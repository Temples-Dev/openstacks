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
import { Vendor } from '../../vendors/entities/vendor.entity';
import { PurchaseOrder } from '../../purchase-orders/entities/purchase-order.entity';
import { InvoiceLine } from './invoice-line.entity';

@Entity('invoices')
@Index(['invoiceNumber'], { unique: true })
@Index(['vendor', 'status'])
@Index(['purchaseOrder'])
@Index(['invoiceDate'])
@Index(['dueDate'])
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 100 })
  invoiceNumber: string;

  @Column({ length: 100, nullable: true })
  vendorInvoiceNumber: string;

  @Column({ type: 'date' })
  invoiceDate: Date;

  @Column({ type: 'date' })
  dueDate: Date;

  @Column({ type: 'date', nullable: true })
  receivedDate: Date;

  @Column({ type: 'date', nullable: true })
  paidDate: Date;

  // Vendor Information
  @ManyToOne(() => Vendor, vendor => vendor.invoices, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'vendor_id' })
  vendor: Vendor;

  @Column({ type: 'uuid' })
  vendorId: string;

  // Purchase Order Information (optional - some invoices may not have PO)
  @ManyToOne(() => PurchaseOrder, purchaseOrder => purchaseOrder.invoices, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'purchase_order_id' })
  purchaseOrder: PurchaseOrder;

  @Column({ type: 'uuid', nullable: true })
  purchaseOrderId: string;

  // Financial Information
  @Column({ type: 'decimal', precision: 15, scale: 2 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  taxAmount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  shippingAmount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  handlingAmount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  totalAmount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  paidAmount: number;

  @Column({ length: 10, default: 'USD' })
  currency: string;

  @Column({ type: 'decimal', precision: 10, scale: 6, default: 1 })
  exchangeRate: number;

  // Status and Workflow
  @Column({
    type: 'enum',
    enum: ['received', 'approved', 'disputed', 'paid', 'cancelled', 'on_hold'],
    default: 'received',
  })
  status: 'received' | 'approved' | 'disputed' | 'paid' | 'cancelled' | 'on_hold';

  @Column({
    type: 'enum',
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  })
  approvalStatus: 'pending' | 'approved' | 'rejected';

  @Column({ type: 'uuid', nullable: true })
  approvedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date;

  @Column({ type: 'text', nullable: true })
  approvalNotes: string;

  // Payment Information
  @Column({
    type: 'enum',
    enum: ['check', 'wire_transfer', 'ach', 'credit_card', 'cash', 'other'],
    nullable: true,
  })
  paymentMethod: 'check' | 'wire_transfer' | 'ach' | 'credit_card' | 'cash' | 'other';

  @Column({ length: 100, nullable: true })
  paymentReference: string; // Check number, transaction ID, etc.

  @Column({ type: 'text', nullable: true })
  paymentNotes: string;

  // Dispute Information
  @Column({ type: 'boolean', default: false })
  isDisputed: boolean;

  @Column({ type: 'text', nullable: true })
  disputeReason: string;

  @Column({ type: 'timestamp', nullable: true })
  disputeDate: Date;

  @Column({ type: 'uuid', nullable: true })
  disputedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  disputeResolvedDate: Date;

  @Column({ type: 'text', nullable: true })
  disputeResolution: string;

  // Matching and Validation
  @Column({ type: 'boolean', default: false })
  isThreeWayMatched: boolean; // PO, Receipt, Invoice match

  @Column({ type: 'json', nullable: true })
  matchingDiscrepancies: {
    priceVariances?: Array<{
      lineNumber: number;
      expectedPrice: number;
      actualPrice: number;
      variance: number;
    }>;
    quantityVariances?: Array<{
      lineNumber: number;
      expectedQuantity: number;
      actualQuantity: number;
      variance: number;
    }>;
    missingItems?: Array<{
      lineNumber: number;
      description: string;
    }>;
    unexpectedItems?: Array<{
      description: string;
      amount: number;
    }>;
  };

  // Document Management
  @Column({ type: 'json', nullable: true })
  attachments: Array<{
    filename: string;
    url: string;
    type: 'pdf' | 'image' | 'document';
    uploadedAt: Date;
    uploadedBy: string;
  }>;

  // Notes and Comments
  @Column({ type: 'text', nullable: true })
  vendorNotes: string;

  @Column({ type: 'text', nullable: true })
  internalNotes: string;

  @Column({ type: 'text', nullable: true })
  accountingNotes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'uuid', nullable: true })
  createdBy: string;

  @Column({ type: 'uuid', nullable: true })
  updatedBy: string;

  // Relationships
  @OneToMany(() => InvoiceLine, line => line.invoice, { cascade: true })
  invoiceLines: InvoiceLine[];

  // Virtual Properties
  get balanceOwed(): number {
    return this.totalAmount - this.paidAmount;
  }

  get isFullyPaid(): boolean {
    return this.paidAmount >= this.totalAmount;
  }

  get isPartiallyPaid(): boolean {
    return this.paidAmount > 0 && this.paidAmount < this.totalAmount;
  }

  get isOverdue(): boolean {
    return !this.isFullyPaid && new Date() > this.dueDate;
  }

  get daysOverdue(): number {
    if (!this.isOverdue) return 0;
    const today = new Date();
    const diffTime = today.getTime() - this.dueDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  get daysUntilDue(): number {
    const today = new Date();
    const diffTime = this.dueDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  get statusDescription(): string {
    const statusMap = {
      received: 'Received - Awaiting processing',
      approved: 'Approved - Ready for payment',
      disputed: 'Disputed - Under review',
      paid: 'Paid - Payment completed',
      cancelled: 'Cancelled - Invoice voided',
      on_hold: 'On Hold - Processing suspended',
    };
    return statusMap[this.status] || 'Unknown Status';
  }

  get approvalStatusDescription(): string {
    const statusMap = {
      pending: 'Pending - Awaiting approval',
      approved: 'Approved - Ready to process',
      rejected: 'Rejected - Approval denied',
    };
    return statusMap[this.approvalStatus] || 'Unknown Status';
  }

  get priorityLevel(): 'low' | 'normal' | 'high' | 'urgent' {
    if (this.isDisputed) return 'high';
    if (this.isOverdue && this.daysOverdue > 30) return 'urgent';
    if (this.isOverdue) return 'high';
    if (this.daysUntilDue <= 3) return 'high';
    if (this.daysUntilDue <= 7) return 'normal';
    return 'low';
  }

  get canBeApproved(): boolean {
    return this.status === 'received' && 
           this.approvalStatus === 'pending' && 
           !this.isDisputed;
  }

  get canBePaid(): boolean {
    return this.status === 'approved' && 
           this.approvalStatus === 'approved' && 
           !this.isDisputed && 
           !this.isFullyPaid;
  }

  get canBeDisputed(): boolean {
    return ['received', 'approved'].includes(this.status) && 
           !this.isDisputed;
  }

  get totalAmountInBaseCurrency(): number {
    return this.totalAmount * this.exchangeRate;
  }

  get netAmount(): number {
    return this.subtotal - this.discountAmount;
  }

  get effectiveTaxRate(): number {
    return this.subtotal > 0 ? (this.taxAmount / this.subtotal) * 100 : 0;
  }

  get paymentPercentage(): number {
    return this.totalAmount > 0 ? (this.paidAmount / this.totalAmount) * 100 : 0;
  }

  get hasVariances(): boolean {
    return this.matchingDiscrepancies && (
      (this.matchingDiscrepancies.priceVariances?.length > 0) ||
      (this.matchingDiscrepancies.quantityVariances?.length > 0) ||
      (this.matchingDiscrepancies.missingItems?.length > 0) ||
      (this.matchingDiscrepancies.unexpectedItems?.length > 0)
    );
  }

  get varianceCount(): number {
    if (!this.matchingDiscrepancies) return 0;
    return (this.matchingDiscrepancies.priceVariances?.length || 0) +
           (this.matchingDiscrepancies.quantityVariances?.length || 0) +
           (this.matchingDiscrepancies.missingItems?.length || 0) +
           (this.matchingDiscrepancies.unexpectedItems?.length || 0);
  }

  get processingDays(): number {
    if (!this.receivedDate) return 0;
    const endDate = this.paidDate || new Date();
    const diffTime = endDate.getTime() - this.receivedDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}
