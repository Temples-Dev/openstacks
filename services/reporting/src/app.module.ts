import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { HttpModule } from '@nestjs/axios';

// Entities
import { Report } from './reports/entities/report.entity';
import { Dashboard } from './dashboards/entities/dashboard.entity';
import { Metric } from './analytics/entities/metric.entity';
import { DataSnapshot } from './analytics/entities/data-snapshot.entity';

// Feature modules
import { AnalyticsModule } from './analytics/analytics.module';
import { DashboardsModule } from './dashboards/dashboards.module';
import { ReportsModule } from './reports/reports.module';
import { CirculationReportsModule } from './circulation-reports/circulation-reports.module';
import { FinancialReportsModule } from './financial-reports/financial-reports.module';
import { CollectionReportsModule } from './collection-reports/collection-reports.module';
import { PatronAnalyticsModule } from './patron-analytics/patron-analytics.module';
import { OperationalModule } from './operational/operational.module';
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
        database: process.env.DB_DATABASE || 'shellnexa_reporting',
        entities: [
          Report,
          Dashboard,
          Metric,
          DataSnapshot,
        ],
        synchronize: process.env.NODE_ENV === 'development',
        logging: process.env.NODE_ENV === 'development',
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
      }),
    }),

    // Scheduling for automated reports
    ScheduleModule.forRoot(),

    // HTTP client for service communication
    HttpModule.register({
      timeout: 15000,
      maxRedirects: 5,
    }),

    // Feature modules
    AnalyticsModule,
    DashboardsModule,
    ReportsModule,
    CirculationReportsModule,
    FinancialReportsModule,
    CollectionReportsModule,
    PatronAnalyticsModule,
    OperationalModule,
    HealthModule,
  ],
})
export class AppModule {}
