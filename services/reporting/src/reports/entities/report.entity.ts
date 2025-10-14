import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('reports')
@Index(['reportType', 'status'])
@Index(['createdBy', 'createdAt'])
@Index(['scheduledAt'])
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: [
      'circulation_summary',
      'financial_summary',
      'collection_analysis',
      'patron_demographics',
      'vendor_performance',
      'budget_utilization',
      'overdue_items',
      'popular_items',
      'acquisition_report',
      'usage_statistics',
      'custom_report'
    ],
  })
  reportType: 
    | 'circulation_summary'
    | 'financial_summary'
    | 'collection_analysis'
    | 'patron_demographics'
    | 'vendor_performance'
    | 'budget_utilization'
    | 'overdue_items'
    | 'popular_items'
    | 'acquisition_report'
    | 'usage_statistics'
    | 'custom_report';

  @Column({
    type: 'enum',
    enum: ['pdf', 'excel', 'csv', 'json', 'html'],
    default: 'pdf',
  })
  format: 'pdf' | 'excel' | 'csv' | 'json' | 'html';

  @Column({
    type: 'enum',
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'pending',
  })
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

  @Column({ type: 'json' })
  parameters: {
    dateRange?: {
      startDate: string;
      endDate: string;
    };
    filters?: {
      library?: string;
      department?: string;
      materialType?: string;
      patronType?: string;
      vendor?: string;
      budget?: string;
      [key: string]: any;
    };
    groupBy?: string[];
    sortBy?: {
      field: string;
      direction: 'asc' | 'desc';
    };
    includeCharts?: boolean;
    includeDetails?: boolean;
    customFields?: string[];
  };

  @Column({ type: 'json', nullable: true })
  data: {
    summary?: Record<string, any>;
    details?: any[];
    charts?: Array<{
      type: 'bar' | 'line' | 'pie' | 'scatter';
      title: string;
      data: any;
      config?: any;
    }>;
    metadata?: {
      recordCount: number;
      generationTime: number;
      dataQuality: 'high' | 'medium' | 'low';
      warnings?: string[];
    };
  };

  @Column({ length: 500, nullable: true })
  filePath: string; // Path to generated report file

  @Column({ type: 'int', nullable: true })
  fileSizeBytes: number;

  @Column({ type: 'timestamp', nullable: true })
  scheduledAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ type: 'int', nullable: true })
  processingTimeMs: number;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ type: 'int', default: 0 })
  downloadCount: number;

  @Column({ type: 'timestamp', nullable: true })
  lastDownloadedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;

  @Column({ type: 'boolean', default: false })
  isRecurring: boolean;

  @Column({
    type: 'enum',
    enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'],
    nullable: true,
  })
  recurringFrequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

  @Column({ type: 'timestamp', nullable: true })
  nextRunAt: Date;

  @Column({ type: 'json', nullable: true })
  recipients: Array<{
    email: string;
    name?: string;
    role?: string;
  }>;

  @Column({ type: 'boolean', default: false })
  emailSent: boolean;

  @Column({ type: 'timestamp', nullable: true })
  emailSentAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'uuid' })
  createdBy: string;

  @Column({ type: 'uuid', nullable: true })
  updatedBy: string;

  // Virtual Properties
  get isCompleted(): boolean {
    return this.status === 'completed';
  }

  get isFailed(): boolean {
    return this.status === 'failed';
  }

  get isProcessing(): boolean {
    return this.status === 'processing';
  }

  get isPending(): boolean {
    return this.status === 'pending';
  }

  get isExpired(): boolean {
    return this.expiresAt && new Date() > this.expiresAt;
  }

  get isScheduled(): boolean {
    return this.scheduledAt && this.scheduledAt > new Date();
  }

  get canBeDownloaded(): boolean {
    return this.isCompleted && !this.isExpired && !!this.filePath;
  }

  get canBeDeleted(): boolean {
    return ['completed', 'failed', 'cancelled'].includes(this.status);
  }

  get canBeCancelled(): boolean {
    return ['pending', 'processing'].includes(this.status);
  }

  get statusDescription(): string {
    const statusMap = {
      pending: 'Pending - Waiting to be processed',
      processing: 'Processing - Report generation in progress',
      completed: 'Completed - Report ready for download',
      failed: 'Failed - Report generation encountered an error',
      cancelled: 'Cancelled - Report generation was cancelled',
    };
    return statusMap[this.status] || 'Unknown Status';
  }

  get reportTypeDisplayName(): string {
    const typeMap = {
      circulation_summary: 'Circulation Summary',
      financial_summary: 'Financial Summary',
      collection_analysis: 'Collection Analysis',
      patron_demographics: 'Patron Demographics',
      vendor_performance: 'Vendor Performance',
      budget_utilization: 'Budget Utilization',
      overdue_items: 'Overdue Items',
      popular_items: 'Popular Items',
      acquisition_report: 'Acquisition Report',
      usage_statistics: 'Usage Statistics',
      custom_report: 'Custom Report',
    };
    return typeMap[this.reportType] || this.reportType;
  }

  get formatDisplayName(): string {
    const formatMap = {
      pdf: 'PDF Document',
      excel: 'Excel Spreadsheet',
      csv: 'CSV File',
      json: 'JSON Data',
      html: 'HTML Report',
    };
    return formatMap[this.format] || this.format.toUpperCase();
  }

  get fileSizeFormatted(): string {
    if (!this.fileSizeBytes) return 'Unknown';
    
    const sizes = ['B', 'KB', 'MB', 'GB'];
    let size = this.fileSizeBytes;
    let sizeIndex = 0;
    
    while (size >= 1024 && sizeIndex < sizes.length - 1) {
      size /= 1024;
      sizeIndex++;
    }
    
    return `${size.toFixed(1)} ${sizes[sizeIndex]}`;
  }

  get processingTimeFormatted(): string {
    if (!this.processingTimeMs) return 'Unknown';
    
    const seconds = this.processingTimeMs / 1000;
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    
    const minutes = seconds / 60;
    if (minutes < 60) return `${minutes.toFixed(1)}m`;
    
    const hours = minutes / 60;
    return `${hours.toFixed(1)}h`;
  }

  get ageInDays(): number {
    return Math.floor((new Date().getTime() - this.createdAt.getTime()) / (1000 * 60 * 60 * 24));
  }

  get daysUntilExpiry(): number {
    if (!this.expiresAt) return Infinity;
    return Math.floor((this.expiresAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  }

  get recordCount(): number {
    return this.data?.metadata?.recordCount || 0;
  }

  get hasCharts(): boolean {
    return this.data?.charts && this.data.charts.length > 0;
  }

  get chartCount(): number {
    return this.data?.charts?.length || 0;
  }

  get dataQuality(): 'high' | 'medium' | 'low' | 'unknown' {
    return this.data?.metadata?.dataQuality || 'unknown';
  }

  get hasWarnings(): boolean {
    return this.data?.metadata?.warnings && this.data.metadata.warnings.length > 0;
  }

  get warningCount(): number {
    return this.data?.metadata?.warnings?.length || 0;
  }

  get recurringFrequencyDisplayName(): string {
    if (!this.isRecurring || !this.recurringFrequency) return 'One-time';
    
    const frequencyMap = {
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly',
      quarterly: 'Quarterly',
      yearly: 'Yearly',
    };
    return frequencyMap[this.recurringFrequency] || this.recurringFrequency;
  }

  get nextRunFormatted(): string {
    if (!this.nextRunAt) return 'Not scheduled';
    return this.nextRunAt.toLocaleDateString();
  }

  get recipientCount(): number {
    return this.recipients?.length || 0;
  }

  get recipientEmails(): string[] {
    return this.recipients?.map(r => r.email) || [];
  }
}
