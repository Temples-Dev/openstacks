"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentMethod = exports.FineStatus = exports.FineType = exports.HoldStatus = exports.HoldType = exports.LoanStatus = exports.NotificationMethod = exports.BlockType = exports.PatronStatus = void 0;
var PatronStatus;
(function (PatronStatus) {
    PatronStatus["ACTIVE"] = "active";
    PatronStatus["EXPIRED"] = "expired";
    PatronStatus["BLOCKED"] = "blocked";
    PatronStatus["SUSPENDED"] = "suspended";
    PatronStatus["INACTIVE"] = "inactive";
})(PatronStatus || (exports.PatronStatus = PatronStatus = {}));
var BlockType;
(function (BlockType) {
    BlockType["MANUAL"] = "manual";
    BlockType["OVERDUE"] = "overdue";
    BlockType["FINES"] = "fines";
    BlockType["LOST_ITEM"] = "lost_item";
    BlockType["DAMAGED_ITEM"] = "damaged_item";
    BlockType["EXPIRED_CARD"] = "expired_card";
})(BlockType || (exports.BlockType = BlockType = {}));
var NotificationMethod;
(function (NotificationMethod) {
    NotificationMethod["EMAIL"] = "email";
    NotificationMethod["SMS"] = "sms";
    NotificationMethod["PHONE"] = "phone";
    NotificationMethod["MAIL"] = "mail";
    NotificationMethod["NONE"] = "none";
})(NotificationMethod || (exports.NotificationMethod = NotificationMethod = {}));
var LoanStatus;
(function (LoanStatus) {
    LoanStatus["ACTIVE"] = "active";
    LoanStatus["RETURNED"] = "returned";
    LoanStatus["OVERDUE"] = "overdue";
    LoanStatus["LOST"] = "lost";
    LoanStatus["CLAIMED_RETURNED"] = "claimed_returned";
})(LoanStatus || (exports.LoanStatus = LoanStatus = {}));
var HoldType;
(function (HoldType) {
    HoldType["TITLE_LEVEL"] = "title_level";
    HoldType["ITEM_LEVEL"] = "item_level";
    HoldType["RECALL"] = "recall";
})(HoldType || (exports.HoldType = HoldType = {}));
var HoldStatus;
(function (HoldStatus) {
    HoldStatus["PENDING"] = "pending";
    HoldStatus["AVAILABLE"] = "available";
    HoldStatus["IN_TRANSIT"] = "in_transit";
    HoldStatus["EXPIRED"] = "expired";
    HoldStatus["CANCELLED"] = "cancelled";
    HoldStatus["FULFILLED"] = "fulfilled";
})(HoldStatus || (exports.HoldStatus = HoldStatus = {}));
var FineType;
(function (FineType) {
    FineType["OVERDUE"] = "overdue";
    FineType["LOST_ITEM"] = "lost_item";
    FineType["DAMAGED_ITEM"] = "damaged_item";
    FineType["PROCESSING_FEE"] = "processing_fee";
    FineType["REPLACEMENT_FEE"] = "replacement_fee";
    FineType["MANUAL"] = "manual";
})(FineType || (exports.FineType = FineType = {}));
var FineStatus;
(function (FineStatus) {
    FineStatus["OPEN"] = "open";
    FineStatus["PAID"] = "paid";
    FineStatus["WAIVED"] = "waived";
    FineStatus["TRANSFERRED"] = "transferred";
    FineStatus["CANCELLED"] = "cancelled";
})(FineStatus || (exports.FineStatus = FineStatus = {}));
var PaymentMethod;
(function (PaymentMethod) {
    PaymentMethod["CASH"] = "cash";
    PaymentMethod["CHECK"] = "check";
    PaymentMethod["CREDIT_CARD"] = "credit_card";
    PaymentMethod["DEBIT_CARD"] = "debit_card";
    PaymentMethod["ONLINE"] = "online";
    PaymentMethod["WAIVER"] = "waiver";
})(PaymentMethod || (exports.PaymentMethod = PaymentMethod = {}));
//# sourceMappingURL=circulation.js.map