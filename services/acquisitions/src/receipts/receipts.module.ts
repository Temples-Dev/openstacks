import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Receipt } from './entities/receipt.entity';
import { ReceiptLine } from './entities/receipt-line.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Receipt, ReceiptLine])],
  controllers: [],
  providers: [],
  exports: [],
})
export class ReceiptsModule {}
