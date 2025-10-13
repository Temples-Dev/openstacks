import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Patron } from './entities/patron.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Patron])],
  exports: [TypeOrmModule],
})
export class PatronsModule {}
