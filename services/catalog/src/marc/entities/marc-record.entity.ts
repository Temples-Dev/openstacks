import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  OneToOne,
  Index,
} from 'typeorm';
import { MarcField } from './marc-field.entity';
import { CatalogRecord } from '../../catalog/entities/catalog-record.entity';

@Entity('marc_records')
@Index(['recordType', 'isDeleted'])
@Index(['leader'])
export class MarcRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'record_type', length: 10, default: 'bib' })
  recordType: 'bib' | 'auth' | 'hold' | 'community' | 'classification';

  @Column({ length: 24 })
  leader: string;

  @Column({ name: 'control_number', length: 50, nullable: true })
  @Index()
  controlNumber: string;

  @Column({ name: 'record_status', length: 1, default: 'n' })
  recordStatus: string;

  @Column({ name: 'encoding_level', length: 1, default: ' ' })
  encodingLevel: string;

  @Column({ name: 'cataloging_source', length: 1, default: 'd' })
  catalogingSource: string;

  @Column({ name: 'marc_format', length: 10, default: 'MARC21' })
  marcFormat: string;

  @Column({ name: 'character_encoding', length: 10, default: 'UTF-8' })
  characterEncoding: string;

  @Column({ name: 'raw_marc', type: 'text', nullable: true })
  rawMarc: string;

  @Column({ name: 'marc_xml', type: 'text', nullable: true })
  marcXml: string;

  @Column({ name: 'is_deleted', default: false })
  @Index()
  isDeleted: boolean;

  @Column({ name: 'last_transaction_date', type: 'timestamp', nullable: true })
  lastTransactionDate: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  // Relations
  @OneToMany(() => MarcField, field => field.marcRecord, { 
    cascade: true, 
    eager: false 
  })
  fields: MarcField[];

  @OneToOne(() => CatalogRecord, catalogRecord => catalogRecord.marcRecord)
  catalogRecord: CatalogRecord;

  // Virtual properties
  get title(): string {
    const titleField = this.fields?.find(f => f.tag === '245');
    if (!titleField) return 'Unknown Title';
    
    const aSubfield = titleField.subfields?.find(s => s.code === 'a');
    const bSubfield = titleField.subfields?.find(s => s.code === 'b');
    
    let title = aSubfield?.value || 'Unknown Title';
    if (bSubfield?.value) {
      title += ` ${bSubfield.value}`;
    }
    
    return title.trim();
  }

  get author(): string {
    const authorField = this.fields?.find(f => ['100', '110', '111'].includes(f.tag));
    if (!authorField) return null;
    
    const aSubfield = authorField.subfields?.find(s => s.code === 'a');
    return aSubfield?.value || null;
  }

  get isbn(): string[] {
    const isbnFields = this.fields?.filter(f => f.tag === '020') || [];
    return isbnFields
      .map(field => field.subfields?.find(s => s.code === 'a')?.value)
      .filter(Boolean);
  }

  get issn(): string[] {
    const issnFields = this.fields?.filter(f => f.tag === '022') || [];
    return issnFields
      .map(field => field.subfields?.find(s => s.code === 'a')?.value)
      .filter(Boolean);
  }

  get subjects(): string[] {
    const subjectFields = this.fields?.filter(f => 
      ['600', '610', '611', '630', '648', '650', '651', '653', '654', '655', '656', '657', '658', '662'].includes(f.tag)
    ) || [];
    
    return subjectFields
      .map(field => {
        const subfields = field.subfields?.filter(s => ['a', 'b', 'c', 'd', 'v', 'x', 'y', 'z'].includes(s.code));
        return subfields?.map(s => s.value).join(' -- ');
      })
      .filter(Boolean);
  }

  get publicationInfo(): { place?: string; publisher?: string; date?: string } {
    const pubField = this.fields?.find(f => f.tag === '260' || f.tag === '264');
    if (!pubField) return {};

    return {
      place: pubField.subfields?.find(s => s.code === 'a')?.value,
      publisher: pubField.subfields?.find(s => s.code === 'b')?.value,
      date: pubField.subfields?.find(s => s.code === 'c')?.value,
    };
  }
}
