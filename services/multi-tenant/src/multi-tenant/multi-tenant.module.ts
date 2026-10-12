import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';

import { MultiTenantService } from './multi-tenant.service';
import { MultiTenantController } from './multi-tenant.controller';
import { LibrarySystem } from '../library-systems/entities/library-system.entity';
import { Library } from '../libraries/entities/library.entity';
import { Branch } from '../libraries/entities/branch.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([LibrarySystem, Library, Branch]),
    CacheModule.register(),
  ],
  controllers: [MultiTenantController],
  providers: [MultiTenantService],
  exports: [MultiTenantService],
})
export class MultiTenantModule {}
