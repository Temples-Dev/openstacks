import { IsOptional, IsString, IsNumber, IsEnum, IsArray, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SearchCatalogDto {
  @ApiPropertyOptional({ description: 'Search query' })
  @IsOptional()
  @IsString()
  query?: string;

  @ApiPropertyOptional({ description: 'Title search' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Author search' })
  @IsOptional()
  @IsString()
  author?: string;

  @ApiPropertyOptional({ description: 'Subject search' })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiPropertyOptional({ description: 'ISBN search' })
  @IsOptional()
  @IsString()
  isbn?: string;

  @ApiPropertyOptional({ description: 'ISSN search' })
  @IsOptional()
  @IsString()
  issn?: string;

  @ApiPropertyOptional({ description: 'Publisher search' })
  @IsOptional()
  @IsString()
  publisher?: string;

  @ApiPropertyOptional({ description: 'Call number search' })
  @IsOptional()
  @IsString()
  callNumber?: string;

  @ApiPropertyOptional({ 
    description: 'Material type filter',
    enum: ['book', 'journal', 'newspaper', 'magazine', 'dvd', 'cd', 'ebook', 'audiobook', 'map', 'manuscript', 'thesis', 'other']
  })
  @IsOptional()
  @IsEnum(['book', 'journal', 'newspaper', 'magazine', 'dvd', 'cd', 'ebook', 'audiobook', 'map', 'manuscript', 'thesis', 'other'])
  materialType?: string;

  @ApiPropertyOptional({ description: 'Language filter' })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({ description: 'Publication year from' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1000)
  publicationYearFrom?: number;

  @ApiPropertyOptional({ description: 'Publication year to' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1000)
  publicationYearTo?: number;

  @ApiPropertyOptional({ description: 'Location codes to search', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  locations?: string[];

  @ApiPropertyOptional({ description: 'Only show available items', default: false })
  @IsOptional()
  @Type(() => Boolean)
  availableOnly?: boolean = false;

  @ApiPropertyOptional({ description: 'Include suppressed records', default: false })
  @IsOptional()
  @Type(() => Boolean)
  includeSuppressed?: boolean = false;

  @ApiPropertyOptional({ 
    description: 'Search type',
    enum: ['keyword', 'title', 'author', 'subject', 'isbn', 'issn', 'call_number', 'advanced'],
    default: 'keyword'
  })
  @IsOptional()
  @IsEnum(['keyword', 'title', 'author', 'subject', 'isbn', 'issn', 'call_number', 'advanced'])
  searchType?: string = 'keyword';

  @ApiPropertyOptional({ 
    description: 'Sort by field',
    enum: ['relevance', 'title', 'author', 'publication_year', 'call_number', 'created_at'],
    default: 'relevance'
  })
  @IsOptional()
  @IsEnum(['relevance', 'title', 'author', 'publication_year', 'call_number', 'created_at'])
  sortBy?: string = 'relevance';

  @ApiPropertyOptional({ 
    description: 'Sort order',
    enum: ['asc', 'desc'],
    default: 'asc'
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: string = 'asc';

  @ApiPropertyOptional({ description: 'Page number', default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
