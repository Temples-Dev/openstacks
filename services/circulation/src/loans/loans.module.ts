import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Loan } from './entities/loan.entity';
import { LoanRenewal } from './entities/loan-renewal.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Loan, LoanRenewal])],
  exports: [TypeOrmModule],
})
export class LoansModule {}
