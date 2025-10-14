import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Invoice } from './invoice.entity';

@Entity('invoice_lines')
@Index(['invoice', 'lineNumber'], { unique: true })
export class InvoiceLine {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Invoice, invoice => invoice.invoiceLines, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'invoice_id' })
  invoice: Invoice;

  @Column({ type: 'uuid' })
  invoiceId: string;

  @Column({ type: 'int' })
  lineNumber: number;

  // Item Information
  @Column({ length: 500 })
  description: string;

  @Column({ length: 20, nullable: true })
  isbn: string;

  @Column({ length: 100, nullable: true })
  vendorItemNumber: string;

  @Column({ type: 'uuid', nullable: true })
  purchaseOrderLineId: string; // Link to PO line

  // Quantity and Pricing
  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  listPrice: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  discountPercentage: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  netPrice: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  lineTotal: number;

  // Fund Allocation
  @Column({ type: 'uuid', nullable: true })
  fundCode: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  allocatedAmount: number;

  // Notes
  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Virtual Properties
  get totalDiscount(): number {
    return this.listPrice && this.unitPrice 
      ? (this.listPrice - this.unitPrice) * this.quantity 
      : 0;
  }

  get effectiveDiscountPercentage(): number {
    return this.listPrice && this.listPrice > 0 
      ? ((this.listPrice - this.unitPrice) / this.listPrice) * 100 
      : 0;
  }
}
