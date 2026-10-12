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
import { Patron } from '../../patrons/entities/patron.entity';
import { FinePayment } from './fine-payment.entity';

@Entity('fines')
@Index(['patron', 'status'])
@Index(['fineType', 'status'])
@Index(['createdDate'])
@Index(['dueDate'])
export class Fine {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'fine_type', length: 50 })
  @Index()
  fineType: 'overdue' | 'lost_item' | 'damaged_item' | 'processing_fee' | 'replacement_fee' | 'late_return' | 'other';

  @Column({ name: 'amount', type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ name: 'amount_paid', type: 'decimal', precision: 10, scale: 2, default: 0 })
  amountPaid: number;

  @Column({ name: 'created_date', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  @Index()
  createdDate: Date;

  @Column({ name: 'due_date', type: 'timestamp', nullable: true })
  @Index()
  dueDate: Date;

  @Column({ name: 'paid_date', type: 'timestamp', nullable: true })
  paidDate: Date;

  @Column({ name: 'waived_date', type: 'timestamp', nullable: true })
  waivedDate: Date;

  @Column({ length: 20, default: 'unpaid' })
  @Index()
  status: 'unpaid' | 'partial' | 'paid' | 'waived' | 'forgiven' | 'transferred';

  @Column({ name: 'item_barcode', length: 50, nullable: true })
  @Index()
  itemBarcode: string;

  @Column({ name: 'item_id', length: 36, nullable: true })
  itemId: string;

  @Column({ name: 'loan_id', length: 36, nullable: true })
  @Index()
  loanId: string;

  @Column({ name: 'catalog_record_id', length: 36, nullable: true })
  catalogRecordId: string;

  @Column({ name: 'title', length: 500, nullable: true })
  title: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description: string;

  @Column({ name: 'reason', type: 'text', nullable: true })
  reason: string;

  @Column({ name: 'waiver_reason', type: 'text', nullable: true })
  waiverReason: string;

  @Column({ name: 'billing_date', type: 'timestamp', nullable: true })
  billingDate: Date;

  @Column({ name: 'last_notice_date', type: 'timestamp', nullable: true })
  lastNoticeDate: Date;

  @Column({ name: 'notice_count', type: 'integer', default: 0 })
  noticeCount: number;

  @Column({ name: 'created_by_staff', length: 100, nullable: true })
  createdByStaff: string;

  @Column({ name: 'waived_by_staff', length: 100, nullable: true })
  waivedByStaff: string;

  @Column({ name: 'library_code', length: 50, nullable: true })
  @Index()
  libraryCode: string;

  @Column({ name: 'is_billable', default: true })
  isBillable: boolean;

  @Column({ name: 'is_refundable', default: false })
  isRefundable: boolean;

  @Column({ name: 'max_fine_amount', type: 'decimal', precision: 10, scale: 2, nullable: true })
  maxFineAmount: number;

  @Column({ name: 'daily_fine_rate', type: 'decimal', precision: 10, scale: 2, nullable: true })
  dailyFineRate: number;

  @Column({ name: 'accrual_start_date', type: 'timestamp', nullable: true })
  accrualStartDate: Date;

  @Column({ name: 'accrual_end_date', type: 'timestamp', nullable: true })
  accrualEndDate: Date;

  @Column({ name: 'staff_notes', type: 'text', nullable: true })
  staffNotes: string;

  @Column({ name: 'system_notes', type: 'text', nullable: true })
  systemNotes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  // Relations
  @ManyToOne(() => Patron, patron => patron.fines, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'patron_id' })
  patron: Patron;

  @OneToMany(() => FinePayment, payment => payment.fine, {
    cascade: true,
  })
  payments: FinePayment[];

  // Virtual properties
  get balanceOwed(): number {
    return Math.max(0, this.amount - this.amountPaid);
  }

  get isFullyPaid(): boolean {
    return this.amountPaid >= this.amount;
  }

  get isPartiallyPaid(): boolean {
    return this.amountPaid > 0 && this.amountPaid < this.amount;
  }

  get isOverdue(): boolean {
    return this.dueDate && new Date() > this.dueDate && this.balanceOwed > 0;
  }

  get daysSinceCreated(): number {
    const now = new Date();
    const diffTime = now.getTime() - this.createdDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  get daysOverdue(): number {
    if (!this.isOverdue) return 0;
    const now = new Date();
    const diffTime = now.getTime() - this.dueDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  get ageCategory(): string {
    const days = this.daysSinceCreated;
    if (days <= 30) return 'current';
    if (days <= 60) return 'recent';
    if (days <= 90) return 'aging';
    return 'old';
  }

  get statusDescription(): string {
    switch (this.status) {
      case 'unpaid':
        return this.isOverdue ? `Overdue (${this.daysOverdue} days)` : 'Unpaid';
      case 'partial':
        return `Partially paid ($${this.balanceOwed.toFixed(2)} remaining)`;
      case 'paid':
        return `Paid on ${this.paidDate?.toLocaleDateString()}`;
      case 'waived':
        return `Waived on ${this.waivedDate?.toLocaleDateString()}`;
      case 'forgiven':
        return 'Forgiven';
      case 'transferred':
        return 'Transferred to collections';
      default:
        return this.status;
    }
  }

  get fineTypeDescription(): string {
    switch (this.fineType) {
      case 'overdue':
        return 'Overdue Fine';
      case 'lost_item':
        return 'Lost Item Fee';
      case 'damaged_item':
        return 'Damaged Item Fee';
      case 'processing_fee':
        return 'Processing Fee';
      case 'replacement_fee':
        return 'Replacement Fee';
      case 'late_return':
        return 'Late Return Fee';
      case 'other':
        return 'Other Fee';
      default:
        return this.fineType;
    }
  }

  get canBeWaived(): boolean {
    return ['unpaid', 'partial'].includes(this.status) && this.balanceOwed > 0;
  }

  get canAcceptPayment(): boolean {
    return ['unpaid', 'partial'].includes(this.status) && this.balanceOwed > 0;
  }

  get shouldSendNotice(): boolean {
    if (this.status !== 'unpaid' && this.status !== 'partial') return false;
    if (!this.lastNoticeDate) return true;
    
    // Send notice every 14 days
    const daysSinceLastNotice = Math.ceil(
      (new Date().getTime() - this.lastNoticeDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    return daysSinceLastNotice >= 14;
  }

  get isEligibleForCollection(): boolean {
    return this.balanceOwed >= 25.00 && this.daysOverdue >= 90;
  }

  get totalPayments(): number {
    return this.payments?.reduce((total, payment) => total + payment.amount, 0) || 0;
  }

  get lastPaymentDate(): Date {
    if (!this.payments?.length) return null;
    return this.payments
      .sort((a, b) => b.paymentDate.getTime() - a.paymentDate.getTime())[0]
      .paymentDate;
  }

  get accrualDays(): number {
    if (!this.accrualStartDate || !this.accrualEndDate) return 0;
    const diffTime = this.accrualEndDate.getTime() - this.accrualStartDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  get calculatedFineAmount(): number {
    if (!this.dailyFineRate || !this.accrualDays) return this.amount;
    
    const calculated = this.dailyFineRate * this.accrualDays;
    return this.maxFineAmount ? Math.min(calculated, this.maxFineAmount) : calculated;
  }
}
