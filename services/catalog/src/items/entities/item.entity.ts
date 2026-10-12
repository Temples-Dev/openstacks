import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { CatalogRecord } from '../../catalog/entities/catalog-record.entity';
import { Holdings } from '../../holdings/entities/holdings.entity';

@Entity('items')
@Index(['barcode'], { unique: true })
@Index(['catalogRecord', 'status'])
@Index(['holdings', 'status'])
export class Item {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50, unique: true })
  @Index()
  barcode: string;

  @Column({ name: 'call_number', length: 100, nullable: true })
  callNumber: string;

  @Column({ name: 'item_type', length: 50, default: 'book' })
  @Index()
  itemType: string; // book, reference, periodical, dvd, cd, etc.

  @Column({ length: 20, default: 'available' })
  @Index()
  status: 'available' | 'checked_out' | 'on_hold' | 'in_transit' | 'missing' | 'damaged' | 'withdrawn' | 'on_order' | 'processing';

  @Column({ name: 'loan_type', length: 20, default: 'standard' })
  loanType: 'standard' | 'reference' | 'reserve' | 'restricted';

  @Column({ name: 'circulation_status', length: 20, default: 'active' })
  circulationStatus: 'active' | 'inactive' | 'suppressed';

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  price: number;

  @Column({ length: 3, nullable: true })
  currency: string;

  @Column({ name: 'acquisition_date', type: 'date', nullable: true })
  acquisitionDate: Date;

  @Column({ name: 'acquisition_method', length: 50, nullable: true })
  acquisitionMethod: string; // purchase, gift, exchange, deposit

  @Column({ length: 100, nullable: true })
  vendor: string;

  @Column({ name: 'invoice_number', length: 50, nullable: true })
  invoiceNumber: string;

  @Column({ name: 'copy_number', type: 'integer', default: 1 })
  copyNumber: number;

  @Column({ name: 'volume_number', length: 50, nullable: true })
  volumeNumber: string;

  @Column({ name: 'issue_number', length: 50, nullable: true })
  issueNumber: string;

  @Column({ name: 'enumeration', length: 100, nullable: true })
  enumeration: string; // v.1, no.2, etc.

  @Column({ name: 'chronology', length: 100, nullable: true })
  chronology: string; // 2023, Jan-Mar, etc.

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'internal_notes', type: 'text', nullable: true })
  internalNotes: string;

  @Column({ name: 'last_inventory_date', type: 'timestamp', nullable: true })
  lastInventoryDate: Date;

  @Column({ name: 'statistical_category', length: 50, nullable: true })
  statisticalCategory: string;

  @Column({ name: 'created_by', length: 100, nullable: true })
  createdBy: string;

  @Column({ name: 'last_modified_by', length: 100, nullable: true })
  lastModifiedBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  // Relations
  @ManyToOne(() => CatalogRecord, catalogRecord => catalogRecord.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'catalog_record_id' })
  catalogRecord: CatalogRecord;

  @ManyToOne(() => Holdings, holdings => holdings.items, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'holdings_id' })
  holdings: Holdings;

  // Virtual properties
  get isAvailable(): boolean {
    return this.status === 'available' && this.circulationStatus === 'active';
  }

  get isCirculating(): boolean {
    return ['available', 'checked_out', 'on_hold', 'in_transit'].includes(this.status);
  }

  get displayCallNumber(): string {
    return this.callNumber || this.catalogRecord?.callNumber || '';
  }

  get fullEnumeration(): string {
    const parts = [];
    if (this.volumeNumber) parts.push(`v.${this.volumeNumber}`);
    if (this.issueNumber) parts.push(`no.${this.issueNumber}`);
    if (this.enumeration) parts.push(this.enumeration);
    if (this.chronology) parts.push(`(${this.chronology})`);
    return parts.join(' ');
  }

  get displayTitle(): string {
    const baseTitle = this.catalogRecord?.fullTitle || 'Unknown Title';
    const enum_ = this.fullEnumeration;
    return enum_ ? `${baseTitle} ${enum_}` : baseTitle;
  }

  get ageInDays(): number {
    if (!this.acquisitionDate) return null;
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - this.acquisitionDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}
