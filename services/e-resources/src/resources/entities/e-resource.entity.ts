import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { License } from '../../licenses/entities/license.entity';
import { UsageStatistic } from '../../usage/entities/usage-statistic.entity';
import { AccessLog } from '../../access/entities/access-log.entity';

@Entity('e_resources')
@Index(['name'])
@Index(['provider'])
@Index(['resourceType'])
@Index(['status'])
@Index(['libraryId'])
export class EResource {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 255 })
  provider: string;

  @Column({
    type: 'enum',
    enum: ['database', 'ebook_collection', 'journal_package', 'streaming_media', 'software', 'reference_tool', 'research_tool'],
    default: 'database',
  })
  resourceType: 'database' | 'ebook_collection' | 'journal_package' | 'streaming_media' | 'software' | 'reference_tool' | 'research_tool';

  @Column({
    type: 'enum',
    enum: ['active', 'inactive', 'trial', 'expired', 'cancelled', 'pending_activation'],
    default: 'pending_activation',
  })
  status: 'active' | 'inactive' | 'trial' | 'expired' | 'cancelled' | 'pending_activation';

  @Column({ type: 'uuid' })
  libraryId: string;

  @Column({ length: 255 })
  libraryName: string;

  @ManyToOne(() => License, { nullable: true })
  @JoinColumn({ name: 'licenseId' })
  license: License;

  @Column({ type: 'uuid', nullable: true })
  licenseId: string;

  @Column('json')
  urls: {
    primary: string;
    admin?: string;
    help?: string;
    marc?: string;
    statistics?: string;
    openUrl?: string;
    mobile?: string;
    api?: string;
  };

  @Column('json')
  accessConfiguration: {
    authenticationMethod: 'ip' | 'proxy' | 'shibboleth' | 'api_key' | 'username_password' | 'referring_url';
    allowedIPs?: string[];
    proxyPrefix?: string;
    shibbolethEntityId?: string;
    apiKey?: string;
    username?: string;
    password?: string;
    referringUrls?: string[];
    simultaneousUsers?: number;
    campusOnly: boolean;
    walkInAccess: boolean;
    remoteAccess: boolean;
    mobileAccess: boolean;
    downloadLimits?: {
      articlesPerSession?: number;
      articlesPerDay?: number;
      articlesPerMonth?: number;
      chaptersPerSession?: number;
      chaptersPerDay?: number;
      chaptersPerMonth?: number;
    };
  };

  @Column('json')
  coverage: {
    subjects?: string[];
    languages?: string[];
    geographicCoverage?: string[];
    dateRange?: {
      startYear?: number;
      endYear?: number;
      currentOnly?: boolean;
      embargoMonths?: number;
    };
    contentTypes?: string[];
    formats?: string[];
    fullTextPercentage?: number;
  };

  @Column('json')
  technicalDetails: {
    platform: string;
    interface?: string;
    searchCapabilities?: string[];
    exportFormats?: string[];
    citationFormats?: string[];
    rssFeeds?: boolean;
    alertServices?: boolean;
    mobileOptimized?: boolean;
    accessibilityCompliant?: boolean;
    multiLanguageInterface?: boolean;
    federatedSearchCompatible?: boolean;
    marcRecordsAvailable?: boolean;
    counterCompliant?: boolean;
    openUrlCompliant?: boolean;
  };

  @Column('json')
  contactInfo: {
    technicalSupport: {
      name?: string;
      email: string;
      phone?: string;
      hours?: string;
      url?: string;
    };
    customerService: {
      name?: string;
      email: string;
      phone?: string;
      hours?: string;
    };
    salesContact?: {
      name: string;
      email: string;
      phone?: string;
    };
    trainingContact?: {
      name?: string;
      email?: string;
      phone?: string;
    };
  };

  @Column('json', { nullable: true })
  pricing: {
    model: 'subscription' | 'perpetual' | 'pay_per_use' | 'tiered' | 'fte_based';
    currency: string;
    annualCost?: number;
    setupFee?: number;
    maintenanceFee?: number;
    additionalUserCost?: number;
    overage?: {
      threshold: number;
      costPerUnit: number;
      unit: string;
    };
    discounts?: Array<{
      type: string;
      percentage: number;
      conditions: string;
    }>;
    renewalTerms?: {
      autoRenewal: boolean;
      noticePeriod: number; // days
      priceIncreaseLimit?: number; // percentage
    };
  };

  @Column('json', { nullable: true })
  trial: {
    isTrialActive: boolean;
    startDate?: Date;
    endDate?: Date;
    trialType?: 'free' | 'extended' | 'pilot';
    trialUsers?: number;
    trialNotes?: string;
    conversionProbability?: number;
  };

  @Column('json', { nullable: true })
  marketing: {
    keyFeatures?: string[];
    targetAudience?: string[];
    competitorComparison?: Array<{
      competitor: string;
      advantages: string[];
      disadvantages: string[];
    }>;
    promotionalMaterials?: Array<{
      type: string;
      url: string;
      description: string;
    }>;
    testimonials?: Array<{
      source: string;
      quote: string;
      date: Date;
    }>;
  };

  @Column('json', { nullable: true })
  integration: {
    discoveryIntegration?: {
      enabled: boolean;
      knowledgeBase?: string;
      marcRecords?: boolean;
      holdings?: boolean;
    };
    linkResolver?: {
      enabled: boolean;
      resolver: string;
      baseUrl?: string;
    };
    authentication?: {
      singleSignOn?: boolean;
      ldapIntegration?: boolean;
      samlSupport?: boolean;
    };
    analytics?: {
      googleAnalytics?: boolean;
      customTracking?: boolean;
      heatmapTracking?: boolean;
    };
  };

  @Column('json', { nullable: true })
  workflow: {
    acquisitionWorkflow?: {
      requestedBy?: string;
      requestDate?: Date;
      approvedBy?: string;
      approvalDate?: Date;
      purchaseOrderNumber?: string;
      activationRequested?: Date;
      activationCompleted?: Date;
    };
    renewalWorkflow?: {
      renewalDue?: Date;
      renewalNotificationSent?: Date;
      renewalDecision?: 'renew' | 'cancel' | 'negotiate' | 'pending';
      renewalNotes?: string;
    };
    evaluationWorkflow?: {
      evaluationPeriod?: {
        start: Date;
        end: Date;
      };
      evaluationCriteria?: string[];
      evaluationResults?: Array<{
        criterion: string;
        score: number;
        notes: string;
      }>;
      finalRecommendation?: 'purchase' | 'trial_extend' | 'decline';
    };
  };

  @OneToMany(() => UsageStatistic, statistic => statistic.resource)
  usageStatistics: UsageStatistic[];

  @OneToMany(() => AccessLog, log => log.resource)
  accessLogs: AccessLog[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'uuid' })
  createdBy: string;

  @Column({ type: 'uuid', nullable: true })
  updatedBy: string;

  // Virtual Properties
  get isActive(): boolean {
    return this.status === 'active';
  }

  get isTrial(): boolean {
    return this.status === 'trial' || (this.trial?.isTrialActive ?? false);
  }

  get isExpired(): boolean {
    return this.status === 'expired';
  }

  get requiresRenewal(): boolean {
    if (!this.license) return false;
    const renewalDate = new Date(this.license.endDate);
    const warningDate = new Date();
    warningDate.setDate(warningDate.getDate() + 90); // 90 days warning
    return renewalDate <= warningDate;
  }

  get daysUntilExpiry(): number {
    if (!this.license) return Infinity;
    const now = new Date();
    const expiryDate = new Date(this.license.endDate);
    const diffTime = expiryDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  get displayName(): string {
    return this.name;
  }

  get resourceTypeDisplayName(): string {
    const typeMap = {
      database: 'Database',
      ebook_collection: 'E-book Collection',
      journal_package: 'Journal Package',
      streaming_media: 'Streaming Media',
      software: 'Software',
      reference_tool: 'Reference Tool',
      research_tool: 'Research Tool',
    };
    return typeMap[this.resourceType] || this.resourceType;
  }

  get statusDisplayName(): string {
    const statusMap = {
      active: 'Active',
      inactive: 'Inactive',
      trial: 'Trial',
      expired: 'Expired',
      cancelled: 'Cancelled',
      pending_activation: 'Pending Activation',
    };
    return statusMap[this.status] || this.status;
  }

  get primaryUrl(): string {
    return this.urls.primary;
  }

  get adminUrl(): string {
    return this.urls.admin || this.urls.primary;
  }

  get helpUrl(): string {
    return this.urls.help || '';
  }

  get statisticsUrl(): string {
    return this.urls.statistics || '';
  }

  get hasProxy(): boolean {
    return this.accessConfiguration.authenticationMethod === 'proxy' && !!this.accessConfiguration.proxyPrefix;
  }

  get proxiedUrl(): string {
    if (!this.hasProxy) return this.primaryUrl;
    return `${this.accessConfiguration.proxyPrefix}${this.primaryUrl}`;
  }

  get allowsRemoteAccess(): boolean {
    return this.accessConfiguration.remoteAccess;
  }

  get allowsWalkInAccess(): boolean {
    return this.accessConfiguration.walkInAccess;
  }

  get hasMobileAccess(): boolean {
    return this.accessConfiguration.mobileAccess;
  }

  get simultaneousUserLimit(): number {
    return this.accessConfiguration.simultaneousUsers || 0;
  }

  get hasUserLimit(): boolean {
    return this.simultaneousUserLimit > 0;
  }

  get annualCost(): number {
    return this.pricing?.annualCost || 0;
  }

  get costPerUser(): number {
    // Calculate based on usage statistics if available
    // For now, return simple calculation
    return this.pricing?.additionalUserCost || 0;
  }

  get isCounterCompliant(): boolean {
    return this.technicalDetails.counterCompliant ?? false;
  }

  get supportsMarcRecords(): boolean {
    return this.technicalDetails.marcRecordsAvailable ?? false;
  }

  get isAccessibilityCompliant(): boolean {
    return this.technicalDetails.accessibilityCompliant ?? false;
  }

  get isMobileOptimized(): boolean {
    return this.technicalDetails.mobileOptimized ?? false;
  }

  get supportsFederatedSearch(): boolean {
    return this.technicalDetails.federatedSearchCompatible ?? false;
  }

  get primarySubjects(): string[] {
    return this.coverage.subjects || [];
  }

  get contentLanguages(): string[] {
    return this.coverage.languages || [];
  }

  get fullTextPercentage(): number {
    return this.coverage.fullTextPercentage || 0;
  }

  get hasFullText(): boolean {
    return this.fullTextPercentage > 0;
  }

  get coverageStartYear(): number | null {
    return this.coverage.dateRange?.startYear || null;
  }

  get coverageEndYear(): number | null {
    return this.coverage.dateRange?.endYear || null;
  }

  get hasEmbargo(): boolean {
    return (this.coverage.dateRange?.embargoMonths || 0) > 0;
  }

  get embargoMonths(): number {
    return this.coverage.dateRange?.embargoMonths || 0;
  }

  get technicalSupportEmail(): string {
    return this.contactInfo.technicalSupport.email;
  }

  get customerServiceEmail(): string {
    return this.contactInfo.customerService.email;
  }

  get platform(): string {
    return this.technicalDetails.platform;
  }

  get searchCapabilities(): string[] {
    return this.technicalDetails.searchCapabilities || [];
  }

  get exportFormats(): string[] {
    return this.technicalDetails.exportFormats || [];
  }

  get hasRssFeeds(): boolean {
    return this.technicalDetails.rssFeeds ?? false;
  }

  get hasAlertServices(): boolean {
    return this.technicalDetails.alertServices ?? false;
  }

  get trialEndDate(): Date | null {
    return this.trial?.endDate ? new Date(this.trial.endDate) : null;
  }

  get trialDaysRemaining(): number {
    if (!this.isTrial || !this.trialEndDate) return 0;
    const now = new Date();
    const diffTime = this.trialEndDate.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }

  get isTrialExpiring(): boolean {
    return this.isTrial && this.trialDaysRemaining <= 7;
  }

  get renewalDueDate(): Date | null {
    return this.workflow?.renewalWorkflow?.renewalDue ? 
      new Date(this.workflow.renewalWorkflow.renewalDue) : null;
  }

  get needsRenewalDecision(): boolean {
    return this.workflow?.renewalWorkflow?.renewalDecision === 'pending';
  }

  get isInEvaluation(): boolean {
    if (!this.workflow?.evaluationWorkflow?.evaluationPeriod) return false;
    const now = new Date();
    const start = new Date(this.workflow.evaluationWorkflow.evaluationPeriod.start);
    const end = new Date(this.workflow.evaluationWorkflow.evaluationPeriod.end);
    return now >= start && now <= end;
  }

  get evaluationScore(): number {
    if (!this.workflow?.evaluationWorkflow?.evaluationResults) return 0;
    const results = this.workflow.evaluationWorkflow.evaluationResults;
    const totalScore = results.reduce((sum, result) => sum + result.score, 0);
    return results.length > 0 ? totalScore / results.length : 0;
  }

  get hasDiscoveryIntegration(): boolean {
    return this.integration?.discoveryIntegration?.enabled ?? false;
  }

  get hasLinkResolver(): boolean {
    return this.integration?.linkResolver?.enabled ?? false;
  }

  get hasSingleSignOn(): boolean {
    return this.integration?.authentication?.singleSignOn ?? false;
  }

  get keyFeatures(): string[] {
    return this.marketing?.keyFeatures || [];
  }

  get targetAudience(): string[] {
    return this.marketing?.targetAudience || [];
  }

  // Helper Methods
  canAccess(userType: string, location: 'on_campus' | 'off_campus'): boolean {
    if (!this.isActive) return false;
    
    if (location === 'off_campus' && !this.allowsRemoteAccess) return false;
    if (location === 'on_campus' && this.accessConfiguration.campusOnly && location === 'off_campus') return false;
    
    return true;
  }

  getAccessUrl(userType: string, location: 'on_campus' | 'off_campus'): string {
    if (!this.canAccess(userType, location)) return '';
    
    if (location === 'off_campus' && this.hasProxy) {
      return this.proxiedUrl;
    }
    
    return this.primaryUrl;
  }

  isWithinDownloadLimits(articlesDownloaded: number, chaptersDownloaded: number, period: 'session' | 'day' | 'month'): boolean {
    const limits = this.accessConfiguration.downloadLimits;
    if (!limits) return true;
    
    const articleLimit = limits[`articlesper${period === 'session' ? 'Session' : period === 'day' ? 'Day' : 'Month'}`];
    const chapterLimit = limits[`chaptersper${period === 'session' ? 'Session' : period === 'day' ? 'Day' : 'Month'}`];
    
    if (articleLimit && articlesDownloaded >= articleLimit) return false;
    if (chapterLimit && chaptersDownloaded >= chapterLimit) return false;
    
    return true;
  }

  calculateUsageCost(usage: { searches?: number; downloads?: number; sessions?: number }): number {
    if (!this.pricing || this.pricing.model !== 'pay_per_use') return 0;
    
    // Simplified calculation - would be more complex in real implementation
    const overage = this.pricing.overage;
    if (!overage) return 0;
    
    const totalUsage = (usage.searches || 0) + (usage.downloads || 0) + (usage.sessions || 0);
    const overageAmount = Math.max(0, totalUsage - overage.threshold);
    
    return overageAmount * overage.costPerUnit;
  }

  getCompetitorComparison(competitor: string): any {
    return this.marketing?.competitorComparison?.find(comp => comp.competitor === competitor);
  }

  addEvaluationResult(criterion: string, score: number, notes: string): void {
    if (!this.workflow) this.workflow = {};
    if (!this.workflow.evaluationWorkflow) this.workflow.evaluationWorkflow = {};
    if (!this.workflow.evaluationWorkflow.evaluationResults) {
      this.workflow.evaluationWorkflow.evaluationResults = [];
    }
    
    // Remove existing result for this criterion
    this.workflow.evaluationWorkflow.evaluationResults = 
      this.workflow.evaluationWorkflow.evaluationResults.filter(r => r.criterion !== criterion);
    
    // Add new result
    this.workflow.evaluationWorkflow.evaluationResults.push({
      criterion,
      score,
      notes,
    });
  }

  setRenewalDecision(decision: 'renew' | 'cancel' | 'negotiate' | 'pending', notes?: string): void {
    if (!this.workflow) this.workflow = {};
    if (!this.workflow.renewalWorkflow) this.workflow.renewalWorkflow = {};
    
    this.workflow.renewalWorkflow.renewalDecision = decision;
    if (notes) this.workflow.renewalWorkflow.renewalNotes = notes;
  }

  updateTrialStatus(isActive: boolean, endDate?: Date, notes?: string): void {
    if (!this.trial) {
      this.trial = {
        isTrialActive: isActive,
      };
    } else {
      this.trial.isTrialActive = isActive;
    }
    
    if (endDate) this.trial.endDate = endDate;
    if (notes) this.trial.trialNotes = notes;
    
    // Update main status
    if (isActive) {
      this.status = 'trial';
    } else if (this.status === 'trial') {
      this.status = 'inactive';
    }
  }

  getFormattedCoverage(): string {
    const parts = [];
    
    if (this.coverageStartYear) {
      if (this.coverageEndYear) {
        parts.push(`${this.coverageStartYear}-${this.coverageEndYear}`);
      } else {
        parts.push(`${this.coverageStartYear}-present`);
      }
    }
    
    if (this.hasEmbargo) {
      parts.push(`${this.embargoMonths} month embargo`);
    }
    
    if (this.fullTextPercentage > 0) {
      parts.push(`${this.fullTextPercentage}% full text`);
    }
    
    return parts.join(', ');
  }

  getStatusColor(): string {
    const colorMap = {
      active: 'green',
      trial: 'blue',
      pending_activation: 'yellow',
      inactive: 'gray',
      expired: 'red',
      cancelled: 'red',
    };
    return colorMap[this.status] || 'gray';
  }

  getRenewalUrgency(): 'low' | 'medium' | 'high' | 'critical' {
    if (!this.requiresRenewal) return 'low';
    
    const days = this.daysUntilExpiry;
    if (days <= 7) return 'critical';
    if (days <= 30) return 'high';
    if (days <= 90) return 'medium';
    return 'low';
  }
}
