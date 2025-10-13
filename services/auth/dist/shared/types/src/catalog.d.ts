import { BaseEntity, FileUpload } from './common';
export interface BibliographicRecord extends BaseEntity {
    marcRecord?: MarcRecord;
    title: string;
    subtitle?: string;
    authors: Author[];
    subjects: Subject[];
    isbn?: string[];
    issn?: string[];
    doi?: string;
    publisher?: string;
    publicationYear?: number;
    language: string;
    format: MaterialFormat;
    description?: string;
    notes?: string;
    series?: string;
    edition?: string;
    physicalDescription?: string;
    contents?: string;
    summary?: string;
    targetAudience?: string;
    genre?: string[];
    keywords?: string[];
    callNumber?: string;
    deweyDecimal?: string;
    lcClassification?: string;
    holdings: Holding[];
}
export interface MarcRecord {
    leader: string;
    controlFields: ControlField[];
    dataFields: DataField[];
    rawMarc?: string;
}
export interface ControlField {
    tag: string;
    value: string;
}
export interface DataField {
    tag: string;
    indicator1: string;
    indicator2: string;
    subfields: Subfield[];
}
export interface Subfield {
    code: string;
    value: string;
}
export interface Author extends BaseEntity {
    name: string;
    firstName?: string;
    lastName?: string;
    middleName?: string;
    role: AuthorRole;
    viafId?: string;
    orcidId?: string;
    biography?: string;
}
export declare enum AuthorRole {
    AUTHOR = "author",
    EDITOR = "editor",
    TRANSLATOR = "translator",
    ILLUSTRATOR = "illustrator",
    CONTRIBUTOR = "contributor",
    COMPILER = "compiler",
    NARRATOR = "narrator"
}
export interface Subject extends BaseEntity {
    heading: string;
    authority: SubjectAuthority;
    authorityId?: string;
    subdivisions?: string[];
}
export declare enum SubjectAuthority {
    LCSH = "lcsh",
    MESH = "mesh",
    FAST = "fast",
    LOCAL = "local",
    OTHER = "other"
}
export declare enum MaterialFormat {
    BOOK = "book",
    EBOOK = "ebook",
    JOURNAL = "journal",
    EJOURNAL = "ejournal",
    AUDIOBOOK = "audiobook",
    DVD = "dvd",
    CD = "cd",
    MAP = "map",
    MANUSCRIPT = "manuscript",
    THESIS = "thesis",
    DATASET = "dataset",
    SOFTWARE = "software",
    WEBSITE = "website",
    OTHER = "other"
}
export interface Holding extends BaseEntity {
    bibliographicRecordId: string;
    locationId: string;
    callNumber: string;
    summary?: string;
    notes?: string;
    items: Item[];
}
export interface Item extends BaseEntity {
    holdingId: string;
    barcode: string;
    status: ItemStatus;
    condition: ItemCondition;
    location: Location;
    price?: number;
    acquisitionDate?: Date;
    lastInventoryDate?: Date;
    notes?: string;
    internalNote?: string;
    rfidTag?: string;
}
export declare enum ItemStatus {
    AVAILABLE = "available",
    CHECKED_OUT = "checked_out",
    ON_HOLD = "on_hold",
    IN_TRANSIT = "in_transit",
    MISSING = "missing",
    LOST = "lost",
    DAMAGED = "damaged",
    WITHDRAWN = "withdrawn",
    ON_ORDER = "on_order",
    IN_PROCESSING = "in_processing"
}
export declare enum ItemCondition {
    NEW = "new",
    GOOD = "good",
    FAIR = "fair",
    POOR = "poor",
    DAMAGED = "damaged"
}
export interface Location extends BaseEntity {
    code: string;
    name: string;
    description?: string;
    parentLocationId?: string;
    isActive: boolean;
    sortOrder?: number;
}
export interface AuthorityRecord extends BaseEntity {
    heading: string;
    authorityType: AuthorityType;
    authoritySource: string;
    authorityId?: string;
    seeAlso?: string[];
    useFor?: string[];
    notes?: string;
}
export declare enum AuthorityType {
    PERSONAL_NAME = "personal_name",
    CORPORATE_NAME = "corporate_name",
    GEOGRAPHIC_NAME = "geographic_name",
    SUBJECT = "subject",
    TITLE = "title",
    GENRE = "genre"
}
export interface DigitalAsset extends BaseEntity {
    bibliographicRecordId?: string;
    title: string;
    description?: string;
    file: FileUpload;
    thumbnail?: FileUpload;
    mimeType: string;
    fileSize: number;
    checksum: string;
    accessPolicy: AccessPolicy;
    preservationMetadata?: PreservationMetadata;
}
export declare enum AccessPolicy {
    PUBLIC = "public",
    RESTRICTED = "restricted",
    PRIVATE = "private",
    EMBARGO = "embargo"
}
export interface PreservationMetadata {
    formatVersion?: string;
    creatingApplication?: string;
    fixityChecks: FixityCheck[];
    migrationHistory?: MigrationEvent[];
}
export interface FixityCheck {
    algorithm: string;
    checksum: string;
    checkedAt: Date;
    status: 'valid' | 'invalid' | 'error';
}
export interface MigrationEvent {
    fromFormat: string;
    toFormat: string;
    migratedAt: Date;
    tool: string;
    notes?: string;
}
