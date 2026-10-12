import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('metrics')
@Index(['metricKey', 'timestamp'])
@Index(['category', 'timestamp'])
@Index(['source', 'timestamp'])
export class Metric {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  metricKey: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ['circulation', 'financial', 'collection', 'patron', 'operational', 'system'],
  })
  category: 'circulation' | 'financial' | 'collection' | 'patron' | 'operational' | 'system';

  @Column({
    type: 'enum',
    enum: ['counter', 'gauge', 'histogram', 'summary'],
    default: 'counter',
  })
  metricType: 'counter' | 'gauge' | 'histogram' | 'summary';

  @Column({ type: 'decimal', precision: 15, scale: 4 })
  value: number;

  @Column({ type: 'decimal', precision: 15, scale: 4, nullable: true })
  previousValue: number;

  @Column({ length: 50 })
  unit: string; // count, dollars, percentage, etc.

  @Column({ type: 'json', nullable: true })
  dimensions: {
    library?: string;
    department?: string;
    branch?: string;
    materialType?: string;
    patronType?: string;
    vendor?: string;
    fund?: string;
    [key: string]: any;
  };

  @Column({ length: 100 })
  source: string; // Which service generated this metric

  @Column({ type: 'timestamp' })
  timestamp: Date;

  @Column({
    type: 'enum',
    enum: ['hourly', 'daily', 'weekly', 'monthly', 'yearly'],
    default: 'daily',
  })
  aggregationPeriod: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly';

  @Column({ type: 'json', nullable: true })
  metadata: {
    calculationMethod?: string;
    dataQuality?: 'high' | 'medium' | 'low';
    confidence?: number;
    anomalyScore?: number;
    trend?: 'up' | 'down' | 'stable';
    [key: string]: any;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Virtual Properties
  get changeFromPrevious(): number | null {
    if (this.previousValue === null || this.previousValue === undefined) return null;
    return this.value - this.previousValue;
  }

  get percentageChange(): number | null {
    if (this.previousValue === null || this.previousValue === 0) return null;
    return ((this.value - this.previousValue) / this.previousValue) * 100;
  }

  get isIncreasing(): boolean {
    const change = this.changeFromPrevious;
    return change !== null && change > 0;
  }

  get isDecreasing(): boolean {
    const change = this.changeFromPrevious;
    return change !== null && change < 0;
  }

  get isStable(): boolean {
    const change = this.changeFromPrevious;
    return change !== null && Math.abs(change) < 0.01; // Within 1% considered stable
  }

  get formattedValue(): string {
    switch (this.unit) {
      case 'currency':
        return `$${this.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
      case 'percentage':
        return `${this.value.toFixed(2)}%`;
      case 'count':
        return this.value.toLocaleString('en-US');
      case 'days':
        return `${this.value.toFixed(1)} days`;
      case 'hours':
        return `${this.value.toFixed(1)} hours`;
      default:
        return this.value.toString();
    }
  }

  get trendIndicator(): '↑' | '↓' | '→' | '?' {
    if (this.changeFromPrevious === null) return '?';
    if (this.isIncreasing) return '↑';
    if (this.isDecreasing) return '↓';
    return '→';
  }

  get qualityScore(): number {
    const quality = this.metadata?.dataQuality;
    switch (quality) {
      case 'high': return 100;
      case 'medium': return 75;
      case 'low': return 50;
      default: return 0;
    }
  }

  get isAnomalous(): boolean {
    const anomalyScore = this.metadata?.anomalyScore;
    return anomalyScore !== undefined && anomalyScore > 0.8;
  }

  get displayName(): string {
    return this.name || this.metricKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  get categoryDisplayName(): string {
    const categoryMap = {
      circulation: 'Circulation',
      financial: 'Financial',
      collection: 'Collection',
      patron: 'Patron',
      operational: 'Operational',
      system: 'System',
    };
    return categoryMap[this.category] || this.category;
  }

  get aggregationDisplayName(): string {
    const periodMap = {
      hourly: 'Hourly',
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly',
      yearly: 'Yearly',
    };
    return periodMap[this.aggregationPeriod] || this.aggregationPeriod;
  }
}
