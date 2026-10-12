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
import { PurchaseOrder } from '../../purchase-orders/entities/purchase-order.entity';
import { ReceiptLine } from './receipt-line.entity';

@Entity('receipts')
@Index(['receiptNumber'], { unique: true })
@Index(['purchaseOrder'])
@Index(['receiptDate'])
export class Receipt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 50 })
  receiptNumber: string;

  @Column({ type: 'date' })
  receiptDate: Date;

  @ManyToOne(() => PurchaseOrder, purchaseOrder => purchaseOrder, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'purchase_order_id' })
  purchaseOrder: PurchaseOrder;

  @Column({ type: 'uuid' })
  purchaseOrderId: string;

  @Column({
    type: 'enum',
    enum: ['complete', 'partial', 'damaged', 'returned'],
    default: 'complete',
  })
  receiptType: 'complete' | 'partial' | 'damaged' | 'returned';

  @Column({ type: 'int' })
  totalItemsReceived: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  totalValue: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'text', nullable: true })
  conditionNotes: string;

  @Column({ type: 'uuid' })
  receivedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @OneToMany(() => ReceiptLine, line => line.receipt, { cascade: true })
  receiptLines: ReceiptLine[];

  // Virtual Properties
  get statusDescription(): string {
    const statusMap = {
      complete: 'Complete - All items received in good condition',
      partial: 'Partial - Some items received',
      damaged: 'Damaged - Items received with damage',
      returned: 'Returned - Items sent back to vendor',
    };
    return statusMap[this.receiptType] || 'Unknown Status';
  }
}
