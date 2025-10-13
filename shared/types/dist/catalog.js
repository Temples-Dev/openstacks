"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccessPolicy = exports.AuthorityType = exports.ItemCondition = exports.ItemStatus = exports.MaterialFormat = exports.SubjectAuthority = exports.AuthorRole = void 0;
var AuthorRole;
(function (AuthorRole) {
    AuthorRole["AUTHOR"] = "author";
    AuthorRole["EDITOR"] = "editor";
    AuthorRole["TRANSLATOR"] = "translator";
    AuthorRole["ILLUSTRATOR"] = "illustrator";
    AuthorRole["CONTRIBUTOR"] = "contributor";
    AuthorRole["COMPILER"] = "compiler";
    AuthorRole["NARRATOR"] = "narrator";
})(AuthorRole || (exports.AuthorRole = AuthorRole = {}));
var SubjectAuthority;
(function (SubjectAuthority) {
    SubjectAuthority["LCSH"] = "lcsh";
    SubjectAuthority["MESH"] = "mesh";
    SubjectAuthority["FAST"] = "fast";
    SubjectAuthority["LOCAL"] = "local";
    SubjectAuthority["OTHER"] = "other";
})(SubjectAuthority || (exports.SubjectAuthority = SubjectAuthority = {}));
var MaterialFormat;
(function (MaterialFormat) {
    MaterialFormat["BOOK"] = "book";
    MaterialFormat["EBOOK"] = "ebook";
    MaterialFormat["JOURNAL"] = "journal";
    MaterialFormat["EJOURNAL"] = "ejournal";
    MaterialFormat["AUDIOBOOK"] = "audiobook";
    MaterialFormat["DVD"] = "dvd";
    MaterialFormat["CD"] = "cd";
    MaterialFormat["MAP"] = "map";
    MaterialFormat["MANUSCRIPT"] = "manuscript";
    MaterialFormat["THESIS"] = "thesis";
    MaterialFormat["DATASET"] = "dataset";
    MaterialFormat["SOFTWARE"] = "software";
    MaterialFormat["WEBSITE"] = "website";
    MaterialFormat["OTHER"] = "other";
})(MaterialFormat || (exports.MaterialFormat = MaterialFormat = {}));
var ItemStatus;
(function (ItemStatus) {
    ItemStatus["AVAILABLE"] = "available";
    ItemStatus["CHECKED_OUT"] = "checked_out";
    ItemStatus["ON_HOLD"] = "on_hold";
    ItemStatus["IN_TRANSIT"] = "in_transit";
    ItemStatus["MISSING"] = "missing";
    ItemStatus["LOST"] = "lost";
    ItemStatus["DAMAGED"] = "damaged";
    ItemStatus["WITHDRAWN"] = "withdrawn";
    ItemStatus["ON_ORDER"] = "on_order";
    ItemStatus["IN_PROCESSING"] = "in_processing";
})(ItemStatus || (exports.ItemStatus = ItemStatus = {}));
var ItemCondition;
(function (ItemCondition) {
    ItemCondition["NEW"] = "new";
    ItemCondition["GOOD"] = "good";
    ItemCondition["FAIR"] = "fair";
    ItemCondition["POOR"] = "poor";
    ItemCondition["DAMAGED"] = "damaged";
})(ItemCondition || (exports.ItemCondition = ItemCondition = {}));
var AuthorityType;
(function (AuthorityType) {
    AuthorityType["PERSONAL_NAME"] = "personal_name";
    AuthorityType["CORPORATE_NAME"] = "corporate_name";
    AuthorityType["GEOGRAPHIC_NAME"] = "geographic_name";
    AuthorityType["SUBJECT"] = "subject";
    AuthorityType["TITLE"] = "title";
    AuthorityType["GENRE"] = "genre";
})(AuthorityType || (exports.AuthorityType = AuthorityType = {}));
var AccessPolicy;
(function (AccessPolicy) {
    AccessPolicy["PUBLIC"] = "public";
    AccessPolicy["RESTRICTED"] = "restricted";
    AccessPolicy["PRIVATE"] = "private";
    AccessPolicy["EMBARGO"] = "embargo";
})(AccessPolicy || (exports.AccessPolicy = AccessPolicy = {}));
//# sourceMappingURL=catalog.js.map