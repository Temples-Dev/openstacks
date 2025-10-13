"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var SeedService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeedService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = require("bcrypt");
const user_entity_1 = require("../../users/entities/user.entity");
const role_entity_1 = require("../../roles/entities/role.entity");
const permission_entity_1 = require("../../roles/entities/permission.entity");
let SeedService = SeedService_1 = class SeedService {
    userRepository;
    roleRepository;
    permissionRepository;
    logger = new common_1.Logger(SeedService_1.name);
    constructor(userRepository, roleRepository, permissionRepository) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.permissionRepository = permissionRepository;
    }
    async seed() {
        this.logger.log('Starting database seeding...');
        try {
            await this.createPermissions();
            await this.createRoles();
            await this.createDefaultUsers();
            this.logger.log('Database seeding completed successfully');
        }
        catch (error) {
            this.logger.error('Database seeding failed:', error);
            throw error;
        }
    }
    async createPermissions() {
        this.logger.log('Creating permissions...');
        const permissions = [
            { name: 'users:read', resource: 'users', action: 'read', description: 'View users' },
            { name: 'users:create', resource: 'users', action: 'create', description: 'Create users' },
            { name: 'users:update', resource: 'users', action: 'update', description: 'Update users' },
            { name: 'users:delete', resource: 'users', action: 'delete', description: 'Delete users' },
            { name: 'users:activate', resource: 'users', action: 'activate', description: 'Activate/deactivate users' },
            { name: 'roles:read', resource: 'roles', action: 'read', description: 'View roles' },
            { name: 'roles:create', resource: 'roles', action: 'create', description: 'Create roles' },
            { name: 'roles:update', resource: 'roles', action: 'update', description: 'Update roles' },
            { name: 'roles:delete', resource: 'roles', action: 'delete', description: 'Delete roles' },
            { name: 'catalog:read', resource: 'catalog', action: 'read', description: 'View catalog records' },
            { name: 'catalog:create', resource: 'catalog', action: 'create', description: 'Create catalog records' },
            { name: 'catalog:update', resource: 'catalog', action: 'update', description: 'Update catalog records' },
            { name: 'catalog:delete', resource: 'catalog', action: 'delete', description: 'Delete catalog records' },
            { name: 'catalog:import', resource: 'catalog', action: 'import', description: 'Import MARC records' },
            { name: 'circulation:read', resource: 'circulation', action: 'read', description: 'View circulation data' },
            { name: 'circulation:checkout', resource: 'circulation', action: 'checkout', description: 'Check out items' },
            { name: 'circulation:checkin', resource: 'circulation', action: 'checkin', description: 'Check in items' },
            { name: 'circulation:renew', resource: 'circulation', action: 'renew', description: 'Renew items' },
            { name: 'circulation:holds', resource: 'circulation', action: 'holds', description: 'Manage holds' },
            { name: 'circulation:fines', resource: 'circulation', action: 'fines', description: 'Manage fines' },
            { name: 'acquisitions:read', resource: 'acquisitions', action: 'read', description: 'View acquisitions' },
            { name: 'acquisitions:create', resource: 'acquisitions', action: 'create', description: 'Create purchase orders' },
            { name: 'acquisitions:update', resource: 'acquisitions', action: 'update', description: 'Update acquisitions' },
            { name: 'acquisitions:approve', resource: 'acquisitions', action: 'approve', description: 'Approve purchases' },
            { name: 'reports:read', resource: 'reports', action: 'read', description: 'View reports' },
            { name: 'reports:create', resource: 'reports', action: 'create', description: 'Create reports' },
            { name: 'reports:export', resource: 'reports', action: 'export', description: 'Export reports' },
            { name: 'system:admin', resource: 'system', action: 'admin', description: 'System administration' },
            { name: 'system:config', resource: 'system', action: 'config', description: 'System configuration' },
        ];
        for (const permissionData of permissions) {
            const existingPermission = await this.permissionRepository.findOne({
                where: { name: permissionData.name },
            });
            if (!existingPermission) {
                const permission = this.permissionRepository.create(permissionData);
                await this.permissionRepository.save(permission);
                this.logger.log(`Created permission: ${permissionData.name}`);
            }
        }
    }
    async createRoles() {
        this.logger.log('Creating roles...');
        const allPermissions = await this.permissionRepository.find();
        const getPermissions = (names) => allPermissions.filter(p => names.includes(p.name));
        const roles = [
            {
                name: 'super_admin',
                description: 'Super Administrator with full system access',
                isSystemRole: true,
                permissions: allPermissions,
            },
            {
                name: 'admin',
                description: 'Administrator with most system access',
                isSystemRole: true,
                permissions: getPermissions([
                    'users:read', 'users:create', 'users:update', 'users:activate',
                    'roles:read', 'roles:create', 'roles:update',
                    'catalog:read', 'catalog:create', 'catalog:update', 'catalog:import',
                    'circulation:read', 'circulation:checkout', 'circulation:checkin', 'circulation:renew', 'circulation:holds', 'circulation:fines',
                    'acquisitions:read', 'acquisitions:create', 'acquisitions:update', 'acquisitions:approve',
                    'reports:read', 'reports:create', 'reports:export',
                    'system:config',
                ]),
            },
            {
                name: 'librarian',
                description: 'Librarian with catalog and circulation access',
                isSystemRole: true,
                permissions: getPermissions([
                    'catalog:read', 'catalog:create', 'catalog:update',
                    'circulation:read', 'circulation:checkout', 'circulation:checkin', 'circulation:renew', 'circulation:holds',
                    'acquisitions:read', 'acquisitions:create',
                    'reports:read',
                ]),
            },
            {
                name: 'circulation_staff',
                description: 'Circulation staff with patron and lending access',
                isSystemRole: true,
                permissions: getPermissions([
                    'catalog:read',
                    'circulation:read', 'circulation:checkout', 'circulation:checkin', 'circulation:renew', 'circulation:holds', 'circulation:fines',
                ]),
            },
            {
                name: 'cataloger',
                description: 'Cataloger with catalog management access',
                isSystemRole: true,
                permissions: getPermissions([
                    'catalog:read', 'catalog:create', 'catalog:update', 'catalog:import',
                ]),
            },
            {
                name: 'patron',
                description: 'Library patron with basic access',
                isSystemRole: true,
                permissions: getPermissions([
                    'catalog:read',
                ]),
            },
        ];
        for (const roleData of roles) {
            const existingRole = await this.roleRepository.findOne({
                where: { name: roleData.name },
                relations: ['permissions'],
            });
            if (!existingRole) {
                const role = this.roleRepository.create({
                    name: roleData.name,
                    description: roleData.description,
                    isSystemRole: roleData.isSystemRole,
                    permissions: roleData.permissions,
                });
                await this.roleRepository.save(role);
                this.logger.log(`Created role: ${roleData.name} with ${roleData.permissions.length} permissions`);
            }
            else {
                existingRole.permissions = roleData.permissions;
                await this.roleRepository.save(existingRole);
                this.logger.log(`Updated role: ${roleData.name} permissions`);
            }
        }
    }
    async createDefaultUsers() {
        this.logger.log('Creating default users...');
        const superAdminRole = await this.roleRepository.findOne({
            where: { name: 'super_admin' },
        });
        const adminRole = await this.roleRepository.findOne({
            where: { name: 'admin' },
        });
        const librarianRole = await this.roleRepository.findOne({
            where: { name: 'librarian' },
        });
        const users = [
            {
                username: 'admin',
                email: 'admin@shellnexa.com',
                password: 'Admin123!',
                firstName: 'System',
                lastName: 'Administrator',
                roles: [superAdminRole],
                isActive: true,
                emailVerified: true,
            },
            {
                username: 'librarian',
                email: 'librarian@shellnexa.com',
                password: 'Librarian123!',
                firstName: 'Jane',
                lastName: 'Librarian',
                roles: [librarianRole],
                isActive: true,
                emailVerified: true,
            },
            {
                username: 'demo',
                email: 'demo@shellnexa.com',
                password: 'Demo123!',
                firstName: 'Demo',
                lastName: 'User',
                roles: [adminRole],
                isActive: true,
                emailVerified: true,
            },
        ];
        for (const userData of users) {
            const existingUser = await this.userRepository.findOne({
                where: [
                    { username: userData.username },
                    { email: userData.email },
                ],
            });
            if (!existingUser) {
                const saltRounds = 12;
                const passwordHash = await bcrypt.hash(userData.password, saltRounds);
                const user = this.userRepository.create({
                    ...userData,
                    passwordHash,
                    roles: userData.roles,
                });
                await this.userRepository.save(user);
                this.logger.log(`Created user: ${userData.username} (${userData.email})`);
            }
            else {
                this.logger.log(`User already exists: ${userData.username}`);
            }
        }
    }
};
exports.SeedService = SeedService;
exports.SeedService = SeedService = SeedService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(role_entity_1.Role)),
    __param(2, (0, typeorm_1.InjectRepository)(permission_entity_1.Permission)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], SeedService);
//# sourceMappingURL=seed.service.js.map