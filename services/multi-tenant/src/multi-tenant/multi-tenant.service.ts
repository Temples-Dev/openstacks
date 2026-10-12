import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Cache } from 'cache-manager';
import { Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

import { LibrarySystem } from '../library-systems/entities/library-system.entity';
import { Library } from '../libraries/entities/library.entity';
import { Branch } from '../libraries/entities/branch.entity';
import { TenantContext, LibrarySystemConfig, LibraryConfig, BranchConfig } from '@shellnexa/types';

@Injectable()
export class MultiTenantService {
  private readonly logger = new Logger(MultiTenantService.name);

  constructor(
    @InjectRepository(LibrarySystem)
    private readonly librarySystemRepository: Repository<LibrarySystem>,
    @InjectRepository(Library)
    private readonly libraryRepository: Repository<Library>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly dataSource: DataSource,
  ) {}

  // Library System Management
  async createLibrarySystem(systemData: Partial<LibrarySystem>): Promise<LibrarySystem> {
    try {
      this.logger.log(`Creating new library system: ${systemData.name}`);

      // Validate system code uniqueness
      const existingSystem = await this.librarySystemRepository.findOne({
        where: { code: systemData.code }
      });

      if (existingSystem) {
        throw new BadRequestException(`Library system with code '${systemData.code}' already exists`);
      }

      const system = this.librarySystemRepository.create({
        ...systemData,
        status: 'active',
        createdAt: new Date(),
      });

      const savedSystem = await this.librarySystemRepository.save(system);
      
      // Clear cache
      await this.clearSystemCache(savedSystem.id);
      
      this.logger.log(`Library system created successfully: ${savedSystem.id}`);
      return savedSystem;

    } catch (error) {
      this.logger.error(`Failed to create library system: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getLibrarySystem(systemId: string): Promise<LibrarySystem> {
    const cacheKey = `system:${systemId}`;
    
    // Try cache first
    let system = await this.cacheManager.get<LibrarySystem>(cacheKey);
    
    if (!system) {
      system = await this.librarySystemRepository.findOne({
        where: { id: systemId },
        relations: ['libraries', 'libraries.branches'],
      });

      if (!system) {
        throw new NotFoundException(`Library system not found: ${systemId}`);
      }

      // Cache for 15 minutes
      await this.cacheManager.set(cacheKey, system, 900000);
    }

    return system;
  }

  async updateLibrarySystem(systemId: string, updateData: Partial<LibrarySystem>): Promise<LibrarySystem> {
    try {
      const system = await this.getLibrarySystem(systemId);
      
      Object.assign(system, updateData);
      system.updatedAt = new Date();

      const updatedSystem = await this.librarySystemRepository.save(system);
      
      // Clear cache
      await this.clearSystemCache(systemId);
      
      this.logger.log(`Library system updated: ${systemId}`);
      return updatedSystem;

    } catch (error) {
      this.logger.error(`Failed to update library system ${systemId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getLibrarySystems(filters?: {
    type?: string;
    status?: string;
    search?: string;
  }): Promise<LibrarySystem[]> {
    const queryBuilder = this.librarySystemRepository.createQueryBuilder('system')
      .leftJoinAndSelect('system.libraries', 'library')
      .leftJoinAndSelect('library.branches', 'branch');

    if (filters?.type) {
      queryBuilder.andWhere('system.type = :type', { type: filters.type });
    }

    if (filters?.status) {
      queryBuilder.andWhere('system.status = :status', { status: filters.status });
    }

    if (filters?.search) {
      queryBuilder.andWhere(
        '(system.name ILIKE :search OR system.code ILIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    return queryBuilder.getMany();
  }

  // Library Management
  async createLibrary(libraryData: Partial<Library>): Promise<Library> {
    try {
      this.logger.log(`Creating new library: ${libraryData.name} in system ${libraryData.systemId}`);

      // Validate system exists
      const system = await this.getLibrarySystem(libraryData.systemId);
      
      // Check subscription limits
      if (system.maxLibrariesReached) {
        throw new BadRequestException('Maximum number of libraries reached for this system');
      }

      // Validate library code uniqueness within system
      const existingLibrary = await this.libraryRepository.findOne({
        where: { 
          code: libraryData.code,
          systemId: libraryData.systemId 
        }
      });

      if (existingLibrary) {
        throw new BadRequestException(`Library with code '${libraryData.code}' already exists in this system`);
      }

      const library = this.libraryRepository.create({
        ...libraryData,
        status: 'active',
        createdAt: new Date(),
      });

      const savedLibrary = await this.libraryRepository.save(library);
      
      // Clear system cache
      await this.clearSystemCache(libraryData.systemId);
      
      this.logger.log(`Library created successfully: ${savedLibrary.id}`);
      return savedLibrary;

    } catch (error) {
      this.logger.error(`Failed to create library: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getLibrary(libraryId: string): Promise<Library> {
    const cacheKey = `library:${libraryId}`;
    
    let library = await this.cacheManager.get<Library>(cacheKey);
    
    if (!library) {
      library = await this.libraryRepository.findOne({
        where: { id: libraryId },
        relations: ['system', 'branches', 'parentLibrary', 'childLibraries'],
      });

      if (!library) {
        throw new NotFoundException(`Library not found: ${libraryId}`);
      }

      await this.cacheManager.set(cacheKey, library, 900000);
    }

    return library;
  }

  async getLibrariesBySystem(systemId: string): Promise<Library[]> {
    return this.libraryRepository.find({
      where: { systemId },
      relations: ['branches'],
      order: { name: 'ASC' },
    });
  }

  async updateLibrary(libraryId: string, updateData: Partial<Library>): Promise<Library> {
    try {
      const library = await this.getLibrary(libraryId);
      
      Object.assign(library, updateData);
      library.updatedAt = new Date();

      const updatedLibrary = await this.libraryRepository.save(library);
      
      // Clear caches
      await this.clearLibraryCache(libraryId);
      await this.clearSystemCache(library.systemId);
      
      this.logger.log(`Library updated: ${libraryId}`);
      return updatedLibrary;

    } catch (error) {
      this.logger.error(`Failed to update library ${libraryId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Branch Management
  async createBranch(branchData: Partial<Branch>): Promise<Branch> {
    try {
      this.logger.log(`Creating new branch: ${branchData.name} for library ${branchData.libraryId}`);

      // Validate library exists
      const library = await this.getLibrary(branchData.libraryId);

      // Validate branch code uniqueness within library
      const existingBranch = await this.branchRepository.findOne({
        where: { 
          code: branchData.code,
          libraryId: branchData.libraryId 
        }
      });

      if (existingBranch) {
        throw new BadRequestException(`Branch with code '${branchData.code}' already exists in this library`);
      }

      const branch = this.branchRepository.create({
        ...branchData,
        status: 'active',
        createdAt: new Date(),
      });

      const savedBranch = await this.branchRepository.save(branch);
      
      // Clear caches
      await this.clearLibraryCache(branchData.libraryId);
      await this.clearSystemCache(library.systemId);
      
      this.logger.log(`Branch created successfully: ${savedBranch.id}`);
      return savedBranch;

    } catch (error) {
      this.logger.error(`Failed to create branch: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getBranch(branchId: string): Promise<Branch> {
    const cacheKey = `branch:${branchId}`;
    
    let branch = await this.cacheManager.get<Branch>(cacheKey);
    
    if (!branch) {
      branch = await this.branchRepository.findOne({
        where: { id: branchId },
        relations: ['library', 'library.system'],
      });

      if (!branch) {
        throw new NotFoundException(`Branch not found: ${branchId}`);
      }

      await this.cacheManager.set(cacheKey, branch, 900000);
    }

    return branch;
  }

  async getBranchesByLibrary(libraryId: string): Promise<Branch[]> {
    return this.branchRepository.find({
      where: { libraryId },
      order: { name: 'ASC' },
    });
  }

  async updateBranch(branchId: string, updateData: Partial<Branch>): Promise<Branch> {
    try {
      const branch = await this.getBranch(branchId);
      
      Object.assign(branch, updateData);
      branch.updatedAt = new Date();

      const updatedBranch = await this.branchRepository.save(branch);
      
      // Clear caches
      await this.clearBranchCache(branchId);
      await this.clearLibraryCache(branch.libraryId);
      
      this.logger.log(`Branch updated: ${branchId}`);
      return updatedBranch;

    } catch (error) {
      this.logger.error(`Failed to update branch ${branchId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Tenant Context Management
  async createTenantContext(
    systemId: string,
    libraryId: string,
    branchId?: string,
    userId?: string,
    userRoles?: string[]
  ): Promise<TenantContext> {
    try {
      // Validate system exists
      const system = await this.getLibrarySystem(systemId);
      
      // Validate library exists and belongs to system
      const library = await this.getLibrary(libraryId);
      if (library.systemId !== systemId) {
        throw new BadRequestException('Library does not belong to the specified system');
      }

      // Validate branch if provided
      let branch = null;
      if (branchId) {
        branch = await this.getBranch(branchId);
        if (branch.libraryId !== libraryId) {
          throw new BadRequestException('Branch does not belong to the specified library');
        }
      }

      const context: TenantContext = {
        systemId,
        libraryId,
        branchId,
        userId,
        userRoles: userRoles || [],
        permissions: [], // Would be populated based on roles
        preferences: {
          timezone: system.timezone,
          locale: system.locale,
          currency: system.currency,
        },
      };

      return context;

    } catch (error) {
      this.logger.error(`Failed to create tenant context: ${error.message}`, error.stack);
      throw error;
    }
  }

  async validateTenantAccess(
    tenantContext: TenantContext,
    requiredPermissions: string[]
  ): Promise<boolean> {
    try {
      // Check if user has required permissions
      const hasPermissions = requiredPermissions.every(permission =>
        tenantContext.permissions.includes(permission)
      );

      if (!hasPermissions) {
        this.logger.warn(`Access denied for user ${tenantContext.userId} - missing permissions`);
        return false;
      }

      // Validate system/library/branch still exist and are active
      const system = await this.getLibrarySystem(tenantContext.systemId);
      if (!system.isActive) {
        this.logger.warn(`Access denied - system ${tenantContext.systemId} is not active`);
        return false;
      }

      const library = await this.getLibrary(tenantContext.libraryId);
      if (!library.isActive) {
        this.logger.warn(`Access denied - library ${tenantContext.libraryId} is not active`);
        return false;
      }

      if (tenantContext.branchId) {
        const branch = await this.getBranch(tenantContext.branchId);
        if (!branch.isActive) {
          this.logger.warn(`Access denied - branch ${tenantContext.branchId} is not active`);
          return false;
        }
      }

      return true;

    } catch (error) {
      this.logger.error(`Failed to validate tenant access: ${error.message}`, error.stack);
      return false;
    }
  }

  // Multi-Tenant Data Operations
  async getTenantDatabaseConfig(systemId: string): Promise<any> {
    const system = await this.getLibrarySystem(systemId);
    
    // Return database configuration based on system type and subscription
    return {
      tenantId: systemId,
      databaseName: `shellnexa_${system.code.toLowerCase()}`,
      connectionString: process.env.DATABASE_URL, // Would be tenant-specific in production
      schemaName: system.code.toLowerCase(),
      isShared: system.type === 'consortium',
      isolationLevel: system.subscription.plan === 'enterprise' ? 'database' : 'schema',
    };
  }

  async getSystemHierarchy(systemId: string): Promise<any> {
    const system = await this.librarySystemRepository.findOne({
      where: { id: systemId },
      relations: [
        'libraries',
        'libraries.branches',
        'libraries.childLibraries',
        'libraries.childLibraries.branches'
      ],
    });

    if (!system) {
      throw new NotFoundException(`Library system not found: ${systemId}`);
    }

    return {
      system: {
        id: system.id,
        code: system.code,
        name: system.name,
        type: system.type,
      },
      libraries: system.libraries.map(library => ({
        id: library.id,
        code: library.code,
        name: library.name,
        type: library.type,
        isActive: library.isActive,
        branches: library.branches.map(branch => ({
          id: branch.id,
          code: branch.code,
          name: branch.name,
          type: branch.branchType,
          isActive: branch.isActive,
        })),
        childLibraries: library.childLibraries?.map(child => ({
          id: child.id,
          code: child.code,
          name: child.name,
          type: child.type,
          isActive: child.isActive,
          branches: child.branches?.map(branch => ({
            id: branch.id,
            code: branch.code,
            name: branch.name,
            type: branch.branchType,
            isActive: branch.isActive,
          })) || [],
        })) || [],
      })),
    };
  }

  // Search and Discovery
  async findNearbyBranches(
    latitude: number,
    longitude: number,
    radiusMiles: number = 25,
    systemId?: string
  ): Promise<Array<Branch & { distance: number }>> {
    let query = this.branchRepository.createQueryBuilder('branch')
      .leftJoinAndSelect('branch.library', 'library')
      .leftJoinAndSelect('library.system', 'system')
      .where('branch.status = :status', { status: 'active' })
      .andWhere('branch.address IS NOT NULL');

    if (systemId) {
      query = query.andWhere('library.systemId = :systemId', { systemId });
    }

    const branches = await query.getMany();

    // Calculate distances and filter by radius
    const branchesWithDistance = branches
      .map(branch => ({
        ...branch,
        distance: branch.calculateDistance(latitude, longitude),
      }))
      .filter(branch => branch.distance <= radiusMiles)
      .sort((a, b) => a.distance - b.distance);

    return branchesWithDistance;
  }

  async searchLibraries(searchTerm: string, systemId?: string): Promise<Library[]> {
    let query = this.libraryRepository.createQueryBuilder('library')
      .leftJoinAndSelect('library.system', 'system')
      .leftJoinAndSelect('library.branches', 'branches')
      .where('library.status = :status', { status: 'active' })
      .andWhere(
        '(library.name ILIKE :search OR library.code ILIKE :search OR library.description ILIKE :search)',
        { search: `%${searchTerm}%` }
      );

    if (systemId) {
      query = query.andWhere('library.systemId = :systemId', { systemId });
    }

    return query.getMany();
  }

  // Analytics and Reporting
  async getSystemStatistics(systemId: string): Promise<any> {
    const system = await this.getLibrarySystem(systemId);
    
    const libraryCount = await this.libraryRepository.count({
      where: { systemId, status: 'active' }
    });

    const branchCount = await this.branchRepository
      .createQueryBuilder('branch')
      .leftJoin('branch.library', 'library')
      .where('library.systemId = :systemId', { systemId })
      .andWhere('branch.status = :status', { status: 'active' })
      .getCount();

    return {
      system: {
        id: system.id,
        name: system.name,
        type: system.type,
        status: system.status,
      },
      counts: {
        libraries: libraryCount,
        branches: branchCount,
        totalLocations: libraryCount + branchCount,
      },
      subscription: {
        plan: system.subscription.plan,
        usage: system.subscriptionUsage,
        status: system.subscriptionStatus,
        daysUntilExpiry: system.daysUntilSubscriptionExpiry,
      },
    };
  }

  // Cache Management
  private async clearSystemCache(systemId: string): Promise<void> {
    await this.cacheManager.del(`system:${systemId}`);
  }

  private async clearLibraryCache(libraryId: string): Promise<void> {
    await this.cacheManager.del(`library:${libraryId}`);
  }

  private async clearBranchCache(branchId: string): Promise<void> {
    await this.cacheManager.del(`branch:${branchId}`);
  }

  // Health Check
  async getHealthStatus(): Promise<any> {
    try {
      const systemCount = await this.librarySystemRepository.count();
      const libraryCount = await this.libraryRepository.count();
      const branchCount = await this.branchRepository.count();

      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        statistics: {
          systems: systemCount,
          libraries: libraryCount,
          branches: branchCount,
        },
        database: 'connected',
        cache: 'operational',
      };

    } catch (error) {
      this.logger.error(`Health check failed: ${error.message}`, error.stack);
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
      };
    }
  }
}
