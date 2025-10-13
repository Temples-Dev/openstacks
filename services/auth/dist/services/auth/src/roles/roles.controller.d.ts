import { RolesService } from './roles.service';
export declare class RolesController {
    private readonly rolesService;
    constructor(rolesService: RolesService);
    findAllRoles(): Promise<import("./entities/role.entity").Role[]>;
    findRole(id: string): Promise<import("./entities/role.entity").Role>;
    createRole(roleData: any): Promise<import("./entities/role.entity").Role>;
    updateRole(id: string, updateData: any): Promise<import("./entities/role.entity").Role>;
    deleteRole(id: string): Promise<{
        success: boolean;
    }>;
    findAllPermissions(): Promise<import("./entities/permission.entity").Permission[]>;
    createPermission(permissionData: any): Promise<import("./entities/permission.entity").Permission>;
    assignPermissions(roleId: string, body: {
        permissionIds: string[];
    }): Promise<import("./entities/role.entity").Role>;
}
