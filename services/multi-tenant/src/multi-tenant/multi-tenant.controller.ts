import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  ValidationPipe,
  UseGuards,
  Headers,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
  ApiHeader,
} from '@nestjs/swagger';
import { MultiTenantService } from './multi-tenant.service';
import { LibrarySystem } from '../library-systems/entities/library-system.entity';
import { Library } from '../libraries/entities/library.entity';
import { Branch } from '../libraries/entities/branch.entity';

@ApiTags('multi-tenant')
@ApiBearerAuth()
@Controller('multi-tenant')
export class MultiTenantController {
  constructor(private readonly multiTenantService: MultiTenantService) {}

  // Library System Management
  @Post('systems')
  @ApiOperation({ summary: 'Create new library system' })
  @ApiResponse({ status: 201, description: 'Library system created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid system data or duplicate code' })
  async createLibrarySystem(@Body() systemData: Partial<LibrarySystem>) {
    return this.multiTenantService.createLibrarySystem(systemData);
  }

  @Get('systems')
  @ApiOperation({ summary: 'Get all library systems' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by system type' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by system status' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by name or code' })
  @ApiResponse({ status: 200, description: 'Library systems retrieved successfully' })
  async getLibrarySystems(
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.multiTenantService.getLibrarySystems({ type, status, search });
  }

  @Get('systems/:systemId')
  @ApiOperation({ summary: 'Get library system by ID' })
  @ApiResponse({ status: 200, description: 'Library system retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Library system not found' })
  async getLibrarySystem(@Param('systemId', ParseUUIDPipe) systemId: string) {
    return this.multiTenantService.getLibrarySystem(systemId);
  }

  @Put('systems/:systemId')
  @ApiOperation({ summary: 'Update library system' })
  @ApiResponse({ status: 200, description: 'Library system updated successfully' })
  @ApiResponse({ status: 404, description: 'Library system not found' })
  async updateLibrarySystem(
    @Param('systemId', ParseUUIDPipe) systemId: string,
    @Body() updateData: Partial<LibrarySystem>,
  ) {
    return this.multiTenantService.updateLibrarySystem(systemId, updateData);
  }

  @Get('systems/:systemId/hierarchy')
  @ApiOperation({ summary: 'Get complete system hierarchy' })
  @ApiResponse({ status: 200, description: 'System hierarchy retrieved successfully' })
  async getSystemHierarchy(@Param('systemId', ParseUUIDPipe) systemId: string) {
    return this.multiTenantService.getSystemHierarchy(systemId);
  }

  @Get('systems/:systemId/statistics')
  @ApiOperation({ summary: 'Get system statistics and usage' })
  @ApiResponse({ status: 200, description: 'System statistics retrieved successfully' })
  async getSystemStatistics(@Param('systemId', ParseUUIDPipe) systemId: string) {
    return this.multiTenantService.getSystemStatistics(systemId);
  }

  // Library Management
  @Post('libraries')
  @ApiOperation({ summary: 'Create new library' })
  @ApiResponse({ status: 201, description: 'Library created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid library data or limits exceeded' })
  async createLibrary(@Body() libraryData: Partial<Library>) {
    return this.multiTenantService.createLibrary(libraryData);
  }

  @Get('libraries/:libraryId')
  @ApiOperation({ summary: 'Get library by ID' })
  @ApiResponse({ status: 200, description: 'Library retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Library not found' })
  async getLibrary(@Param('libraryId', ParseUUIDPipe) libraryId: string) {
    return this.multiTenantService.getLibrary(libraryId);
  }

  @Put('libraries/:libraryId')
  @ApiOperation({ summary: 'Update library' })
  @ApiResponse({ status: 200, description: 'Library updated successfully' })
  @ApiResponse({ status: 404, description: 'Library not found' })
  async updateLibrary(
    @Param('libraryId', ParseUUIDPipe) libraryId: string,
    @Body() updateData: Partial<Library>,
  ) {
    return this.multiTenantService.updateLibrary(libraryId, updateData);
  }

  @Get('systems/:systemId/libraries')
  @ApiOperation({ summary: 'Get all libraries in a system' })
  @ApiResponse({ status: 200, description: 'Libraries retrieved successfully' })
  async getLibrariesBySystem(@Param('systemId', ParseUUIDPipe) systemId: string) {
    return this.multiTenantService.getLibrariesBySystem(systemId);
  }

  // Branch Management
  @Post('branches')
  @ApiOperation({ summary: 'Create new branch' })
  @ApiResponse({ status: 201, description: 'Branch created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid branch data or duplicate code' })
  async createBranch(@Body() branchData: Partial<Branch>) {
    return this.multiTenantService.createBranch(branchData);
  }

  @Get('branches/:branchId')
  @ApiOperation({ summary: 'Get branch by ID' })
  @ApiResponse({ status: 200, description: 'Branch retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Branch not found' })
  async getBranch(@Param('branchId', ParseUUIDPipe) branchId: string) {
    return this.multiTenantService.getBranch(branchId);
  }

  @Put('branches/:branchId')
  @ApiOperation({ summary: 'Update branch' })
  @ApiResponse({ status: 200, description: 'Branch updated successfully' })
  @ApiResponse({ status: 404, description: 'Branch not found' })
  async updateBranch(
    @Param('branchId', ParseUUIDPipe) branchId: string,
    @Body() updateData: Partial<Branch>,
  ) {
    return this.multiTenantService.updateBranch(branchId, updateData);
  }

  @Get('libraries/:libraryId/branches')
  @ApiOperation({ summary: 'Get all branches for a library' })
  @ApiResponse({ status: 200, description: 'Branches retrieved successfully' })
  async getBranchesByLibrary(@Param('libraryId', ParseUUIDPipe) libraryId: string) {
    return this.multiTenantService.getBranchesByLibrary(libraryId);
  }

  // Search and Discovery
  @Get('search/libraries')
  @ApiOperation({ summary: 'Search libraries by name, code, or description' })
  @ApiQuery({ name: 'q', description: 'Search term' })
  @ApiQuery({ name: 'systemId', required: false, description: 'Filter by system ID' })
  @ApiResponse({ status: 200, description: 'Search results retrieved successfully' })
  async searchLibraries(
    @Query('q') searchTerm: string,
    @Query('systemId') systemId?: string,
  ) {
    return this.multiTenantService.searchLibraries(searchTerm, systemId);
  }

  @Get('search/branches/nearby')
  @ApiOperation({ summary: 'Find nearby branches by location' })
  @ApiQuery({ name: 'lat', description: 'Latitude' })
  @ApiQuery({ name: 'lng', description: 'Longitude' })
  @ApiQuery({ name: 'radius', required: false, description: 'Search radius in miles (default: 25)' })
  @ApiQuery({ name: 'systemId', required: false, description: 'Filter by system ID' })
  @ApiResponse({ status: 200, description: 'Nearby branches retrieved successfully' })
  async findNearbyBranches(
    @Query('lat') latitude: number,
    @Query('lng') longitude: number,
    @Query('radius') radius?: number,
    @Query('systemId') systemId?: string,
  ) {
    return this.multiTenantService.findNearbyBranches(
      latitude,
      longitude,
      radius || 25,
      systemId,
    );
  }

  // Tenant Context Management
  @Post('context')
  @ApiOperation({ summary: 'Create tenant context for user session' })
  @ApiHeader({ name: 'X-System-ID', description: 'Library System ID' })
  @ApiHeader({ name: 'X-Library-ID', description: 'Library ID' })
  @ApiHeader({ name: 'X-Branch-ID', required: false, description: 'Branch ID (optional)' })
  @ApiResponse({ status: 201, description: 'Tenant context created successfully' })
  async createTenantContext(
    @Headers('X-System-ID') systemId: string,
    @Headers('X-Library-ID') libraryId: string,
    @Headers('X-Branch-ID') branchId?: string,
    @Body() contextData?: { userId?: string; userRoles?: string[] },
  ) {
    return this.multiTenantService.createTenantContext(
      systemId,
      libraryId,
      branchId,
      contextData?.userId,
      contextData?.userRoles,
    );
  }

  @Post('context/validate')
  @ApiOperation({ summary: 'Validate tenant access permissions' })
  @ApiResponse({ status: 200, description: 'Access validation result' })
  async validateTenantAccess(
    @Body() validationData: {
      tenantContext: any;
      requiredPermissions: string[];
    },
  ) {
    const isValid = await this.multiTenantService.validateTenantAccess(
      validationData.tenantContext,
      validationData.requiredPermissions,
    );
    
    return {
      isValid,
      timestamp: new Date().toISOString(),
    };
  }

  // Database Configuration
  @Get('systems/:systemId/database-config')
  @ApiOperation({ summary: 'Get tenant database configuration' })
  @ApiResponse({ status: 200, description: 'Database configuration retrieved successfully' })
  async getTenantDatabaseConfig(@Param('systemId', ParseUUIDPipe) systemId: string) {
    return this.multiTenantService.getTenantDatabaseConfig(systemId);
  }

  // Health Check
  @Get('health')
  @ApiOperation({ summary: 'Get multi-tenant service health status' })
  @ApiResponse({ status: 200, description: 'Health status retrieved successfully' })
  async getHealthStatus() {
    return this.multiTenantService.getHealthStatus();
  }
}
