import { User } from '../../users/entities/user.entity';
export declare class Session {
    id: string;
    userId: string;
    token: string;
    refreshToken: string;
    expiresAt: Date;
    ipAddress: string;
    userAgent: string;
    isActive: boolean;
    user: User;
    createdAt: Date;
    updatedAt: Date;
}
