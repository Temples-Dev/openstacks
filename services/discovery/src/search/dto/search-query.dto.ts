import { IsString, IsOptional, IsNumber, IsBoolean, IsObject, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SearchQueryDto {
  @ApiProperty({ 
    description: 'Search query string',
    example: 'javascript programming'
  })
  @IsString()
  query: string;

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
    enum: ['relevance', 'title', 'author', 'publication_date', 'popularity'],
    default: 'relevance'
  })
  @IsOptional()
  @IsString()
  sort?: string = 'relevance';

  @ApiPropertyOptional({ 
    description: 'Enable fuzzy search for typo tolerance',
    default: false
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  fuzzy?: boolean = false;

  @ApiPropertyOptional({ 
    description: 'Search filters object',
    example: {
      materialType: 'book',
      language: 'en',
      publicationYear: '2020'
    }
  })
  @IsOptional()
  @IsObject()
  filters?: {
    materialType?: string;
    language?: string;
    publicationYear?: string;
    author?: string;
    subject?: string;
    availability?: string;
    location?: string;
  };

  @ApiPropertyOptional({ 
    description: 'Search scope',
    enum: ['all', 'title', 'author', 'subject', 'isbn'],
    default: 'all'
  })
  @IsOptional()
  @IsString()
  scope?: string = 'all';

  @ApiPropertyOptional({ 
    description: 'Include facets in response',
    default: true
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeFacets?: boolean = true;

  @ApiPropertyOptional({ 
    description: 'Include suggestions in response',
    default: true
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeSuggestions?: boolean = true;
}
