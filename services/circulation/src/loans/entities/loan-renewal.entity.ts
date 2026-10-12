import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Loan } from './loan.entity';

@Entity('loan_renewals')
@Index(['loan', 'renewalDate'])
export class LoanRenewal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'renewal_date', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  @Index()
  renewalDate: Date;

  @Column({ name: 'previous_due_date', type: 'timestamp' })
  previousDueDate: Date;

  @Column({ name: 'new_due_date', type: 'timestamp' })
  newDueDate: Date;

  @Column({ name: 'renewal_type', length: 20, default: 'manual' })
  renewalType: 'manual' | 'automatic' | 'staff_override';

  @Column({ name: 'renewed_by_staff', length: 100, nullable: true })
  renewedByStaff: string;

  @Column({ name: 'renewal_library', length: 50, nullable: true })
  renewalLibrary: string;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => Loan, loan => loan.renewals, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'loan_id' })
  loan: Loan;

  // Virtual properties
  get extensionDays(): number {
    const diffTime = this.newDueDate.getTime() - this.previousDueDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  get isAutoRenewal(): boolean {
    return this.renewalType === 'automatic';
  }
}
