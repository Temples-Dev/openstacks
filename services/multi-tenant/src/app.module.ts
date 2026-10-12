import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { BullModule } from '@nestjs/bull';
import { HttpModule } from '@nestjs/axios';

// Entities
import { LibrarySystem } from './library-systems/entities/library-system.entity';
import { Library } from './libraries/entities/library.entity';
import { Branch } from './libraries/entities/branch.entity';

// Modules
import { MultiTenantModule } from './multi-tenant/multi-tenant.module';
import { LibrarySystemsModule } from './library-systems/library-systems.module';
import { LibrariesModule } from './libraries/libraries.module';
import { ConsortiumModule } from './consortium/consortium.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Database
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT, 10) || 5432,
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'password',
        database: process.env.DB_DATABASE || 'openstacks_multitenant',
        entities: [
          LibrarySystem,
          Library,
          Branch,
        ],
        synchronize: process.env.NODE_ENV === 'development',
        logging: process.env.NODE_ENV === 'development',
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
      }),
    }),

    // Caching with Redis
    CacheModule.registerAsync({
      useFactory: () => ({
        store: 'redis',
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT, 10) || 6379,
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB, 10) || 0,
        ttl: 900, // 15 minutes default TTL
      }),
    }),

    // Queue Management with Bull
    BullModule.forRootAsync({
      useFactory: () => ({
        redis: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT, 10) || 6379,
          password: process.env.REDIS_PASSWORD,
          db: parseInt(process.env.REDIS_QUEUE_DB, 10) || 1,
        },
      }),
    }),

    // HTTP client for service communication
    HttpModule.register({
      timeout: 15000,
      maxRedirects: 5,
    }),

    // Feature modules
    MultiTenantModule,
    LibrarySystemsModule,
    LibrariesModule,
    ConsortiumModule,
    HealthModule,
  ],
})
export class AppModule {}
