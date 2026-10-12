import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice } from './entities/invoice.entity';
import { InvoiceLine } from './entities/invoice-line.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Invoice, InvoiceLine])],
  controllers: [],
  providers: [],
  exports: [],
})
export class InvoicesModule {}
