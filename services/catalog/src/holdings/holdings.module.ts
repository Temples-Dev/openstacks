import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Holdings } from './entities/holdings.entity';
import { Location } from './entities/location.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Holdings, Location])],
  exports: [TypeOrmModule],
})
export class HoldingsModule {}
