export interface BaseEntity {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export interface PaginationQuery {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}
export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    errors?: string[];
    timestamp: string;
}
export interface SearchQuery extends PaginationQuery {
    query?: string;
    filters?: Record<string, any>;
    facets?: string[];
}
export interface SearchResponse<T> extends PaginatedResponse<T> {
    facets?: Record<string, Array<{
        value: string;
        count: number;
    }>>;
    suggestions?: string[];
}
export interface AuditLog extends BaseEntity {
    userId?: string;
    action: string;
    entityType: string;
    entityId: string;
    oldValues?: Record<string, any>;
    newValues?: Record<string, any>;
    metadata?: Record<string, any>;
}
export interface FileUpload {
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    path: string;
    url?: string;
}
export interface Address {
    street1: string;
    street2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
}
export interface ContactInfo {
    email?: string;
    phone?: string;
    fax?: string;
    website?: string;
}
//# sourceMappingURL=common.d.ts.map