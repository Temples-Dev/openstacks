import { BaseEntity } from './common';

// Patron types
export interface Patron extends BaseEntity {
  barcode: string;
  userId?: string; // Link to auth service user
  patronType: PatronType;
  status: PatronStatus;
  expirationDate?: Date;
  registrationDate: Date;
  homeLibrary: string;
  statisticalCategory?: string;
  notes?: string;
  blocks: PatronBlock[];
  preferences: PatronPreferences;
}

export interface PatronType extends BaseEntity {
  name: string;
  description?: string;
  loanPolicies: LoanPolicy[];
  maxCheckouts: number;
  maxRenewals: number;
  maxHolds: number;
  loanPeriodDays: number;
  gracePeriodDays: number;
  isActive: boolean;
}

export enum PatronStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  BLOCKED = 'blocked',
  SUSPENDED = 'suspended',
  INACTIVE = 'inactive'
}

export interface PatronBlock extends BaseEntity {
  patronId: string;
  type: BlockType;
  reason: string;
  blockedBy: string;
  blockedAt: Date;
  expiresAt?: Date;
  isActive: boolean;
}

export enum BlockType {
  MANUAL = 'manual',
  OVERDUE = 'overdue',
  FINES = 'fines',
  LOST_ITEM = 'lost_item',
  DAMAGED_ITEM = 'damaged_item',
  EXPIRED_CARD = 'expired_card'
}

export interface PatronPreferences {
  holdNotificationMethod: NotificationMethod;
  overdueNotificationMethod: NotificationMethod;
  language: string;
  receivePromotionalEmails: boolean;
}

export enum NotificationMethod {
  EMAIL = 'email',
  SMS = 'sms',
  PHONE = 'phone',
  MAIL = 'mail',
  NONE = 'none'
}

// Loan and circulation
export interface Loan extends BaseEntity {
  patronId: string;
  itemId: string;
  checkoutDate: Date;
  dueDate: Date;
  returnDate?: Date;
  renewalCount: number;
  maxRenewals: number;
  status: LoanStatus;
  checkoutLibrary: string;
  renewalHistory: RenewalEvent[];
  notes?: string;
}

export enum LoanStatus {
  ACTIVE = 'active',
  RETURNED = 'returned',
  OVERDUE = 'overdue',
  LOST = 'lost',
  CLAIMED_RETURNED = 'claimed_returned'
}

export interface RenewalEvent {
  renewedAt: Date;
  renewedBy: string;
  previousDueDate: Date;
  newDueDate: Date;
  method: 'staff' | 'self_service' | 'automatic';
}

export interface LoanPolicy extends BaseEntity {
  name: string;
  description?: string;
  materialTypes: string[];
  patronTypes: string[];
  loanPeriodDays: number;
  maxRenewals: number;
  renewalPeriodDays: number;
  gracePeriodDays: number;
  finePolicy?: FinePolicy;
  isActive: boolean;
}

// Holds and reservations
export interface Hold extends BaseEntity {
  patronId: string;
  bibliographicRecordId?: string;
  itemId?: string;
  holdType: HoldType;
  status: HoldStatus;
  requestDate: Date;
  expirationDate?: Date;
  pickupLocation: string;
  queuePosition: number;
  notificationSent?: Date;
  holdShelfExpirationDate?: Date;
  notes?: string;
}

export enum HoldType {
  TITLE_LEVEL = 'title_level',
  ITEM_LEVEL = 'item_level',
  RECALL = 'recall'
}

export enum HoldStatus {
  PENDING = 'pending',
  AVAILABLE = 'available',
  IN_TRANSIT = 'in_transit',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
  FULFILLED = 'fulfilled'
}

// Fines and fees
export interface Fine extends BaseEntity {
  patronId: string;
  loanId?: string;
  itemId?: string;
  type: FineType;
  amount: number;
  balance: number;
  description: string;
  status: FineStatus;
  createdBy: string;
  payments: Payment[];
}

export enum FineType {
  OVERDUE = 'overdue',
  LOST_ITEM = 'lost_item',
  DAMAGED_ITEM = 'damaged_item',
  PROCESSING_FEE = 'processing_fee',
  REPLACEMENT_FEE = 'replacement_fee',
  MANUAL = 'manual'
}

export enum FineStatus {
  OPEN = 'open',
  PAID = 'paid',
  WAIVED = 'waived',
  TRANSFERRED = 'transferred',
  CANCELLED = 'cancelled'
}

export interface Payment extends BaseEntity {
  fineId: string;
  amount: number;
  method: PaymentMethod;
  transactionId?: string;
  processedBy: string;
  processedAt: Date;
  notes?: string;
}

export enum PaymentMethod {
  CASH = 'cash',
  CHECK = 'check',
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  ONLINE = 'online',
  WAIVER = 'waiver'
}

export interface FinePolicy extends BaseEntity {
  name: string;
  description?: string;
  overdueFinePer: 'day' | 'hour';
  overdueAmount: number;
  maxOverdueFine?: number;
  lostItemFee: number;
  lostItemProcessingFee: number;
  damagedItemFee: number;
  gracePeriodDays: number;
  isActive: boolean;
}

// Self-checkout and kiosk
export interface SelfCheckoutSession extends BaseEntity {
  patronBarcode?: string;
  kioskId: string;
  startTime: Date;
  endTime?: Date;
  transactions: SelfCheckoutTransaction[];
  status: 'active' | 'completed' | 'abandoned';
}

export interface SelfCheckoutTransaction {
  type: 'checkout' | 'checkin' | 'renewal';
  itemBarcode: string;
  timestamp: Date;
  success: boolean;
  errorMessage?: string;
}
