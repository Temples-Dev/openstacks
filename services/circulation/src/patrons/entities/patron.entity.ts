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
import { Loan } from '../../loans/entities/loan.entity';
import { Hold } from '../../holds/entities/hold.entity';
import { Fine } from '../../fines/entities/fine.entity';

@Entity('patrons')
@Index(['barcode'], { unique: true })
@Index(['email'], { unique: true })
@Index(['patronType', 'status'])
export class Patron {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50, unique: true })
  @Index()
  barcode: string;

  @Column({ name: 'first_name', length: 100 })
  firstName: string;

  @Column({ name: 'last_name', length: 100 })
  @Index()
  lastName: string;

  @Column({ name: 'middle_name', length: 100, nullable: true })
  middleName: string;

  @Column({ length: 200, unique: true })
  @Index()
  email: string;

  @Column({ name: 'phone_number', length: 20, nullable: true })
  phoneNumber: string;

  @Column({ name: 'date_of_birth', type: 'date', nullable: true })
  dateOfBirth: Date;

  @Column({ name: 'patron_type', length: 50, default: 'standard' })
  @Index()
  patronType: 'student' | 'faculty' | 'staff' | 'community' | 'visitor' | 'standard';

  @Column({ length: 20, default: 'active' })
  @Index()
  status: 'active' | 'inactive' | 'suspended' | 'expired' | 'blocked';

  @Column({ name: 'expiration_date', type: 'date' })
  @Index()
  expirationDate: Date;

  @Column({ name: 'registration_date', type: 'date', default: () => 'CURRENT_DATE' })
  registrationDate: Date;

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

  @Column({ name: 'home_library', length: 50, nullable: true })
  @Index()
  homeLibrary: string;

  @Column({ name: 'preferred_language', length: 10, default: 'en' })
  preferredLanguage: string;

  @Column({ name: 'notification_preferences', type: 'text', nullable: true })
  notificationPreferences: string; // JSON: email, sms, phone preferences

  @Column({ name: 'checkout_limit', type: 'integer', default: 10 })
  checkoutLimit: number;

  @Column({ name: 'hold_limit', type: 'integer', default: 5 })
  holdLimit: number;

  @Column({ name: 'renewal_limit', type: 'integer', default: 2 })
  renewalLimit: number;

  @Column({ name: 'fine_limit', type: 'decimal', precision: 10, scale: 2, default: 50.00 })
  fineLimit: number;

  @Column({ name: 'loan_period_days', type: 'integer', default: 21 })
  loanPeriodDays: number;

  @Column({ name: 'can_place_holds', default: true })
  canPlaceHolds: boolean;

  @Column({ name: 'can_renew_items', default: true })
  canRenewItems: boolean;

  @Column({ name: 'can_request_items', default: true })
  canRequestItems: boolean;

  @Column({ name: 'privacy_level', length: 20, default: 'standard' })
  privacyLevel: 'minimal' | 'standard' | 'enhanced';

  @Column({ name: 'last_activity_date', type: 'timestamp', nullable: true })
  lastActivityDate: Date;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'staff_notes', type: 'text', nullable: true })
  staffNotes: string;

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
  @OneToMany(() => Loan, loan => loan.patron)
  loans: Loan[];

  @OneToMany(() => Hold, hold => hold.patron)
  holds: Hold[];

  @OneToMany(() => Fine, fine => fine.patron)
  fines: Fine[];

  // Virtual properties
  get fullName(): string {
    const parts = [this.firstName];
    if (this.middleName) parts.push(this.middleName);
    parts.push(this.lastName);
    return parts.join(' ');
  }

  get displayName(): string {
    return `${this.lastName}, ${this.firstName}`;
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

  get isActive(): boolean {
    return this.status === 'active' && !this.isExpired;
  }

  get isExpired(): boolean {
    return this.expirationDate < new Date();
  }

  get canCheckout(): boolean {
    return this.isActive && 
           this.currentLoansCount < this.checkoutLimit &&
           this.totalFinesAmount < this.fineLimit;
  }

  get canPlaceHold(): boolean {
    return this.isActive && 
           this.canPlaceHolds && 
           this.currentHoldsCount < this.holdLimit;
  }

  get currentLoansCount(): number {
    return this.loans?.filter(loan => !loan.returnDate).length || 0;
  }

  get currentHoldsCount(): number {
    return this.holds?.filter(hold => hold.status === 'active').length || 0;
  }

  get totalFinesAmount(): number {
    return this.fines?.reduce((total, fine) => 
      total + (fine.status === 'unpaid' ? fine.amount : 0), 0) || 0;
  }

  get overdueLoansCount(): number {
    const now = new Date();
    return this.loans?.filter(loan => 
      !loan.returnDate && loan.dueDate < now
    ).length || 0;
  }

  get daysUntilExpiration(): number {
    const now = new Date();
    const diffTime = this.expirationDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  get age(): number {
    if (!this.dateOfBirth) return null;
    const now = new Date();
    const diffTime = now.getTime() - this.dateOfBirth.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365.25));
  }

  get notificationPreferencesObject(): any {
    if (!this.notificationPreferences) return {};
    try {
      return JSON.parse(this.notificationPreferences);
    } catch {
      return {};
    }
  }

  get isMinor(): boolean {
    return this.age !== null && this.age < 18;
  }

  get statusDescription(): string {
    switch (this.status) {
      case 'active': return this.isExpired ? 'Expired' : 'Active';
      case 'inactive': return 'Inactive';
      case 'suspended': return 'Suspended';
      case 'expired': return 'Expired';
      case 'blocked': return 'Blocked';
      default: return 'Unknown';
    }
  }
}
