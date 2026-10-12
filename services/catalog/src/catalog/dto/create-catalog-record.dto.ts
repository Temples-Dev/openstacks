import { IsString, IsOptional, IsNumber, IsArray, IsEnum, IsBoolean, IsDateString, MaxLength, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCatalogRecordDto {
  @ApiProperty({ description: 'Record title', maxLength: 500 })
  @IsString()
  @MaxLength(500)
  title: string;

  @ApiPropertyOptional({ description: 'Record subtitle', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  subtitle?: string;

  @ApiPropertyOptional({ description: 'Primary author', maxLength: 300 })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  author?: string;

  @ApiPropertyOptional({ description: 'Additional authors', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  additionalAuthors?: string[];

  @ApiPropertyOptional({ description: 'ISBN', maxLength: 20 })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  isbn?: string;

  @ApiPropertyOptional({ description: 'ISSN', maxLength: 20 })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  issn?: string;

  @ApiPropertyOptional({ description: 'Publication year' })
  @IsOptional()
  @IsNumber()
  @Min(1000)
  publicationYear?: number;

  @ApiPropertyOptional({ description: 'Publisher', maxLength: 300 })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  publisher?: string;

  @ApiPropertyOptional({ description: 'Publication place', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  publicationPlace?: string;

  @ApiPropertyOptional({ description: 'Edition', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  edition?: string;

  @ApiPropertyOptional({ description: 'Physical description' })
  @IsOptional()
  @IsString()
  physicalDescription?: string;

  @ApiPropertyOptional({ description: 'Summary/abstract' })
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Subject headings', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  subjects?: string[];

  @ApiProperty({ 
    description: 'Material type',
    enum: ['book', 'journal', 'newspaper', 'magazine', 'dvd', 'cd', 'ebook', 'audiobook', 'map', 'manuscript', 'thesis', 'other'],
    default: 'book'
  })
  @IsEnum(['book', 'journal', 'newspaper', 'magazine', 'dvd', 'cd', 'ebook', 'audiobook', 'map', 'manuscript', 'thesis', 'other'])
  materialType: string = 'book';

  @ApiPropertyOptional({ description: 'Language code (ISO 639)', maxLength: 10 })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  language?: string;

  @ApiPropertyOptional({ description: 'Dewey Decimal Classification', maxLength: 20 })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  deweyDecimal?: string;

  @ApiPropertyOptional({ description: 'Library of Congress Classification', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  lcClassification?: string;

  @ApiPropertyOptional({ description: 'Call number', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  callNumber?: string;

  @ApiProperty({ 
    description: 'Cataloging level',
    enum: ['minimal', 'core', 'full', 'enhanced'],
    default: 'full'
  })
  @IsEnum(['minimal', 'core', 'full', 'enhanced'])
  catalogingLevel: string = 'full';

  @ApiPropertyOptional({ description: 'Cataloged by', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  catalogedBy?: string;

  @ApiPropertyOptional({ description: 'Cataloged date' })
  @IsOptional()
  @IsDateString()
  catalogedDate?: string;

  @ApiPropertyOptional({ description: 'Is record active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @ApiPropertyOptional({ description: 'Is record suppressed from public view', default: false })
  @IsOptional()
  @IsBoolean()
  isSuppressed?: boolean = false;
}
