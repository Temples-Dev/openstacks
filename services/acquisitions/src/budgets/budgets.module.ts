import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Budget } from './entities/budget.entity';
import { BudgetAllocation } from './entities/budget-allocation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Budget, BudgetAllocation])],
  controllers: [],
  providers: [],
  exports: [],
})
export class BudgetsModule {}
