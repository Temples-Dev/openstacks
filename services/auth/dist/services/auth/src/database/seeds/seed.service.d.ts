import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Role } from '../../roles/entities/role.entity';
import { Permission } from '../../roles/entities/permission.entity';
export declare class SeedService {
    private readonly userRepository;
    private readonly roleRepository;
    private readonly permissionRepository;
    private readonly logger;
    constructor(userRepository: Repository<User>, roleRepository: Repository<Role>, permissionRepository: Repository<Permission>);
    seed(): Promise<void>;
    private createPermissions;
    private createRoles;
    private createDefaultUsers;
}
