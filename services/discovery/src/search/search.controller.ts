import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { SearchService } from './search.service';
import { SearchQueryDto } from './dto/search-query.dto';
import { AdvancedSearchDto } from './dto/advanced-search.dto';
import { SearchResultsDto } from './dto/search-results.dto';

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({ summary: 'Basic catalog search' })
  @ApiResponse({ 
    status: 200, 
    description: 'Search results',
    type: SearchResultsDto
  })
  @ApiResponse({ status: 400, description: 'Invalid search parameters' })
  async search(@Query() searchQuery: SearchQueryDto): Promise<SearchResultsDto> {
    return this.searchService.search(searchQuery);
  }

  @Post('advanced')
  @ApiOperation({ summary: 'Advanced catalog search with multiple criteria' })
  @ApiResponse({ 
    status: 200, 
    description: 'Advanced search results',
    type: SearchResultsDto
  })
  @ApiResponse({ status: 400, description: 'Invalid search parameters' })
  async advancedSearch(@Body() advancedQuery: AdvancedSearchDto): Promise<SearchResultsDto> {
    return this.searchService.advancedSearch(advancedQuery);
  }

  @Get('suggestions')
  @ApiOperation({ summary: 'Get search suggestions for autocomplete' })
  @ApiQuery({ 
    name: 'q', 
    description: 'Partial search query',
    example: 'javascr'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Search suggestions',
    schema: {
      type: 'object',
      properties: {
        suggestions: {
          type: 'array',
          items: { type: 'string' }
        }
      }
    }
  })
  async getSuggestions(@Query('q') query: string) {
    const suggestions = await this.searchService.getSuggestedSearches(query);
    return { suggestions };
  }

  @Get('popular')
  @ApiOperation({ summary: 'Get popular search terms' })
  @ApiResponse({ 
    status: 200, 
    description: 'Popular search terms',
    schema: {
      type: 'object',
      properties: {
        popularSearches: {
          type: 'array',
          items: { type: 'string' }
        }
      }
    }
  })
  async getPopularSearches() {
    const popularSearches = await this.searchService.getPopularSearches();
    return { popularSearches };
  }

  @Get('recent/:patronId')
  @ApiOperation({ summary: 'Get recent searches for a patron' })
  @ApiParam({ name: 'patronId', description: 'Patron ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Recent search terms',
    schema: {
      type: 'object',
      properties: {
        recentSearches: {
          type: 'array',
          items: { type: 'string' }
        }
      }
    }
  })
  async getRecentSearches(@Param('patronId') patronId: string) {
    const recentSearches = await this.searchService.getRecentSearches(patronId);
    return { recentSearches };
  }
}
