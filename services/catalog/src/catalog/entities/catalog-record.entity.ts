import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { MarcRecord } from '../../marc/entities/marc-record.entity';
import { Item } from '../../items/entities/item.entity';
import { Holdings } from '../../holdings/entities/holdings.entity';

@Entity('catalog_records')
@Index(['recordType', 'isActive'])
@Index(['title'])
@Index(['author'])
@Index(['isbn'])
@Index(['issn'])
export class CatalogRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'record_type', length: 20, default: 'bibliographic' })
  recordType: 'bibliographic' | 'authority' | 'holdings' | 'classification';

  @Column({ length: 500 })
  @Index()
  title: string;

  @Column({ length: 500, nullable: true })
  @Index()
  subtitle: string;

  @Column({ length: 300, nullable: true })
  @Index()
  author: string;

  @Column({ name: 'additional_authors', type: 'text', nullable: true })
  additionalAuthors: string; // JSON array of additional authors

  @Column({ length: 20, nullable: true })
  @Index()
  isbn: string;

  @Column({ length: 20, nullable: true })
  @Index()
  issn: string;

  @Column({ name: 'publication_year', type: 'integer', nullable: true })
  @Index()
  publicationYear: number;

  @Column({ length: 300, nullable: true })
  publisher: string;

  @Column({ name: 'publication_place', length: 200, nullable: true })
  publicationPlace: string;

  @Column({ length: 50, nullable: true })
  edition: string;

  @Column({ name: 'physical_description', type: 'text', nullable: true })
  physicalDescription: string;

  @Column({ type: 'text', nullable: true })
  summary: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'text', nullable: true })
  subjects: string; // JSON array of subject headings

  @Column({ name: 'material_type', length: 50, default: 'book' })
  @Index()
  materialType: string; // book, journal, dvd, cd, ebook, etc.

  @Column({ length: 10, nullable: true })
  language: string;

  @Column({ name: 'dewey_decimal', length: 20, nullable: true })
  @Index()
  deweyDecimal: string;

  @Column({ name: 'lc_classification', length: 50, nullable: true })
  @Index()
  lcClassification: string;

  @Column({ name: 'call_number', length: 100, nullable: true })
  @Index()
  callNumber: string;

  @Column({ name: 'is_active', default: true })
  @Index()
  isActive: boolean;

  @Column({ name: 'is_suppressed', default: false })
  @Index()
  isSuppressed: boolean;

  @Column({ name: 'cataloging_level', length: 10, default: 'full' })
  catalogingLevel: 'minimal' | 'core' | 'full' | 'enhanced';

  @Column({ name: 'cataloged_by', length: 100, nullable: true })
  catalogedBy: string;

  @Column({ name: 'cataloged_date', type: 'timestamp', nullable: true })
  catalogedDate: Date;

  @Column({ name: 'last_modified_by', length: 100, nullable: true })
  lastModifiedBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  // Relations
  @OneToOne(() => MarcRecord, marcRecord => marcRecord.catalogRecord, {
    cascade: true,
    eager: false,
  })
  @JoinColumn({ name: 'marc_record_id' })
  marcRecord: MarcRecord;

  @OneToMany(() => Item, item => item.catalogRecord)
  items: Item[];

  @OneToMany(() => Holdings, holdings => holdings.catalogRecord)
  holdings: Holdings[];

  // Virtual properties
  get fullTitle(): string {
    if (this.subtitle) {
      return `${this.title} : ${this.subtitle}`;
    }
    return this.title;
  }

  get itemCount(): number {
    return this.items?.length || 0;
  }

  get availableItemCount(): number {
    return this.items?.filter(item => item.status === 'available').length || 0;
  }

  get subjectArray(): string[] {
    if (!this.subjects) return [];
    try {
      return JSON.parse(this.subjects);
    } catch {
      return [];
    }
  }

  get additionalAuthorsArray(): string[] {
    if (!this.additionalAuthors) return [];
    try {
      return JSON.parse(this.additionalAuthors);
    } catch {
      return [];
    }
  }

  get allAuthors(): string[] {
    const authors = [];
    if (this.author) authors.push(this.author);
    authors.push(...this.additionalAuthorsArray);
    return authors;
  }

  get citationAPA(): string {
    let citation = '';
    
    if (this.author) {
      citation += `${this.author}. `;
    }
    
    if (this.publicationYear) {
      citation += `(${this.publicationYear}). `;
    }
    
    citation += `${this.fullTitle}`;
    
    if (this.publisher) {
      citation += `. ${this.publisher}`;
    }
    
    return citation;
  }

  get citationMLA(): string {
    let citation = '';
    
    if (this.author) {
      citation += `${this.author}. `;
    }
    
    citation += `"${this.fullTitle}."`;
    
    if (this.publisher) {
      citation += ` ${this.publisher}`;
    }
    
    if (this.publicationYear) {
      citation += `, ${this.publicationYear}`;
    }
    
    return citation;
  }
}
