import { Role } from '../../roles/entities/role.entity';
import { Session } from '../../auth/entities/session.entity';
export declare class User {
    id: string;
    username: string;
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    isActive: boolean;
    emailVerified: boolean;
    lastLoginAt: Date;
    emailVerificationToken: string;
    passwordResetToken: string;
    passwordResetExpiresAt: Date;
    roles: Role[];
    sessions: Session[];
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
    get fullName(): string;
    get permissions(): string[];
}
