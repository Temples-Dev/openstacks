import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MarcService } from './marc.service';
import { MarcController } from './marc.controller';
import { MarcRecord } from './entities/marc-record.entity';
import { MarcField } from './entities/marc-field.entity';
import { MarcSubfield } from './entities/marc-subfield.entity';
import { CatalogRecord } from '../catalog/entities/catalog-record.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MarcRecord, MarcField, MarcSubfield, CatalogRecord])],
  controllers: [MarcController],
  providers: [MarcService],
  exports: [MarcService],
})
export class MarcModule {}
