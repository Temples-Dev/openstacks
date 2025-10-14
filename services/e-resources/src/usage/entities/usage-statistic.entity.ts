import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { EResource } from '../../resources/entities/e-resource.entity';

@Entity('usage_statistics')
@Index(['resourceId', 'reportDate'])
@Index(['metricType', 'reportDate'])
@Index(['libraryId', 'reportDate'])
export class UsageStatistic {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => EResource, resource => resource.usageStatistics)
  @JoinColumn({ name: 'resourceId' })
  resource: EResource;

  @Column({ type: 'uuid' })
  resourceId: string;

  @Column({ type: 'uuid' })
  libraryId: string;

  @Column({ type: 'date' })
  reportDate: Date;

  @Column({
    type: 'enum',
    enum: ['monthly', 'quarterly', 'annual', 'custom'],
    default: 'monthly',
  })
  reportPeriod: 'monthly' | 'quarterly' | 'annual' | 'custom';

  @Column({
    type: 'enum',
    enum: ['counter_5', 'counter_4', 'custom', 'vendor_specific'],
    default: 'counter_5',
  })
  reportStandard: 'counter_5' | 'counter_4' | 'custom' | 'vendor_specific';

  @Column({
    type: 'enum',
    enum: [
      'searches_platform',
      'searches_federated',
      'total_item_investigations',
      'total_item_requests',
      'unique_item_investigations',
      'unique_item_requests',
      'unique_title_investigations',
      'unique_title_requests',
      'sessions',
      'downloads',
      'views',
      'turnaways'
    ],
  })
  metricType: string;

  @Column({ type: 'integer', default: 0 })
  count: number;

  @Column('json', { nullable: true })
  breakdown: {
    byUserType?: Record<string, number>;
    byLocation?: Record<string, number>;
    byFormat?: Record<string, number>;
    bySubject?: Record<string, number>;
    byLanguage?: Record<string, number>;
  };

  @Column('json', { nullable: true })
  metadata: {
    dataSource?: string;
    collectionMethod?: string;
    qualityIndicators?: string[];
    notes?: string;
    reportingPeriodTotal?: number;
    percentageOfTotal?: number;
  };

  @CreateDateColumn()
  createdAt: Date;

  // Virtual Properties
  get displayMetricType(): string {
    const typeMap = {
      searches_platform: 'Platform Searches',
      searches_federated: 'Federated Searches',
      total_item_investigations: 'Total Item Investigations',
      total_item_requests: 'Total Item Requests',
      unique_item_investigations: 'Unique Item Investigations',
      unique_item_requests: 'Unique Item Requests',
      unique_title_investigations: 'Unique Title Investigations',
      unique_title_requests: 'Unique Title Requests',
      sessions: 'Sessions',
      downloads: 'Downloads',
      views: 'Views',
      turnaways: 'Turnaways',
    };
    return typeMap[this.metricType] || this.metricType;
  }

  get isCounterCompliant(): boolean {
    return this.reportStandard.startsWith('counter_');
  }

  get reportYear(): number {
    return this.reportDate.getFullYear();
  }

  get reportMonth(): number {
    return this.reportDate.getMonth() + 1;
  }
}
