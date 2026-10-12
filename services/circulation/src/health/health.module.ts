import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { Patron } from '../patrons/entities/patron.entity';
import { Loan } from '../loans/entities/loan.entity';

@Module({
  imports: [
    TerminusModule,
    TypeOrmModule.forFeature([Patron, Loan]),
  ],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
