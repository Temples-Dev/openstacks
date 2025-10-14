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

@Entity('access_logs')
@Index(['resourceId', 'accessTime'])
@Index(['userId', 'accessTime'])
@Index(['ipAddress', 'accessTime'])
@Index(['accessType'])
export class AccessLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => EResource, resource => resource.accessLogs)
  @JoinColumn({ name: 'resourceId' })
  resource: EResource;

  @Column({ type: 'uuid' })
  resourceId: string;

  @Column({ type: 'uuid', nullable: true })
  userId: string;

  @Column({ length: 255, nullable: true })
  userType: string;

  @Column({ length: 45 })
  ipAddress: string;

  @Column({ length: 255, nullable: true })
  userAgent: string;

  @Column({ type: 'timestamp' })
  accessTime: Date;

  @Column({
    type: 'enum',
    enum: ['login', 'search', 'view', 'download', 'print', 'email', 'logout', 'denied'],
  })
  accessType: 'login' | 'search' | 'view' | 'download' | 'print' | 'email' | 'logout' | 'denied';

  @Column({ type: 'text', nullable: true })
  accessUrl: string;

  @Column({ type: 'text', nullable: true })
  referrer: string;

  @Column({ length: 255, nullable: true })
  sessionId: string;

  @Column({ type: 'integer', nullable: true })
  duration: number; // seconds

  @Column({
    type: 'enum',
    enum: ['success', 'denied', 'error', 'timeout'],
    default: 'success',
  })
  status: 'success' | 'denied' | 'error' | 'timeout';

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column('json', { nullable: true })
  metadata: {
    location?: 'on_campus' | 'off_campus';
    accessMethod?: 'direct' | 'proxy' | 'shibboleth';
    deviceType?: 'desktop' | 'mobile' | 'tablet';
    browser?: string;
    operatingSystem?: string;
    downloadSize?: number; // bytes
    searchTerms?: string;
    resultCount?: number;
  };

  @CreateDateColumn()
  createdAt: Date;

  // Virtual Properties
  get isSuccessful(): boolean {
    return this.status === 'success';
  }

  get isDenied(): boolean {
    return this.status === 'denied' || this.accessType === 'denied';
  }

  get isDownload(): boolean {
    return this.accessType === 'download';
  }

  get isSearch(): boolean {
    return this.accessType === 'search';
  }

  get accessTypeDisplayName(): string {
    const typeMap = {
      login: 'Login',
      search: 'Search',
      view: 'View',
      download: 'Download',
      print: 'Print',
      email: 'Email',
      logout: 'Logout',
      denied: 'Access Denied',
    };
    return typeMap[this.accessType] || this.accessType;
  }

  get durationMinutes(): number {
    return this.duration ? Math.round(this.duration / 60) : 0;
  }

  get location(): string {
    return this.metadata?.location || 'unknown';
  }

  get accessMethod(): string {
    return this.metadata?.accessMethod || 'direct';
  }

  get deviceType(): string {
    return this.metadata?.deviceType || 'desktop';
  }
}
