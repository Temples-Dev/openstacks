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
import { DigitalObject } from './digital-object.entity';

@Entity('digital_files')
@Index(['digitalObjectId'])
@Index(['fileName'])
@Index(['fileType'])
@Index(['status'])
export class DigitalFile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => DigitalObject, object => object.files)
  @JoinColumn({ name: 'digitalObjectId' })
  digitalObject: DigitalObject;

  @Column({ type: 'uuid' })
  digitalObjectId: string;

  @Column({ length: 255 })
  fileName: string;

  @Column({ length: 255 })
  originalFileName: string;

  @Column({ length: 100 })
  fileType: string; // MIME type

  @Column({ length: 10 })
  fileExtension: string;

  @Column({ type: 'bigint' })
  fileSize: number; // bytes

  @Column({
    type: 'enum',
    enum: ['active', 'deleted', 'quarantined', 'migrated'],
    default: 'active',
  })
  status: 'active' | 'deleted' | 'quarantined' | 'migrated';

  @Column({ type: 'text' })
  filePath: string; // Storage path

  @Column({ type: 'text', nullable: true })
  thumbnailPath: string;

  @Column('json')
  checksums: {
    md5: string;
    sha1: string;
    sha256: string;
  };

  @Column('json', { nullable: true })
  metadata: {
    // Technical metadata
    technical?: {
      format: string;
      formatVersion?: string;
      encoding?: string;
      compression?: string;
      colorSpace?: string;
      resolution?: {
        width: number;
        height: number;
        dpi?: number;
      };
      duration?: number; // for audio/video files
      bitrate?: number;
      sampleRate?: number;
      channels?: number;
    };
    
    // Preservation metadata
    preservation?: {
      originalFormat: string;
      migrationHistory: Array<{
        fromFormat: string;
        toFormat: string;
        migrationDate: Date;
        migrationTool: string;
        migrationNotes?: string;
      }>;
      fixityChecks: Array<{
        checkDate: Date;
        algorithm: string;
        checksum: string;
        result: 'pass' | 'fail';
        notes?: string;
      }>;
    };
    
    // Descriptive metadata
    descriptive?: {
      title?: string;
      description?: string;
      creator?: string;
      dateCreated?: Date;
      software?: string;
      equipment?: string;
      processingNotes?: string;
    };
  };

  @Column('json', { nullable: true })
  access: {
    visibility: 'public' | 'restricted' | 'private';
    downloadable: boolean;
    streamable?: boolean;
    requiresViewer?: boolean;
    viewerType?: 'pdf' | 'image' | 'video' | 'audio' | 'text' | 'universal';
    accessRestrictions?: string[];
    embargoDate?: Date;
  };

  @Column('json', { nullable: true })
  statistics: {
    downloadCount: number;
    viewCount: number;
    lastDownloaded?: Date;
    lastViewed?: Date;
    downloadsByMonth?: Array<{
      month: string;
      downloads: number;
      views: number;
    }>;
  };

  @Column('json', { nullable: true })
  virusCheck: {
    lastScanned: Date;
    scanResult: 'clean' | 'infected' | 'suspicious' | 'error';
    scanEngine: string;
    scanVersion: string;
    threatDetails?: string[];
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'uuid' })
  uploadedBy: string;

  // Virtual Properties
  get isActive(): boolean {
    return this.status === 'active';
  }

  get isDeleted(): boolean {
    return this.status === 'deleted';
  }

  get isQuarantined(): boolean {
    return this.status === 'quarantined';
  }

  get displayName(): string {
    return this.originalFileName || this.fileName;
  }

  get fileSizeFormatted(): string {
    const bytes = this.fileSize;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  get isImage(): boolean {
    return this.fileType.startsWith('image/');
  }

  get isVideo(): boolean {
    return this.fileType.startsWith('video/');
  }

  get isAudio(): boolean {
    return this.fileType.startsWith('audio/');
  }

  get isPdf(): boolean {
    return this.fileType === 'application/pdf';
  }

  get isText(): boolean {
    return this.fileType.startsWith('text/');
  }

  get isDocument(): boolean {
    const docTypes = [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ];
    return docTypes.includes(this.fileType);
  }

  get isArchive(): boolean {
    const archiveTypes = [
      'application/zip',
      'application/x-rar-compressed',
      'application/x-tar',
      'application/gzip',
      'application/x-7z-compressed',
    ];
    return archiveTypes.includes(this.fileType);
  }

  get canBeViewed(): boolean {
    return this.access?.requiresViewer !== false && 
           (this.isImage || this.isPdf || this.isText || this.isVideo || this.isAudio);
  }

  get canBeDownloaded(): boolean {
    return this.access?.downloadable !== false && this.isActive;
  }

  get canBeStreamed(): boolean {
    return this.access?.streamable === true && (this.isVideo || this.isAudio);
  }

  get hasThumbnail(): boolean {
    return !!this.thumbnailPath;
  }

  get downloadCount(): number {
    return this.statistics?.downloadCount || 0;
  }

  get viewCount(): number {
    return this.statistics?.viewCount || 0;
  }

  get lastDownloaded(): Date | null {
    return this.statistics?.lastDownloaded ? new Date(this.statistics.lastDownloaded) : null;
  }

  get lastViewed(): Date | null {
    return this.statistics?.lastViewed ? new Date(this.statistics.lastViewed) : null;
  }

  get primaryChecksum(): string {
    return this.checksums.sha256 || this.checksums.sha1 || this.checksums.md5;
  }

  get isVirusFree(): boolean {
    return this.virusCheck?.scanResult === 'clean';
  }

  get lastVirusScan(): Date | null {
    return this.virusCheck?.lastScanned ? new Date(this.virusCheck.lastScanned) : null;
  }

  get needsVirusScan(): boolean {
    if (!this.virusCheck) return true;
    const lastScan = this.lastVirusScan;
    if (!lastScan) return true;
    
    // Scan if older than 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return lastScan < thirtyDaysAgo;
  }

  get resolution(): { width: number; height: number } | null {
    return this.metadata?.technical?.resolution || null;
  }

  get duration(): number | null {
    return this.metadata?.technical?.duration || null;
  }

  get format(): string {
    return this.metadata?.technical?.format || this.fileType;
  }

  get originalFormat(): string {
    return this.metadata?.preservation?.originalFormat || this.format;
  }

  get hasMigrationHistory(): boolean {
    return !!(this.metadata?.preservation?.migrationHistory && 
             this.metadata.preservation.migrationHistory.length > 0);
  }

  get migrationHistory(): any[] {
    return this.metadata?.preservation?.migrationHistory || [];
  }

  get lastFixityCheck(): any {
    const checks = this.metadata?.preservation?.fixityChecks || [];
    return checks.length > 0 ? checks[checks.length - 1] : null;
  }

  get fixityCheckStatus(): 'pass' | 'fail' | 'unknown' {
    const lastCheck = this.lastFixityCheck;
    return lastCheck ? lastCheck.result : 'unknown';
  }

  get needsFixityCheck(): boolean {
    const lastCheck = this.lastFixityCheck;
    if (!lastCheck) return true;
    
    // Check if older than 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    return new Date(lastCheck.checkDate) < ninetyDaysAgo;
  }

  // Helper Methods
  updateStatistics(downloads?: number, views?: number): void {
    if (!this.statistics) {
      this.statistics = {
        downloadCount: 0,
        viewCount: 0,
      };
    }
    
    if (downloads !== undefined) {
      this.statistics.downloadCount += downloads;
      this.statistics.lastDownloaded = new Date();
    }
    
    if (views !== undefined) {
      this.statistics.viewCount += views;
      this.statistics.lastViewed = new Date();
    }
  }

  addFixityCheck(algorithm: string, checksum: string, result: 'pass' | 'fail', notes?: string): void {
    if (!this.metadata) this.metadata = {};
    if (!this.metadata.preservation) this.metadata.preservation = { originalFormat: this.format, migrationHistory: [], fixityChecks: [] };
    if (!this.metadata.preservation.fixityChecks) this.metadata.preservation.fixityChecks = [];
    
    this.metadata.preservation.fixityChecks.push({
      checkDate: new Date(),
      algorithm,
      checksum,
      result,
      notes,
    });
    
    // Keep only last 10 checks
    this.metadata.preservation.fixityChecks = this.metadata.preservation.fixityChecks.slice(-10);
  }

  addMigration(fromFormat: string, toFormat: string, migrationTool: string, notes?: string): void {
    if (!this.metadata) this.metadata = {};
    if (!this.metadata.preservation) this.metadata.preservation = { originalFormat: this.format, migrationHistory: [], fixityChecks: [] };
    if (!this.metadata.preservation.migrationHistory) this.metadata.preservation.migrationHistory = [];
    
    this.metadata.preservation.migrationHistory.push({
      fromFormat,
      toFormat,
      migrationDate: new Date(),
      migrationTool,
      migrationNotes: notes,
    });
    
    // Update current format
    if (this.metadata.technical) {
      this.metadata.technical.format = toFormat;
    }
  }

  updateVirusScan(result: 'clean' | 'infected' | 'suspicious' | 'error', engine: string, version: string, threats?: string[]): void {
    this.virusCheck = {
      lastScanned: new Date(),
      scanResult: result,
      scanEngine: engine,
      scanVersion: version,
      threatDetails: threats,
    };
    
    // Quarantine if infected
    if (result === 'infected') {
      this.status = 'quarantined';
    }
  }

  generateThumbnail(): Promise<string> {
    // This would integrate with image processing library
    // Returns path to generated thumbnail
    return Promise.resolve('');
  }

  validateChecksum(algorithm: 'md5' | 'sha1' | 'sha256', expectedChecksum: string): boolean {
    const actualChecksum = this.checksums[algorithm];
    return actualChecksum === expectedChecksum;
  }

  calculateChecksum(algorithm: 'md5' | 'sha1' | 'sha256', content: Buffer): string {
    const crypto = require('crypto');
    const hash = crypto.createHash(algorithm);
    hash.update(content);
    return hash.digest('hex');
  }

  getViewerUrl(): string {
    if (!this.canBeViewed) return '';
    
    const viewerType = this.access?.viewerType || this.getDefaultViewerType();
    return `/viewer/${viewerType}/${this.id}`;
  }

  getDownloadUrl(): string {
    if (!this.canBeDownloaded) return '';
    return `/download/${this.id}`;
  }

  getStreamUrl(): string {
    if (!this.canBeStreamed) return '';
    return `/stream/${this.id}`;
  }

  private getDefaultViewerType(): string {
    if (this.isPdf) return 'pdf';
    if (this.isImage) return 'image';
    if (this.isVideo) return 'video';
    if (this.isAudio) return 'audio';
    if (this.isText) return 'text';
    return 'universal';
  }

  setTechnicalMetadata(metadata: {
    format?: string;
    formatVersion?: string;
    encoding?: string;
    compression?: string;
    colorSpace?: string;
    resolution?: { width: number; height: number; dpi?: number };
    duration?: number;
    bitrate?: number;
    sampleRate?: number;
    channels?: number;
  }): void {
    if (!this.metadata) this.metadata = {};
    if (!this.metadata.technical) this.metadata.technical = { format: this.fileType };
    
    Object.assign(this.metadata.technical, metadata);
  }

  setDescriptiveMetadata(metadata: {
    title?: string;
    description?: string;
    creator?: string;
    dateCreated?: Date;
    software?: string;
    equipment?: string;
    processingNotes?: string;
  }): void {
    if (!this.metadata) this.metadata = {};
    if (!this.metadata.descriptive) this.metadata.descriptive = {};
    
    Object.assign(this.metadata.descriptive, metadata);
  }

  setAccessRestrictions(
    visibility: 'public' | 'restricted' | 'private',
    downloadable: boolean = true,
    streamable?: boolean,
    requiresViewer?: boolean,
    restrictions?: string[],
    embargoDate?: Date
  ): void {
    this.access = {
      visibility,
      downloadable,
      streamable,
      requiresViewer,
      viewerType: this.getDefaultViewerType(),
      accessRestrictions: restrictions,
      embargoDate,
    };
  }

  isAccessibleToUser(userType: string, userId?: string): boolean {
    if (!this.access) return true;
    
    if (this.access.visibility === 'public') return true;
    if (this.access.visibility === 'private') return false;
    
    // Check embargo
    if (this.access.embargoDate && new Date() < this.access.embargoDate) {
      return false;
    }
    
    // For restricted access, would need more complex logic
    return true;
  }

  getFileIcon(): string {
    if (this.isImage) return 'image';
    if (this.isVideo) return 'video';
    if (this.isAudio) return 'audio';
    if (this.isPdf) return 'pdf';
    if (this.isDocument) return 'document';
    if (this.isArchive) return 'archive';
    if (this.isText) return 'text';
    return 'file';
  }
}
