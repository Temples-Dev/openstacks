import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { PurchaseOrder } from '../../purchase-orders/entities/purchase-order.entity';
import { Invoice } from '../../invoices/entities/invoice.entity';

@Entity('vendors')
@Index(['code'], { unique: true })
@Index(['name'])
@Index(['status'])
export class Vendor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 50 })
  code: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ['active', 'inactive', 'suspended', 'pending_approval'],
    default: 'pending_approval',
  })
  status: 'active' | 'inactive' | 'suspended' | 'pending_approval';

  @Column({
    type: 'enum',
    enum: ['books', 'serials', 'media', 'digital', 'supplies', 'services', 'mixed'],
    default: 'mixed',
  })
  vendorType: 'books' | 'serials' | 'media' | 'digital' | 'supplies' | 'services' | 'mixed';

  // Contact Information
  @Column({ length: 255, nullable: true })
  contactPerson: string;

  @Column({ length: 255, nullable: true })
  email: string;

  @Column({ length: 50, nullable: true })
  phone: string;

  @Column({ length: 50, nullable: true })
  fax: string;

  @Column({ length: 255, nullable: true })
  website: string;

  // Address Information
  @Column({ length: 255, nullable: true })
  addressLine1: string;

  @Column({ length: 255, nullable: true })
  addressLine2: string;

  @Column({ length: 100, nullable: true })
  city: string;

  @Column({ length: 100, nullable: true })
  state: string;

  @Column({ length: 20, nullable: true })
  postalCode: string;

  @Column({ length: 100, nullable: true })
  country: string;

  // Financial Information
  @Column({ length: 50, nullable: true })
  taxId: string;

  @Column({ length: 10, default: 'USD' })
  currency: string;

  @Column({
    type: 'enum',
    enum: ['net_30', 'net_60', 'net_90', 'cod', 'prepaid', 'custom'],
    default: 'net_30',
  })
  paymentTerms: 'net_30' | 'net_60' | 'net_90' | 'cod' | 'prepaid' | 'custom';

  @Column({ type: 'text', nullable: true })
  customPaymentTerms: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  discountPercentage: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  creditLimit: number;

  // Performance Metrics
  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  performanceRating: number; // 0.00 to 5.00

  @Column({ type: 'int', default: 0 })
  totalOrders: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalOrderValue: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  averageDeliveryDays: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  fulfillmentRate: number; // Percentage

  // Preferences and Settings
  @Column({ type: 'json', nullable: true })
  orderingPreferences: {
    preferredOrderMethod?: 'email' | 'fax' | 'online' | 'edi';
    minimumOrderAmount?: number;
    shippingInstructions?: string;
    specialInstructions?: string;
  };

  @Column({ type: 'json', nullable: true })
  catalogSettings: {
    hasOnlineCatalog?: boolean;
    catalogUrl?: string;
    catalogFormat?: 'marc' | 'csv' | 'xml' | 'api';
    lastCatalogUpdate?: Date;
  };

  // Approval and Workflow
  @Column({ type: 'uuid', nullable: true })
  approvedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date;

  @Column({ type: 'text', nullable: true })
  approvalNotes: string;

  @Column({ type: 'text', nullable: true })
  internalNotes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'uuid', nullable: true })
  createdBy: string;

  @Column({ type: 'uuid', nullable: true })
  updatedBy: string;

  // Relationships
  @OneToMany(() => PurchaseOrder, purchaseOrder => purchaseOrder.vendor)
  purchaseOrders: PurchaseOrder[];

  @OneToMany(() => Invoice, invoice => invoice.vendor)
  invoices: Invoice[];

  // Virtual Properties
  get fullAddress(): string {
    const parts = [
      this.addressLine1,
      this.addressLine2,
      this.city,
      this.state,
      this.postalCode,
      this.country,
    ].filter(Boolean);
    return parts.join(', ');
  }

  get isActive(): boolean {
    return this.status === 'active';
  }

  get canReceiveOrders(): boolean {
    return this.status === 'active' && this.performanceRating >= 2.0;
  }

  get statusDescription(): string {
    const statusMap = {
      active: 'Active - Available for orders',
      inactive: 'Inactive - Not available for orders',
      suspended: 'Suspended - Temporarily unavailable',
      pending_approval: 'Pending Approval - Awaiting review',
    };
    return statusMap[this.status] || 'Unknown Status';
  }

  get averageOrderValue(): number {
    return this.totalOrders > 0 ? this.totalOrderValue / this.totalOrders : 0;
  }

  get performanceGrade(): string {
    if (this.performanceRating >= 4.5) return 'A+';
    if (this.performanceRating >= 4.0) return 'A';
    if (this.performanceRating >= 3.5) return 'B+';
    if (this.performanceRating >= 3.0) return 'B';
    if (this.performanceRating >= 2.5) return 'C+';
    if (this.performanceRating >= 2.0) return 'C';
    return 'D';
  }

  get contactInfo(): string {
    const parts = [];
    if (this.contactPerson) parts.push(this.contactPerson);
    if (this.email) parts.push(this.email);
    if (this.phone) parts.push(this.phone);
    return parts.join(' | ');
  }
}
