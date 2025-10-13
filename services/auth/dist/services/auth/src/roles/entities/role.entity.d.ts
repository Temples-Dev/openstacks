import { User } from '../../users/entities/user.entity';
import { Permission } from './permission.entity';
export declare class Role {
    id: string;
    name: string;
    description: string;
    isSystemRole: boolean;
    users: User[];
    permissions: Permission[];
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
