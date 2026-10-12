import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AdvancedSearchDto {
  @ApiPropertyOptional({ 
    description: 'Title search',
    example: 'JavaScript: The Good Parts'
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ 
    description: 'Author search',
    example: 'Douglas Crockford'
  })
  @IsOptional()
  @IsString()
  author?: string;

  @ApiPropertyOptional({ 
    description: 'Subject search',
    example: 'Computer Programming'
  })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiPropertyOptional({ 
    description: 'ISBN search',
    example: '9780596517748'
  })
  @IsOptional()
  @IsString()
  isbn?: string;

  @ApiPropertyOptional({ 
    description: 'ISSN search',
    example: '1234-5678'
  })
  @IsOptional()
  @IsString()
  issn?: string;

  @ApiPropertyOptional({ 
    description: 'Publisher search',
    example: 'O\'Reilly Media'
  })
  @IsOptional()
  @IsString()
  publisher?: string;

  @ApiPropertyOptional({ 
    description: 'Publication year',
    example: 2008
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  publicationYear?: number;

  @ApiPropertyOptional({ 
    description: 'Publication year range start',
    example: 2000
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  publicationYearFrom?: number;

  @ApiPropertyOptional({ 
    description: 'Publication year range end',
    example: 2023
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  publicationYearTo?: number;

  @ApiPropertyOptional({ 
    description: 'Material type',
    enum: ['book', 'ebook', 'journal', 'article', 'dvd', 'cd', 'audiobook', 'map', 'manuscript'],
    example: 'book'
  })
  @IsOptional()
  @IsString()
  materialType?: string;

  @ApiPropertyOptional({ 
    description: 'Language code',
    example: 'en'
  })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({ 
    description: 'Call number',
    example: 'QA76.73.J39'
  })
  @IsOptional()
  @IsString()
  callNumber?: string;

  @ApiPropertyOptional({ 
    description: 'Series title',
    example: 'O\'Reilly Animal Books'
  })
  @IsOptional()
  @IsString()
  series?: string;

  @ApiPropertyOptional({ 
    description: 'Keywords in description/summary',
    example: 'functional programming'
  })
  @IsOptional()
  @IsString()
  keywords?: string;

  @ApiPropertyOptional({ 
    description: 'Location/library',
    example: 'Main Library'
  })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ 
    description: 'Availability status',
    enum: ['available', 'checked_out', 'on_hold', 'in_processing'],
    example: 'available'
  })
  @IsOptional()
  @IsString()
  availability?: string;

  @ApiPropertyOptional({ 
    description: 'Page number for pagination',
    minimum: 1,
    default: 1
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ 
    description: 'Number of results per page',
    minimum: 1,
    maximum: 100,
    default: 20
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ 
    description: 'Sort order',
    enum: ['relevance', 'title', 'author', 'publication_date', 'call_number'],
    default: 'relevance'
  })
  @IsOptional()
  @IsString()
  sort?: string = 'relevance';

  @ApiPropertyOptional({ 
    description: 'Boolean operator for combining fields',
    enum: ['AND', 'OR'],
    default: 'AND'
  })
  @IsOptional()
  @IsString()
  operator?: string = 'AND';
}
