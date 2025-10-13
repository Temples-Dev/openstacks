import { HealthService } from './health.service';
import { HealthCheckResponse } from '@shellnexa/types';
export declare class HealthController {
    private readonly healthService;
    constructor(healthService: HealthService);
    check(): Promise<HealthCheckResponse>;
    ready(): Promise<{
        status: string;
    }>;
    live(): {
        status: string;
    };
}
