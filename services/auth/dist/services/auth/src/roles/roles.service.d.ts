import { Repository } from 'typeorm';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
export declare class RolesService {
    private readonly roleRepository;
    private readonly permissionRepository;
    constructor(roleRepository: Repository<Role>, permissionRepository: Repository<Permission>);
    findAllRoles(): Promise<Role[]>;
    findRole(id: string): Promise<Role>;
    createRole(roleData: Partial<Role>): Promise<Role>;
    updateRole(id: string, updateData: Partial<Role>): Promise<Role>;
    deleteRole(id: string): Promise<void>;
    findAllPermissions(): Promise<Permission[]>;
    findPermission(id: string): Promise<Permission>;
    createPermission(permissionData: Partial<Permission>): Promise<Permission>;
    assignPermissionsToRole(roleId: string, permissionIds: string[]): Promise<Role>;
}
