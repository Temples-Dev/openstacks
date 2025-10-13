import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthorityRecord } from './entities/authority-record.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AuthorityRecord])],
  exports: [TypeOrmModule],
})
export class AuthoritiesModule {}
