import { Role } from './role.entity';
export declare class Permission {
    id: string;
    name: string;
    resource: string;
    action: string;
    description: string;
    roles: Role[];
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
