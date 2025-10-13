export interface ApiError {
    code: string;
    message: string;
    details?: any;
    field?: string;
}
export interface ValidationError extends ApiError {
    field: string;
    value?: any;
    constraint: string;
}
export interface ApiErrorResponse {
    success: false;
    errors: ApiError[];
    timestamp: string;
    path: string;
    method: string;
}
export interface HealthCheckResponse {
    status: 'ok' | 'error';
    timestamp: string;
    uptime: number;
    version: string;
    services: ServiceHealth[];
}
export interface ServiceHealth {
    name: string;
    status: 'healthy' | 'unhealthy' | 'degraded';
    responseTime?: number;
    lastChecked: string;
    details?: any;
}
export interface BatchRequest<T> {
    items: T[];
    options?: {
        continueOnError?: boolean;
        validateOnly?: boolean;
    };
}
export interface BatchResponse<T> {
    success: boolean;
    results: BatchResult<T>[];
    summary: {
        total: number;
        successful: number;
        failed: number;
    };
}
export interface BatchResult<T> {
    index: number;
    success: boolean;
    data?: T;
    errors?: ApiError[];
}
export interface FileUploadResponse {
    success: boolean;
    file: {
        id: string;
        filename: string;
        originalName: string;
        mimeType: string;
        size: number;
        url: string;
    };
}
export interface ExportRequest {
    format: 'csv' | 'excel' | 'json' | 'xml' | 'marc';
    filters?: Record<string, any>;
    fields?: string[];
    options?: Record<string, any>;
}
export interface ExportResponse {
    success: boolean;
    downloadUrl: string;
    filename: string;
    expiresAt: string;
}
export interface ImportRequest {
    format: 'csv' | 'excel' | 'json' | 'xml' | 'marc';
    fileUrl: string;
    options?: {
        skipValidation?: boolean;
        updateExisting?: boolean;
        mapping?: Record<string, string>;
    };
}
export interface ImportResponse {
    success: boolean;
    jobId: string;
    status: 'queued' | 'processing' | 'completed' | 'failed';
}
export interface ImportStatus {
    jobId: string;
    status: 'queued' | 'processing' | 'completed' | 'failed';
    progress: {
        total: number;
        processed: number;
        successful: number;
        failed: number;
    };
    startedAt?: string;
    completedAt?: string;
    errors?: ApiError[];
}
//# sourceMappingURL=api.d.ts.map