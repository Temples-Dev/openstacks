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
import { Receipt } from './receipt.entity';
import { PurchaseOrderLine } from '../../purchase-orders/entities/purchase-order-line.entity';

@Entity('receipt_lines')
@Index(['receipt', 'lineNumber'], { unique: true })
export class ReceiptLine {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Receipt, receipt => receipt.receiptLines, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'receipt_id' })
  receipt: Receipt;

  @Column({ type: 'uuid' })
  receiptId: string;

  @ManyToOne(() => PurchaseOrderLine, poLine => poLine.receiptLines, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'purchase_order_line_id' })
  purchaseOrderLine: PurchaseOrderLine;

  @Column({ type: 'uuid' })
  purchaseOrderLineId: string;

  @Column({ type: 'int' })
  lineNumber: number;

  @Column({ type: 'int' })
  quantityReceived: number;

  @Column({ type: 'int', default: 0 })
  quantityDamaged: number;

  @Column({ type: 'int', default: 0 })
  quantityReturned: number;

  @Column({
    type: 'enum',
    enum: ['good', 'damaged', 'defective', 'wrong_item', 'missing'],
    default: 'good',
  })
  condition: 'good' | 'damaged' | 'defective' | 'wrong_item' | 'missing';

  @Column({ type: 'text', nullable: true })
  conditionNotes: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Virtual Properties
  get quantityAccepted(): number {
    return this.quantityReceived - this.quantityDamaged - this.quantityReturned;
  }

  get conditionDescription(): string {
    const conditionMap = {
      good: 'Good - Item in acceptable condition',
      damaged: 'Damaged - Item has physical damage',
      defective: 'Defective - Item does not function properly',
      wrong_item: 'Wrong Item - Incorrect item received',
      missing: 'Missing - Item not included in shipment',
    };
    return conditionMap[this.condition] || 'Unknown Condition';
  }

  get hasIssues(): boolean {
    return this.condition !== 'good' || this.quantityDamaged > 0 || this.quantityReturned > 0;
  }
}
