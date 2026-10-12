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
import { Budget } from './budget.entity';

@Entity('budget_allocations')
@Index(['budget', 'fundCode'], { unique: true })
@Index(['fundCode'])
export class BudgetAllocation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Budget, budget => budget.allocations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'budget_id' })
  budget: Budget;

  @Column({ type: 'uuid' })
  budgetId: string;

  @Column({ length: 50 })
  fundCode: string;

  @Column({ length: 255 })
  fundName: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ['books', 'serials', 'digital', 'media', 'supplies', 'equipment', 'services', 'other'],
    default: 'books',
  })
  category: 'books' | 'serials' | 'digital' | 'media' | 'supplies' | 'equipment' | 'services' | 'other';

  // Financial Information
  @Column({ type: 'decimal', precision: 15, scale: 2 })
  allocatedAmount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  encumberedAmount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  expendedAmount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  transferredIn: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  transferredOut: number;

  // Spending Controls
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 80 })
  warningThreshold: number; // Percentage

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 95 })
  stopSpendingThreshold: number; // Percentage

  @Column({ type: 'boolean', default: false })
  allowOverspending: boolean;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 5 })
  overspendingLimit: number; // Percentage

  // Department/Owner Information
  @Column({ length: 100, nullable: true })
  department: string;

  @Column({ type: 'uuid', nullable: true })
  managerId: string; // Fund manager

  @Column({ type: 'uuid', nullable: true })
  contactPersonId: string;

  // Status and Workflow
  @Column({
    type: 'enum',
    enum: ['active', 'inactive', 'frozen', 'closed'],
    default: 'active',
  })
  status: 'active' | 'inactive' | 'frozen' | 'closed';

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'text', nullable: true })
  restrictions: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'uuid', nullable: true })
  createdBy: string;

  @Column({ type: 'uuid', nullable: true })
  updatedBy: string;

  // Virtual Properties
  get availableBalance(): number {
    return this.adjustedAllocation - this.encumberedAmount - this.expendedAmount;
  }

  get adjustedAllocation(): number {
    return this.allocatedAmount + this.transferredIn - this.transferredOut;
  }

  get utilizationPercentage(): number {
    const utilized = this.encumberedAmount + this.expendedAmount;
    return this.adjustedAllocation > 0 ? (utilized / this.adjustedAllocation) * 100 : 0;
  }

  get expendedPercentage(): number {
    return this.adjustedAllocation > 0 ? (this.expendedAmount / this.adjustedAllocation) * 100 : 0;
  }

  get encumberedPercentage(): number {
    return this.adjustedAllocation > 0 ? (this.encumberedAmount / this.adjustedAllocation) * 100 : 0;
  }

  get isActive(): boolean {
    return this.status === 'active';
  }

  get isOverWarningThreshold(): boolean {
    return this.utilizationPercentage >= this.warningThreshold;
  }

  get isOverStopSpendingThreshold(): boolean {
    return this.utilizationPercentage >= this.stopSpendingThreshold;
  }

  get canSpend(): boolean {
    if (this.status !== 'active') return false;
    if (this.isOverStopSpendingThreshold && !this.allowOverspending) return false;
    if (this.allowOverspending) {
      return this.utilizationPercentage <= (100 + this.overspendingLimit);
    }
    return true;
  }

  get statusDescription(): string {
    const statusMap = {
      active: 'Active - Available for spending',
      inactive: 'Inactive - Not available for spending',
      frozen: 'Frozen - Spending suspended',
      closed: 'Closed - Fund closed',
    };
    return statusMap[this.status] || 'Unknown Status';
  }

  get healthStatus(): 'healthy' | 'warning' | 'critical' | 'overspent' {
    const utilization = this.utilizationPercentage;
    
    if (utilization > 100) return 'overspent';
    if (utilization >= this.stopSpendingThreshold) return 'critical';
    if (utilization >= this.warningThreshold) return 'warning';
    return 'healthy';
  }

  get categoryDescription(): string {
    const categoryMap = {
      books: 'Books - Print and physical materials',
      serials: 'Serials - Journals and periodicals',
      digital: 'Digital - E-books and digital resources',
      media: 'Media - DVDs, CDs, and multimedia',
      supplies: 'Supplies - Office and library supplies',
      equipment: 'Equipment - Furniture and technology',
      services: 'Services - Professional and consulting',
      other: 'Other - Miscellaneous expenses',
    };
    return categoryMap[this.category] || 'Unknown Category';
  }

  get spendingRate(): number {
    // Calculate spending rate as percentage of allocation per month
    // This is a simplified calculation - real implementation would be more sophisticated
    return this.adjustedAllocation > 0 ? (this.expendedAmount / this.adjustedAllocation) * 100 / 12 : 0;
  }

  get projectedYearEndSpending(): number {
    // Simple projection based on current spending rate
    const monthsElapsed = Math.max(1, new Date().getMonth() + 1);
    const monthlySpendingRate = this.expendedAmount / monthsElapsed;
    return monthlySpendingRate * 12;
  }

  get remainingMonths(): number {
    return Math.max(0, 12 - (new Date().getMonth() + 1));
  }

  get recommendedMonthlySpending(): number {
    return this.remainingMonths > 0 ? this.availableBalance / this.remainingMonths : 0;
  }
}
