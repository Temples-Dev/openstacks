import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { Library } from '../../libraries/entities/library.entity';
import { ConsortiumMembership } from '../../consortium/entities/consortium-membership.entity';

@Entity('library_systems')
@Index(['code'], { unique: true })
@Index(['name'])
@Index(['type'])
export class LibrarySystem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 50 })
  code: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ['single', 'multi_branch', 'consortium'],
    default: 'single',
  })
  type: 'single' | 'multi_branch' | 'consortium';

  @Column({
    type: 'enum',
    enum: ['active', 'inactive', 'suspended', 'migrating'],
    default: 'active',
  })
  status: 'active' | 'inactive' | 'suspended' | 'migrating';

  @Column({ length: 50 })
  timezone: string; // e.g., 'America/New_York'

  @Column({ length: 10 })
  locale: string; // e.g., 'en-US'

  @Column({ length: 3 })
  currency: string; // ISO 4217 currency code

  @Column({ length: 5 })
  fiscalYearStart: string; // MM-DD format

  @Column('json')
  configuration: {
    branding: {
      logoUrl?: string;
      primaryColor?: string;
      secondaryColor?: string;
      customCss?: string;
    };
    features: {
      multiLanguage: boolean;
      selfCheckout: boolean;
      mobileApp: boolean;
      digitalServices: boolean;
      consortiumServices: boolean;
    };
    integrations: {
      ils?: string;
      discovery?: string;
      payment?: string;
      authentication?: string;
    };
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
      defaultLanguage: string;
    };
  };

  @Column('json')
  contactInfo: {
    adminEmail: string;
    supportEmail: string;
    phone: string;
    website?: string;
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
  };

  @Column('json')
  subscription: {
    plan: 'basic' | 'professional' | 'enterprise' | 'consortium';
    startDate: Date;
    endDate: Date;
    maxLibraries: number;
    maxPatrons: number;
    maxItems: number;
    features: string[];
    billingContact: {
      name: string;
      email: string;
      phone: string;
    };
  };

  @Column('json', { nullable: true })
  sharedPolicies: {
    circulation?: {
      allowInterbranchLoans: boolean;
      allowInterbranchHolds: boolean;
      allowInterbranchReturns: boolean;
      transitTimeHours: number;
      defaultLoanPeriod: number;
      defaultRenewalLimit: number;
    };
    patron?: {
      sharedRegistration: boolean;
      crossSystemAccess: boolean;
      unifiedCard: boolean;
      reciprocalPrivileges: boolean;
    };
    resource?: {
      sharedCatalog: boolean;
      sharedAcquisitions: boolean;
      resourceSharing: boolean;
      consortiumDiscounts: boolean;
    };
  };

  @Column('json', { nullable: true })
  analytics: {
    dataRetentionYears: number;
    shareAnonymizedData: boolean;
    benchmarkingParticipation: boolean;
    customReporting: boolean;
  };

  @OneToMany(() => Library, library => library.system)
  libraries: Library[];

  @OneToMany(() => ConsortiumMembership, membership => membership.librarySystem)
  consortiumMemberships: ConsortiumMembership[];

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

  get isMultiBranch(): boolean {
    return this.type === 'multi_branch' || this.type === 'consortium';
  }

  get isConsortium(): boolean {
    return this.type === 'consortium';
  }

  get subscriptionStatus(): 'active' | 'expired' | 'expiring_soon' {
    const now = new Date();
    const endDate = new Date(this.subscription.endDate);
    const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (endDate < now) return 'expired';
    if (daysUntilExpiry <= 30) return 'expiring_soon';
    return 'active';
  }

  get maxLibrariesReached(): boolean {
    return this.libraries && this.libraries.length >= this.subscription.maxLibraries;
  }

  get displayName(): string {
    return this.name || this.code;
  }

  get typeDisplayName(): string {
    const typeMap = {
      single: 'Single Library',
      multi_branch: 'Multi-Branch System',
      consortium: 'Library Consortium',
    };
    return typeMap[this.type] || this.type;
  }

  get statusDisplayName(): string {
    const statusMap = {
      active: 'Active',
      inactive: 'Inactive',
      suspended: 'Suspended',
      migrating: 'Migrating',
    };
    return statusMap[this.status] || this.status;
  }

  get planDisplayName(): string {
    const planMap = {
      basic: 'Basic Plan',
      professional: 'Professional Plan',
      enterprise: 'Enterprise Plan',
      consortium: 'Consortium Plan',
    };
    return planMap[this.subscription.plan] || this.subscription.plan;
  }

  get libraryCount(): number {
    return this.libraries ? this.libraries.length : 0;
  }

  get activeLibraryCount(): number {
    return this.libraries ? this.libraries.filter(lib => lib.isActive).length : 0;
  }

  get hasFeature(feature: string): boolean {
    return this.configuration.features[feature] || false;
  }

  get hasIntegration(integration: string): boolean {
    return !!this.configuration.integrations[integration];
  }

  get allowsInterbranchOperations(): boolean {
    return this.sharedPolicies?.circulation?.allowInterbranchLoans || false;
  }

  get hasSharedCatalog(): boolean {
    return this.sharedPolicies?.resource?.sharedCatalog || false;
  }

  get supportsConsortiumServices(): boolean {
    return this.configuration.features.consortiumServices && this.isConsortium;
  }

  get primaryContactEmail(): string {
    return this.contactInfo.adminEmail;
  }

  get billingContactEmail(): string {
    return this.subscription.billingContact.email;
  }

  get formattedAddress(): string {
    const addr = this.contactInfo.address;
    return `${addr.street}, ${addr.city}, ${addr.state} ${addr.zipCode}, ${addr.country}`;
  }

  get daysUntilSubscriptionExpiry(): number {
    const now = new Date();
    const endDate = new Date(this.subscription.endDate);
    return Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  get subscriptionUsage(): {
    libraries: { used: number; max: number; percentage: number };
    patrons: { used: number; max: number; percentage: number };
    items: { used: number; max: number; percentage: number };
  } {
    // This would be populated by service logic
    return {
      libraries: {
        used: this.libraryCount,
        max: this.subscription.maxLibraries,
        percentage: (this.libraryCount / this.subscription.maxLibraries) * 100,
      },
      patrons: {
        used: 0, // Would be calculated from actual patron count
        max: this.subscription.maxPatrons,
        percentage: 0,
      },
      items: {
        used: 0, // Would be calculated from actual item count
        max: this.subscription.maxItems,
        percentage: 0,
      },
    };
  }

  // Helper methods
  canAddLibrary(): boolean {
    return this.isActive && !this.maxLibrariesReached;
  }

  canEnableFeature(feature: string): boolean {
    return this.subscription.features.includes(feature);
  }

  getTimezoneOffset(): number {
    // This would use a timezone library to get the actual offset
    return 0; // Placeholder
  }

  formatDateForSystem(date: Date): string {
    return date.toLocaleDateString(this.locale, {
      timeZone: this.timezone,
    });
  }

  formatCurrencyForSystem(amount: number): string {
    return new Intl.NumberFormat(this.locale, {
      style: 'currency',
      currency: this.currency,
    }).format(amount);
  }
}
