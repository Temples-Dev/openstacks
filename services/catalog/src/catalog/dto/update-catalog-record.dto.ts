import { PartialType } from '@nestjs/swagger';
import { CreateCatalogRecordDto } from './create-catalog-record.dto';

export class UpdateCatalogRecordDto extends PartialType(CreateCatalogRecordDto) {}
