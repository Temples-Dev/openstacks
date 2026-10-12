import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { HttpModule } from '@nestjs/axios';
import { ScheduleModule } from '@nestjs/schedule';
import { TerminusModule } from '@nestjs/terminus';

import { DigitalRepositoryModule } from './digital-repository/digital-repository.module';
import { CollectionsModule } from './collections/collections.module';
import { ObjectsModule } from './objects/objects.module';
import { MetadataModule } from './metadata/metadata.module';
import { PreservationModule } from './preservation/preservation.module';
import { OaiPmhModule } from './oai-pmh/oai-pmh.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Database
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'shellnexa_repository',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: process.env.NODE_ENV !== 'production',
      logging: process.env.NODE_ENV === 'development',
    }),

    // Queue Management
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD,
      },
    }),

    // HTTP Client
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),

    // Scheduling
    ScheduleModule.forRoot(),

    // Health Checks
    TerminusModule,

    // Feature Modules
    DigitalRepositoryModule,
    CollectionsModule,
    ObjectsModule,
    MetadataModule,
    PreservationModule,
    OaiPmhModule,
    HealthModule,
  ],
})
export class AppModule {}
