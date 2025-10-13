import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { HealthCheckResponse } from '@shellnexa/types';
export declare class HealthService {
    private readonly userRepository;
    private readonly startTime;
    constructor(userRepository: Repository<User>);
    check(): Promise<HealthCheckResponse>;
    isReady(): Promise<boolean>;
    private checkServices;
    private checkDatabase;
}
