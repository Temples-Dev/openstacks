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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const role_entity_1 = require("./entities/role.entity");
const permission_entity_1 = require("./entities/permission.entity");
let RolesService = class RolesService {
    roleRepository;
    permissionRepository;
    constructor(roleRepository, permissionRepository) {
        this.roleRepository = roleRepository;
        this.permissionRepository = permissionRepository;
    }
    async findAllRoles() {
        return this.roleRepository.find({
            relations: ['permissions'],
        });
    }
    async findRole(id) {
        const role = await this.roleRepository.findOne({
            where: { id },
            relations: ['permissions'],
        });
        if (!role) {
            throw new common_1.NotFoundException('Role not found');
        }
        return role;
    }
    async createRole(roleData) {
        const role = this.roleRepository.create(roleData);
        return this.roleRepository.save(role);
    }
    async updateRole(id, updateData) {
        await this.roleRepository.update(id, updateData);
        return this.findRole(id);
    }
    async deleteRole(id) {
        const role = await this.findRole(id);
        if (role.isSystemRole) {
            throw new Error('Cannot delete system role');
        }
        await this.roleRepository.softDelete(id);
    }
    async findAllPermissions() {
        return this.permissionRepository.find();
    }
    async findPermission(id) {
        const permission = await this.permissionRepository.findOne({
            where: { id },
        });
        if (!permission) {
            throw new common_1.NotFoundException('Permission not found');
        }
        return permission;
    }
    async createPermission(permissionData) {
        const permission = this.permissionRepository.create(permissionData);
        return this.permissionRepository.save(permission);
    }
    async assignPermissionsToRole(roleId, permissionIds) {
        const role = await this.findRole(roleId);
        const permissions = await this.permissionRepository.findByIds(permissionIds);
        role.permissions = permissions;
        return this.roleRepository.save(role);
    }
};
exports.RolesService = RolesService;
exports.RolesService = RolesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(role_entity_1.Role)),
    __param(1, (0, typeorm_1.InjectRepository)(permission_entity_1.Permission)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], RolesService);
//# sourceMappingURL=roles.service.js.map