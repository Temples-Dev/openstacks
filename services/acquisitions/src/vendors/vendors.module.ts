import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vendor } from './entities/vendor.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Vendor])],
  controllers: [],
  providers: [],
  exports: [],
})
export class VendorsModule {}
