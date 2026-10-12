import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Holdings } from './holdings.entity';

@Entity('locations')
@Index(['code'], { unique: true })
@Index(['isActive'])
export class Location {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 20, unique: true })
  @Index()
  code: string;

  @Column({ length: 200 })
  name: string;

  @Column({ name: 'display_name', length: 200, nullable: true })
  displayName: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'location_type', length: 50, default: 'stack' })
  @Index()
  locationType: 'stack' | 'reference' | 'reserve' | 'special' | 'storage' | 'remote' | 'digital' | 'other';

  @Column({ name: 'parent_location', length: 20, nullable: true })
  parentLocation: string;

  @Column({ name: 'library_code', length: 20, nullable: true })
  @Index()
  libraryCode: string;

  @Column({ name: 'library_name', length: 200, nullable: true })
  libraryName: string;

  @Column({ name: 'campus_code', length: 20, nullable: true })
  campusCode: string;

  @Column({ name: 'campus_name', length: 200, nullable: true })
  campusName: string;

  @Column({ name: 'institution_code', length: 20, nullable: true })
  institutionCode: string;

  @Column({ name: 'institution_name', length: 200, nullable: true })
  institutionName: string;

  @Column({ name: 'is_active', default: true })
  @Index()
  isActive: boolean;

  @Column({ name: 'is_public', default: true })
  @Index()
  isPublic: boolean;

  @Column({ name: 'is_circulating', default: true })
  isCirculating: boolean;

  @Column({ name: 'is_requestable', default: true })
  isRequestable: boolean;

  @Column({ name: 'pickup_location', default: false })
  isPickupLocation: boolean;

  @Column({ name: 'delivery_location', default: false })
  isDeliveryLocation: boolean;

  @Column({ name: 'sort_order', type: 'integer', default: 0 })
  sortOrder: number;

  @Column({ name: 'address_line1', length: 200, nullable: true })
  addressLine1: string;

  @Column({ name: 'address_line2', length: 200, nullable: true })
  addressLine2: string;

  @Column({ length: 100, nullable: true })
  city: string;

  @Column({ name: 'state_province', length: 50, nullable: true })
  stateProvince: string;

  @Column({ name: 'postal_code', length: 20, nullable: true })
  postalCode: string;

  @Column({ length: 100, nullable: true })
  country: string;

  @Column({ name: 'phone_number', length: 20, nullable: true })
  phoneNumber: string;

  @Column({ name: 'email_address', length: 200, nullable: true })
  emailAddress: string;

  @Column({ name: 'website_url', length: 500, nullable: true })
  websiteUrl: string;

  @Column({ name: 'hours_of_operation', type: 'text', nullable: true })
  hoursOfOperation: string;

  @Column({ name: 'special_instructions', type: 'text', nullable: true })
  specialInstructions: string;

  @Column({ name: 'access_restrictions', type: 'text', nullable: true })
  accessRestrictions: string;

  @Column({ name: 'created_by', length: 100, nullable: true })
  createdBy: string;

  @Column({ name: 'last_modified_by', length: 100, nullable: true })
  lastModifiedBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  // Relations
  @OneToMany(() => Holdings, holdings => holdings.location)
  holdings: Holdings[];

  // Virtual properties
  get fullName(): string {
    const parts = [];
    if (this.institutionName) parts.push(this.institutionName);
    if (this.campusName && this.campusName !== this.institutionName) parts.push(this.campusName);
    if (this.libraryName && this.libraryName !== this.campusName) parts.push(this.libraryName);
    parts.push(this.name);
    return parts.join(' - ');
  }

  get shortDisplayName(): string {
    return this.displayName || this.name;
  }

  get fullAddress(): string {
    const parts = [];
    if (this.addressLine1) parts.push(this.addressLine1);
    if (this.addressLine2) parts.push(this.addressLine2);
    
    const cityStateZip = [];
    if (this.city) cityStateZip.push(this.city);
    if (this.stateProvince) cityStateZip.push(this.stateProvince);
    if (this.postalCode) cityStateZip.push(this.postalCode);
    
    if (cityStateZip.length > 0) {
      parts.push(cityStateZip.join(', '));
    }
    
    if (this.country) parts.push(this.country);
    
    return parts.join('\n');
  }

  get holdingsCount(): number {
    return this.holdings?.length || 0;
  }

  get canCirculate(): boolean {
    return this.isActive && this.isCirculating;
  }

  get canRequest(): boolean {
    return this.isActive && this.isRequestable;
  }
}
