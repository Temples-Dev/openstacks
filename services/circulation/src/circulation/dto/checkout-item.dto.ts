import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CheckoutItemDto {
  @ApiProperty({ description: 'Patron barcode', maxLength: 50 })
  @IsString()
  @MaxLength(50)
  patronBarcode: string;

  @ApiProperty({ description: 'Item barcode', maxLength: 50 })
  @IsString()
  @MaxLength(50)
  itemBarcode: string;

  @ApiPropertyOptional({ description: 'Staff member ID performing checkout', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  staffId?: string;
}
