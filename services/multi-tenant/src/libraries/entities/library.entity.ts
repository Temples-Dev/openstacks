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
import { LibrarySystem } from '../../library-systems/entities/library-system.entity';
import { Branch } from './branch.entity';

@Entity('libraries')
@Index(['code', 'systemId'], { unique: true })
@Index(['name'])
@Index(['type'])
@Index(['status'])
export class Library {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50 })
  code: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ['main', 'branch', 'consortium_member', 'mobile', 'digital_only'],
    default: 'main',
  })
  type: 'main' | 'branch' | 'consortium_member' | 'mobile' | 'digital_only';

  @Column({
    type: 'enum',
    enum: ['active', 'inactive', 'temporarily_closed', 'under_renovation', 'planned'],
    default: 'active',
  })
  status: 'active' | 'inactive' | 'temporarily_closed' | 'under_renovation' | 'planned';

  @ManyToOne(() => LibrarySystem, system => system.libraries)
  @JoinColumn({ name: 'systemId' })
  system: LibrarySystem;

  @Column({ type: 'uuid' })
  systemId: string;

  @ManyToOne(() => Library, { nullable: true })
  @JoinColumn({ name: 'parentLibraryId' })
  parentLibrary: Library;

  @Column({ type: 'uuid', nullable: true })
  parentLibraryId: string;

  @OneToMany(() => Library, library => library.parentLibrary)
  childLibraries: Library[];

  @OneToMany(() => Branch, branch => branch.library)
  branches: Branch[];

  @Column('json')
  contactInfo: {
    phone: string;
    email: string;
    website?: string;
    socialMedia?: {
      facebook?: string;
      twitter?: string;
      instagram?: string;
      linkedin?: string;
    };
  };

  @Column('json')
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };

  @Column('json')
  operatingHours: Array<{
    dayOfWeek: number; // 0 = Sunday
    openTime: string; // HH:MM format
    closeTime: string; // HH:MM format
    isClosed: boolean;
  }>;

  @Column('json', { nullable: true })
  specialHours: Array<{
    date: string; // YYYY-MM-DD
    openTime?: string;
    closeTime?: string;
    isClosed: boolean;
    reason: string;
  }>;

  @Column('json')
  services: Array<{
    serviceType: string;
    isAvailable: boolean;
    description?: string;
    restrictions?: string[];
    schedule?: {
      days: number[];
      startTime: string;
      endTime: string;
    };
  }>;

  @Column('json')
  facilities: {
    totalArea?: number; // square feet
    seatingCapacity?: number;
    studyRooms?: number;
    meetingRooms?: number;
    computerStations?: number;
    parkingSpaces?: number;
    accessibility: {
      wheelchairAccessible: boolean;
      elevators: boolean;
      assistiveListening: boolean;
      brailleSignage: boolean;
      largeprint: boolean;
    };
    amenities: string[]; // wifi, cafe, children_area, etc.
  };

  @Column('json')
  staffing: {
    totalStaff: number;
    librarians: number;
    supportStaff: number;
    volunteers: number;
    hoursPerWeek: number;
  };

  @Column('json')
  collections: {
    totalItems?: number;
    books?: number;
    ebooks?: number;
    audiobooks?: number;
    dvds?: number;
    periodicals?: number;
    databases?: number;
    specialCollections?: Array<{
      name: string;
      type: string;
      itemCount: number;
      description?: string;
    }>;
  };

  @Column('json')
  demographics: {
    serviceArea: {
      population: number;
      households: number;
      squareMiles: number;
    };
    patronTypes: Array<{
      type: string;
      count: number;
      percentage: number;
    }>;
  };

  @Column('json')
  configuration: {
    circulation: {
      allowSelfCheckout: boolean;
      allowSelfRenewal: boolean;
      allowHoldPickup: boolean;
      requireIdForPickup: boolean;
      maxItemsOut: number;
      maxHolds: number;
    };
    catalog: {
      showAvailabilityOnly: boolean;
      allowPatronRequests: boolean;
      enableRecommendations: boolean;
      showNewItems: boolean;
    };
    digital: {
      enableEbooks: boolean;
      enableAudiobooks: boolean;
      enableStreaming: boolean;
      enableDatabases: boolean;
    };
    notifications: {
      overdueNotices: boolean;
      holdNotifications: boolean;
      eventReminders: boolean;
      newsletterOptIn: boolean;
    };
  };

  @Column('json', { nullable: true })
  budget: {
    fiscalYear: string;
    totalBudget: number;
    materialsbudget: number;
    staffBudget: number;
    operatingBudget: number;
    capitalBudget: number;
    grantFunding?: number;
    fundraising?: number;
  };

  @Column('json', { nullable: true })
  statistics: {
    lastUpdated: Date;
    annual: {
      circulation: number;
      visits: number;
      programAttendance: number;
      referenceQuestions: number;
      computerUse: number;
      wifiSessions: number;
    };
    monthly: Record<string, any>;
    weekly: Record<string, any>;
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

  get isMain(): boolean {
    return this.type === 'main';
  }

  get isBranch(): boolean {
    return this.type === 'branch';
  }

  get isConsortiumMember(): boolean {
    return this.type === 'consortium_member';
  }

  get hasParent(): boolean {
    return !!this.parentLibraryId;
  }

  get hasChildren(): boolean {
    return this.childLibraries && this.childLibraries.length > 0;
  }

  get branchCount(): number {
    return this.branches ? this.branches.length : 0;
  }

  get activeBranchCount(): number {
    return this.branches ? this.branches.filter(b => b.isActive).length : 0;
  }

  get displayName(): string {
    return this.name || this.code;
  }

  get fullName(): string {
    if (this.hasParent && this.parentLibrary) {
      return `${this.parentLibrary.name} - ${this.name}`;
    }
    return this.name;
  }

  get typeDisplayName(): string {
    const typeMap = {
      main: 'Main Library',
      branch: 'Branch Library',
      consortium_member: 'Consortium Member',
      mobile: 'Mobile Library',
      digital_only: 'Digital Only',
    };
    return typeMap[this.type] || this.type;
  }

  get statusDisplayName(): string {
    const statusMap = {
      active: 'Active',
      inactive: 'Inactive',
      temporarily_closed: 'Temporarily Closed',
      under_renovation: 'Under Renovation',
      planned: 'Planned',
    };
    return statusMap[this.status] || this.status;
  }

  get formattedAddress(): string {
    const addr = this.address;
    return `${addr.street}, ${addr.city}, ${addr.state} ${addr.zipCode}`;
  }

  get primaryPhone(): string {
    return this.contactInfo.phone;
  }

  get primaryEmail(): string {
    return this.contactInfo.email;
  }

  get websiteUrl(): string {
    return this.contactInfo.website || '';
  }

  get totalCollectionSize(): number {
    return this.collections.totalItems || 0;
  }

  get totalStaffCount(): number {
    return this.staffing.totalStaff || 0;
  }

  get servicePopulation(): number {
    return this.demographics.serviceArea.population || 0;
  }

  get annualCirculation(): number {
    return this.statistics?.annual?.circulation || 0;
  }

  get annualVisits(): number {
    return this.statistics?.annual?.visits || 0;
  }

  // Operating hours helpers
  get isOpenToday(): boolean {
    const today = new Date().getDay();
    const todayHours = this.operatingHours.find(h => h.dayOfWeek === today);
    return todayHours ? !todayHours.isClosed : false;
  }

  get todaysHours(): string {
    const today = new Date().getDay();
    const todayHours = this.operatingHours.find(h => h.dayOfWeek === today);
    
    if (!todayHours || todayHours.isClosed) {
      return 'Closed';
    }
    
    return `${todayHours.openTime} - ${todayHours.closeTime}`;
  }

  get isCurrentlyOpen(): boolean {
    if (!this.isOpenToday) return false;
    
    const now = new Date();
    const today = now.getDay();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
    
    const todayHours = this.operatingHours.find(h => h.dayOfWeek === today);
    if (!todayHours || todayHours.isClosed) return false;
    
    return currentTime >= todayHours.openTime && currentTime <= todayHours.closeTime;
  }

  // Service availability helpers
  hasService(serviceType: string): boolean {
    return this.services.some(s => s.serviceType === serviceType && s.isAvailable);
  }

  getService(serviceType: string): any {
    return this.services.find(s => s.serviceType === serviceType);
  }

  get availableServices(): string[] {
    return this.services.filter(s => s.isAvailable).map(s => s.serviceType);
  }

  // Facility helpers
  get isWheelchairAccessible(): boolean {
    return this.facilities.accessibility.wheelchairAccessible;
  }

  get hasWifi(): boolean {
    return this.facilities.amenities.includes('wifi');
  }

  get hasStudyRooms(): boolean {
    return (this.facilities.studyRooms || 0) > 0;
  }

  get hasMeetingRooms(): boolean {
    return (this.facilities.meetingRooms || 0) > 0;
  }

  get hasParking(): boolean {
    return (this.facilities.parkingSpaces || 0) > 0;
  }

  // Configuration helpers
  get allowsSelfCheckout(): boolean {
    return this.configuration.circulation.allowSelfCheckout;
  }

  get allowsSelfRenewal(): boolean {
    return this.configuration.circulation.allowSelfRenewal;
  }

  get enablesDigitalServices(): boolean {
    return this.configuration.digital.enableEbooks || 
           this.configuration.digital.enableAudiobooks ||
           this.configuration.digital.enableStreaming ||
           this.configuration.digital.enableDatabases;
  }

  // Statistics helpers
  get circulationPerCapita(): number {
    const population = this.servicePopulation;
    const circulation = this.annualCirculation;
    return population > 0 ? circulation / population : 0;
  }

  get visitsPerCapita(): number {
    const population = this.servicePopulation;
    const visits = this.annualVisits;
    return population > 0 ? visits / population : 0;
  }

  get itemsPerCapita(): number {
    const population = this.servicePopulation;
    const items = this.totalCollectionSize;
    return population > 0 ? items / population : 0;
  }

  // Budget helpers
  get totalBudgetAmount(): number {
    return this.budget?.totalBudget || 0;
  }

  get materialsPercentage(): number {
    const total = this.totalBudgetAmount;
    const materials = this.budget?.materialsbudget || 0;
    return total > 0 ? (materials / total) * 100 : 0;
  }

  get staffPercentage(): number {
    const total = this.totalBudgetAmount;
    const staff = this.budget?.staffBudget || 0;
    return total > 0 ? (staff / total) * 100 : 0;
  }

  // Helper methods
  getHoursForDay(dayOfWeek: number): string {
    const dayHours = this.operatingHours.find(h => h.dayOfWeek === dayOfWeek);
    if (!dayHours || dayHours.isClosed) {
      return 'Closed';
    }
    return `${dayHours.openTime} - ${dayHours.closeTime}`;
  }

  getSpecialHoursForDate(date: string): any {
    return this.specialHours?.find(h => h.date === date);
  }

  isOpenOnDate(date: Date): boolean {
    const dateString = date.toISOString().split('T')[0];
    const specialHours = this.getSpecialHoursForDate(dateString);
    
    if (specialHours) {
      return !specialHours.isClosed;
    }
    
    const dayOfWeek = date.getDay();
    const regularHours = this.operatingHours.find(h => h.dayOfWeek === dayOfWeek);
    return regularHours ? !regularHours.isClosed : false;
  }

  calculateDistance(latitude: number, longitude: number): number {
    if (!this.address.coordinates) return Infinity;
    
    const lat1 = this.address.coordinates.latitude;
    const lon1 = this.address.coordinates.longitude;
    const lat2 = latitude;
    const lon2 = longitude;
    
    // Haversine formula for distance calculation
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
}
