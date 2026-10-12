import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SearchFacetValueDto {
  @ApiProperty({ description: 'Facet value' })
  value: string;

  @ApiProperty({ description: 'Number of items with this value' })
  count: number;
}

export class SearchFacetDto {
  @ApiProperty({ description: 'Facet display name' })
  name: string;

  @ApiProperty({ description: 'Facet field name' })
  field: string;

  @ApiProperty({ 
    description: 'Facet values with counts',
    type: [SearchFacetValueDto]
  })
  values: SearchFacetValueDto[];
}

export class AvailabilityDto {
  @ApiProperty({ 
    description: 'Availability status',
    enum: ['available', 'checked_out', 'on_hold', 'in_processing', 'missing']
  })
  status: string;

  @ApiProperty({ description: 'Total number of copies' })
  totalCopies: number;

  @ApiProperty({ description: 'Number of available copies' })
  availableCopies: number;

  @ApiPropertyOptional({ description: 'Next available date if all copies are checked out' })
  nextAvailableDate?: Date;
}

export class SearchItemDto {
  @ApiProperty({ description: 'Catalog record ID' })
  id: string;

  @ApiProperty({ description: 'Item title' })
  title: string;

  @ApiPropertyOptional({ description: 'Item subtitle' })
  subtitle?: string;

  @ApiPropertyOptional({ description: 'Primary author' })
  author?: string;

  @ApiPropertyOptional({ description: 'Additional authors' })
  additionalAuthors?: string[];

  @ApiPropertyOptional({ description: 'ISBN' })
  isbn?: string;

  @ApiPropertyOptional({ description: 'ISSN' })
  issn?: string;

  @ApiPropertyOptional({ description: 'Publisher' })
  publisher?: string;

  @ApiPropertyOptional({ description: 'Publication year' })
  publicationYear?: number;

  @ApiPropertyOptional({ description: 'Material type' })
  materialType?: string;

  @ApiPropertyOptional({ description: 'Language' })
  language?: string;

  @ApiPropertyOptional({ description: 'Subject headings' })
  subjects?: string[];

  @ApiPropertyOptional({ description: 'Summary/description' })
  summary?: string;

  @ApiPropertyOptional({ description: 'Call number' })
  callNumber?: string;

  @ApiPropertyOptional({ description: 'Physical description' })
  physicalDescription?: string;

  @ApiProperty({ 
    description: 'Availability information',
    type: AvailabilityDto
  })
  availability: AvailabilityDto;

  @ApiPropertyOptional({ description: 'Cover image URL' })
  coverImageUrl?: string;

  @ApiPropertyOptional({ description: 'Formatted citation' })
  citation?: string;

  @ApiPropertyOptional({ description: 'Relevance score (0-10)' })
  relevanceScore?: number;

  @ApiPropertyOptional({ description: 'Fuzzy search score (0-1)' })
  fuzzyScore?: number;

  @ApiPropertyOptional({ description: 'Patron-friendly description' })
  description?: string;
}

export class SearchResultsDto {
  @ApiProperty({ 
    description: 'Search result items',
    type: [SearchItemDto]
  })
  items: SearchItemDto[];

  @ApiProperty({ description: 'Total number of results' })
  totalCount: number;

  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Results per page' })
  limit: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages: number;

  @ApiProperty({ description: 'Search execution time in milliseconds' })
  searchTime: number;

  @ApiProperty({ description: 'Original search query' })
  query: string;

  @ApiProperty({ 
    description: 'Type of search performed',
    enum: ['basic', 'advanced', 'browse']
  })
  searchType: string;

  @ApiPropertyOptional({ 
    description: 'Search facets for filtering',
    type: [SearchFacetDto]
  })
  facets?: SearchFacetDto[];

  @ApiPropertyOptional({ 
    description: 'Search suggestions and corrections',
    type: [String]
  })
  suggestions?: string[];

  @ApiPropertyOptional({ description: 'Applied filters' })
  appliedFilters?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Related searches' })
  relatedSearches?: string[];

  @ApiPropertyOptional({ description: 'Search tips for better results' })
  searchTips?: string[];
}
