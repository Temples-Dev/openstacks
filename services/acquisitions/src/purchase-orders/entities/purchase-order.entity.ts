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
import { PurchaseOrderLine } from './purchase-order-line.entity';
import { Budget } from '../../budgets/entities/budget.entity';
import { Invoice } from '../../invoices/entities/invoice.entity';

@Entity('purchase_orders')
@Index(['orderNumber'], { unique: true })
@Index(['vendor', 'status'])
@Index(['budget', 'status'])
@Index(['orderDate'])
@Index(['expectedDeliveryDate'])
export class PurchaseOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 50 })
  orderNumber: string;

  @Column({
    type: 'enum',
    enum: ['draft', 'pending_approval', 'approved', 'sent', 'partially_received', 'received', 'cancelled', 'closed'],
    default: 'draft',
  })
  status: 'draft' | 'pending_approval' | 'approved' | 'sent' | 'partially_received' | 'received' | 'cancelled' | 'closed';

  @Column({
    type: 'enum',
    enum: ['standard', 'rush', 'standing_order', 'blanket_order', 'approval_plan'],
    default: 'standard',
  })
  orderType: 'standard' | 'rush' | 'standing_order' | 'blanket_order' | 'approval_plan';

  @Column({ type: 'date' })
  orderDate: Date;

  @Column({ type: 'date', nullable: true })
  expectedDeliveryDate: Date;

  @Column({ type: 'date', nullable: true })
  actualDeliveryDate: Date;

  @Column({ type: 'date', nullable: true })
  sentDate: Date;

  // Vendor Information
  @ManyToOne(() => Vendor, vendor => vendor.purchaseOrders, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'vendor_id' })
  vendor: Vendor;

  @Column({ type: 'uuid' })
  vendorId: string;

  @Column({ length: 100, nullable: true })
  vendorOrderNumber: string;

  // Budget Information
  @ManyToOne(() => Budget, budget => budget.purchaseOrders, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'budget_id' })
  budget: Budget;

  @Column({ type: 'uuid' })
  budgetId: string;

  // Financial Information
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  taxAmount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  shippingAmount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalAmount: number;

  @Column({ length: 10, default: 'USD' })
  currency: string;

  @Column({ type: 'decimal', precision: 10, scale: 6, default: 1 })
  exchangeRate: number;

  // Shipping Information
  @Column({ length: 255, nullable: true })
  shippingAddress: string;

  @Column({ length: 100, nullable: true })
  shippingMethod: string;

  @Column({ length: 100, nullable: true })
  trackingNumber: string;

  // Approval Workflow
  @Column({ type: 'uuid', nullable: true })
  requestedBy: string;

  @Column({ type: 'uuid', nullable: true })
  approvedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date;

  @Column({ type: 'text', nullable: true })
  approvalNotes: string;

  // Special Instructions and Notes
  @Column({ type: 'text', nullable: true })
  specialInstructions: string;

  @Column({ type: 'text', nullable: true })
  internalNotes: string;

  @Column({ type: 'text', nullable: true })
  vendorNotes: string;

  // Rush Order Information
  @Column({ type: 'boolean', default: false })
  isRushOrder: boolean;

  @Column({ type: 'text', nullable: true })
  rushJustification: string;

  @Column({ type: 'date', nullable: true })
  rushDeadline: Date;

  // Recurring Order Information
  @Column({ type: 'boolean', default: false })
  isRecurring: boolean;

  @Column({
    type: 'enum',
    enum: ['weekly', 'monthly', 'quarterly', 'annually'],
    nullable: true,
  })
  recurringFrequency: 'weekly' | 'monthly' | 'quarterly' | 'annually';

  @Column({ type: 'date', nullable: true })
  nextRecurringDate: Date;

  @Column({ type: 'uuid', nullable: true })
  parentOrderId: string; // For recurring orders

  // Receiving Information
  @Column({ type: 'int', default: 0 })
  totalItemsOrdered: number;

  @Column({ type: 'int', default: 0 })
  totalItemsReceived: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  fulfillmentPercentage: number;

  @Column({ type: 'timestamp', nullable: true })
  firstReceiptDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastReceiptDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'uuid', nullable: true })
  createdBy: string;

  @Column({ type: 'uuid', nullable: true })
  updatedBy: string;

  // Relationships
  @OneToMany(() => PurchaseOrderLine, line => line.purchaseOrder, { cascade: true })
  orderLines: PurchaseOrderLine[];

  @OneToMany(() => Invoice, invoice => invoice.purchaseOrder)
  invoices: Invoice[];

  // Virtual Properties
  get isActive(): boolean {
    return !['cancelled', 'closed'].includes(this.status);
  }

  get canBeModified(): boolean {
    return ['draft', 'pending_approval'].includes(this.status);
  }

  get canBeCancelled(): boolean {
    return ['draft', 'pending_approval', 'approved', 'sent'].includes(this.status);
  }

  get canBeReceived(): boolean {
    return ['sent', 'partially_received'].includes(this.status);
  }

  get isOverdue(): boolean {
    if (!this.expectedDeliveryDate || this.status === 'received') return false;
    return new Date() > this.expectedDeliveryDate;
  }

  get daysOverdue(): number {
    if (!this.isOverdue) return 0;
    const today = new Date();
    const diffTime = today.getTime() - this.expectedDeliveryDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  get daysUntilDelivery(): number {
    if (!this.expectedDeliveryDate) return 0;
    const today = new Date();
    const diffTime = this.expectedDeliveryDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  get statusDescription(): string {
    const statusMap = {
      draft: 'Draft - Being prepared',
      pending_approval: 'Pending Approval - Awaiting authorization',
      approved: 'Approved - Ready to send',
      sent: 'Sent - Awaiting delivery',
      partially_received: 'Partially Received - Some items delivered',
      received: 'Received - All items delivered',
      cancelled: 'Cancelled - Order terminated',
      closed: 'Closed - Order completed',
    };
    return statusMap[this.status] || 'Unknown Status';
  }

  get priorityLevel(): 'low' | 'normal' | 'high' | 'urgent' {
    if (this.isRushOrder) return 'urgent';
    if (this.isOverdue) return 'high';
    if (this.daysUntilDelivery <= 7) return 'high';
    if (this.daysUntilDelivery <= 14) return 'normal';
    return 'low';
  }

  get totalAmountInBaseCurrency(): number {
    return this.totalAmount * this.exchangeRate;
  }

  get averageItemValue(): number {
    return this.totalItemsOrdered > 0 ? this.totalAmount / this.totalItemsOrdered : 0;
  }

  get completionPercentage(): number {
    return this.totalItemsOrdered > 0 
      ? (this.totalItemsReceived / this.totalItemsOrdered) * 100 
      : 0;
  }

  get estimatedTax(): number {
    // Simple tax calculation - in real implementation would use tax service
    return this.subtotal * 0.08; // 8% default tax rate
  }

  get netAmount(): number {
    return this.subtotal - this.discountAmount;
  }
}
