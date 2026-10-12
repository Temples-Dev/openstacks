import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';

// Feature modules
import { PatronsModule } from './patrons/patrons.module';
import { LoansModule } from './loans/loans.module';
import { HoldsModule } from './holds/holds.module';
import { FinesModule } from './fines/fines.module';
import { CirculationModule } from './circulation/circulation.module';
import { HealthModule } from './health/health.module';

// Entities
import { Patron } from './patrons/entities/patron.entity';
import { Loan } from './loans/entities/loan.entity';
import { LoanRenewal } from './loans/entities/loan-renewal.entity';
import { Hold } from './holds/entities/hold.entity';
import { Fine } from './fines/entities/fine.entity';
import { FinePayment } from './fines/entities/fine-payment.entity';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Scheduling for automated tasks
    ScheduleModule.forRoot(),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'openstacks'),
        password: configService.get('DB_PASSWORD', 'openstacks_dev'),
        database: configService.get('DB_DATABASE', 'circulation_service'),
        entities: [
          Patron,
          Loan,
          LoanRenewal,
          Hold,
          Fine,
          FinePayment,
        ],
        synchronize: false, // Disable auto-sync to avoid conflicts
        logging: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),

    // Feature modules
    PatronsModule,
    LoansModule,
    HoldsModule,
    FinesModule,
    CirculationModule,
    HealthModule,
  ],
})
export class AppModule {}
