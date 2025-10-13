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
import { LoanRenewal } from './loan-renewal.entity';

@Entity('loans')
@Index(['patron', 'status'])
@Index(['itemBarcode', 'status'])
@Index(['dueDate'])
@Index(['checkoutDate'])
export class Loan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'item_barcode', length: 50 })
  @Index()
  itemBarcode: string;

  @Column({ name: 'item_id', length: 36, nullable: true })
  @Index()
  itemId: string;

  @Column({ name: 'catalog_record_id', length: 36, nullable: true })
  catalogRecordId: string;

  @Column({ name: 'checkout_date', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  @Index()
  checkoutDate: Date;

  @Column({ name: 'due_date', type: 'timestamp' })
  @Index()
  dueDate: Date;

  @Column({ name: 'return_date', type: 'timestamp', nullable: true })
  @Index()
  returnDate: Date;

  @Column({ name: 'original_due_date', type: 'timestamp' })
  originalDueDate: Date;

  @Column({ length: 20, default: 'active' })
  @Index()
  status: 'active' | 'returned' | 'overdue' | 'lost' | 'claimed_returned' | 'renewed';

  @Column({ name: 'loan_type', length: 20, default: 'standard' })
  loanType: 'standard' | 'reserve' | 'interlibrary' | 'course_reserve' | 'reference';

  @Column({ name: 'renewal_count', type: 'integer', default: 0 })
  renewalCount: number;

  @Column({ name: 'max_renewals', type: 'integer', default: 2 })
  maxRenewals: number;

  @Column({ name: 'checkout_library', length: 50, nullable: true })
  checkoutLibrary: string;

  @Column({ name: 'return_library', length: 50, nullable: true })
  returnLibrary: string;

  @Column({ name: 'checkout_staff', length: 100, nullable: true })
  checkoutStaff: string;

  @Column({ name: 'return_staff', length: 100, nullable: true })
  returnStaff: string;

  @Column({ name: 'auto_renewal_enabled', default: true })
  autoRenewalEnabled: boolean;

  @Column({ name: 'auto_renewal_count', type: 'integer', default: 0 })
  autoRenewalCount: number;

  @Column({ name: 'last_reminder_date', type: 'timestamp', nullable: true })
  lastReminderDate: Date;

  @Column({ name: 'reminder_count', type: 'integer', default: 0 })
  reminderCount: number;

  @Column({ name: 'overdue_notice_count', type: 'integer', default: 0 })
  overdueNoticeCount: number;

  @Column({ name: 'last_overdue_notice_date', type: 'timestamp', nullable: true })
  lastOverdueNoticeDate: Date;

  @Column({ name: 'fine_amount', type: 'decimal', precision: 10, scale: 2, default: 0 })
  fineAmount: number;

  @Column({ name: 'replacement_cost', type: 'decimal', precision: 10, scale: 2, nullable: true })
  replacementCost: number;

  @Column({ name: 'processing_fee', type: 'decimal', precision: 10, scale: 2, default: 0 })
  processingFee: number;

  @Column({ name: 'is_recalled', default: false })
  @Index()
  isRecalled: boolean;

  @Column({ name: 'recall_date', type: 'timestamp', nullable: true })
  recallDate: Date;

  @Column({ name: 'recall_due_date', type: 'timestamp', nullable: true })
  recallDueDate: Date;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes: string;

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
  @ManyToOne(() => Patron, patron => patron.loans, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'patron_id' })
  patron: Patron;

  @OneToMany(() => LoanRenewal, renewal => renewal.loan, {
    cascade: true,
  })
  renewals: LoanRenewal[];

  // Virtual properties
  get isOverdue(): boolean {
    if (this.returnDate) return false;
    return new Date() > this.dueDate;
  }

  get isActive(): boolean {
    return this.status === 'active' && !this.returnDate;
  }

  get isReturned(): boolean {
    return !!this.returnDate || this.status === 'returned';
  }

  get canRenew(): boolean {
    return this.isActive && 
           !this.isRecalled && 
           this.renewalCount < this.maxRenewals &&
           this.patron?.canRenewItems;
  }

  get daysOverdue(): number {
    if (!this.isOverdue) return 0;
    const now = new Date();
    const diffTime = now.getTime() - this.dueDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  get daysUntilDue(): number {
    if (this.returnDate) return 0;
    const now = new Date();
    const diffTime = this.dueDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  get loanPeriodDays(): number {
    const diffTime = this.dueDate.getTime() - this.checkoutDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  get totalLoanDays(): number {
    const endDate = this.returnDate || new Date();
    const diffTime = endDate.getTime() - this.checkoutDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  get renewalsRemaining(): number {
    return Math.max(0, this.maxRenewals - this.renewalCount);
  }

  get statusDescription(): string {
    if (this.isReturned) return 'Returned';
    if (this.isRecalled) return 'Recalled';
    if (this.isOverdue) return `Overdue (${this.daysOverdue} days)`;
    if (this.daysUntilDue <= 3) return `Due soon (${this.daysUntilDue} days)`;
    return 'Active';
  }

  get fineCalculation(): { dailyRate: number; totalFine: number; description: string } {
    if (!this.isOverdue) {
      return { dailyRate: 0, totalFine: 0, description: 'No fine - not overdue' };
    }

    // Standard fine calculation - $0.25 per day for books, $1.00 for DVDs, etc.
    const dailyRate = this.loanType === 'reserve' ? 1.00 : 0.25;
    const totalFine = Math.min(dailyRate * this.daysOverdue, this.replacementCost || 50.00);
    
    return {
      dailyRate,
      totalFine,
      description: `${this.daysOverdue} days × $${dailyRate} = $${totalFine.toFixed(2)}`
    };
  }

  get nextReminderDue(): boolean {
    if (this.returnDate || !this.isOverdue) return false;
    
    // Send reminder every 7 days for overdue items
    if (!this.lastReminderDate) return true;
    
    const daysSinceLastReminder = Math.ceil(
      (new Date().getTime() - this.lastReminderDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    return daysSinceLastReminder >= 7;
  }

  get isLongOverdue(): boolean {
    return this.daysOverdue >= 30;
  }

  get shouldBeDeclaredLost(): boolean {
    return this.daysOverdue >= 60;
  }

  get recallDaysRemaining(): number {
    if (!this.isRecalled || !this.recallDueDate) return 0;
    const now = new Date();
    const diffTime = this.recallDueDate.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }
}
