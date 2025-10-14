import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { HttpModule } from '@nestjs/axios';
import { ScheduleModule } from '@nestjs/schedule';
import { TerminusModule } from '@nestjs/terminus';

import { EResourcesModule } from './e-resources/e-resources.module';
import { ResourcesModule } from './resources/resources.module';
import { LicensesModule } from './licenses/licenses.module';
import { UsageModule } from './usage/usage.module';
import { AccessModule } from './access/access.module';
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
      database: process.env.DB_NAME || 'shellnexa_eresources',
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
    EResourcesModule,
    ResourcesModule,
    LicensesModule,
    UsageModule,
    AccessModule,
    HealthModule,
  ],
})
export class AppModule {}
