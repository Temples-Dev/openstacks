import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Hold } from './entities/hold.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Hold])],
  exports: [TypeOrmModule],
})
export class HoldsModule {}
