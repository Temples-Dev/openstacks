import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User } from '../../users/entities/user.entity';
import { Role } from '../../roles/entities/role.entity';
import { Permission } from '../../roles/entities/permission.entity';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  async seed() {
    this.logger.log('Starting database seeding...');

    try {
      // Create permissions first
      await this.createPermissions();
      
      // Create roles and assign permissions
      await this.createRoles();
      
      // Create default admin user
      await this.createDefaultUsers();

      this.logger.log('Database seeding completed successfully');
    } catch (error) {
      this.logger.error('Database seeding failed:', error);
      throw error;
    }
  }

  private async createPermissions() {
    this.logger.log('Creating permissions...');

    const permissions = [
      // User management
      { name: 'users:read', resource: 'users', action: 'read', description: 'View users' },
      { name: 'users:create', resource: 'users', action: 'create', description: 'Create users' },
      { name: 'users:update', resource: 'users', action: 'update', description: 'Update users' },
      { name: 'users:delete', resource: 'users', action: 'delete', description: 'Delete users' },
      { name: 'users:activate', resource: 'users', action: 'activate', description: 'Activate/deactivate users' },

      // Role management
      { name: 'roles:read', resource: 'roles', action: 'read', description: 'View roles' },
      { name: 'roles:create', resource: 'roles', action: 'create', description: 'Create roles' },
      { name: 'roles:update', resource: 'roles', action: 'update', description: 'Update roles' },
      { name: 'roles:delete', resource: 'roles', action: 'delete', description: 'Delete roles' },

      // Catalog management
      { name: 'catalog:read', resource: 'catalog', action: 'read', description: 'View catalog records' },
      { name: 'catalog:create', resource: 'catalog', action: 'create', description: 'Create catalog records' },
      { name: 'catalog:update', resource: 'catalog', action: 'update', description: 'Update catalog records' },
      { name: 'catalog:delete', resource: 'catalog', action: 'delete', description: 'Delete catalog records' },
      { name: 'catalog:import', resource: 'catalog', action: 'import', description: 'Import MARC records' },

      // Circulation management
      { name: 'circulation:read', resource: 'circulation', action: 'read', description: 'View circulation data' },
      { name: 'circulation:checkout', resource: 'circulation', action: 'checkout', description: 'Check out items' },
      { name: 'circulation:checkin', resource: 'circulation', action: 'checkin', description: 'Check in items' },
      { name: 'circulation:renew', resource: 'circulation', action: 'renew', description: 'Renew items' },
      { name: 'circulation:holds', resource: 'circulation', action: 'holds', description: 'Manage holds' },
      { name: 'circulation:fines', resource: 'circulation', action: 'fines', description: 'Manage fines' },

      // Acquisitions management
      { name: 'acquisitions:read', resource: 'acquisitions', action: 'read', description: 'View acquisitions' },
      { name: 'acquisitions:create', resource: 'acquisitions', action: 'create', description: 'Create purchase orders' },
      { name: 'acquisitions:update', resource: 'acquisitions', action: 'update', description: 'Update acquisitions' },
      { name: 'acquisitions:approve', resource: 'acquisitions', action: 'approve', description: 'Approve purchases' },

      // Reporting
      { name: 'reports:read', resource: 'reports', action: 'read', description: 'View reports' },
      { name: 'reports:create', resource: 'reports', action: 'create', description: 'Create reports' },
      { name: 'reports:export', resource: 'reports', action: 'export', description: 'Export reports' },

      // System administration
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

  private async createRoles() {
    this.logger.log('Creating roles...');

    // Get all permissions for role assignments
    const allPermissions = await this.permissionRepository.find();
    const getPermissions = (names: string[]) => 
      allPermissions.filter(p => names.includes(p.name));

    const roles = [
      {
        name: 'super_admin',
        description: 'Super Administrator with full system access',
        isSystemRole: true,
        permissions: allPermissions, // All permissions
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
      } else {
        // Update permissions if role exists
        existingRole.permissions = roleData.permissions;
        await this.roleRepository.save(existingRole);
        this.logger.log(`Updated role: ${roleData.name} permissions`);
      }
    }
  }

  private async createDefaultUsers() {
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
      } else {
        this.logger.log(`User already exists: ${userData.username}`);
      }
    }
  }
}
