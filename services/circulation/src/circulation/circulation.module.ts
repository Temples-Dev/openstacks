import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CirculationService } from './circulation.service';
import { CirculationController } from './circulation.controller';
import { Patron } from '../patrons/entities/patron.entity';
import { Loan } from '../loans/entities/loan.entity';
import { LoanRenewal } from '../loans/entities/loan-renewal.entity';
import { Hold } from '../holds/entities/hold.entity';
import { Fine } from '../fines/entities/fine.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Patron, Loan, LoanRenewal, Hold, Fine])],
  controllers: [CirculationController],
  providers: [CirculationService],
  exports: [CirculationService],
})
export class CirculationModule {}
