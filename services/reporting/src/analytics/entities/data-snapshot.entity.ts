import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('data_snapshots')
@Index(['snapshotType', 'timestamp'])
@Index(['source', 'timestamp'])
export class DataSnapshot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: ['daily_summary', 'weekly_summary', 'monthly_summary', 'yearly_summary', 'real_time'],
    default: 'daily_summary',
  })
  snapshotType: 'daily_summary' | 'weekly_summary' | 'monthly_summary' | 'yearly_summary' | 'real_time';

  @Column({ type: 'timestamp' })
  timestamp: Date;

  @Column({ type: 'date' })
  snapshotDate: Date;

  @Column({ length: 100 })
  source: string; // Which service or process generated this snapshot

  @Column({ type: 'json' })
  data: {
    // Circulation metrics
    circulation?: {
      totalCheckouts: number;
      totalCheckins: number;
      totalRenewals: number;
      totalHolds: number;
      totalFines: number;
      overdueItems: number;
      activePatrons: number;
      newPatrons: number;
      popularItems: Array<{
        itemId: string;
        title: string;
        checkouts: number;
      }>;
    };

    // Financial metrics
    financial?: {
      totalSpending: number;
      budgetUtilization: number;
      pendingOrders: number;
      receivedOrders: number;
      outstandingInvoices: number;
      vendorPerformance: Array<{
        vendorId: string;
        name: string;
        rating: number;
        orderCount: number;
      }>;
    };

    // Collection metrics
    collection?: {
      totalItems: number;
      newAcquisitions: number;
      itemsWithdrawn: number;
      collectionValue: number;
      turnoverRate: number;
      collectionAge: number;
      formatDistribution: Record<string, number>;
      subjectDistribution: Record<string, number>;
    };

    // Patron metrics
    patron?: {
      totalPatrons: number;
      activePatrons: number;
      newRegistrations: number;
      patronsByType: Record<string, number>;
      averageItemsPerPatron: number;
      patronSatisfaction: number;
      digitalUsage: number;
    };

    // Operational metrics
    operational?: {
      staffProductivity: number;
      systemUptime: number;
      responseTime: number;
      errorRate: number;
      processingBacklog: number;
      workflowEfficiency: number;
    };

    // Custom metrics
    custom?: Record<string, any>;
  };

  @Column({ type: 'json', nullable: true })
  metadata: {
    generatedBy?: string;
    processingTime?: number;
    dataQuality?: 'high' | 'medium' | 'low';
    completeness?: number; // Percentage of expected data present
    anomalies?: Array<{
      metric: string;
      value: number;
      expected: number;
      severity: 'low' | 'medium' | 'high';
    }>;
    trends?: Array<{
      metric: string;
      direction: 'up' | 'down' | 'stable';
      strength: number; // 0-1
    }>;
  };

  @CreateDateColumn()
  createdAt: Date;

  // Virtual Properties
  get isRecent(): boolean {
    const hoursSinceSnapshot = (new Date().getTime() - this.timestamp.getTime()) / (1000 * 60 * 60);
    return hoursSinceSnapshot <= 24;
  }

  get dataCompleteness(): number {
    return this.metadata?.completeness || 0;
  }

  get hasAnomalies(): boolean {
    return this.metadata?.anomalies && this.metadata.anomalies.length > 0;
  }

  get anomalyCount(): number {
    return this.metadata?.anomalies?.length || 0;
  }

  get highSeverityAnomalies(): number {
    return this.metadata?.anomalies?.filter(a => a.severity === 'high').length || 0;
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

  get snapshotTypeDisplayName(): string {
    const typeMap = {
      daily_summary: 'Daily Summary',
      weekly_summary: 'Weekly Summary',
      monthly_summary: 'Monthly Summary',
      yearly_summary: 'Yearly Summary',
      real_time: 'Real-time',
    };
    return typeMap[this.snapshotType] || this.snapshotType;
  }

  get circulationSummary(): string {
    const circ = this.data.circulation;
    if (!circ) return 'No circulation data';
    
    return `${circ.totalCheckouts} checkouts, ${circ.totalCheckins} returns, ${circ.activePatrons} active patrons`;
  }

  get financialSummary(): string {
    const fin = this.data.financial;
    if (!fin) return 'No financial data';
    
    return `$${fin.totalSpending.toLocaleString()} spent, ${fin.budgetUtilization.toFixed(1)}% budget utilized`;
  }

  get collectionSummary(): string {
    const coll = this.data.collection;
    if (!coll) return 'No collection data';
    
    return `${coll.totalItems.toLocaleString()} items, ${coll.newAcquisitions} new acquisitions`;
  }

  get patronSummary(): string {
    const patron = this.data.patron;
    if (!patron) return 'No patron data';
    
    return `${patron.totalPatrons.toLocaleString()} total patrons, ${patron.activePatrons.toLocaleString()} active`;
  }

  get operationalSummary(): string {
    const ops = this.data.operational;
    if (!ops) return 'No operational data';
    
    return `${ops.systemUptime.toFixed(1)}% uptime, ${ops.responseTime.toFixed(0)}ms avg response`;
  }

  get overallHealthScore(): number {
    let score = 0;
    let factors = 0;

    // Data quality factor
    score += this.qualityScore;
    factors++;

    // Completeness factor
    score += this.dataCompleteness;
    factors++;

    // Anomaly factor (inverse)
    const anomalyPenalty = Math.min(this.anomalyCount * 10, 50);
    score += Math.max(0, 100 - anomalyPenalty);
    factors++;

    // Recency factor
    score += this.isRecent ? 100 : 50;
    factors++;

    return factors > 0 ? score / factors : 0;
  }

  get healthGrade(): 'A' | 'B' | 'C' | 'D' | 'F' {
    const score = this.overallHealthScore;
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  getMetricValue(path: string): any {
    const keys = path.split('.');
    let current = this.data;
    
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return null;
      }
    }
    
    return current;
  }

  getTrendDirection(metric: string): 'up' | 'down' | 'stable' | null {
    const trend = this.metadata?.trends?.find(t => t.metric === metric);
    return trend?.direction || null;
  }

  getTrendStrength(metric: string): number {
    const trend = this.metadata?.trends?.find(t => t.metric === metric);
    return trend?.strength || 0;
  }
}
