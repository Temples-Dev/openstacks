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
import { Library } from './library.entity';

@Entity('branches')
@Index(['code', 'libraryId'], { unique: true })
@Index(['name'])
@Index(['status'])
export class Branch {
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
    enum: ['physical', 'mobile', 'kiosk', 'pickup_point', 'virtual'],
    default: 'physical',
  })
  branchType: 'physical' | 'mobile' | 'kiosk' | 'pickup_point' | 'virtual';

  @Column({
    type: 'enum',
    enum: ['active', 'inactive', 'temporarily_closed', 'seasonal'],
    default: 'active',
  })
  status: 'active' | 'inactive' | 'temporarily_closed' | 'seasonal';

  @ManyToOne(() => Library, library => library.branches)
  @JoinColumn({ name: 'libraryId' })
  library: Library;

  @Column({ type: 'uuid' })
  libraryId: string;

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
    deliveryInstructions?: string;
  };

  @Column('json')
  contactInfo: {
    phone: string;
    email: string;
    managerName?: string;
    managerEmail?: string;
  };

  @Column('json')
  operatingHours: Array<{
    dayOfWeek: number; // 0 = Sunday
    openTime: string; // HH:MM format
    closeTime: string; // HH:MM format
    isClosed: boolean;
  }>;

  @Column('json', { nullable: true })
  seasonalSchedule: {
    summerHours?: Array<{
      startDate: string; // YYYY-MM-DD
      endDate: string;
      schedule: Array<{
        dayOfWeek: number;
        openTime: string;
        closeTime: string;
        isClosed: boolean;
      }>;
    }>;
    holidayClosures?: Array<{
      date: string; // YYYY-MM-DD
      name: string;
      isClosed: boolean;
      alternateHours?: {
        openTime: string;
        closeTime: string;
      };
    }>;
  };

  @Column('json')
  services: Array<{
    serviceType: string;
    isAvailable: boolean;
    description?: string;
    limitations?: string[];
    staffRequired?: boolean;
    appointmentOnly?: boolean;
  }>;

  @Column('json')
  facilities: {
    totalArea?: number; // square feet
    seatingCapacity?: number;
    studySpaces?: number;
    computerStations?: number;
    printingStations?: number;
    parkingSpaces?: number;
    driveThrough?: boolean;
    accessibility: {
      wheelchairAccessible: boolean;
      automaticDoors: boolean;
      elevators: boolean;
      accessibleParking: boolean;
      accessibleRestrooms: boolean;
    };
    security: {
      securitySystem: boolean;
      cameras: boolean;
      alarmSystem: boolean;
      keypadEntry: boolean;
    };
    technology: {
      wifi: boolean;
      publicComputers: number;
      laptopCheckout: boolean;
      tabletCheckout: boolean;
      chargingStations: number;
    };
  };

  @Column('json')
  staffing: {
    totalStaff: number;
    fullTimeStaff: number;
    partTimeStaff: number;
    volunteers: number;
    managerPresent: boolean;
    librarianPresent: boolean;
    hoursStaffed: number; // hours per week
  };

  @Column('json')
  collections: {
    hasPhysicalCollection: boolean;
    totalItems?: number;
    popularMaterials?: string[];
    specialCollections?: Array<{
      name: string;
      type: string;
      itemCount: number;
    }>;
    holdShelf: {
      capacity: number;
      selfService: boolean;
      lockerSystem: boolean;
    };
  };

  @Column('json')
  equipment: Array<{
    type: string; // 'self_checkout', 'book_drop', 'copier', 'scanner', etc.
    model?: string;
    quantity: number;
    isOperational: boolean;
    lastMaintenance?: Date;
    notes?: string;
  }>;

  @Column('json')
  transportation: {
    publicTransit?: {
      busRoutes: string[];
      nearestStop: string;
      walkingDistance: number; // minutes
    };
    parking: {
      spaces: number;
      handicapSpaces: number;
      isFree: boolean;
      timeLimit?: number; // hours
    };
    bikeRacks?: {
      capacity: number;
      covered: boolean;
    };
  };

  @Column('json', { nullable: true })
  demographics: {
    serviceRadius: number; // miles
    primaryServiceArea: {
      neighborhoods: string[];
      zipCodes: string[];
    };
    patronDemographics?: {
      ageGroups: Record<string, number>;
      languages: Record<string, number>;
      educationLevels: Record<string, number>;
    };
  };

  @Column('json', { nullable: true })
  performance: {
    lastUpdated: Date;
    metrics: {
      dailyVisits: number;
      weeklyCirculation: number;
      computerUsage: number;
      programAttendance: number;
      holdPickups: number;
    };
    goals: {
      targetVisits: number;
      targetCirculation: number;
      targetPrograms: number;
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

  get isPhysical(): boolean {
    return this.branchType === 'physical';
  }

  get isMobile(): boolean {
    return this.branchType === 'mobile';
  }

  get isKiosk(): boolean {
    return this.branchType === 'kiosk';
  }

  get isPickupPoint(): boolean {
    return this.branchType === 'pickup_point';
  }

  get isVirtual(): boolean {
    return this.branchType === 'virtual';
  }

  get displayName(): string {
    return this.name || this.code;
  }

  get fullName(): string {
    return `${this.library?.name || 'Library'} - ${this.name}`;
  }

  get branchTypeDisplayName(): string {
    const typeMap = {
      physical: 'Physical Branch',
      mobile: 'Mobile Library',
      kiosk: 'Self-Service Kiosk',
      pickup_point: 'Pickup Point',
      virtual: 'Virtual Branch',
    };
    return typeMap[this.branchType] || this.branchType;
  }

  get statusDisplayName(): string {
    const statusMap = {
      active: 'Active',
      inactive: 'Inactive',
      temporarily_closed: 'Temporarily Closed',
      seasonal: 'Seasonal',
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

  get managerContact(): string {
    return this.contactInfo.managerEmail || this.contactInfo.email;
  }

  get totalStaffCount(): number {
    return this.staffing.totalStaff || 0;
  }

  get isFullyStaffed(): boolean {
    return this.staffing.managerPresent && this.staffing.librarianPresent;
  }

  get hasPhysicalCollection(): boolean {
    return this.collections.hasPhysicalCollection;
  }

  get totalCollectionSize(): number {
    return this.collections.totalItems || 0;
  }

  get holdShelfCapacity(): number {
    return this.collections.holdShelf.capacity || 0;
  }

  get hasSelfServiceHolds(): boolean {
    return this.collections.holdShelf.selfService;
  }

  get parkingSpaces(): number {
    return this.transportation.parking.spaces || 0;
  }

  get hasFreeParking(): boolean {
    return this.transportation.parking.isFree;
  }

  get isWheelchairAccessible(): boolean {
    return this.facilities.accessibility.wheelchairAccessible;
  }

  get hasWifi(): boolean {
    return this.facilities.technology.wifi;
  }

  get computerCount(): number {
    return this.facilities.technology.publicComputers || 0;
  }

  get chargingStationCount(): number {
    return this.facilities.technology.chargingStations || 0;
  }

  get hasDriveThrough(): boolean {
    return this.facilities.driveThrough || false;
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

  // Service helpers
  hasService(serviceType: string): boolean {
    return this.services.some(s => s.serviceType === serviceType && s.isAvailable);
  }

  getService(serviceType: string): any {
    return this.services.find(s => s.serviceType === serviceType);
  }

  get availableServices(): string[] {
    return this.services.filter(s => s.isAvailable).map(s => s.serviceType);
  }

  get staffRequiredServices(): string[] {
    return this.services
      .filter(s => s.isAvailable && s.staffRequired)
      .map(s => s.serviceType);
  }

  get selfServiceCapabilities(): string[] {
    return this.services
      .filter(s => s.isAvailable && !s.staffRequired)
      .map(s => s.serviceType);
  }

  // Equipment helpers
  hasEquipment(equipmentType: string): boolean {
    return this.equipment.some(e => e.type === equipmentType && e.isOperational);
  }

  getEquipment(equipmentType: string): any {
    return this.equipment.find(e => e.type === equipmentType);
  }

  get operationalEquipment(): string[] {
    return this.equipment.filter(e => e.isOperational).map(e => e.type);
  }

  get maintenanceNeeded(): any[] {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return this.equipment.filter(e => {
      if (!e.lastMaintenance) return true;
      return new Date(e.lastMaintenance) < thirtyDaysAgo;
    });
  }

  // Performance helpers
  get dailyVisitGoalMet(): boolean {
    if (!this.performance) return false;
    return this.performance.metrics.dailyVisits >= this.performance.goals.targetVisits;
  }

  get weeklyCirculationGoalMet(): boolean {
    if (!this.performance) return false;
    return this.performance.metrics.weeklyCirculation >= this.performance.goals.targetCirculation;
  }

  get overallPerformanceScore(): number {
    if (!this.performance) return 0;
    
    const metrics = this.performance.metrics;
    const goals = this.performance.goals;
    
    let score = 0;
    let factors = 0;
    
    if (goals.targetVisits > 0) {
      score += Math.min(100, (metrics.dailyVisits / goals.targetVisits) * 100);
      factors++;
    }
    
    if (goals.targetCirculation > 0) {
      score += Math.min(100, (metrics.weeklyCirculation / goals.targetCirculation) * 100);
      factors++;
    }
    
    if (goals.targetPrograms > 0) {
      score += Math.min(100, (metrics.programAttendance / goals.targetPrograms) * 100);
      factors++;
    }
    
    return factors > 0 ? score / factors : 0;
  }

  // Helper methods
  getHoursForDay(dayOfWeek: number): string {
    const dayHours = this.operatingHours.find(h => h.dayOfWeek === dayOfWeek);
    if (!dayHours || dayHours.isClosed) {
      return 'Closed';
    }
    return `${dayHours.openTime} - ${dayHours.closeTime}`;
  }

  isOpenOnDate(date: Date): boolean {
    // Check for holiday closures first
    const dateString = date.toISOString().split('T')[0];
    const holidayClosure = this.seasonalSchedule?.holidayClosures?.find(h => h.date === dateString);
    
    if (holidayClosure) {
      return !holidayClosure.isClosed;
    }
    
    // Check for seasonal hours
    const summerHours = this.seasonalSchedule?.summerHours?.find(s => 
      dateString >= s.startDate && dateString <= s.endDate
    );
    
    if (summerHours) {
      const dayOfWeek = date.getDay();
      const seasonalHours = summerHours.schedule.find(h => h.dayOfWeek === dayOfWeek);
      return seasonalHours ? !seasonalHours.isClosed : false;
    }
    
    // Use regular hours
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

  getServiceAreaInfo(): any {
    return {
      radius: this.demographics?.serviceRadius || 0,
      neighborhoods: this.demographics?.primaryServiceArea?.neighborhoods || [],
      zipCodes: this.demographics?.primaryServiceArea?.zipCodes || [],
    };
  }

  getTransportationOptions(): any {
    return {
      publicTransit: this.transportation.publicTransit || null,
      parking: this.transportation.parking,
      bikeRacks: this.transportation.bikeRacks || null,
    };
  }
}
