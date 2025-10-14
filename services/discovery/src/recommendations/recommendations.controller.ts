import {
  Controller,
  Get,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { RecommendationsService } from './recommendations.service';

@ApiTags('recommendations')
@Controller('recommendations')
export class RecommendationsController {
  constructor(private readonly recommendationsService: RecommendationsService) {}

  @Get('personalized/:patronId')
  @ApiOperation({ summary: 'Get personalized recommendations for a patron' })
  @ApiParam({ name: 'patronId', description: 'Patron ID' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of recommendations' })
  @ApiResponse({ 
    status: 200, 
    description: 'Personalized recommendations',
    schema: {
      type: 'object',
      properties: {
        recommendations: {
          type: 'array',
          items: { type: 'object' }
        }
      }
    }
  })
  async getPersonalizedRecommendations(
    @Param('patronId', ParseUUIDPipe) patronId: string,
    @Query('limit') limit?: number,
  ) {
    const recommendations = await this.recommendationsService.getPersonalizedRecommendations(
      patronId, 
      limit
    );
    return { recommendations };
  }

  @Get('similar/:itemId')
  @ApiOperation({ summary: 'Get items similar to the specified item' })
  @ApiParam({ name: 'itemId', description: 'Item ID' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of similar items' })
  @ApiResponse({ 
    status: 200, 
    description: 'Similar items',
    schema: {
      type: 'object',
      properties: {
        similarItems: {
          type: 'array',
          items: { type: 'object' }
        }
      }
    }
  })
  async getSimilarItems(
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Query('limit') limit?: number,
  ) {
    const similarItems = await this.recommendationsService.getSimilarItems(itemId, limit);
    return { similarItems };
  }

  @Get('popular')
  @ApiOperation({ summary: 'Get popular items' })
  @ApiQuery({ 
    name: 'period', 
    required: false,
    enum: ['week', 'month', 'year'],
    description: 'Time period for popularity'
  })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of popular items' })
  @ApiResponse({ 
    status: 200, 
    description: 'Popular items',
    schema: {
      type: 'object',
      properties: {
        popularItems: {
          type: 'array',
          items: { type: 'object' }
        }
      }
    }
  })
  async getPopularItems(
    @Query('period') period?: 'week' | 'month' | 'year',
    @Query('limit') limit?: number,
  ) {
    const popularItems = await this.recommendationsService.getPopularItems(period, limit);
    return { popularItems };
  }

  @Get('new-and-noteworthy')
  @ApiOperation({ summary: 'Get new and noteworthy items' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of items' })
  @ApiResponse({ 
    status: 200, 
    description: 'New and noteworthy items',
    schema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: { type: 'object' }
        }
      }
    }
  })
  async getNewAndNoteworthy(@Query('limit') limit?: number) {
    const items = await this.recommendationsService.getNewAndNoteworthy(limit);
    return { items };
  }

  @Get('by-subject')
  @ApiOperation({ summary: 'Get recommendations by subject' })
  @ApiQuery({ name: 'subject', description: 'Subject heading' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of recommendations' })
  @ApiResponse({ 
    status: 200, 
    description: 'Subject-based recommendations',
    schema: {
      type: 'object',
      properties: {
        recommendations: {
          type: 'array',
          items: { type: 'object' }
        }
      }
    }
  })
  async getRecommendationsBySubject(
    @Query('subject') subject: string,
    @Query('limit') limit?: number,
  ) {
    const recommendations = await this.recommendationsService.getRecommendationsBySubject(
      subject, 
      limit
    );
    return { recommendations };
  }

  @Get('staff-picks')
  @ApiOperation({ summary: 'Get staff-curated recommendations' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of staff picks' })
  @ApiResponse({ 
    status: 200, 
    description: 'Staff picks',
    schema: {
      type: 'object',
      properties: {
        staffPicks: {
          type: 'array',
          items: { type: 'object' }
        }
      }
    }
  })
  async getStaffPicks(@Query('limit') limit?: number) {
    const staffPicks = await this.recommendationsService.getStaffPicks(limit);
    return { staffPicks };
  }

  @Get('award-winners')
  @ApiOperation({ summary: 'Get award-winning items' })
  @ApiQuery({ name: 'year', required: false, description: 'Award year' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of award winners' })
  @ApiResponse({ 
    status: 200, 
    description: 'Award winners',
    schema: {
      type: 'object',
      properties: {
        awardWinners: {
          type: 'array',
          items: { type: 'object' }
        }
      }
    }
  })
  async getAwardWinners(
    @Query('year') year?: number,
    @Query('limit') limit?: number,
  ) {
    const awardWinners = await this.recommendationsService.getAwardWinners(year, limit);
    return { awardWinners };
  }

  @Get('trending-topics')
  @ApiOperation({ summary: 'Get trending topics and subjects' })
  @ApiResponse({ 
    status: 200, 
    description: 'Trending topics',
    schema: {
      type: 'object',
      properties: {
        trendingTopics: {
          type: 'array',
          items: { type: 'string' }
        }
      }
    }
  })
  async getTrendingTopics() {
    const trendingTopics = await this.recommendationsService.getTrendingTopics();
    return { trendingTopics };
  }
}
