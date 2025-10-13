import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('roles')
@Controller('roles')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all roles' })
  async findAllRoles() {
    return this.rolesService.findAllRoles();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get role by ID' })
  async findRole(@Param('id') id: string) {
    return this.rolesService.findRole(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new role' })
  async createRole(@Body() roleData: any) {
    return this.rolesService.createRole(roleData);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update role' })
  async updateRole(@Param('id') id: string, @Body() updateData: any) {
    return this.rolesService.updateRole(id, updateData);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete role' })
  async deleteRole(@Param('id') id: string) {
    await this.rolesService.deleteRole(id);
    return { success: true };
  }

  @Get('permissions/all')
  @ApiOperation({ summary: 'Get all permissions' })
  async findAllPermissions() {
    return this.rolesService.findAllPermissions();
  }

  @Post('permissions')
  @ApiOperation({ summary: 'Create new permission' })
  async createPermission(@Body() permissionData: any) {
    return this.rolesService.createPermission(permissionData);
  }

  @Put(':id/permissions')
  @ApiOperation({ summary: 'Assign permissions to role' })
  async assignPermissions(
    @Param('id') roleId: string,
    @Body() body: { permissionIds: string[] }
  ) {
    return this.rolesService.assignPermissionsToRole(roleId, body.permissionIds);
  }
}
