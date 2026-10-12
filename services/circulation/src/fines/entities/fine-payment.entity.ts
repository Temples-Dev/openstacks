import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Fine } from './fine.entity';

@Entity('fine_payments')
@Index(['fine', 'paymentDate'])
@Index(['paymentMethod'])
@Index(['transactionId'])
export class FinePayment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'amount', type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ name: 'payment_date', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  @Index()
  paymentDate: Date;

  @Column({ name: 'payment_method', length: 50 })
  @Index()
  paymentMethod: 'cash' | 'credit_card' | 'debit_card' | 'check' | 'money_order' | 'online' | 'waiver' | 'forgiveness' | 'other';

  @Column({ name: 'transaction_id', length: 100, nullable: true })
  @Index()
  transactionId: string;

  @Column({ name: 'reference_number', length: 100, nullable: true })
  referenceNumber: string;

  @Column({ name: 'collected_by_staff', length: 100, nullable: true })
  collectedByStaff: string;

  @Column({ name: 'library_code', length: 50, nullable: true })
  libraryCode: string;

  @Column({ name: 'register_id', length: 50, nullable: true })
  registerId: string;

  @Column({ name: 'receipt_number', length: 100, nullable: true })
  receiptNumber: string;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'is_refunded', default: false })
  isRefunded: boolean;

  @Column({ name: 'refund_date', type: 'timestamp', nullable: true })
  refundDate: Date;

  @Column({ name: 'refund_amount', type: 'decimal', precision: 10, scale: 2, nullable: true })
  refundAmount: number;

  @Column({ name: 'refund_reason', type: 'text', nullable: true })
  refundReason: string;

  @Column({ name: 'refunded_by_staff', length: 100, nullable: true })
  refundedByStaff: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => Fine, fine => fine.payments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'fine_id' })
  fine: Fine;

  // Virtual properties
  get netAmount(): number {
    return this.amount - (this.refundAmount || 0);
  }

  get paymentMethodDescription(): string {
    switch (this.paymentMethod) {
      case 'cash': return 'Cash';
      case 'credit_card': return 'Credit Card';
      case 'debit_card': return 'Debit Card';
      case 'check': return 'Check';
      case 'money_order': return 'Money Order';
      case 'online': return 'Online Payment';
      case 'waiver': return 'Waived';
      case 'forgiveness': return 'Forgiven';
      case 'other': return 'Other';
      default: return this.paymentMethod;
    }
  }

  get canBeRefunded(): boolean {
    return !this.isRefunded && 
           this.netAmount > 0 && 
           ['cash', 'credit_card', 'debit_card', 'online'].includes(this.paymentMethod);
  }

  get isWaiver(): boolean {
    return this.paymentMethod === 'waiver' || this.paymentMethod === 'forgiveness';
  }
}
