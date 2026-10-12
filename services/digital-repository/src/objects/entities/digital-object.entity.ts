import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { DigitalCollection } from '../../collections/entities/digital-collection.entity';
import { DigitalFile } from './digital-file.entity';

@Entity('digital_objects')
@Index(['handle'], { unique: true })
@Index(['title'])
@Index(['status'])
@Index(['collectionId'])
@Index(['createdAt'])
export class DigitalObject {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 255 })
  handle: string; // Persistent identifier

  @Column({ length: 500 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ['draft', 'submitted', 'under_review', 'published', 'withdrawn', 'embargoed'],
    default: 'draft',
  })
  status: 'draft' | 'submitted' | 'under_review' | 'published' | 'withdrawn' | 'embargoed';

  @ManyToOne(() => DigitalCollection, collection => collection.objects)
  @JoinColumn({ name: 'collectionId' })
  collection: DigitalCollection;

  @Column({ type: 'uuid' })
  collectionId: string;

  @Column({ type: 'uuid' })
  submittedBy: string;

  @Column({ length: 255 })
  submitterName: string;

  @Column({ length: 255 })
  submitterEmail: string;

  @Column({ type: 'uuid', nullable: true })
  reviewedBy: string;

  @Column({ type: 'uuid', nullable: true })
  approvedBy: string;

  @Column('json')
  metadata: {
    // Dublin Core fields
    dublin_core?: {
      title: string[];
      creator: string[];
      subject: string[];
      description: string[];
      publisher: string[];
      contributor: string[];
      date: string[];
      type: string[];
      format: string[];
      identifier: string[];
      source: string[];
      language: string[];
      relation: string[];
      coverage: string[];
      rights: string[];
    };
    
    // MODS fields
    mods?: {
      titleInfo: any[];
      name: any[];
      typeOfResource: string;
      genre: string[];
      originInfo: any;
      language: any[];
      physicalDescription: any;
      abstract: string[];
      subject: any[];
      classification: any[];
      relatedItem: any[];
      identifier: any[];
      location: any;
      accessCondition: any[];
      recordInfo: any;
    };
    
    // Custom fields
    custom?: Record<string, any>;
  };

  @Column('json')
  access: {
    visibility: 'public' | 'restricted' | 'private' | 'embargoed';
    embargoDate?: Date;
    embargoReason?: string;
    accessConditions?: string;
    license?: string;
    rightsStatement?: string;
    allowedUsers?: string[];
    allowedGroups?: string[];
    ipRestrictions?: string[];
    downloadRestrictions?: {
      requiresLogin: boolean;
      requiresApproval: boolean;
      maxDownloadsPerUser?: number;
      maxDownloadsPerDay?: number;
    };
  };

  @Column('json')
  preservation: {
    checksums: { [algorithm: string]: string };
    formatMigrations: Array<{
      originalFormat: string;
      migratedFormat: string;
      migrationDate: Date;
      migrationTool: string;
      migrationNotes?: string;
    }>;
    preservationEvents: Array<{
      eventType: 'ingestion' | 'validation' | 'migration' | 'replication' | 'deletion';
      eventDate: Date;
      eventDetail: string;
      eventOutcome: 'success' | 'failure' | 'warning';
      agentName: string;
      agentType: 'person' | 'software' | 'hardware';
    }>;
    storageLocations: Array<{
      location: string;
      locationType: 'primary' | 'backup' | 'archive';
      lastVerified: Date;
      status: 'active' | 'inactive' | 'corrupted';
    }>;
  };

  @Column('json', { nullable: true })
  workflow: {
    submissionDate?: Date;
    reviewStartDate?: Date;
    reviewEndDate?: Date;
    approvalDate?: Date;
    publicationDate?: Date;
    withdrawalDate?: Date;
    withdrawalReason?: string;
    reviewComments?: Array<{
      reviewerId: string;
      reviewerName: string;
      comment: string;
      date: Date;
      action: 'approve' | 'reject' | 'request_changes';
    }>;
    revisions?: Array<{
      revisionNumber: number;
      revisionDate: Date;
      revisionReason: string;
      changedBy: string;
      changes: string[];
    }>;
  };

  @Column('json', { nullable: true })
  versioning: {
    versionNumber: number;
    isLatestVersion: boolean;
    parentObjectId?: string;
    childObjectIds?: string[];
    versionHistory: Array<{
      version: number;
      date: Date;
      changedBy: string;
      changeDescription: string;
      majorChange: boolean;
    }>;
  };

  @Column('json', { nullable: true })
  statistics: {
    viewCount: number;
    downloadCount: number;
    citationCount: number;
    lastViewed?: Date;
    lastDownloaded?: Date;
    monthlyViews?: Array<{
      month: string;
      views: number;
      downloads: number;
    }>;
    referringSites?: Array<{
      site: string;
      count: number;
    }>;
    geographicAccess?: Array<{
      country: string;
      count: number;
    }>;
  };

  @Column('json', { nullable: true })
  citations: {
    preferredCitation?: string;
    citationFormats?: {
      apa?: string;
      mla?: string;
      chicago?: string;
      bibtex?: string;
      endnote?: string;
      ris?: string;
    };
    relatedPublications?: Array<{
      title: string;
      authors: string[];
      journal?: string;
      doi?: string;
      url?: string;
      citationType: 'cites' | 'is_cited_by' | 'is_supplement_to' | 'is_supplemented_by';
    }>;
  };

  @Column('json', { nullable: true })
  identifiers: {
    doi?: string;
    isbn?: string;
    issn?: string;
    orcid?: string[];
    pmid?: string;
    arxiv?: string;
    local?: string[];
    external?: Array<{
      type: string;
      value: string;
      source: string;
    }>;
  };

  @OneToMany(() => DigitalFile, file => file.digitalObject)
  files: DigitalFile[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Virtual Properties
  get isPublished(): boolean {
    return this.status === 'published';
  }

  get isDraft(): boolean {
    return this.status === 'draft';
  }

  get isUnderReview(): boolean {
    return this.status === 'under_review';
  }

  get isEmbargoed(): boolean {
    return this.status === 'embargoed' || (this.access.visibility === 'embargoed' && this.access.embargoDate && new Date() < this.access.embargoDate);
  }

  get isWithdrawn(): boolean {
    return this.status === 'withdrawn';
  }

  get isPublic(): boolean {
    return this.access.visibility === 'public' && this.isPublished && !this.isEmbargoed;
  }

  get displayTitle(): string {
    return this.title;
  }

  get statusDisplayName(): string {
    const statusMap = {
      draft: 'Draft',
      submitted: 'Submitted',
      under_review: 'Under Review',
      published: 'Published',
      withdrawn: 'Withdrawn',
      embargoed: 'Embargoed',
    };
    return statusMap[this.status] || this.status;
  }

  get primaryCreator(): string {
    const creators = this.metadata.dublin_core?.creator || [];
    return creators.length > 0 ? creators[0] : 'Unknown';
  }

  get allCreators(): string[] {
    return this.metadata.dublin_core?.creator || [];
  }

  get primarySubject(): string {
    const subjects = this.metadata.dublin_core?.subject || [];
    return subjects.length > 0 ? subjects[0] : '';
  }

  get allSubjects(): string[] {
    return this.metadata.dublin_core?.subject || [];
  }

  get publicationDate(): string {
    const dates = this.metadata.dublin_core?.date || [];
    return dates.length > 0 ? dates[0] : '';
  }

  get resourceType(): string {
    const types = this.metadata.dublin_core?.type || [];
    return types.length > 0 ? types[0] : 'Unknown';
  }

  get language(): string {
    const languages = this.metadata.dublin_core?.language || [];
    return languages.length > 0 ? languages[0] : 'en';
  }

  get rights(): string {
    const rights = this.metadata.dublin_core?.rights || [];
    return rights.length > 0 ? rights[0] : '';
  }

  get license(): string {
    return this.access.license || '';
  }

  get embargoDate(): Date | null {
    return this.access.embargoDate ? new Date(this.access.embargoDate) : null;
  }

  get daysUntilEmbargoLift(): number {
    if (!this.embargoDate) return 0;
    const now = new Date();
    const diffTime = this.embargoDate.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }

  get fileCount(): number {
    return this.files ? this.files.length : 0;
  }

  get totalFileSize(): number {
    return this.files ? this.files.reduce((sum, file) => sum + file.fileSize, 0) : 0;
  }

  get viewCount(): number {
    return this.statistics?.viewCount || 0;
  }

  get downloadCount(): number {
    return this.statistics?.downloadCount || 0;
  }

  get citationCount(): number {
    return this.statistics?.citationCount || 0;
  }

  get lastViewed(): Date | null {
    return this.statistics?.lastViewed ? new Date(this.statistics.lastViewed) : null;
  }

  get lastDownloaded(): Date | null {
    return this.statistics?.lastDownloaded ? new Date(this.statistics.lastDownloaded) : null;
  }

  get versionNumber(): number {
    return this.versioning?.versionNumber || 1;
  }

  get isLatestVersion(): boolean {
    return this.versioning?.isLatestVersion ?? true;
  }

  get hasVersions(): boolean {
    return !!(this.versioning?.versionHistory && this.versioning.versionHistory.length > 1);
  }

  get doi(): string {
    return this.identifiers?.doi || '';
  }

  get hasDoi(): boolean {
    return !!this.doi;
  }

  get preferredCitation(): string {
    return this.citations?.preferredCitation || this.generateDefaultCitation();
  }

  get submissionDate(): Date | null {
    return this.workflow?.submissionDate ? new Date(this.workflow.submissionDate) : null;
  }

  get publicationDateFormatted(): Date | null {
    return this.workflow?.publicationDate ? new Date(this.workflow.publicationDate) : null;
  }

  get reviewComments(): any[] {
    return this.workflow?.reviewComments || [];
  }

  get hasReviewComments(): boolean {
    return this.reviewComments.length > 0;
  }

  get checksums(): Record<string, string> {
    return this.preservation.checksums || {};
  }

  get primaryChecksum(): string {
    const checksums = this.checksums;
    return checksums.sha256 || checksums.sha1 || checksums.md5 || '';
  }

  get preservationEvents(): any[] {
    return this.preservation.preservationEvents || [];
  }

  get lastPreservationEvent(): any {
    const events = this.preservationEvents;
    return events.length > 0 ? events[events.length - 1] : null;
  }

  // Helper Methods
  canUserAccess(userType: string, userId?: string): boolean {
    if (!this.isPublished) return false;
    if (this.isEmbargoed) return false;
    if (this.isWithdrawn) return false;
    
    if (this.access.visibility === 'public') return true;
    if (this.access.visibility === 'private') return false;
    
    if (this.access.visibility === 'restricted') {
      const allowedUsers = this.access.allowedUsers || [];
      return userId ? allowedUsers.includes(userId) : false;
    }
    
    return true;
  }

  canUserDownload(userType: string, userId?: string): boolean {
    if (!this.canUserAccess(userType, userId)) return false;
    
    const restrictions = this.access.downloadRestrictions;
    if (!restrictions) return true;
    
    if (restrictions.requiresLogin && !userId) return false;
    if (restrictions.requiresApproval) return false; // Would need approval logic
    
    return true;
  }

  generateDefaultCitation(): string {
    const creators = this.allCreators.join(', ');
    const year = this.publicationDate ? new Date(this.publicationDate).getFullYear() : new Date().getFullYear();
    const title = this.title;
    
    return `${creators} (${year}). ${title}. Retrieved from ${this.handle}`;
  }

  addPreservationEvent(
    eventType: 'ingestion' | 'validation' | 'migration' | 'replication' | 'deletion',
    eventDetail: string,
    eventOutcome: 'success' | 'failure' | 'warning',
    agentName: string,
    agentType: 'person' | 'software' | 'hardware' = 'software'
  ): void {
    if (!this.preservation.preservationEvents) {
      this.preservation.preservationEvents = [];
    }
    
    this.preservation.preservationEvents.push({
      eventType,
      eventDate: new Date(),
      eventDetail,
      eventOutcome,
      agentName,
      agentType,
    });
  }

  updateStatistics(views?: number, downloads?: number, citations?: number): void {
    if (!this.statistics) {
      this.statistics = {
        viewCount: 0,
        downloadCount: 0,
        citationCount: 0,
      };
    }
    
    if (views !== undefined) {
      this.statistics.viewCount += views;
      this.statistics.lastViewed = new Date();
    }
    
    if (downloads !== undefined) {
      this.statistics.downloadCount += downloads;
      this.statistics.lastDownloaded = new Date();
    }
    
    if (citations !== undefined) {
      this.statistics.citationCount = citations;
    }
  }

  addReviewComment(
    reviewerId: string,
    reviewerName: string,
    comment: string,
    action: 'approve' | 'reject' | 'request_changes'
  ): void {
    if (!this.workflow) this.workflow = {};
    if (!this.workflow.reviewComments) this.workflow.reviewComments = [];
    
    this.workflow.reviewComments.push({
      reviewerId,
      reviewerName,
      comment,
      date: new Date(),
      action,
    });
  }

  createNewVersion(changedBy: string, changeDescription: string, majorChange: boolean = false): void {
    if (!this.versioning) {
      this.versioning = {
        versionNumber: 1,
        isLatestVersion: true,
        versionHistory: [],
      };
    }
    
    // Add current version to history
    this.versioning.versionHistory.push({
      version: this.versioning.versionNumber,
      date: new Date(),
      changedBy,
      changeDescription,
      majorChange,
    });
    
    // Increment version number
    if (majorChange) {
      this.versioning.versionNumber = Math.floor(this.versioning.versionNumber) + 1;
    } else {
      this.versioning.versionNumber += 0.1;
    }
  }

  setDoi(doi: string): void {
    if (!this.identifiers) this.identifiers = {};
    this.identifiers.doi = doi;
  }

  addIdentifier(type: string, value: string, source?: string): void {
    if (!this.identifiers) this.identifiers = {};
    if (!this.identifiers.external) this.identifiers.external = [];
    
    // Remove existing identifier of same type
    this.identifiers.external = this.identifiers.external.filter(id => id.type !== type);
    
    // Add new identifier
    this.identifiers.external.push({
      type,
      value,
      source: source || 'manual',
    });
  }

  updateMetadata(schema: 'dublin_core' | 'mods' | 'custom', metadata: any): void {
    if (!this.metadata) this.metadata = {};
    this.metadata[schema] = metadata;
  }

  setEmbargo(embargoDate: Date, reason?: string): void {
    this.access.visibility = 'embargoed';
    this.access.embargoDate = embargoDate;
    if (reason) this.access.embargoReason = reason;
    this.status = 'embargoed';
  }

  liftEmbargo(): void {
    this.access.visibility = 'public';
    this.access.embargoDate = null;
    this.access.embargoReason = null;
    if (this.status === 'embargoed') {
      this.status = 'published';
    }
  }

  withdraw(reason: string, withdrawnBy: string): void {
    this.status = 'withdrawn';
    if (!this.workflow) this.workflow = {};
    this.workflow.withdrawalDate = new Date();
    this.workflow.withdrawalReason = reason;
    
    this.addPreservationEvent(
      'deletion',
      `Object withdrawn: ${reason}`,
      'success',
      withdrawnBy,
      'person'
    );
  }

  calculateChecksum(algorithm: 'md5' | 'sha1' | 'sha256' | 'sha512', content: Buffer): string {
    const crypto = require('crypto');
    const hash = crypto.createHash(algorithm);
    hash.update(content);
    return hash.digest('hex');
  }

  validateChecksums(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Would validate file checksums against stored checksums
    // This is a simplified version
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
