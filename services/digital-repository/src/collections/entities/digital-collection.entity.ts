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
import { DigitalObject } from '../../objects/entities/digital-object.entity';

@Entity('digital_collections')
@Index(['handle'], { unique: true })
@Index(['name'])
@Index(['collectionType'])
@Index(['status'])
@Index(['libraryId'])
export class DigitalCollection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 255 })
  handle: string; // Persistent identifier (e.g., hdl:123456789/1)

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: ['institutional_repository', 'special_collections', 'theses', 'faculty_works', 'archives', 'datasets', 'multimedia'],
    default: 'institutional_repository',
  })
  collectionType: 'institutional_repository' | 'special_collections' | 'theses' | 'faculty_works' | 'archives' | 'datasets' | 'multimedia';

  @Column({
    type: 'enum',
    enum: ['active', 'inactive', 'private', 'restricted', 'archived'],
    default: 'active',
  })
  status: 'active' | 'inactive' | 'private' | 'restricted' | 'archived';

  @Column({ type: 'uuid' })
  libraryId: string;

  @Column({ length: 255 })
  libraryName: string;

  @ManyToOne(() => DigitalCollection, { nullable: true })
  @JoinColumn({ name: 'parentCollectionId' })
  parentCollection: DigitalCollection;

  @Column({ type: 'uuid', nullable: true })
  parentCollectionId: string;

  @OneToMany(() => DigitalCollection, collection => collection.parentCollection)
  childCollections: DigitalCollection[];

  @OneToMany(() => DigitalObject, object => object.collection)
  objects: DigitalObject[];

  @Column('json')
  metadata: {
    schema: 'dublin_core' | 'mods' | 'datacite' | 'custom';
    requiredFields: string[];
    optionalFields?: string[];
    customFields?: Array<{
      name: string;
      type: 'text' | 'number' | 'date' | 'boolean' | 'select' | 'multiselect';
      required: boolean;
      options?: string[];
      validation?: any;
    }>;
    defaultValues?: Record<string, any>;
  };

  @Column('json')
  workflow: {
    submissionRequired: boolean;
    reviewRequired: boolean;
    approvalRequired: boolean;
    embargoSupported: boolean;
    versioningEnabled: boolean;
    allowedFileTypes: string[];
    maxFileSize: number; // bytes
    maxFilesPerSubmission: number;
    autoPublish: boolean;
    notificationEmails: string[];
  };

  @Column('json')
  access: {
    visibility: 'public' | 'restricted' | 'private';
    allowedUserTypes?: string[];
    allowedUsers?: string[];
    allowedGroups?: string[];
    ipRestrictions?: string[];
    embargoDefault?: number; // days
    licenseDefault?: string;
    rightsStatement?: string;
  };

  @Column('json')
  preservation: {
    enabled: boolean;
    checksumAlgorithm: 'md5' | 'sha1' | 'sha256' | 'sha512';
    formatMigration: boolean;
    redundantStorage: boolean;
    backupSchedule?: string;
    retentionPolicy?: {
      minimumYears: number;
      reviewCycle: number;
      disposalApproval: boolean;
    };
  };

  @Column('json')
  harvesting: {
    oaiPmhEnabled: boolean;
    oaiPmhSet?: string;
    metadataFormats: string[];
    harvestingAllowed: boolean;
    externalHarvesters?: Array<{
      name: string;
      baseUrl: string;
      metadataPrefix: string;
      schedule?: string;
    }>;
  };

  @Column('json', { nullable: true })
  branding: {
    logoUrl?: string;
    bannerUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    customCss?: string;
    headerText?: string;
    footerText?: string;
  };

  @Column('json', { nullable: true })
  statistics: {
    totalObjects: number;
    publishedObjects: number;
    embargoedObjects: number;
    totalDownloads: number;
    totalViews: number;
    lastUpdated: Date;
    monthlyStats?: Array<{
      month: string;
      submissions: number;
      downloads: number;
      views: number;
    }>;
  };

  @Column('json', { nullable: true })
  integration: {
    crossrefEnabled?: boolean;
    orcidEnabled?: boolean;
    doiMinting?: {
      enabled: boolean;
      prefix?: string;
      registrationAgency?: 'crossref' | 'datacite';
    };
    socialMedia?: {
      twitter?: boolean;
      facebook?: boolean;
      linkedIn?: boolean;
    };
    analytics?: {
      googleAnalytics?: string;
      plumAnalytics?: boolean;
      altmetrics?: boolean;
    };
  };

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

  get isPublic(): boolean {
    return this.access.visibility === 'public';
  }

  get isRestricted(): boolean {
    return this.access.visibility === 'restricted';
  }

  get isPrivate(): boolean {
    return this.access.visibility === 'private';
  }

  get hasParent(): boolean {
    return !!this.parentCollectionId;
  }

  get hasChildren(): boolean {
    return this.childCollections && this.childCollections.length > 0;
  }

  get displayName(): string {
    return this.name;
  }

  get collectionTypeDisplayName(): string {
    const typeMap = {
      institutional_repository: 'Institutional Repository',
      special_collections: 'Special Collections',
      theses: 'Theses & Dissertations',
      faculty_works: 'Faculty Works',
      archives: 'Archives',
      datasets: 'Research Datasets',
      multimedia: 'Multimedia Collections',
    };
    return typeMap[this.collectionType] || this.collectionType;
  }

  get statusDisplayName(): string {
    const statusMap = {
      active: 'Active',
      inactive: 'Inactive',
      private: 'Private',
      restricted: 'Restricted',
      archived: 'Archived',
    };
    return statusMap[this.status] || this.status;
  }

  get totalObjectCount(): number {
    return this.statistics?.totalObjects || 0;
  }

  get publishedObjectCount(): number {
    return this.statistics?.publishedObjects || 0;
  }

  get embargoedObjectCount(): number {
    return this.statistics?.embargoedObjects || 0;
  }

  get totalDownloads(): number {
    return this.statistics?.totalDownloads || 0;
  }

  get totalViews(): number {
    return this.statistics?.totalViews || 0;
  }

  get requiresSubmission(): boolean {
    return this.workflow.submissionRequired;
  }

  get requiresReview(): boolean {
    return this.workflow.reviewRequired;
  }

  get requiresApproval(): boolean {
    return this.workflow.approvalRequired;
  }

  get supportsEmbargo(): boolean {
    return this.workflow.embargoSupported;
  }

  get supportsVersioning(): boolean {
    return this.workflow.versioningEnabled;
  }

  get maxFileSize(): number {
    return this.workflow.maxFileSize;
  }

  get maxFilesPerSubmission(): number {
    return this.workflow.maxFilesPerSubmission;
  }

  get allowedFileTypes(): string[] {
    return this.workflow.allowedFileTypes;
  }

  get autoPublishes(): boolean {
    return this.workflow.autoPublish;
  }

  get notificationEmails(): string[] {
    return this.workflow.notificationEmails || [];
  }

  get metadataSchema(): string {
    return this.metadata.schema;
  }

  get requiredFields(): string[] {
    return this.metadata.requiredFields;
  }

  get customFields(): any[] {
    return this.metadata.customFields || [];
  }

  get hasCustomFields(): boolean {
    return this.customFields.length > 0;
  }

  get preservationEnabled(): boolean {
    return this.preservation.enabled;
  }

  get checksumAlgorithm(): string {
    return this.preservation.checksumAlgorithm;
  }

  get formatMigrationEnabled(): boolean {
    return this.preservation.formatMigration;
  }

  get hasRedundantStorage(): boolean {
    return this.preservation.redundantStorage;
  }

  get oaiPmhEnabled(): boolean {
    return this.harvesting.oaiPmhEnabled;
  }

  get oaiPmhSet(): string {
    return this.harvesting.oaiPmhSet || this.handle;
  }

  get metadataFormats(): string[] {
    return this.harvesting.metadataFormats;
  }

  get allowsHarvesting(): boolean {
    return this.harvesting.harvestingAllowed;
  }

  get hasDoiMinting(): boolean {
    return this.integration?.doiMinting?.enabled || false;
  }

  get doiPrefix(): string {
    return this.integration?.doiMinting?.prefix || '';
  }

  get hasCrossref(): boolean {
    return this.integration?.crossrefEnabled || false;
  }

  get hasOrcid(): boolean {
    return this.integration?.orcidEnabled || false;
  }

  get hasAnalytics(): boolean {
    return !!(this.integration?.analytics?.googleAnalytics || 
             this.integration?.analytics?.plumAnalytics ||
             this.integration?.analytics?.altmetrics);
  }

  get logoUrl(): string {
    return this.branding?.logoUrl || '';
  }

  get bannerUrl(): string {
    return this.branding?.bannerUrl || '';
  }

  get primaryColor(): string {
    return this.branding?.primaryColor || '#007bff';
  }

  get hasCustomBranding(): boolean {
    return !!(this.branding?.logoUrl || this.branding?.bannerUrl || this.branding?.customCss);
  }

  get childCollectionCount(): number {
    return this.childCollections ? this.childCollections.length : 0;
  }

  get fullPath(): string {
    if (this.hasParent && this.parentCollection) {
      return `${this.parentCollection.fullPath}/${this.name}`;
    }
    return this.name;
  }

  get depth(): number {
    if (!this.hasParent) return 0;
    return (this.parentCollection?.depth || 0) + 1;
  }

  // Helper Methods
  canUserAccess(userType: string, userId?: string): boolean {
    if (this.isPublic) return true;
    if (this.isPrivate) return false;
    
    if (this.isRestricted) {
      const allowedTypes = this.access.allowedUserTypes || [];
      const allowedUsers = this.access.allowedUsers || [];
      
      return allowedTypes.includes(userType) || (userId && allowedUsers.includes(userId));
    }
    
    return true;
  }

  canUserSubmit(userType: string, userId?: string): boolean {
    if (!this.isActive) return false;
    return this.canUserAccess(userType, userId);
  }

  isFileTypeAllowed(fileType: string): boolean {
    return this.allowedFileTypes.includes('*') || this.allowedFileTypes.includes(fileType);
  }

  isFileSizeAllowed(fileSize: number): boolean {
    return fileSize <= this.maxFileSize;
  }

  canAddMoreFiles(currentFileCount: number): boolean {
    return currentFileCount < this.maxFilesPerSubmission;
  }

  getRequiredFieldsForSchema(): string[] {
    const baseFields = this.requiredFields;
    const customRequired = this.customFields.filter(field => field.required).map(field => field.name);
    return [...baseFields, ...customRequired];
  }

  getOptionalFieldsForSchema(): string[] {
    const optionalFields = this.metadata.optionalFields || [];
    const customOptional = this.customFields.filter(field => !field.required).map(field => field.name);
    return [...optionalFields, ...customOptional];
  }

  addCustomField(
    name: string,
    type: 'text' | 'number' | 'date' | 'boolean' | 'select' | 'multiselect',
    required: boolean = false,
    options?: string[],
    validation?: any
  ): void {
    if (!this.metadata.customFields) {
      this.metadata.customFields = [];
    }
    
    // Remove existing field with same name
    this.metadata.customFields = this.metadata.customFields.filter(field => field.name !== name);
    
    // Add new field
    this.metadata.customFields.push({
      name,
      type,
      required,
      options,
      validation,
    });
  }

  removeCustomField(name: string): void {
    if (this.metadata.customFields) {
      this.metadata.customFields = this.metadata.customFields.filter(field => field.name !== name);
    }
  }

  updateStatistics(
    totalObjects?: number,
    publishedObjects?: number,
    embargoedObjects?: number,
    totalDownloads?: number,
    totalViews?: number
  ): void {
    if (!this.statistics) {
      this.statistics = {
        totalObjects: 0,
        publishedObjects: 0,
        embargoedObjects: 0,
        totalDownloads: 0,
        totalViews: 0,
        lastUpdated: new Date(),
      };
    }
    
    if (totalObjects !== undefined) this.statistics.totalObjects = totalObjects;
    if (publishedObjects !== undefined) this.statistics.publishedObjects = publishedObjects;
    if (embargoedObjects !== undefined) this.statistics.embargoedObjects = embargoedObjects;
    if (totalDownloads !== undefined) this.statistics.totalDownloads = totalDownloads;
    if (totalViews !== undefined) this.statistics.totalViews = totalViews;
    
    this.statistics.lastUpdated = new Date();
  }

  addMonthlyStats(month: string, submissions: number, downloads: number, views: number): void {
    if (!this.statistics) {
      this.updateStatistics();
    }
    
    if (!this.statistics.monthlyStats) {
      this.statistics.monthlyStats = [];
    }
    
    // Remove existing stats for this month
    this.statistics.monthlyStats = this.statistics.monthlyStats.filter(stat => stat.month !== month);
    
    // Add new stats
    this.statistics.monthlyStats.push({
      month,
      submissions,
      downloads,
      views,
    });
    
    // Keep only last 12 months
    this.statistics.monthlyStats = this.statistics.monthlyStats
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12);
  }

  getOaiPmhBaseUrl(): string {
    return `/oai?verb=Identify&set=${this.oaiPmhSet}`;
  }

  generateHandle(): string {
    // Generate a handle based on library and collection
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `hdl:${this.libraryId}/${timestamp}${random}`;
  }

  validateMetadata(metadata: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const requiredFields = this.getRequiredFieldsForSchema();
    
    // Check required fields
    for (const field of requiredFields) {
      if (!metadata[field] || (Array.isArray(metadata[field]) && metadata[field].length === 0)) {
        errors.push(`Required field '${field}' is missing or empty`);
      }
    }
    
    // Validate custom fields
    for (const customField of this.customFields) {
      const value = metadata[customField.name];
      
      if (customField.required && (!value || (Array.isArray(value) && value.length === 0))) {
        errors.push(`Required custom field '${customField.name}' is missing or empty`);
      }
      
      if (value && customField.type === 'select' && customField.options) {
        if (!customField.options.includes(value)) {
          errors.push(`Invalid value for field '${customField.name}'. Must be one of: ${customField.options.join(', ')}`);
        }
      }
      
      if (value && customField.type === 'multiselect' && customField.options) {
        const invalidValues = value.filter(v => !customField.options.includes(v));
        if (invalidValues.length > 0) {
          errors.push(`Invalid values for field '${customField.name}': ${invalidValues.join(', ')}`);
        }
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
