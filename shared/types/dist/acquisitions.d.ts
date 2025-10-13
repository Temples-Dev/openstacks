import { BaseEntity, Address, ContactInfo } from './common';
export interface Vendor extends BaseEntity {
    name: string;
    code: string;
    type: VendorType;
    status: VendorStatus;
    contactInfo: ContactInfo;
    address: Address;
    paymentTerms?: string;
    discountPercent?: number;
    taxId?: string;
    accountNumber?: string;
    notes?: string;
    contracts: VendorContract[];
}
export declare enum VendorType {
    BOOK_VENDOR = "book_vendor",
    SERIAL_VENDOR = "serial_vendor",
    ELECTRONIC_VENDOR = "electronic_vendor",
    EQUIPMENT_VENDOR = "equipment_vendor",
    SERVICE_PROVIDER = "service_provider",
    OTHER = "other"
}
export declare enum VendorStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
    SUSPENDED = "suspended",
    PENDING_APPROVAL = "pending_approval"
}
export interface VendorContract extends BaseEntity {
    vendorId: string;
    name: string;
    contractNumber?: string;
    startDate: Date;
    endDate?: Date;
    value?: number;
    currency: string;
    terms?: string;
    status: ContractStatus;
    documents?: string[];
}
export declare enum ContractStatus {
    DRAFT = "draft",
    ACTIVE = "active",
    EXPIRED = "expired",
    CANCELLED = "cancelled",
    RENEWED = "renewed"
}
export interface PurchaseRequest extends BaseEntity {
    requestedBy: string;
    title: string;
    author?: string;
    isbn?: string;
    publisher?: string;
    publicationYear?: number;
    format: string;
    quantity: number;
    estimatedPrice?: number;
    currency: string;
    urgency: RequestUrgency;
    justification?: string;
    fund?: string;
    status: RequestStatus;
    approvals: Approval[];
    notes?: string;
}
export declare enum RequestUrgency {
    LOW = "low",
    NORMAL = "normal",
    HIGH = "high",
    URGENT = "urgent"
}
export declare enum RequestStatus {
    SUBMITTED = "submitted",
    UNDER_REVIEW = "under_review",
    APPROVED = "approved",
    REJECTED = "rejected",
    ORDERED = "ordered",
    RECEIVED = "received",
    CANCELLED = "cancelled"
}
export interface Approval extends BaseEntity {
    requestId: string;
    approvedBy: string;
    approvedAt: Date;
    level: number;
    status: ApprovalStatus;
    comments?: string;
}
export declare enum ApprovalStatus {
    PENDING = "pending",
    APPROVED = "approved",
    REJECTED = "rejected",
    DELEGATED = "delegated"
}
export interface PurchaseOrder extends BaseEntity {
    orderNumber: string;
    vendorId: string;
    orderDate: Date;
    expectedDeliveryDate?: Date;
    status: OrderStatus;
    currency: string;
    subtotal: number;
    taxAmount: number;
    shippingAmount: number;
    discountAmount: number;
    totalAmount: number;
    paymentTerms?: string;
    shippingAddress: Address;
    billingAddress: Address;
    orderLines: OrderLine[];
    notes?: string;
    createdBy: string;
}
export declare enum OrderStatus {
    DRAFT = "draft",
    SENT = "sent",
    ACKNOWLEDGED = "acknowledged",
    PARTIALLY_RECEIVED = "partially_received",
    RECEIVED = "received",
    CANCELLED = "cancelled",
    CLOSED = "closed"
}
export interface OrderLine extends BaseEntity {
    purchaseOrderId: string;
    lineNumber: number;
    title: string;
    author?: string;
    isbn?: string;
    quantity: number;
    unitPrice: number;
    discountPercent?: number;
    totalPrice: number;
    fund?: string;
    notes?: string;
    receivingHistory: ReceivingRecord[];
}
export interface ReceivingRecord extends BaseEntity {
    orderLineId: string;
    quantityReceived: number;
    receivedDate: Date;
    receivedBy: string;
    condition: string;
    notes?: string;
    invoiceId?: string;
}
export interface Invoice extends BaseEntity {
    invoiceNumber: string;
    vendorId: string;
    purchaseOrderId?: string;
    invoiceDate: Date;
    dueDate?: Date;
    status: InvoiceStatus;
    currency: string;
    subtotal: number;
    taxAmount: number;
    totalAmount: number;
    paidAmount: number;
    balanceAmount: number;
    paymentTerms?: string;
    invoiceLines: InvoiceLine[];
    payments: InvoicePayment[];
    notes?: string;
}
export declare enum InvoiceStatus {
    RECEIVED = "received",
    UNDER_REVIEW = "under_review",
    APPROVED = "approved",
    PAID = "paid",
    PARTIALLY_PAID = "partially_paid",
    OVERDUE = "overdue",
    DISPUTED = "disputed",
    CANCELLED = "cancelled"
}
export interface InvoiceLine extends BaseEntity {
    invoiceId: string;
    orderLineId?: string;
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    fund?: string;
}
export interface InvoicePayment extends BaseEntity {
    invoiceId: string;
    paymentDate: Date;
    amount: number;
    method: string;
    reference?: string;
    processedBy: string;
    notes?: string;
}
export interface Fund extends BaseEntity {
    code: string;
    name: string;
    description?: string;
    fiscalYear: string;
    budgetAmount: number;
    allocatedAmount: number;
    expendedAmount: number;
    encumberedAmount: number;
    availableAmount: number;
    currency: string;
    status: FundStatus;
    parentFundId?: string;
    restrictions?: string;
}
export declare enum FundStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
    FROZEN = "frozen",
    CLOSED = "closed"
}
export interface BudgetTransaction extends BaseEntity {
    fundId: string;
    type: TransactionType;
    amount: number;
    description: string;
    reference?: string;
    fiscalYear: string;
    transactionDate: Date;
    createdBy: string;
}
export declare enum TransactionType {
    ALLOCATION = "allocation",
    ENCUMBRANCE = "encumbrance",
    EXPENDITURE = "expenditure",
    PAYMENT = "payment",
    CREDIT = "credit",
    TRANSFER = "transfer"
}
export interface Subscription extends BaseEntity {
    title: string;
    vendorId: string;
    subscriptionId?: string;
    startDate: Date;
    endDate: Date;
    status: SubscriptionStatus;
    renewalType: RenewalType;
    cost: number;
    currency: string;
    fund?: string;
    notes?: string;
    renewalHistory: SubscriptionRenewal[];
}
export declare enum SubscriptionStatus {
    ACTIVE = "active",
    EXPIRED = "expired",
    CANCELLED = "cancelled",
    ON_HOLD = "on_hold"
}
export declare enum RenewalType {
    AUTOMATIC = "automatic",
    MANUAL = "manual",
    NOTIFICATION_ONLY = "notification_only"
}
export interface SubscriptionRenewal extends BaseEntity {
    subscriptionId: string;
    renewedFrom: Date;
    renewedTo: Date;
    cost: number;
    renewedBy: string;
    renewedAt: Date;
    notes?: string;
}
//# sourceMappingURL=acquisitions.d.ts.map