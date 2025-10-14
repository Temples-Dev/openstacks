import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';

import { AcquisitionsService } from './acquisitions.service';
import { AcquisitionsController } from './acquisitions.controller';

import { PurchaseOrder } from '../purchase-orders/entities/purchase-order.entity';
import { PurchaseOrderLine } from '../purchase-orders/entities/purchase-order-line.entity';
import { Vendor } from '../vendors/entities/vendor.entity';
import { Budget } from '../budgets/entities/budget.entity';
import { BudgetAllocation } from '../budgets/entities/budget-allocation.entity';
import { Invoice } from '../invoices/entities/invoice.entity';
import { Receipt } from '../receipts/entities/receipt.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PurchaseOrder,
      PurchaseOrderLine,
      Vendor,
      Budget,
      BudgetAllocation,
      Invoice,
      Receipt,
    ]),
    HttpModule,
  ],
  controllers: [AcquisitionsController],
  providers: [AcquisitionsService],
  exports: [AcquisitionsService],
})
export class AcquisitionsModule {}
