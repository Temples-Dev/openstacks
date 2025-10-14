import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { PurchaseOrder } from './purchase-order.entity';
import { ReceiptLine } from '../../receipts/entities/receipt-line.entity';

@Entity('purchase_order_lines')
@Index(['purchaseOrder', 'lineNumber'], { unique: true })
@Index(['isbn'])
@Index(['catalogRecordId'])
export class PurchaseOrderLine {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => PurchaseOrder, purchaseOrder => purchaseOrder.orderLines, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'purchase_order_id' })
  purchaseOrder: PurchaseOrder;

  @Column({ type: 'uuid' })
  purchaseOrderId: string;

  @Column({ type: 'int' })
  lineNumber: number;

  // Item Information
  @Column({ length: 500 })
  title: string;

  @Column({ length: 255, nullable: true })
  author: string;

  @Column({ length: 20, nullable: true })
  isbn: string;

  @Column({ length: 20, nullable: true })
  issn: string;

  @Column({ length: 100, nullable: true })
  publisher: string;

  @Column({ type: 'int', nullable: true })
  publicationYear: number;

  @Column({ length: 50, nullable: true })
  edition: string;

  @Column({
    type: 'enum',
    enum: ['book', 'ebook', 'journal', 'dvd', 'cd', 'audiobook', 'database', 'other'],
    default: 'book',
  })
  materialType: 'book' | 'ebook' | 'journal' | 'dvd' | 'cd' | 'audiobook' | 'database' | 'other';

  @Column({ length: 100, nullable: true })
  format: string; // hardcover, paperback, digital, etc.

  @Column({ type: 'uuid', nullable: true })
  catalogRecordId: string; // Link to catalog service

  // Vendor Information
  @Column({ length: 100, nullable: true })
  vendorItemNumber: string;

  @Column({ length: 100, nullable: true })
  vendorTitle: string;

  // Ordering Information
  @Column({ type: 'int' })
  quantityOrdered: number;

  @Column({ type: 'int', default: 0 })
  quantityReceived: number;

  @Column({ type: 'int', default: 0 })
  quantityCancelled: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  listPrice: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  discountPercentage: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  netPrice: number; // Unit price after discount

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  lineTotal: number; // Net price * quantity ordered

  @Column({ length: 10, default: 'USD' })
  currency: string;

  // Fund and Budget Allocation
  @Column({ type: 'uuid', nullable: true })
  fundCode: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  encumberedAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  expendedAmount: number;

  // Status and Workflow
  @Column({
    type: 'enum',
    enum: ['active', 'partially_received', 'received', 'cancelled', 'backordered'],
    default: 'active',
  })
  status: 'active' | 'partially_received' | 'received' | 'cancelled' | 'backordered';

  @Column({ type: 'date', nullable: true })
  expectedReceiptDate: Date;

  @Column({ type: 'date', nullable: true })
  actualReceiptDate: Date;

  @Column({ type: 'boolean', default: false })
  isRushItem: boolean;

  @Column({ type: 'boolean', default: false })
  isBackordered: boolean;

  @Column({ type: 'date', nullable: true })
  backorderDate: Date;

  @Column({ type: 'text', nullable: true })
  backorderReason: string;

  // Special Instructions
  @Column({ type: 'text', nullable: true })
  specialInstructions: string;

  @Column({ type: 'text', nullable: true })
  internalNotes: string;

  @Column({ type: 'text', nullable: true })
  vendorNotes: string;

  // Cataloging Information
  @Column({ type: 'boolean', default: false })
  requiresCataloging: boolean;

  @Column({
    type: 'enum',
    enum: ['pending', 'in_progress', 'completed', 'not_required'],
    default: 'pending',
  })
  catalogingStatus: 'pending' | 'in_progress' | 'completed' | 'not_required';

  @Column({ type: 'uuid', nullable: true })
  catalogedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  catalogedAt: Date;

  // Claims and Follow-up
  @Column({ type: 'int', default: 0 })
  claimCount: number;

  @Column({ type: 'date', nullable: true })
  lastClaimDate: Date;

  @Column({ type: 'date', nullable: true })
  nextClaimDate: Date;

  @Column({ type: 'text', nullable: true })
  claimNotes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'uuid', nullable: true })
  createdBy: string;

  @Column({ type: 'uuid', nullable: true })
  updatedBy: string;

  // Relationships
  @OneToMany(() => ReceiptLine, receiptLine => receiptLine.purchaseOrderLine)
  receiptLines: ReceiptLine[];

  // Virtual Properties
  get quantityOutstanding(): number {
    return this.quantityOrdered - this.quantityReceived - this.quantityCancelled;
  }

  get isFullyReceived(): boolean {
    return this.quantityReceived >= this.quantityOrdered;
  }

  get isPartiallyReceived(): boolean {
    return this.quantityReceived > 0 && this.quantityReceived < this.quantityOrdered;
  }

  get fulfillmentPercentage(): number {
    return this.quantityOrdered > 0 
      ? (this.quantityReceived / this.quantityOrdered) * 100 
      : 0;
  }

  get totalDiscount(): number {
    return this.listPrice && this.unitPrice 
      ? (this.listPrice - this.unitPrice) * this.quantityOrdered 
      : 0;
  }

  get canBeClaimed(): boolean {
    return this.status === 'active' && 
           this.quantityOutstanding > 0 && 
           this.expectedReceiptDate && 
           new Date() > this.expectedReceiptDate;
  }

  get isOverdue(): boolean {
    return this.expectedReceiptDate && 
           new Date() > this.expectedReceiptDate && 
           this.quantityOutstanding > 0;
  }

  get daysOverdue(): number {
    if (!this.isOverdue) return 0;
    const today = new Date();
    const diffTime = today.getTime() - this.expectedReceiptDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  get statusDescription(): string {
    const statusMap = {
      active: 'Active - Awaiting receipt',
      partially_received: 'Partially Received - Some items delivered',
      received: 'Received - All items delivered',
      cancelled: 'Cancelled - Order line terminated',
      backordered: 'Backordered - Temporarily unavailable',
    };
    return statusMap[this.status] || 'Unknown Status';
  }

  get catalogingStatusDescription(): string {
    const statusMap = {
      pending: 'Pending - Awaiting cataloging',
      in_progress: 'In Progress - Being cataloged',
      completed: 'Completed - Cataloging finished',
      not_required: 'Not Required - No cataloging needed',
    };
    return statusMap[this.catalogingStatus] || 'Unknown Status';
  }

  get priorityLevel(): 'low' | 'normal' | 'high' | 'urgent' {
    if (this.isRushItem) return 'urgent';
    if (this.isOverdue && this.daysOverdue > 30) return 'high';
    if (this.isOverdue) return 'normal';
    return 'low';
  }

  get needsClaim(): boolean {
    if (!this.canBeClaimed) return false;
    if (this.claimCount === 0) return this.daysOverdue >= 7;
    if (this.claimCount === 1) return this.daysOverdue >= 14;
    if (this.claimCount === 2) return this.daysOverdue >= 30;
    return this.daysOverdue >= 60;
  }

  get displayTitle(): string {
    let title = this.title;
    if (this.author) title += ` / ${this.author}`;
    if (this.edition) title += ` (${this.edition})`;
    return title;
  }

  get remainingEncumbrance(): number {
    return this.encumberedAmount ? this.encumberedAmount - this.expendedAmount : 0;
  }
}
