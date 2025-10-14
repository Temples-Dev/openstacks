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
import { BudgetAllocation } from './budget-allocation.entity';

@Entity('budgets')
@Index(['code'], { unique: true })
@Index(['fiscalYear'])
@Index(['status'])
export class Budget {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 50 })
  code: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'int' })
  fiscalYear: number;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date' })
  endDate: Date;

  @Column({
    type: 'enum',
    enum: ['draft', 'active', 'closed', 'frozen'],
    default: 'draft',
  })
  status: 'draft' | 'active' | 'closed' | 'frozen';

  @Column({
    type: 'enum',
    enum: ['library', 'department', 'grant', 'endowment', 'special'],
    default: 'library',
  })
  budgetType: 'library' | 'department' | 'grant' | 'endowment' | 'special';

  // Financial Information
  @Column({ type: 'decimal', precision: 15, scale: 2 })
  totalAllocation: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalEncumbered: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalExpended: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalTransferredIn: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalTransferredOut: number;

  @Column({ length: 10, default: 'USD' })
  currency: string;

  // Approval and Workflow
  @Column({ type: 'uuid', nullable: true })
  managerId: string; // Budget manager

  @Column({ type: 'uuid', nullable: true })
  approvedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date;

  // Spending Controls
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 80 })
  warningThreshold: number; // Percentage

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 95 })
  stopSpendingThreshold: number; // Percentage

  @Column({ type: 'boolean', default: false })
  allowOverspending: boolean;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 5 })
  overspendingLimit: number; // Percentage

  // Notifications
  @Column({ type: 'boolean', default: true })
  enableWarningNotifications: boolean;

  @Column({ type: 'boolean', default: true })
  enableOverspendingNotifications: boolean;

  @Column({ type: 'json', nullable: true })
  notificationSettings: {
    emailAddresses?: string[];
    warningFrequency?: 'daily' | 'weekly' | 'monthly';
    includeProjections?: boolean;
  };

  // Reporting and Analytics
  @Column({ type: 'json', nullable: true })
  spendingCategories: {
    books?: number;
    serials?: number;
    digital?: number;
    media?: number;
    supplies?: number;
    other?: number;
  };

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

  // Relationships
  @OneToMany(() => PurchaseOrder, purchaseOrder => purchaseOrder.budget)
  purchaseOrders: PurchaseOrder[];

  @OneToMany(() => BudgetAllocation, allocation => allocation.budget, { cascade: true })
  allocations: BudgetAllocation[];

  // Virtual Properties
  get availableBalance(): number {
    return this.adjustedAllocation - this.totalEncumbered - this.totalExpended;
  }

  get adjustedAllocation(): number {
    return this.totalAllocation + this.totalTransferredIn - this.totalTransferredOut;
  }

  get utilizationPercentage(): number {
    const utilized = this.totalEncumbered + this.totalExpended;
    return this.adjustedAllocation > 0 ? (utilized / this.adjustedAllocation) * 100 : 0;
  }

  get expendedPercentage(): number {
    return this.adjustedAllocation > 0 ? (this.totalExpended / this.adjustedAllocation) * 100 : 0;
  }

  get encumberedPercentage(): number {
    return this.adjustedAllocation > 0 ? (this.totalEncumbered / this.adjustedAllocation) * 100 : 0;
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
      draft: 'Draft - Being prepared',
      active: 'Active - Available for spending',
      closed: 'Closed - Fiscal year ended',
      frozen: 'Frozen - Spending suspended',
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

  get projectedEndDate(): Date | null {
    if (this.totalExpended === 0) return null;
    
    const daysElapsed = Math.floor(
      (new Date().getTime() - this.startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysElapsed <= 0) return null;
    
    const dailySpendRate = this.totalExpended / daysElapsed;
    const remainingBudget = this.availableBalance;
    
    if (dailySpendRate <= 0) return null;
    
    const daysRemaining = remainingBudget / dailySpendRate;
    const projectedDate = new Date();
    projectedDate.setDate(projectedDate.getDate() + daysRemaining);
    
    return projectedDate;
  }

  get daysRemaining(): number {
    const today = new Date();
    const diffTime = this.endDate.getTime() - today.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }

  get averageDailySpending(): number {
    const daysElapsed = Math.floor(
      (new Date().getTime() - this.startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysElapsed > 0 ? this.totalExpended / daysElapsed : 0;
  }

  get projectedYearEndBalance(): number {
    const daysRemaining = this.daysRemaining;
    const dailySpendRate = this.averageDailySpending;
    const projectedSpending = dailySpendRate * daysRemaining;
    return this.availableBalance - projectedSpending;
  }

  get spendingVelocity(): 'slow' | 'normal' | 'fast' | 'very_fast' {
    const targetUtilization = (new Date().getTime() - this.startDate.getTime()) / 
                             (this.endDate.getTime() - this.startDate.getTime()) * 100;
    
    const actualUtilization = this.utilizationPercentage;
    const variance = actualUtilization - targetUtilization;
    
    if (variance > 20) return 'very_fast';
    if (variance > 10) return 'fast';
    if (variance < -10) return 'slow';
    return 'normal';
  }
}
