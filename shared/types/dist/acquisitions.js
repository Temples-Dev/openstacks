"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RenewalType = exports.SubscriptionStatus = exports.TransactionType = exports.FundStatus = exports.InvoiceStatus = exports.OrderStatus = exports.ApprovalStatus = exports.RequestStatus = exports.RequestUrgency = exports.ContractStatus = exports.VendorStatus = exports.VendorType = void 0;
var VendorType;
(function (VendorType) {
    VendorType["BOOK_VENDOR"] = "book_vendor";
    VendorType["SERIAL_VENDOR"] = "serial_vendor";
    VendorType["ELECTRONIC_VENDOR"] = "electronic_vendor";
    VendorType["EQUIPMENT_VENDOR"] = "equipment_vendor";
    VendorType["SERVICE_PROVIDER"] = "service_provider";
    VendorType["OTHER"] = "other";
})(VendorType || (exports.VendorType = VendorType = {}));
var VendorStatus;
(function (VendorStatus) {
    VendorStatus["ACTIVE"] = "active";
    VendorStatus["INACTIVE"] = "inactive";
    VendorStatus["SUSPENDED"] = "suspended";
    VendorStatus["PENDING_APPROVAL"] = "pending_approval";
})(VendorStatus || (exports.VendorStatus = VendorStatus = {}));
var ContractStatus;
(function (ContractStatus) {
    ContractStatus["DRAFT"] = "draft";
    ContractStatus["ACTIVE"] = "active";
    ContractStatus["EXPIRED"] = "expired";
    ContractStatus["CANCELLED"] = "cancelled";
    ContractStatus["RENEWED"] = "renewed";
})(ContractStatus || (exports.ContractStatus = ContractStatus = {}));
var RequestUrgency;
(function (RequestUrgency) {
    RequestUrgency["LOW"] = "low";
    RequestUrgency["NORMAL"] = "normal";
    RequestUrgency["HIGH"] = "high";
    RequestUrgency["URGENT"] = "urgent";
})(RequestUrgency || (exports.RequestUrgency = RequestUrgency = {}));
var RequestStatus;
(function (RequestStatus) {
    RequestStatus["SUBMITTED"] = "submitted";
    RequestStatus["UNDER_REVIEW"] = "under_review";
    RequestStatus["APPROVED"] = "approved";
    RequestStatus["REJECTED"] = "rejected";
    RequestStatus["ORDERED"] = "ordered";
    RequestStatus["RECEIVED"] = "received";
    RequestStatus["CANCELLED"] = "cancelled";
})(RequestStatus || (exports.RequestStatus = RequestStatus = {}));
var ApprovalStatus;
(function (ApprovalStatus) {
    ApprovalStatus["PENDING"] = "pending";
    ApprovalStatus["APPROVED"] = "approved";
    ApprovalStatus["REJECTED"] = "rejected";
    ApprovalStatus["DELEGATED"] = "delegated";
})(ApprovalStatus || (exports.ApprovalStatus = ApprovalStatus = {}));
var OrderStatus;
(function (OrderStatus) {
    OrderStatus["DRAFT"] = "draft";
    OrderStatus["SENT"] = "sent";
    OrderStatus["ACKNOWLEDGED"] = "acknowledged";
    OrderStatus["PARTIALLY_RECEIVED"] = "partially_received";
    OrderStatus["RECEIVED"] = "received";
    OrderStatus["CANCELLED"] = "cancelled";
    OrderStatus["CLOSED"] = "closed";
})(OrderStatus || (exports.OrderStatus = OrderStatus = {}));
var InvoiceStatus;
(function (InvoiceStatus) {
    InvoiceStatus["RECEIVED"] = "received";
    InvoiceStatus["UNDER_REVIEW"] = "under_review";
    InvoiceStatus["APPROVED"] = "approved";
    InvoiceStatus["PAID"] = "paid";
    InvoiceStatus["PARTIALLY_PAID"] = "partially_paid";
    InvoiceStatus["OVERDUE"] = "overdue";
    InvoiceStatus["DISPUTED"] = "disputed";
    InvoiceStatus["CANCELLED"] = "cancelled";
})(InvoiceStatus || (exports.InvoiceStatus = InvoiceStatus = {}));
var FundStatus;
(function (FundStatus) {
    FundStatus["ACTIVE"] = "active";
    FundStatus["INACTIVE"] = "inactive";
    FundStatus["FROZEN"] = "frozen";
    FundStatus["CLOSED"] = "closed";
})(FundStatus || (exports.FundStatus = FundStatus = {}));
var TransactionType;
(function (TransactionType) {
    TransactionType["ALLOCATION"] = "allocation";
    TransactionType["ENCUMBRANCE"] = "encumbrance";
    TransactionType["EXPENDITURE"] = "expenditure";
    TransactionType["PAYMENT"] = "payment";
    TransactionType["CREDIT"] = "credit";
    TransactionType["TRANSFER"] = "transfer";
})(TransactionType || (exports.TransactionType = TransactionType = {}));
var SubscriptionStatus;
(function (SubscriptionStatus) {
    SubscriptionStatus["ACTIVE"] = "active";
    SubscriptionStatus["EXPIRED"] = "expired";
    SubscriptionStatus["CANCELLED"] = "cancelled";
    SubscriptionStatus["ON_HOLD"] = "on_hold";
})(SubscriptionStatus || (exports.SubscriptionStatus = SubscriptionStatus = {}));
var RenewalType;
(function (RenewalType) {
    RenewalType["AUTOMATIC"] = "automatic";
    RenewalType["MANUAL"] = "manual";
    RenewalType["NOTIFICATION_ONLY"] = "notification_only";
})(RenewalType || (exports.RenewalType = RenewalType = {}));
//# sourceMappingURL=acquisitions.js.map