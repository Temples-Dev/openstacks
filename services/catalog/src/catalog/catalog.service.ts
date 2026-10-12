import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, Like, ILike, Between, In } from 'typeorm';
import { CatalogRecord } from './entities/catalog-record.entity';
import { CreateCatalogRecordDto } from './dto/create-catalog-record.dto';
import { UpdateCatalogRecordDto } from './dto/update-catalog-record.dto';
import { SearchCatalogDto } from './dto/search-catalog.dto';

@Injectable()
export class CatalogService {
  private readonly logger = new Logger(CatalogService.name);

  constructor(
    @InjectRepository(CatalogRecord)
    private readonly catalogRecordRepository: Repository<CatalogRecord>,
  ) {}

  async create(createCatalogRecordDto: CreateCatalogRecordDto): Promise<CatalogRecord> {
    try {
      // Convert arrays to JSON strings for storage
      const recordData: Partial<CatalogRecord> = {
        ...createCatalogRecordDto,
        additionalAuthors: createCatalogRecordDto.additionalAuthors 
          ? JSON.stringify(createCatalogRecordDto.additionalAuthors) 
          : null,
        subjects: createCatalogRecordDto.subjects 
          ? JSON.stringify(createCatalogRecordDto.subjects) 
          : null,
        catalogedDate: createCatalogRecordDto.catalogedDate 
          ? new Date(createCatalogRecordDto.catalogedDate) 
          : new Date(),
        catalogingLevel: createCatalogRecordDto.catalogingLevel as 'minimal' | 'core' | 'full' | 'enhanced',
      };

      const catalogRecord = this.catalogRecordRepository.create(recordData);
      const savedRecord = await this.catalogRecordRepository.save(catalogRecord);
      
      this.logger.log(`Created catalog record: ${savedRecord.id} - "${savedRecord.title}"`);
      return savedRecord;
    } catch (error) {
      this.logger.error(`Failed to create catalog record: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to create catalog record');
    }
  }

  async findAll(options?: FindManyOptions<CatalogRecord>): Promise<CatalogRecord[]> {
    const defaultOptions: FindManyOptions<CatalogRecord> = {
      where: { isActive: true, isSuppressed: false },
      relations: ['items', 'holdings', 'marcRecord'],
      order: { title: 'ASC' },
      take: 50,
    };

    const mergedOptions = { ...defaultOptions, ...options };
    return this.catalogRecordRepository.find(mergedOptions);
  }

  async findOne(id: string): Promise<CatalogRecord> {
    const catalogRecord = await this.catalogRecordRepository.findOne({
      where: { id },
      relations: ['items', 'holdings', 'holdings.location', 'marcRecord', 'marcRecord.fields', 'marcRecord.fields.subfields'],
    });

    if (!catalogRecord) {
      throw new NotFoundException(`Catalog record with ID ${id} not found`);
    }

    return catalogRecord;
  }

  async findByIsbn(isbn: string): Promise<CatalogRecord[]> {
    return this.catalogRecordRepository.find({
      where: { isbn: ILike(`%${isbn}%`) },
      relations: ['items', 'holdings'],
    });
  }

  async findByIssn(issn: string): Promise<CatalogRecord[]> {
    return this.catalogRecordRepository.find({
      where: { issn: ILike(`%${issn}%`) },
      relations: ['items', 'holdings'],
    });
  }

  async search(searchDto: SearchCatalogDto): Promise<{ records: CatalogRecord[]; total: number; page: number; totalPages: number }> {
    const queryBuilder = this.catalogRecordRepository.createQueryBuilder('catalog')
      .leftJoinAndSelect('catalog.items', 'items')
      .leftJoinAndSelect('catalog.holdings', 'holdings')
      .leftJoinAndSelect('holdings.location', 'location');

    // Base filters
    if (!searchDto.includeSuppressed) {
      queryBuilder.andWhere('catalog.isSuppressed = :suppressed', { suppressed: false });
    }
    queryBuilder.andWhere('catalog.isActive = :active', { active: true });

    // Search conditions
    if (searchDto.query) {
      switch (searchDto.searchType) {
        case 'title':
          queryBuilder.andWhere('catalog.title ILIKE :query OR catalog.subtitle ILIKE :query', 
            { query: `%${searchDto.query}%` });
          break;
        case 'author':
          queryBuilder.andWhere('catalog.author ILIKE :query', { query: `%${searchDto.query}%` });
          break;
        case 'subject':
          queryBuilder.andWhere('catalog.subjects ILIKE :query', { query: `%${searchDto.query}%` });
          break;
        case 'isbn':
          queryBuilder.andWhere('catalog.isbn ILIKE :query', { query: `%${searchDto.query}%` });
          break;
        case 'issn':
          queryBuilder.andWhere('catalog.issn ILIKE :query', { query: `%${searchDto.query}%` });
          break;
        case 'call_number':
          queryBuilder.andWhere('catalog.callNumber ILIKE :query', { query: `%${searchDto.query}%` });
          break;
        default: // keyword search
          queryBuilder.andWhere(
            '(catalog.title ILIKE :query OR catalog.subtitle ILIKE :query OR catalog.author ILIKE :query OR catalog.subjects ILIKE :query OR catalog.summary ILIKE :query)',
            { query: `%${searchDto.query}%` }
          );
      }
    }

    // Individual field searches
    if (searchDto.title) {
      queryBuilder.andWhere('catalog.title ILIKE :title', { title: `%${searchDto.title}%` });
    }
    if (searchDto.author) {
      queryBuilder.andWhere('catalog.author ILIKE :author', { author: `%${searchDto.author}%` });
    }
    if (searchDto.subject) {
      queryBuilder.andWhere('catalog.subjects ILIKE :subject', { subject: `%${searchDto.subject}%` });
    }
    if (searchDto.isbn) {
      queryBuilder.andWhere('catalog.isbn ILIKE :isbn', { isbn: `%${searchDto.isbn}%` });
    }
    if (searchDto.issn) {
      queryBuilder.andWhere('catalog.issn ILIKE :issn', { issn: `%${searchDto.issn}%` });
    }
    if (searchDto.publisher) {
      queryBuilder.andWhere('catalog.publisher ILIKE :publisher', { publisher: `%${searchDto.publisher}%` });
    }
    if (searchDto.callNumber) {
      queryBuilder.andWhere('catalog.callNumber ILIKE :callNumber', { callNumber: `%${searchDto.callNumber}%` });
    }

    // Filters
    if (searchDto.materialType) {
      queryBuilder.andWhere('catalog.materialType = :materialType', { materialType: searchDto.materialType });
    }
    if (searchDto.language) {
      queryBuilder.andWhere('catalog.language = :language', { language: searchDto.language });
    }
    if (searchDto.publicationYearFrom) {
      queryBuilder.andWhere('catalog.publicationYear >= :yearFrom', { yearFrom: searchDto.publicationYearFrom });
    }
    if (searchDto.publicationYearTo) {
      queryBuilder.andWhere('catalog.publicationYear <= :yearTo', { yearTo: searchDto.publicationYearTo });
    }
    if (searchDto.locations && searchDto.locations.length > 0) {
      queryBuilder.andWhere('location.code IN (:...locations)', { locations: searchDto.locations });
    }
    if (searchDto.availableOnly) {
      queryBuilder.andWhere('items.status = :status', { status: 'available' });
    }

    // Sorting
    switch (searchDto.sortBy) {
      case 'title':
        queryBuilder.orderBy('catalog.title', searchDto.sortOrder?.toUpperCase() as 'ASC' | 'DESC');
        break;
      case 'author':
        queryBuilder.orderBy('catalog.author', searchDto.sortOrder?.toUpperCase() as 'ASC' | 'DESC');
        break;
      case 'publication_year':
        queryBuilder.orderBy('catalog.publicationYear', searchDto.sortOrder?.toUpperCase() as 'ASC' | 'DESC');
        break;
      case 'call_number':
        queryBuilder.orderBy('catalog.callNumber', searchDto.sortOrder?.toUpperCase() as 'ASC' | 'DESC');
        break;
      case 'created_at':
        queryBuilder.orderBy('catalog.createdAt', searchDto.sortOrder?.toUpperCase() as 'ASC' | 'DESC');
        break;
      default: // relevance - for now, just use title
        queryBuilder.orderBy('catalog.title', 'ASC');
    }

    // Pagination
    const page = searchDto.page || 1;
    const limit = searchDto.limit || 20;
    const offset = (page - 1) * limit;

    queryBuilder.skip(offset).take(limit);

    // Execute query
    const [records, total] = await queryBuilder.getManyAndCount();
    const totalPages = Math.ceil(total / limit);

    this.logger.log(`Search completed: ${total} results found for query: ${searchDto.query || 'advanced search'}`);

    return {
      records,
      total,
      page,
      totalPages,
    };
  }

  async update(id: string, updateCatalogRecordDto: UpdateCatalogRecordDto): Promise<CatalogRecord> {
    const catalogRecord = await this.findOne(id);

    // Convert arrays to JSON strings for storage
    const updateData = {
      ...updateCatalogRecordDto,
      additionalAuthors: updateCatalogRecordDto.additionalAuthors 
        ? JSON.stringify(updateCatalogRecordDto.additionalAuthors) 
        : catalogRecord.additionalAuthors,
      subjects: updateCatalogRecordDto.subjects 
        ? JSON.stringify(updateCatalogRecordDto.subjects) 
        : catalogRecord.subjects,
      catalogedDate: updateCatalogRecordDto.catalogedDate 
        ? new Date(updateCatalogRecordDto.catalogedDate) 
        : catalogRecord.catalogedDate,
    };

    Object.assign(catalogRecord, updateData);
    const updatedRecord = await this.catalogRecordRepository.save(catalogRecord);
    
    this.logger.log(`Updated catalog record: ${updatedRecord.id} - "${updatedRecord.title}"`);
    return updatedRecord;
  }

  async remove(id: string): Promise<void> {
    const catalogRecord = await this.findOne(id);
    await this.catalogRecordRepository.softDelete(id);
    this.logger.log(`Soft deleted catalog record: ${id} - "${catalogRecord.title}"`);
  }

  async restore(id: string): Promise<CatalogRecord> {
    await this.catalogRecordRepository.restore(id);
    const restoredRecord = await this.findOne(id);
    this.logger.log(`Restored catalog record: ${id} - "${restoredRecord.title}"`);
    return restoredRecord;
  }

  async suppress(id: string): Promise<CatalogRecord> {
    const catalogRecord = await this.findOne(id);
    catalogRecord.isSuppressed = true;
    const suppressedRecord = await this.catalogRecordRepository.save(catalogRecord);
    this.logger.log(`Suppressed catalog record: ${id} - "${suppressedRecord.title}"`);
    return suppressedRecord;
  }

  async unsuppress(id: string): Promise<CatalogRecord> {
    const catalogRecord = await this.catalogRecordRepository.findOne({
      where: { id },
      relations: ['items', 'holdings'],
    });

    if (!catalogRecord) {
      throw new NotFoundException(`Catalog record with ID ${id} not found`);
    }

    catalogRecord.isSuppressed = false;
    const unsuppressedRecord = await this.catalogRecordRepository.save(catalogRecord);
    this.logger.log(`Unsuppressed catalog record: ${id} - "${unsuppressedRecord.title}"`);
    return unsuppressedRecord;
  }

  async getStatistics(): Promise<{
    totalRecords: number;
    activeRecords: number;
    suppressedRecords: number;
    recordsByMaterialType: { materialType: string; count: number }[];
    recordsByLanguage: { language: string; count: number }[];
    recentlyAdded: number;
  }> {
    const totalRecords = await this.catalogRecordRepository.count();
    const activeRecords = await this.catalogRecordRepository.count({ where: { isActive: true, isSuppressed: false } });
    const suppressedRecords = await this.catalogRecordRepository.count({ where: { isSuppressed: true } });

    const recordsByMaterialType = await this.catalogRecordRepository
      .createQueryBuilder('catalog')
      .select('catalog.materialType', 'materialType')
      .addSelect('COUNT(*)', 'count')
      .where('catalog.isActive = :active', { active: true })
      .groupBy('catalog.materialType')
      .getRawMany();

    const recordsByLanguage = await this.catalogRecordRepository
      .createQueryBuilder('catalog')
      .select('catalog.language', 'language')
      .addSelect('COUNT(*)', 'count')
      .where('catalog.isActive = :active AND catalog.language IS NOT NULL', { active: true })
      .groupBy('catalog.language')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentlyAdded = await this.catalogRecordRepository.count({
      where: { 
        isActive: true, 
        createdAt: Between(thirtyDaysAgo, new Date()) 
      }
    });

    return {
      totalRecords,
      activeRecords,
      suppressedRecords,
      recordsByMaterialType,
      recordsByLanguage,
      recentlyAdded,
    };
  }
}
