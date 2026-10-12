import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { HttpModule } from '@nestjs/axios';

// Entities
import { Vendor } from './vendors/entities/vendor.entity';
import { PurchaseOrder } from './purchase-orders/entities/purchase-order.entity';
import { PurchaseOrderLine } from './purchase-orders/entities/purchase-order-line.entity';
import { Budget } from './budgets/entities/budget.entity';
import { BudgetAllocation } from './budgets/entities/budget-allocation.entity';
import { Invoice } from './invoices/entities/invoice.entity';
import { InvoiceLine } from './invoices/entities/invoice-line.entity';
import { Receipt } from './receipts/entities/receipt.entity';
import { ReceiptLine } from './receipts/entities/receipt-line.entity';

// Feature modules
import { VendorsModule } from './vendors/vendors.module';
import { PurchaseOrdersModule } from './purchase-orders/purchase-orders.module';
import { BudgetsModule } from './budgets/budgets.module';
import { InvoicesModule } from './invoices/invoices.module';
import { ReceiptsModule } from './receipts/receipts.module';
import { AcquisitionsModule } from './acquisitions/acquisitions.module';
import { ReportsModule } from './reports/reports.module';
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
        database: process.env.DB_DATABASE || 'shellnexa_acquisitions',
        entities: [
          Vendor,
          PurchaseOrder,
          PurchaseOrderLine,
          Budget,
          BudgetAllocation,
          Invoice,
          InvoiceLine,
          Receipt,
          ReceiptLine,
        ],
        synchronize: process.env.NODE_ENV === 'development',
        logging: process.env.NODE_ENV === 'development',
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
      }),
    }),

    // Scheduling for automated tasks
    ScheduleModule.forRoot(),

    // HTTP client for service communication
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
    }),

    // Feature modules
    VendorsModule,
    PurchaseOrdersModule,
    BudgetsModule,
    InvoicesModule,
    ReceiptsModule,
    AcquisitionsModule,
    ReportsModule,
    HealthModule,
  ],
})
export class AppModule {}
