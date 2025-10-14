import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { ILLRequest } from '../../requests/entities/ill-request.entity';

@Entity('ill_partners')
@Index(['code'], { unique: true })
@Index(['name'])
@Index(['status'])
@Index(['partnerType'])
export class ILLPartner {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 50 })
  code: string; // OCLC symbol, NUC code, or custom identifier

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ['library', 'consortium', 'commercial', 'government', 'academic', 'public', 'special'],
    default: 'library',
  })
  partnerType: 'library' | 'consortium' | 'commercial' | 'government' | 'academic' | 'public' | 'special';

  @Column({
    type: 'enum',
    enum: ['active', 'inactive', 'suspended', 'testing'],
    default: 'active',
  })
  status: 'active' | 'inactive' | 'suspended' | 'testing';

  @Column('json')
  contactInfo: {
    primaryContact: {
      name: string;
      title: string;
      email: string;
      phone: string;
    };
    illContact?: {
      name: string;
      email: string;
      phone: string;
    };
    address: {
      institution: string;
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
    website?: string;
    timezone: string;
  };

  @Column('json')
  connectionDetails: {
    protocol: 'iso_ill' | 'oclc_ill' | 'ncip' | 'rest_api' | 'email' | 'web_form' | 'manual';
    endpoint?: string;
    authentication?: {
      type: 'basic' | 'oauth' | 'api_key' | 'certificate' | 'none';
      credentials?: Record<string, any>;
    };
    configuration?: {
      requestFormat?: string;
      responseFormat?: string;
      timeout?: number;
      retryAttempts?: number;
      batchSize?: number;
    };
    testEndpoint?: string;
    documentation?: string;
  };

  @Column('json')
  capabilities: {
    // Lending capabilities
    lends: boolean;
    lendsTo: string[]; // patron types or institution types
    lendingMaterialTypes: string[];
    lendingFormats: string[];
    maxLoanPeriod?: number; // days
    renewalsAllowed: boolean;
    maxRenewals?: number;
    
    // Borrowing capabilities
    borrows: boolean;
    borrowsFor: string[]; // patron types
    borrowingMaterialTypes: string[];
    borrowingFormats: string[];
    
    // Copy/digitization services
    providesCopies: boolean;
    copyMaterialTypes?: string[];
    copyFormats?: string[];
    digitalDelivery: boolean;
    
    // Special services
    rushService: boolean;
    rushFee?: number;
    trackingProvided: boolean;
    returnShippingProvided: boolean;
    
    // Operational details
    operatingHours?: {
      timezone: string;
      schedule: Array<{
        dayOfWeek: number;
        openTime: string;
        closeTime: string;
        isClosed: boolean;
      }>;
    };
    holidaySchedule?: Array<{
      date: string;
      isClosed: boolean;
      description: string;
    }>;
  };

  @Column('json')
  policies: {
    // General policies
    reciprocalAgreement: boolean;
    membershipRequired: boolean;
    
    // Cost and billing
    feeStructure: {
      type: 'free' | 'reciprocal' | 'fee_based' | 'deposit_account';
      loanFee?: number;
      copyFee?: number;
      rushFee?: number;
      shippingFee?: number;
      currency: string;
      billingFrequency?: 'per_transaction' | 'monthly' | 'quarterly' | 'annually';
    };
    
    // Restrictions
    restrictions?: {
      materialTypes?: string[];
      patronTypes?: string[];
      geographicRestrictions?: string[];
      languageRestrictions?: string[];
      dateRestrictions?: {
        noItemsOlderThan?: number; // years
        noItemsNewerThan?: number; // years
      };
    };
    
    // Copyright and licensing
    copyrightCompliance: boolean;
    ccgCompliant?: boolean;
    licenseTerms?: string;
    
    // Processing policies
    processingTime: {
      standardRequests?: number; // hours
      rushRequests?: number; // hours
      copyRequests?: number; // hours
    };
    
    // Communication preferences
    communicationPreferences: {
      requestNotifications: boolean;
      statusUpdates: boolean;
      preferredMethod: 'email' | 'system' | 'phone';
      language: string;
    };
  };

  @Column('json')
  statistics: {
    lastUpdated: Date;
    
    // Performance metrics
    performance: {
      averageResponseTime: number; // hours
      fillRate: number; // percentage
      onTimeDeliveryRate: number; // percentage
      returnRate: number; // percentage
      satisfactionRating: number; // 1-5 scale
    };
    
    // Volume statistics
    volume: {
      requestsSent: number;
      requestsReceived: number;
      requestsFilled: number;
      requestsUnfilled: number;
      averageMonthlyVolume: number;
    };
    
    // Financial statistics
    financial: {
      totalCosts: number;
      averageCostPerRequest: number;
      outstandingBalance: number;
      currency: string;
    };
    
    // Recent activity
    recentActivity: {
      lastRequestSent?: Date;
      lastRequestReceived?: Date;
      lastSuccessfulTransaction?: Date;
      lastFailedTransaction?: Date;
    };
  };

  @Column('json', { nullable: true })
  collections: {
    // Collection strengths
    strengths?: string[]; // subject areas, languages, formats
    specialCollections?: Array<{
      name: string;
      description: string;
      size?: number;
      subjects?: string[];
    }>;
    
    // Collection size indicators
    totalHoldings?: number;
    bookHoldings?: number;
    serialHoldings?: number;
    digitalHoldings?: number;
    
    // Catalog information
    catalogAccess?: {
      publicCatalog?: string;
      z39_50?: {
        host: string;
        port: number;
        database: string;
      };
      api?: string;
    };
  };

  @Column('json', { nullable: true })
  agreements: Array<{
    agreementType: 'reciprocal' | 'consortium' | 'commercial' | 'custom';
    startDate: Date;
    endDate?: Date;
    terms: string;
    signedBy: string;
    documentPath?: string;
    isActive: boolean;
  }>;

  @Column('json', { nullable: true })
  integrationSettings: {
    // Automated processing
    autoProcessRequests: boolean;
    autoAcceptRequests: boolean;
    autoRouteBySubject: boolean;
    
    // Notification settings
    notifyOnNewRequests: boolean;
    notifyOnStatusChanges: boolean;
    notifyOnOverdue: boolean;
    
    // Data mapping
    fieldMappings?: Array<{
      localField: string;
      partnerField: string;
      transformation?: string;
    }>;
    
    // Quality control
    validateRequests: boolean;
    requireApproval: boolean;
    duplicateDetection: boolean;
  };

  @OneToMany(() => ILLRequest, request => request.lendingPartner)
  requests: ILLRequest[];

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

  get canLend(): boolean {
    return this.isActive && this.capabilities.lends;
  }

  get canBorrow(): boolean {
    return this.isActive && this.capabilities.borrows;
  }

  get canProvideCopies(): boolean {
    return this.isActive && this.capabilities.providesCopies;
  }

  get hasDigitalDelivery(): boolean {
    return this.capabilities.digitalDelivery;
  }

  get hasRushService(): boolean {
    return this.capabilities.rushService;
  }

  get isReciprocal(): boolean {
    return this.policies.reciprocalAgreement;
  }

  get isFeeBasedService(): boolean {
    return this.policies.feeStructure.type === 'fee_based';
  }

  get displayName(): string {
    return this.name || this.code;
  }

  get partnerTypeDisplayName(): string {
    const typeMap = {
      library: 'Library',
      consortium: 'Library Consortium',
      commercial: 'Commercial Service',
      government: 'Government Library',
      academic: 'Academic Library',
      public: 'Public Library',
      special: 'Special Library',
    };
    return typeMap[this.partnerType] || this.partnerType;
  }

  get statusDisplayName(): string {
    const statusMap = {
      active: 'Active',
      inactive: 'Inactive',
      suspended: 'Suspended',
      testing: 'Testing',
    };
    return statusMap[this.status] || this.status;
  }

  get protocolDisplayName(): string {
    const protocolMap = {
      iso_ill: 'ISO ILL Protocol',
      oclc_ill: 'OCLC ILL',
      ncip: 'NCIP',
      rest_api: 'REST API',
      email: 'Email',
      web_form: 'Web Form',
      manual: 'Manual Process',
    };
    return protocolMap[this.connectionDetails.protocol] || this.connectionDetails.protocol;
  }

  get primaryContactEmail(): string {
    return this.contactInfo.primaryContact.email;
  }

  get illContactEmail(): string {
    return this.contactInfo.illContact?.email || this.primaryContactEmail;
  }

  get averageResponseTime(): number {
    return this.statistics.performance.averageResponseTime || 0;
  }

  get fillRate(): number {
    return this.statistics.performance.fillRate || 0;
  }

  get satisfactionRating(): number {
    return this.statistics.performance.satisfactionRating || 0;
  }

  get monthlyVolume(): number {
    return this.statistics.volume.averageMonthlyVolume || 0;
  }

  get outstandingBalance(): number {
    return this.statistics.financial.outstandingBalance || 0;
  }

  get hasOutstandingBalance(): boolean {
    return this.outstandingBalance > 0;
  }

  get lastActivity(): Date | null {
    const activity = this.statistics.recentActivity;
    const dates = [
      activity.lastRequestSent,
      activity.lastRequestReceived,
      activity.lastSuccessfulTransaction,
    ].filter(Boolean);
    
    return dates.length > 0 ? new Date(Math.max(...dates.map(d => new Date(d).getTime()))) : null;
  }

  get daysSinceLastActivity(): number {
    const lastActivity = this.lastActivity;
    if (!lastActivity) return Infinity;
    
    const now = new Date();
    const diffTime = now.getTime() - lastActivity.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  get isRecentlyActive(): boolean {
    return this.daysSinceLastActivity <= 30;
  }

  get performanceScore(): number {
    const fillRate = this.fillRate / 100;
    const responseTime = Math.max(0, 1 - (this.averageResponseTime / 168)); // 1 week baseline
    const satisfaction = this.satisfactionRating / 5;
    
    return (fillRate * 0.4 + responseTime * 0.3 + satisfaction * 0.3) * 100;
  }

  get performanceGrade(): string {
    const score = this.performanceScore;
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  get totalHoldings(): number {
    return this.collections?.totalHoldings || 0;
  }

  get hasSpecialCollections(): boolean {
    return !!(this.collections?.specialCollections && this.collections.specialCollections.length > 0);
  }

  get activeAgreements(): any[] {
    return this.agreements?.filter(agreement => agreement.isActive) || [];
  }

  get hasActiveAgreement(): boolean {
    return this.activeAgreements.length > 0;
  }

  // Helper methods
  canLendMaterialType(materialType: string): boolean {
    return this.canLend && this.capabilities.lendingMaterialTypes.includes(materialType);
  }

  canBorrowMaterialType(materialType: string): boolean {
    return this.canBorrow && this.capabilities.borrowingMaterialTypes.includes(materialType);
  }

  canProvideCopyOfType(materialType: string): boolean {
    return this.canProvideCopies && 
           this.capabilities.copyMaterialTypes?.includes(materialType);
  }

  canLendToPatronType(patronType: string): boolean {
    return this.canLend && this.capabilities.lendsTo.includes(patronType);
  }

  canBorrowForPatronType(patronType: string): boolean {
    return this.canBorrow && this.capabilities.borrowsFor.includes(patronType);
  }

  getEstimatedCost(requestType: 'loan' | 'copy', isRush: boolean = false): number {
    const fees = this.policies.feeStructure;
    
    if (fees.type === 'free' || fees.type === 'reciprocal') {
      return 0;
    }
    
    let cost = 0;
    
    if (requestType === 'loan') {
      cost = fees.loanFee || 0;
    } else if (requestType === 'copy') {
      cost = fees.copyFee || 0;
    }
    
    if (isRush && fees.rushFee) {
      cost += fees.rushFee;
    }
    
    if (fees.shippingFee) {
      cost += fees.shippingFee;
    }
    
    return cost;
  }

  getEstimatedProcessingTime(requestType: 'loan' | 'copy', isRush: boolean = false): number {
    const processingTimes = this.policies.processingTime;
    
    if (isRush && processingTimes.rushRequests) {
      return processingTimes.rushRequests;
    }
    
    if (requestType === 'copy' && processingTimes.copyRequests) {
      return processingTimes.copyRequests;
    }
    
    return processingTimes.standardRequests || 72; // 72 hours default
  }

  isOperatingNow(): boolean {
    if (!this.capabilities.operatingHours) return true; // Assume 24/7 if not specified
    
    const now = new Date();
    const dayOfWeek = now.getDay();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
    
    const todaySchedule = this.capabilities.operatingHours.schedule.find(
      s => s.dayOfWeek === dayOfWeek
    );
    
    if (!todaySchedule || todaySchedule.isClosed) return false;
    
    return currentTime >= todaySchedule.openTime && currentTime <= todaySchedule.closeTime;
  }

  hasCollectionStrength(subject: string): boolean {
    return this.collections?.strengths?.includes(subject) || false;
  }

  updateStatistics(
    responseTime?: number,
    wasFilled?: boolean,
    wasOnTime?: boolean,
    cost?: number,
    satisfactionRating?: number
  ): void {
    if (!this.statistics) {
      this.statistics = {
        lastUpdated: new Date(),
        performance: {
          averageResponseTime: 0,
          fillRate: 0,
          onTimeDeliveryRate: 0,
          returnRate: 0,
          satisfactionRating: 0,
        },
        volume: {
          requestsSent: 0,
          requestsReceived: 0,
          requestsFilled: 0,
          requestsUnfilled: 0,
          averageMonthlyVolume: 0,
        },
        financial: {
          totalCosts: 0,
          averageCostPerRequest: 0,
          outstandingBalance: 0,
          currency: 'USD',
        },
        recentActivity: {},
      };
    }
    
    // Update performance metrics (simplified - would use proper statistical methods in production)
    if (responseTime !== undefined) {
      this.statistics.performance.averageResponseTime = 
        (this.statistics.performance.averageResponseTime + responseTime) / 2;
    }
    
    if (wasFilled !== undefined) {
      this.statistics.volume.requestsReceived++;
      if (wasFilled) {
        this.statistics.volume.requestsFilled++;
      } else {
        this.statistics.volume.requestsUnfilled++;
      }
      
      this.statistics.performance.fillRate = 
        (this.statistics.volume.requestsFilled / this.statistics.volume.requestsReceived) * 100;
    }
    
    if (cost !== undefined) {
      this.statistics.financial.totalCosts += cost;
      this.statistics.financial.averageCostPerRequest = 
        this.statistics.financial.totalCosts / this.statistics.volume.requestsReceived;
    }
    
    if (satisfactionRating !== undefined) {
      this.statistics.performance.satisfactionRating = 
        (this.statistics.performance.satisfactionRating + satisfactionRating) / 2;
    }
    
    this.statistics.lastUpdated = new Date();
    this.statistics.recentActivity.lastSuccessfulTransaction = new Date();
  }
}
