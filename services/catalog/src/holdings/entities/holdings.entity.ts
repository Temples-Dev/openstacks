import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { CatalogRecord } from '../../catalog/entities/catalog-record.entity';
import { Location } from './location.entity';
import { Item } from '../../items/entities/item.entity';

@Entity('holdings')
@Index(['catalogRecord', 'location'])
@Index(['callNumber'])
export class Holdings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'call_number', length: 100 })
  @Index()
  callNumber: string;

  @Column({ name: 'call_number_type', length: 20, default: 'lc' })
  callNumberType: 'lc' | 'dewey' | 'sudoc' | 'local' | 'other';

  @Column({ name: 'call_number_prefix', length: 50, nullable: true })
  callNumberPrefix: string;

  @Column({ name: 'call_number_suffix', length: 50, nullable: true })
  callNumberSuffix: string;

  @Column({ name: 'shelving_title', length: 300, nullable: true })
  shelvingTitle: string;

  @Column({ name: 'copy_statement', length: 100, nullable: true })
  copyStatement: string;

  @Column({ name: 'holdings_statement', type: 'text', nullable: true })
  holdingsStatement: string; // Summary of what volumes/issues are held

  @Column({ name: 'holdings_statement_for_supplements', type: 'text', nullable: true })
  holdingsStatementForSupplements: string;

  @Column({ name: 'holdings_statement_for_indexes', type: 'text', nullable: true })
  holdingsStatementForIndexes: string;

  @Column({ name: 'textual_holdings', type: 'text', nullable: true })
  textualHoldings: string; // Free text description of holdings

  @Column({ name: 'receipt_status', length: 20, default: 'not_currently_received' })
  receiptStatus: 'currently_received' | 'not_currently_received' | 'publication_ceased' | 'unknown';

  @Column({ name: 'acquisition_status', length: 20, default: 'other' })
  acquisitionStatus: 'on_order' | 'currently_received' | 'not_currently_received' | 'ceased_publication' | 'complete' | 'other';

  @Column({ name: 'retention_policy', length: 100, nullable: true })
  retentionPolicy: string;

  @Column({ name: 'completeness', length: 20, default: 'unknown' })
  completeness: 'complete' | 'incomplete' | 'scattered' | 'not_applicable' | 'unknown';

  @Column({ name: 'acquisition_method', length: 50, nullable: true })
  acquisitionMethod: string;

  @Column({ name: 'acquisition_end_date', type: 'date', nullable: true })
  acquisitionEndDate: Date;

  @Column({ name: 'general_retention_policy', length: 100, nullable: true })
  generalRetentionPolicy: string;

  @Column({ name: 'specific_retention_policy', length: 100, nullable: true })
  specificRetentionPolicy: string;

  @Column({ name: 'digitization_policy', length: 100, nullable: true })
  digitizationPolicy: string;

  @Column({ name: 'reproduction_policy', length: 100, nullable: true })
  reproductionPolicy: string;

  @Column({ name: 'public_note', type: 'text', nullable: true })
  publicNote: string;

  @Column({ name: 'staff_note', type: 'text', nullable: true })
  staffNote: string;

  @Column({ name: 'summary_holdings', type: 'text', nullable: true })
  summaryHoldings: string;

  @Column({ name: 'is_suppressed', default: false })
  @Index()
  isSuppressed: boolean;

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
  @ManyToOne(() => CatalogRecord, catalogRecord => catalogRecord.holdings, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'catalog_record_id' })
  catalogRecord: CatalogRecord;

  @ManyToOne(() => Location, location => location.holdings, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'location_id' })
  location: Location;

  @OneToMany(() => Item, item => item.holdings)
  items: Item[];

  // Virtual properties
  get fullCallNumber(): string {
    const parts = [];
    if (this.callNumberPrefix) parts.push(this.callNumberPrefix);
    parts.push(this.callNumber);
    if (this.callNumberSuffix) parts.push(this.callNumberSuffix);
    return parts.join(' ');
  }

  get itemCount(): number {
    return this.items?.length || 0;
  }

  get availableItemCount(): number {
    return this.items?.filter(item => item.isAvailable).length || 0;
  }

  get circulatingItemCount(): number {
    return this.items?.filter(item => item.isCirculating).length || 0;
  }

  get displayLocation(): string {
    return this.location?.displayName || 'Unknown Location';
  }

  get isCurrentlyReceived(): boolean {
    return this.receiptStatus === 'currently_received';
  }

  get hasItems(): boolean {
    return this.itemCount > 0;
  }

  get hasAvailableItems(): boolean {
    return this.availableItemCount > 0;
  }
}
