import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { EResource } from '../../resources/entities/e-resource.entity';

@Entity('licenses')
@Index(['licenseNumber'], { unique: true })
@Index(['startDate', 'endDate'])
@Index(['status'])
@Index(['libraryId'])
export class License {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 100 })
  licenseNumber: string;

  @Column({ length: 255 })
  licenseName: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ['active', 'expired', 'pending', 'cancelled', 'suspended'],
    default: 'pending',
  })
  status: 'active' | 'expired' | 'pending' | 'cancelled' | 'suspended';

  @Column({ type: 'uuid' })
  libraryId: string;

  @Column({ length: 255 })
  licensor: string;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date' })
  endDate: Date;

  @Column('json')
  terms: {
    simultaneousUsers?: number;
    downloadLimits?: {
      articlesPerSession?: number;
      articlesPerDay?: number;
      articlesPerMonth?: number;
    };
    printingAllowed: boolean;
    courseReserveAllowed: boolean;
    illAllowed: boolean;
    walkInAccess: boolean;
    remoteAccess: boolean;
    perpetualAccess: boolean;
    archivalRights: boolean;
  };

  @Column('json')
  restrictions: {
    geographicRestrictions?: string[];
    userTypeRestrictions?: string[];
    usageRestrictions?: string[];
    technicalRestrictions?: string[];
  };

  @Column('json')
  compliance: {
    counterCompliant: boolean;
    accessibilityCompliant: boolean;
    privacyCompliant: boolean;
    governingLaw: string;
  };

  @OneToMany(() => EResource, resource => resource.license)
  resources: EResource[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'uuid' })
  createdBy: string;

  // Virtual Properties
  get isActive(): boolean {
    return this.status === 'active';
  }

  get isExpired(): boolean {
    return this.status === 'expired' || new Date() > this.endDate;
  }

  get daysUntilExpiry(): number {
    const now = new Date();
    const diffTime = this.endDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  get requiresRenewal(): boolean {
    return this.daysUntilExpiry <= 90;
  }
}
