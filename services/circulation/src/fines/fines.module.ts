import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Fine } from './entities/fine.entity';
import { FinePayment } from './entities/fine-payment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Fine, FinePayment])],
  exports: [TypeOrmModule],
})
export class FinesModule {}
