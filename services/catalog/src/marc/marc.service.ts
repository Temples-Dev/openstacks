import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MarcRecord } from './entities/marc-record.entity';
import { MarcField } from './entities/marc-field.entity';
import { MarcSubfield } from './entities/marc-subfield.entity';
import { CatalogRecord } from '../catalog/entities/catalog-record.entity';
import * as marc4js from 'marc4js';
import * as xml2js from 'xml2js';

@Injectable()
export class MarcService {
  private readonly logger = new Logger(MarcService.name);

  constructor(
    @InjectRepository(MarcRecord)
    private readonly marcRecordRepository: Repository<MarcRecord>,
    @InjectRepository(MarcField)
    private readonly marcFieldRepository: Repository<MarcField>,
    @InjectRepository(MarcSubfield)
    private readonly marcSubfieldRepository: Repository<MarcSubfield>,
    @InjectRepository(CatalogRecord)
    private readonly catalogRecordRepository: Repository<CatalogRecord>,
  ) {}

  async importMarcRecord(marcData: string, format: 'iso2709' | 'marcxml' | 'json' = 'iso2709'): Promise<MarcRecord> {
    try {
      let parsedRecord;

      switch (format) {
        case 'iso2709':
          parsedRecord = await this.parseISO2709(marcData);
          break;
        case 'marcxml':
          parsedRecord = await this.parseMarcXML(marcData);
          break;
        case 'json':
          parsedRecord = JSON.parse(marcData);
          break;
        default:
          throw new BadRequestException('Unsupported MARC format');
      }

      const marcRecord = await this.createMarcRecordFromParsed(parsedRecord, marcData);
      await this.createCatalogRecordFromMarc(marcRecord);

      this.logger.log(`Imported MARC record: ${marcRecord.id} - Control Number: ${marcRecord.controlNumber}`);
      return marcRecord;
    } catch (error) {
      this.logger.error(`Failed to import MARC record: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to import MARC record: ${error.message}`);
    }
  }

  async exportMarcRecord(id: string, format: 'iso2709' | 'marcxml' | 'json' = 'iso2709'): Promise<string> {
    const marcRecord = await this.marcRecordRepository.findOne({
      where: { id },
      relations: ['fields', 'fields.subfields'],
    });

    if (!marcRecord) {
      throw new BadRequestException('MARC record not found');
    }

    switch (format) {
      case 'iso2709':
        return this.exportToISO2709(marcRecord);
      case 'marcxml':
        return this.exportToMarcXML(marcRecord);
      case 'json':
        return this.exportToJSON(marcRecord);
      default:
        throw new BadRequestException('Unsupported export format');
    }
  }

  private async parseISO2709(marcData: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const parser = marc4js.parse();
      let record = null;

      parser.on('data', (data) => {
        record = data;
      });

      parser.on('error', (error) => {
        reject(error);
      });

      parser.on('end', () => {
        if (record) {
          resolve(record);
        } else {
          reject(new Error('No MARC record found'));
        }
      });

      parser.write(Buffer.from(marcData, 'binary'));
      parser.end();
    });
  }

  private async parseMarcXML(marcXml: string): Promise<any> {
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(marcXml);
    
    // Convert MARCXML to internal format
    const record = result.record || result.collection?.record?.[0];
    if (!record) {
      throw new BadRequestException('Invalid MARCXML format');
    }

    return this.convertMarcXMLToInternal(record);
  }

  private convertMarcXMLToInternal(xmlRecord: any): any {
    const record = {
      leader: xmlRecord.leader?.[0] || '00000nam a2200000 a 4500',
      fields: [],
    };

    // Process control fields (001-009)
    if (xmlRecord.controlfield) {
      xmlRecord.controlfield.forEach((field: any) => {
        record.fields.push({
          tag: field.$.tag,
          value: field._,
        });
      });
    }

    // Process data fields (010+)
    if (xmlRecord.datafield) {
      xmlRecord.datafield.forEach((field: any) => {
        const dataField = {
          tag: field.$.tag,
          ind1: field.$.ind1 || ' ',
          ind2: field.$.ind2 || ' ',
          subfields: [],
        };

        if (field.subfield) {
          field.subfield.forEach((subfield: any) => {
            dataField.subfields.push({
              code: subfield.$.code,
              value: subfield._,
            });
          });
        }

        record.fields.push(dataField);
      });
    }

    return record;
  }

  private async createMarcRecordFromParsed(parsedRecord: any, rawMarc: string): Promise<MarcRecord> {
    const marcRecord = this.marcRecordRepository.create({
      leader: parsedRecord.leader || '00000nam a2200000 a 4500',
      controlNumber: this.extractControlNumber(parsedRecord),
      recordStatus: parsedRecord.leader?.[5] || 'n',
      encodingLevel: parsedRecord.leader?.[17] || ' ',
      catalogingSource: parsedRecord.leader?.[18] || 'd',
      rawMarc: rawMarc,
      marcXml: await this.convertToMarcXML(parsedRecord),
    });

    const savedMarcRecord = await this.marcRecordRepository.save(marcRecord);

    // Create fields
    if (parsedRecord.fields) {
      for (let i = 0; i < parsedRecord.fields.length; i++) {
        const fieldData = parsedRecord.fields[i];
        await this.createMarcField(savedMarcRecord, fieldData, i);
      }
    }

    return savedMarcRecord;
  }

  private async createMarcField(marcRecord: MarcRecord, fieldData: any, order: number): Promise<MarcField> {
    const marcField = this.marcFieldRepository.create({
      marcRecord,
      tag: fieldData.tag,
      indicator1: fieldData.ind1 || ' ',
      indicator2: fieldData.ind2 || ' ',
      value: fieldData.value || null, // For control fields
      fieldOrder: order,
    });

    const savedField = await this.marcFieldRepository.save(marcField);

    // Create subfields for data fields
    if (fieldData.subfields) {
      for (let i = 0; i < fieldData.subfields.length; i++) {
        const subfieldData = fieldData.subfields[i];
        await this.createMarcSubfield(savedField, subfieldData, i);
      }
    }

    return savedField;
  }

  private async createMarcSubfield(marcField: MarcField, subfieldData: any, order: number): Promise<MarcSubfield> {
    const marcSubfield = this.marcSubfieldRepository.create({
      marcField,
      code: subfieldData.code,
      value: subfieldData.value,
      subfieldOrder: order,
    });

    return this.marcSubfieldRepository.save(marcSubfield);
  }

  private extractControlNumber(parsedRecord: any): string {
    const controlField = parsedRecord.fields?.find((field: any) => field.tag === '001');
    return controlField?.value || null;
  }

  private async convertToMarcXML(parsedRecord: any): Promise<string> {
    const builder = new xml2js.Builder({
      rootName: 'record',
      xmldec: { version: '1.0', encoding: 'UTF-8' },
    });

    const xmlRecord = {
      $: { xmlns: 'http://www.loc.gov/MARC21/slim' },
      leader: parsedRecord.leader,
      controlfield: [],
      datafield: [],
    };

    parsedRecord.fields?.forEach((field: any) => {
      if (field.tag < '010') {
        // Control field
        xmlRecord.controlfield.push({
          $: { tag: field.tag },
          _: field.value,
        });
      } else {
        // Data field
        const dataField = {
          $: {
            tag: field.tag,
            ind1: field.ind1 || ' ',
            ind2: field.ind2 || ' ',
          },
          subfield: field.subfields?.map((subfield: any) => ({
            $: { code: subfield.code },
            _: subfield.value,
          })) || [],
        };
        xmlRecord.datafield.push(dataField);
      }
    });

    return builder.buildObject(xmlRecord);
  }

  private async createCatalogRecordFromMarc(marcRecord: MarcRecord): Promise<CatalogRecord> {
    // Extract bibliographic data from MARC fields
    const title = this.extractTitle(marcRecord);
    const author = this.extractAuthor(marcRecord);
    const isbn = this.extractISBN(marcRecord);
    const issn = this.extractISSN(marcRecord);
    const publicationInfo = this.extractPublicationInfo(marcRecord);
    const subjects = this.extractSubjects(marcRecord);
    const physicalDescription = this.extractPhysicalDescription(marcRecord);
    const summary = this.extractSummary(marcRecord);

    const catalogRecord = this.catalogRecordRepository.create({
      marcRecord,
      title: title.main,
      subtitle: title.subtitle,
      author: author,
      isbn: isbn,
      issn: issn,
      publicationYear: publicationInfo.year,
      publisher: publicationInfo.publisher,
      publicationPlace: publicationInfo.place,
      physicalDescription: physicalDescription,
      summary: summary,
      subjects: subjects.length > 0 ? JSON.stringify(subjects) : null,
      materialType: this.determineMaterialType(marcRecord),
      language: this.extractLanguage(marcRecord),
      callNumber: this.extractCallNumber(marcRecord),
      catalogedDate: new Date(),
    });

    return this.catalogRecordRepository.save(catalogRecord);
  }

  private extractTitle(marcRecord: MarcRecord): { main: string; subtitle?: string } {
    const titleField = marcRecord.fields?.find(f => f.tag === '245');
    if (!titleField) return { main: 'Unknown Title' };

    const mainTitle = titleField.subfields?.find(s => s.code === 'a')?.value || 'Unknown Title';
    const subtitle = titleField.subfields?.find(s => s.code === 'b')?.value;

    return {
      main: mainTitle.replace(/[\/:]$/, '').trim(),
      subtitle: subtitle?.replace(/[\/:]$/, '').trim(),
    };
  }

  private extractAuthor(marcRecord: MarcRecord): string {
    const authorField = marcRecord.fields?.find(f => ['100', '110', '111'].includes(f.tag));
    if (!authorField) return null;

    return authorField.subfields?.find(s => s.code === 'a')?.value?.replace(/,$/, '').trim() || null;
  }

  private extractISBN(marcRecord: MarcRecord): string {
    const isbnField = marcRecord.fields?.find(f => f.tag === '020');
    return isbnField?.subfields?.find(s => s.code === 'a')?.value?.split(' ')[0] || null;
  }

  private extractISSN(marcRecord: MarcRecord): string {
    const issnField = marcRecord.fields?.find(f => f.tag === '022');
    return issnField?.subfields?.find(s => s.code === 'a')?.value || null;
  }

  private extractPublicationInfo(marcRecord: MarcRecord): { place?: string; publisher?: string; year?: number } {
    const pubField = marcRecord.fields?.find(f => f.tag === '260' || f.tag === '264');
    if (!pubField) return {};

    const place = pubField.subfields?.find(s => s.code === 'a')?.value?.replace(/[,:;]$/, '').trim();
    const publisher = pubField.subfields?.find(s => s.code === 'b')?.value?.replace(/[,:;]$/, '').trim();
    const dateStr = pubField.subfields?.find(s => s.code === 'c')?.value?.replace(/[^\d]/g, '');
    const year = dateStr ? parseInt(dateStr.substring(0, 4)) : null;

    return { place, publisher, year };
  }

  private extractSubjects(marcRecord: MarcRecord): string[] {
    const subjectTags = ['600', '610', '611', '630', '648', '650', '651', '653', '654', '655'];
    const subjectFields = marcRecord.fields?.filter(f => subjectTags.includes(f.tag)) || [];

    return subjectFields.map(field => {
      const subfields = field.subfields?.filter(s => ['a', 'b', 'c', 'd', 'v', 'x', 'y', 'z'].includes(s.code));
      return subfields?.map(s => s.value).join(' -- ') || '';
    }).filter(Boolean);
  }

  private extractPhysicalDescription(marcRecord: MarcRecord): string {
    const physField = marcRecord.fields?.find(f => f.tag === '300');
    if (!physField) return null;

    const subfields = physField.subfields?.filter(s => ['a', 'b', 'c'].includes(s.code));
    return subfields?.map(s => s.value).join(' ; ') || null;
  }

  private extractSummary(marcRecord: MarcRecord): string {
    const summaryField = marcRecord.fields?.find(f => f.tag === '520');
    return summaryField?.subfields?.find(s => s.code === 'a')?.value || null;
  }

  private extractLanguage(marcRecord: MarcRecord): string {
    const langField = marcRecord.fields?.find(f => f.tag === '008');
    if (langField?.value && langField.value.length >= 38) {
      return langField.value.substring(35, 38);
    }
    return null;
  }

  private extractCallNumber(marcRecord: MarcRecord): string {
    const lcField = marcRecord.fields?.find(f => f.tag === '050');
    if (lcField) {
      const a = lcField.subfields?.find(s => s.code === 'a')?.value || '';
      const b = lcField.subfields?.find(s => s.code === 'b')?.value || '';
      return `${a} ${b}`.trim();
    }

    const deweyField = marcRecord.fields?.find(f => f.tag === '082');
    if (deweyField) {
      return deweyField.subfields?.find(s => s.code === 'a')?.value || null;
    }

    return null;
  }

  private determineMaterialType(marcRecord: MarcRecord): string {
    const leader = marcRecord.leader;
    if (!leader || leader.length < 8) return 'book';

    const recordType = leader[6];
    const bibLevel = leader[7];

    switch (recordType) {
      case 'a': // Language material
        return bibLevel === 's' ? 'journal' : 'book';
      case 'c': // Notated music
        return 'music_score';
      case 'e': // Cartographic material
        return 'map';
      case 'g': // Projected medium
        return 'dvd';
      case 'i': // Nonmusical sound recording
        return 'audiobook';
      case 'j': // Musical sound recording
        return 'cd';
      case 'm': // Computer file
        return 'ebook';
      case 't': // Manuscript language material
        return 'manuscript';
      default:
        return 'book';
    }
  }

  private exportToISO2709(marcRecord: MarcRecord): string {
    // This would require implementing MARC binary format encoding
    // For now, return the raw MARC if available
    return marcRecord.rawMarc || '';
  }

  private exportToMarcXML(marcRecord: MarcRecord): string {
    return marcRecord.marcXml || '';
  }

  private exportToJSON(marcRecord: MarcRecord): string {
    const jsonRecord = {
      leader: marcRecord.leader,
      fields: marcRecord.fields?.map(field => ({
        tag: field.tag,
        indicator1: field.indicator1,
        indicator2: field.indicator2,
        value: field.value,
        subfields: field.subfields?.map(subfield => ({
          code: subfield.code,
          value: subfield.value,
        })),
      })),
    };

    return JSON.stringify(jsonRecord, null, 2);
  }
}
