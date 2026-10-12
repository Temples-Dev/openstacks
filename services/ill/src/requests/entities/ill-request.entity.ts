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
import { ILLPartner } from '../../partners/entities/ill-partner.entity';
import { ILLTransaction } from './ill-transaction.entity';

@Entity('ill_requests')
@Index(['requestNumber'], { unique: true })
@Index(['patronId', 'status'])
@Index(['requestingLibraryId', 'status'])
@Index(['lendingLibraryId', 'status'])
@Index(['createdAt'])
export class ILLRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 50 })
  requestNumber: string;

  @Column({
    type: 'enum',
    enum: ['pending', 'searching', 'located', 'requested', 'shipped', 'received', 'returned', 'cancelled', 'unfilled'],
    default: 'pending',
  })
  status: 'pending' | 'searching' | 'located' | 'requested' | 'shipped' | 'received' | 'returned' | 'cancelled' | 'unfilled';

  @Column({
    type: 'enum',
    enum: ['loan', 'copy', 'digital'],
    default: 'loan',
  })
  requestType: 'loan' | 'copy' | 'digital';

  @Column({
    type: 'enum',
    enum: ['normal', 'rush', 'urgent'],
    default: 'normal',
  })
  priority: 'normal' | 'rush' | 'urgent';

  // Patron Information
  @Column({ type: 'uuid' })
  patronId: string;

  @Column({ length: 255 })
  patronName: string;

  @Column({ length: 255 })
  patronEmail: string;

  @Column({ length: 50, nullable: true })
  patronBarcode: string;

  @Column({ length: 100, nullable: true })
  patronType: string;

  // Requesting Library Information
  @Column({ type: 'uuid' })
  requestingLibraryId: string;

  @Column({ length: 255 })
  requestingLibraryName: string;

  @Column({ length: 50 })
  requestingLibraryCode: string;

  // Lending Library Information (when found)
  @ManyToOne(() => ILLPartner, { nullable: true })
  @JoinColumn({ name: 'lendingPartnerId' })
  lendingPartner: ILLPartner;

  @Column({ type: 'uuid', nullable: true })
  lendingPartnerId: string;

  @Column({ length: 255, nullable: true })
  lendingLibraryName: string;

  @Column({ length: 50, nullable: true })
  lendingLibraryCode: string;

  // Item Details
  @Column('json')
  itemDetails: {
    title: string;
    author?: string;
    isbn?: string;
    issn?: string;
    oclcNumber?: string;
    doi?: string;
    pmid?: string;
    publisher?: string;
    publicationYear?: number;
    edition?: string;
    volume?: string;
    issue?: string;
    pages?: string;
    itemType: 'book' | 'article' | 'thesis' | 'media' | 'digital' | 'other';
    format?: 'physical' | 'digital' | 'microform';
    language?: string;
    subject?: string;
    notes?: string;
  };

  // Citation Information (for articles/chapters)
  @Column('json', { nullable: true })
  citationDetails: {
    journalTitle?: string;
    bookTitle?: string;
    chapterTitle?: string;
    articleTitle?: string;
    volume?: string;
    issue?: string;
    pages?: string;
    startPage?: string;
    endPage?: string;
    publicationDate?: string;
  };

  // Delivery Information
  @Column('json')
  deliveryInfo: {
    method: 'physical' | 'digital' | 'pickup' | 'mail';
    address?: {
      name: string;
      institution: string;
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
    email?: string;
    pickupLocation?: string;
    specialInstructions?: string;
  };

  // Routing and Attempts
  @Column('json')
  routing: {
    attempts: Array<{
      partnerId: string;
      partnerName: string;
      requestedAt: Date;
      respondedAt?: Date;
      response: 'pending' | 'filled' | 'unfilled' | 'conditional' | 'error';
      reason?: string;
      cost?: number;
      estimatedDelivery?: Date;
      conditions?: string;
    }>;
    currentAttempt?: number;
    maxAttempts: number;
    routingRules?: string[];
  };

  // Dates and Deadlines
  @Column({ type: 'date', nullable: true })
  neededBy: Date;

  @Column({ type: 'date', nullable: true })
  dueDate: Date;

  @Column({ type: 'date', nullable: true })
  shippedDate: Date;

  @Column({ type: 'date', nullable: true })
  receivedDate: Date;

  @Column({ type: 'date', nullable: true })
  returnedDate: Date;

  @Column({ type: 'date', nullable: true })
  cancelledDate: Date;

  // Cost and Billing
  @Column('json', { nullable: true })
  costInfo: {
    estimatedCost?: number;
    actualCost?: number;
    currency: string;
    costType: 'free' | 'reciprocal' | 'fee_based' | 'deposit_account';
    maxCost?: number;
    billingInfo?: {
      accountNumber?: string;
      billingAddress?: any;
      paymentMethod?: string;
    };
    invoiceNumber?: string;
    paidDate?: Date;
  };

  // Tracking Information
  @Column('json', { nullable: true })
  trackingInfo: {
    carrier?: string;
    trackingNumber?: string;
    trackingUrl?: string;
    estimatedDelivery?: Date;
    deliveryConfirmation?: boolean;
    signatureRequired?: boolean;
  };

  // Copyright and Licensing
  @Column('json', { nullable: true })
  copyrightInfo: {
    copyrightCompliant: boolean;
    ccgCompliant?: boolean;
    ccl?: boolean;
    copyrightNotice?: string;
    licenseTerms?: string;
    digitalRightsManagement?: boolean;
  };

  // Staff Notes and Communication
  @Column('json', { nullable: true })
  staffNotes: Array<{
    timestamp: Date;
    staffId: string;
    staffName: string;
    note: string;
    isPublic: boolean;
  }>;

  @Column('json', { nullable: true })
  patronCommunication: Array<{
    timestamp: Date;
    type: 'email' | 'phone' | 'sms' | 'system_message';
    subject?: string;
    message: string;
    sentBy: string;
    delivered: boolean;
  }>;

  // Quality and Performance Metrics
  @Column('json', { nullable: true })
  metrics: {
    requestToFillTime?: number; // hours
    requestToDeliveryTime?: number; // hours
    totalProcessingTime?: number; // hours
    patronSatisfactionRating?: number; // 1-5
    partnerResponseTime?: number; // hours
    costEffectiveness?: number;
  };

  @OneToMany(() => ILLTransaction, transaction => transaction.request)
  transactions: ILLTransaction[];

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
    return !['returned', 'cancelled', 'unfilled'].includes(this.status);
  }

  get isOverdue(): boolean {
    if (!this.dueDate || this.status !== 'received') return false;
    return new Date() > this.dueDate;
  }

  get isUrgent(): boolean {
    return this.priority === 'urgent' || this.priority === 'rush';
  }

  get daysOverdue(): number {
    if (!this.isOverdue) return 0;
    const now = new Date();
    const diffTime = now.getTime() - this.dueDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  get currentAttemptNumber(): number {
    return this.routing.currentAttempt || 0;
  }

  get hasMoreAttempts(): boolean {
    return this.currentAttemptNumber < this.routing.maxAttempts;
  }

  get lastAttempt(): any {
    const attempts = this.routing.attempts;
    return attempts.length > 0 ? attempts[attempts.length - 1] : null;
  }

  get estimatedCost(): number {
    return this.costInfo?.estimatedCost || 0;
  }

  get actualCost(): number {
    return this.costInfo?.actualCost || 0;
  }

  get isPaid(): boolean {
    return !!this.costInfo?.paidDate;
  }

  get statusDisplayName(): string {
    const statusMap = {
      pending: 'Pending Review',
      searching: 'Searching for Item',
      located: 'Item Located',
      requested: 'Request Sent',
      shipped: 'Item Shipped',
      received: 'Item Received',
      returned: 'Item Returned',
      cancelled: 'Request Cancelled',
      unfilled: 'Request Unfilled',
    };
    return statusMap[this.status] || this.status;
  }

  get priorityDisplayName(): string {
    const priorityMap = {
      normal: 'Normal',
      rush: 'Rush',
      urgent: 'Urgent',
    };
    return priorityMap[this.priority] || this.priority;
  }

  get requestTypeDisplayName(): string {
    const typeMap = {
      loan: 'Loan Request',
      copy: 'Copy Request',
      digital: 'Digital Delivery',
    };
    return typeMap[this.requestType] || this.requestType;
  }

  get itemTypeDisplayName(): string {
    const typeMap = {
      book: 'Book',
      article: 'Journal Article',
      thesis: 'Thesis/Dissertation',
      media: 'Media Item',
      digital: 'Digital Resource',
      other: 'Other',
    };
    return typeMap[this.itemDetails.itemType] || this.itemDetails.itemType;
  }

  get formattedTitle(): string {
    let title = this.itemDetails.title;
    if (this.citationDetails?.articleTitle) {
      title = this.citationDetails.articleTitle;
    } else if (this.citationDetails?.chapterTitle) {
      title = this.citationDetails.chapterTitle;
    }
    return title;
  }

  get formattedAuthor(): string {
    return this.itemDetails.author || 'Unknown Author';
  }

  get formattedCitation(): string {
    const item = this.itemDetails;
    const citation = this.citationDetails;
    
    let result = `${this.formattedAuthor}. ${this.formattedTitle}.`;
    
    if (citation?.journalTitle) {
      result += ` ${citation.journalTitle}`;
      if (citation.volume) result += ` ${citation.volume}`;
      if (citation.issue) result += `(${citation.issue})`;
      if (citation.pages) result += `: ${citation.pages}`;
    } else if (item.publisher) {
      result += ` ${item.publisher}`;
      if (item.publicationYear) result += `, ${item.publicationYear}`;
    }
    
    return result;
  }

  get processingTimeHours(): number {
    if (!this.metrics?.totalProcessingTime) return 0;
    return this.metrics.totalProcessingTime;
  }

  get processingTimeDays(): number {
    return Math.ceil(this.processingTimeHours / 24);
  }

  get ageInDays(): number {
    const now = new Date();
    const diffTime = now.getTime() - this.createdAt.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  get isExpedited(): boolean {
    return this.priority !== 'normal';
  }

  get hasTrackingInfo(): boolean {
    return !!this.trackingInfo?.trackingNumber;
  }

  get deliveryMethod(): string {
    return this.deliveryInfo.method;
  }

  get isDigitalDelivery(): boolean {
    return this.deliveryInfo.method === 'digital';
  }

  get isPhysicalDelivery(): boolean {
    return ['physical', 'pickup', 'mail'].includes(this.deliveryInfo.method);
  }

  get patronNotificationCount(): number {
    return this.patronCommunication?.length || 0;
  }

  get staffNoteCount(): number {
    return this.staffNotes?.length || 0;
  }

  get lastPatronCommunication(): any {
    const communications = this.patronCommunication;
    return communications && communications.length > 0 
      ? communications[communications.length - 1] 
      : null;
  }

  get lastStaffNote(): any {
    const notes = this.staffNotes;
    return notes && notes.length > 0 
      ? notes[notes.length - 1] 
      : null;
  }

  // Helper methods
  addStaffNote(staffId: string, staffName: string, note: string, isPublic: boolean = false): void {
    if (!this.staffNotes) this.staffNotes = [];
    
    this.staffNotes.push({
      timestamp: new Date(),
      staffId,
      staffName,
      note,
      isPublic,
    });
  }

  addPatronCommunication(
    type: 'email' | 'phone' | 'sms' | 'system_message',
    message: string,
    sentBy: string,
    subject?: string
  ): void {
    if (!this.patronCommunication) this.patronCommunication = [];
    
    this.patronCommunication.push({
      timestamp: new Date(),
      type,
      subject,
      message,
      sentBy,
      delivered: false, // Will be updated when delivery is confirmed
    });
  }

  addRoutingAttempt(partnerId: string, partnerName: string): void {
    this.routing.attempts.push({
      partnerId,
      partnerName,
      requestedAt: new Date(),
      response: 'pending',
    });
    
    this.routing.currentAttempt = this.routing.attempts.length;
  }

  updateRoutingAttempt(
    attemptIndex: number,
    response: 'filled' | 'unfilled' | 'conditional' | 'error',
    reason?: string,
    cost?: number,
    estimatedDelivery?: Date,
    conditions?: string
  ): void {
    if (attemptIndex >= 0 && attemptIndex < this.routing.attempts.length) {
      const attempt = this.routing.attempts[attemptIndex];
      attempt.respondedAt = new Date();
      attempt.response = response;
      if (reason) attempt.reason = reason;
      if (cost !== undefined) attempt.cost = cost;
      if (estimatedDelivery) attempt.estimatedDelivery = estimatedDelivery;
      if (conditions) attempt.conditions = conditions;
    }
  }

  calculateProcessingTime(): void {
    if (!this.metrics) this.metrics = {};
    
    const now = new Date();
    const startTime = this.createdAt.getTime();
    
    // Calculate total processing time
    this.metrics.totalProcessingTime = (now.getTime() - startTime) / (1000 * 60 * 60); // hours
    
    // Calculate request to fill time (when item is located/requested)
    if (['located', 'requested', 'shipped', 'received'].includes(this.status)) {
      const locatedAttempt = this.routing.attempts.find(a => a.response === 'filled');
      if (locatedAttempt) {
        this.metrics.requestToFillTime = 
          (locatedAttempt.respondedAt.getTime() - startTime) / (1000 * 60 * 60);
      }
    }
    
    // Calculate request to delivery time
    if (this.receivedDate) {
      this.metrics.requestToDeliveryTime = 
        (this.receivedDate.getTime() - startTime) / (1000 * 60 * 60);
    }
  }

  canBeCancelled(): boolean {
    return ['pending', 'searching', 'located', 'requested'].includes(this.status);
  }

  canBeReturned(): boolean {
    return this.status === 'received' && this.requestType === 'loan';
  }

  canBeRenewed(): boolean {
    return this.status === 'received' && 
           this.requestType === 'loan' && 
           !this.isOverdue &&
           this.dueDate &&
           new Date() < this.dueDate;
  }

  getNextAction(): string {
    switch (this.status) {
      case 'pending':
        return 'Review and begin search';
      case 'searching':
        return 'Continue partner search';
      case 'located':
        return 'Send request to lending library';
      case 'requested':
        return 'Wait for lending library response';
      case 'shipped':
        return 'Track shipment and prepare for receipt';
      case 'received':
        return this.isOverdue ? 'Process overdue return' : 'Monitor loan period';
      case 'returned':
        return 'Request completed';
      case 'cancelled':
        return 'Request cancelled';
      case 'unfilled':
        return 'Consider alternative sources';
      default:
        return 'Review status';
    }
  }
}
