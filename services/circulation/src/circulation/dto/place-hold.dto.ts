import { IsString, IsOptional, MaxLength, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PlaceHoldDto {
  @ApiProperty({ description: 'Patron barcode', maxLength: 50 })
  @IsString()
  @MaxLength(50)
  patronBarcode: string;

  @ApiProperty({ description: 'Catalog record ID', maxLength: 36 })
  @IsString()
  @MaxLength(36)
  catalogRecordId: string;

  @ApiProperty({ description: 'Pickup library code', maxLength: 50 })
  @IsString()
  @MaxLength(50)
  pickupLibrary: string;

  @ApiPropertyOptional({ description: 'Specific item barcode (for item-level holds)', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  itemBarcode?: string;

  @ApiPropertyOptional({ 
    description: 'Hold type',
    enum: ['title', 'item', 'recall', 'course_reserve'],
    default: 'title'
  })
  @IsOptional()
  @IsEnum(['title', 'item', 'recall', 'course_reserve'])
  holdType?: string = 'title';

  @ApiPropertyOptional({ 
    description: 'Notification method',
    enum: ['email', 'phone', 'sms', 'none'],
    default: 'email'
  })
  @IsOptional()
  @IsEnum(['email', 'phone', 'sms', 'none'])
  notificationMethod?: string = 'email';

  @ApiPropertyOptional({ description: 'Patron notes', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  patronNotes?: string;
}
