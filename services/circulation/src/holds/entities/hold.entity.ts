import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Patron } from '../../patrons/entities/patron.entity';

@Entity('holds')
@Index(['patron', 'status'])
@Index(['catalogRecordId', 'status'])
@Index(['itemBarcode', 'status'])
@Index(['holdDate'])
@Index(['expirationDate'])
export class Hold {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'catalog_record_id', length: 36 })
  @Index()
  catalogRecordId: string;

  @Column({ name: 'item_barcode', length: 50, nullable: true })
  @Index()
  itemBarcode: string; // Specific item hold (optional)

  @Column({ name: 'item_id', length: 36, nullable: true })
  itemId: string;

  @Column({ name: 'hold_date', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  @Index()
  holdDate: Date;

  @Column({ name: 'expiration_date', type: 'timestamp' })
  @Index()
  expirationDate: Date;

  @Column({ name: 'pickup_date', type: 'timestamp', nullable: true })
  pickupDate: Date;

  @Column({ name: 'filled_date', type: 'timestamp', nullable: true })
  filledDate: Date;

  @Column({ name: 'cancelled_date', type: 'timestamp', nullable: true })
  cancelledDate: Date;

  @Column({ length: 20, default: 'active' })
  @Index()
  status: 'active' | 'filled' | 'picked_up' | 'expired' | 'cancelled' | 'in_transit' | 'available';

  @Column({ name: 'hold_type', length: 20, default: 'title' })
  holdType: 'title' | 'item' | 'recall' | 'course_reserve';

  @Column({ name: 'priority', type: 'integer', default: 1 })
  @Index()
  priority: number; // 1 = highest priority

  @Column({ name: 'queue_position', type: 'integer', default: 1 })
  queuePosition: number;

  @Column({ name: 'pickup_library', length: 50 })
  @Index()
  pickupLibrary: string;

  @Column({ name: 'hold_library', length: 50, nullable: true })
  holdLibrary: string; // Library where hold was placed

  @Column({ name: 'notification_method', length: 20, default: 'email' })
  notificationMethod: 'email' | 'phone' | 'sms' | 'none';

  @Column({ name: 'notification_sent', default: false })
  notificationSent: boolean;

  @Column({ name: 'notification_date', type: 'timestamp', nullable: true })
  notificationDate: Date;

  @Column({ name: 'pickup_deadline', type: 'timestamp', nullable: true })
  pickupDeadline: Date;

  @Column({ name: 'suspend_until', type: 'timestamp', nullable: true })
  suspendUntil: Date;

  @Column({ name: 'is_suspended', default: false })
  @Index()
  isSuspended: boolean;

  @Column({ name: 'suspend_reason', length: 100, nullable: true })
  suspendReason: string;

  @Column({ name: 'cancellation_reason', length: 100, nullable: true })
  cancellationReason: string;

  @Column({ name: 'staff_notes', type: 'text', nullable: true })
  staffNotes: string;

  @Column({ name: 'patron_notes', type: 'text', nullable: true })
  patronNotes: string;

  @Column({ name: 'placed_by_staff', length: 100, nullable: true })
  placedByStaff: string;

  @Column({ name: 'filled_by_staff', length: 100, nullable: true })
  filledByStaff: string;

  @Column({ name: 'cancelled_by_staff', length: 100, nullable: true })
  cancelledByStaff: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  // Relations
  @ManyToOne(() => Patron, patron => patron.holds, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'patron_id' })
  patron: Patron;

  // Virtual properties
  get isActive(): boolean {
    return this.status === 'active' && !this.isExpired && !this.isSuspended;
  }

  get isExpired(): boolean {
    return new Date() > this.expirationDate;
  }

  get isAvailableForPickup(): boolean {
    return this.status === 'available' && !this.isExpired;
  }

  get isPastPickupDeadline(): boolean {
    return this.pickupDeadline && new Date() > this.pickupDeadline;
  }

  get daysInQueue(): number {
    const now = new Date();
    const diffTime = now.getTime() - this.holdDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  get daysUntilExpiration(): number {
    const now = new Date();
    const diffTime = this.expirationDate.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }

  get daysUntilPickupDeadline(): number {
    if (!this.pickupDeadline) return null;
    const now = new Date();
    const diffTime = this.pickupDeadline.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }

  get estimatedWaitTime(): string {
    // Rough estimation based on queue position and average loan period
    const avgLoanPeriod = 21; // days
    const estimatedDays = (this.queuePosition - 1) * avgLoanPeriod;
    
    if (estimatedDays <= 7) return 'Less than 1 week';
    if (estimatedDays <= 14) return '1-2 weeks';
    if (estimatedDays <= 30) return '2-4 weeks';
    if (estimatedDays <= 60) return '1-2 months';
    return 'More than 2 months';
  }

  get statusDescription(): string {
    switch (this.status) {
      case 'active':
        if (this.isSuspended) return `Suspended until ${this.suspendUntil?.toLocaleDateString()}`;
        return `In queue (position ${this.queuePosition})`;
      case 'filled':
        return 'Being prepared for pickup';
      case 'available':
        return `Available for pickup${this.pickupDeadline ? ` until ${this.pickupDeadline.toLocaleDateString()}` : ''}`;
      case 'picked_up':
        return `Picked up on ${this.pickupDate?.toLocaleDateString()}`;
      case 'expired':
        return 'Expired';
      case 'cancelled':
        return `Cancelled${this.cancellationReason ? ` - ${this.cancellationReason}` : ''}`;
      case 'in_transit':
        return 'In transit to pickup library';
      default:
        return this.status;
    }
  }

  get canBeCancelled(): boolean {
    return ['active', 'filled', 'available', 'in_transit'].includes(this.status);
  }

  get canBeSuspended(): boolean {
    return this.status === 'active' && !this.isSuspended;
  }

  get canBeReactivated(): boolean {
    return this.isSuspended && (!this.suspendUntil || new Date() >= this.suspendUntil);
  }

  get needsNotification(): boolean {
    return this.status === 'available' && !this.notificationSent;
  }

  get isOverdueForPickup(): boolean {
    return this.status === 'available' && this.isPastPickupDeadline;
  }

  get holdAge(): string {
    const days = this.daysInQueue;
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days <= 7) return `${days} days ago`;
    if (days <= 30) return `${Math.ceil(days / 7)} weeks ago`;
    return `${Math.ceil(days / 30)} months ago`;
  }
}
