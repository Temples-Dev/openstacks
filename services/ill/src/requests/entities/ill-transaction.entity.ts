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
import { ILLRequest } from './ill-request.entity';

@Entity('ill_transactions')
@Index(['requestId', 'transactionType'])
@Index(['createdAt'])
export class ILLTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ILLRequest, request => request.transactions)
  @JoinColumn({ name: 'requestId' })
  request: ILLRequest;

  @Column({ type: 'uuid' })
  requestId: string;

  @Column({
    type: 'enum',
    enum: [
      'request_created',
      'search_initiated',
      'partner_contacted',
      'partner_responded',
      'item_located',
      'request_sent',
      'item_shipped',
      'item_received',
      'item_returned',
      'request_cancelled',
      'payment_processed',
      'renewal_requested',
      'renewal_approved',
      'renewal_denied',
      'overdue_notice',
      'status_updated',
      'note_added',
      'communication_sent'
    ],
  })
  transactionType: string;

  @Column({
    type: 'enum',
    enum: ['system', 'staff', 'patron', 'partner', 'automated'],
    default: 'system',
  })
  initiatedBy: 'system' | 'staff' | 'patron' | 'partner' | 'automated';

  @Column({ type: 'uuid', nullable: true })
  userId: string;

  @Column({ length: 255, nullable: true })
  userName: string;

  @Column({ type: 'text' })
  description: string;

  @Column('json', { nullable: true })
  transactionData: {
    previousStatus?: string;
    newStatus?: string;
    partnerId?: string;
    partnerName?: string;
    cost?: number;
    trackingNumber?: string;
    dueDate?: Date;
    notes?: string;
    metadata?: Record<string, any>;
  };

  @Column('json', { nullable: true })
  systemMetadata: {
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
    correlationId?: string;
    processingTime?: number;
    errorDetails?: any;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Virtual Properties
  get isSystemGenerated(): boolean {
    return this.initiatedBy === 'system' || this.initiatedBy === 'automated';
  }

  get isUserGenerated(): boolean {
    return ['staff', 'patron'].includes(this.initiatedBy);
  }

  get isPartnerGenerated(): boolean {
    return this.initiatedBy === 'partner';
  }

  get transactionTypeDisplayName(): string {
    const typeMap = {
      request_created: 'Request Created',
      search_initiated: 'Search Initiated',
      partner_contacted: 'Partner Contacted',
      partner_responded: 'Partner Responded',
      item_located: 'Item Located',
      request_sent: 'Request Sent to Partner',
      item_shipped: 'Item Shipped',
      item_received: 'Item Received',
      item_returned: 'Item Returned',
      request_cancelled: 'Request Cancelled',
      payment_processed: 'Payment Processed',
      renewal_requested: 'Renewal Requested',
      renewal_approved: 'Renewal Approved',
      renewal_denied: 'Renewal Denied',
      overdue_notice: 'Overdue Notice Sent',
      status_updated: 'Status Updated',
      note_added: 'Note Added',
      communication_sent: 'Communication Sent',
    };
    return typeMap[this.transactionType] || this.transactionType;
  }

  get initiatedByDisplayName(): string {
    const initiatorMap = {
      system: 'System',
      staff: 'Staff Member',
      patron: 'Patron',
      partner: 'Partner Library',
      automated: 'Automated Process',
    };
    return initiatorMap[this.initiatedBy] || this.initiatedBy;
  }

  get hasTransactionData(): boolean {
    return !!this.transactionData && Object.keys(this.transactionData).length > 0;
  }

  get formattedDescription(): string {
    let description = this.description;
    
    if (this.transactionData) {
      const data = this.transactionData;
      
      if (data.previousStatus && data.newStatus) {
        description += ` (${data.previousStatus} → ${data.newStatus})`;
      }
      
      if (data.partnerName) {
        description += ` - Partner: ${data.partnerName}`;
      }
      
      if (data.cost) {
        description += ` - Cost: $${data.cost.toFixed(2)}`;
      }
      
      if (data.trackingNumber) {
        description += ` - Tracking: ${data.trackingNumber}`;
      }
    }
    
    return description;
  }

  get ageInHours(): number {
    const now = new Date();
    const diffTime = now.getTime() - this.createdAt.getTime();
    return diffTime / (1000 * 60 * 60);
  }

  get ageInDays(): number {
    return Math.ceil(this.ageInHours / 24);
  }
}
