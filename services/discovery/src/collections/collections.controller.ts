import {
  Controller,
  Get,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { CollectionsService } from './collections.service';

@ApiTags('collections')
@Controller('collections')
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Get('featured')
  @ApiOperation({ summary: 'Get featured collections and exhibits' })
  @ApiResponse({ 
    status: 200, 
    description: 'Featured collections',
    schema: {
      type: 'object',
      properties: {
        collections: {
          type: 'array',
          items: { type: 'object' }
        }
      }
    }
  })
  async getFeaturedCollections() {
    const collections = await this.collectionsService.getFeaturedCollections();
    return { collections };
  }

  @Get('seasonal')
  @ApiOperation({ summary: 'Get seasonal collections' })
  @ApiResponse({ 
    status: 200, 
    description: 'Seasonal collections',
    schema: {
      type: 'object',
      properties: {
        collections: {
          type: 'array',
          items: { type: 'object' }
        }
      }
    }
  })
  async getSeasonalCollections() {
    const collections = await this.collectionsService.getSeasonalCollections();
    return { collections };
  }

  @Get('exhibits')
  @ApiOperation({ summary: 'Get current exhibits' })
  @ApiResponse({ 
    status: 200, 
    description: 'Current exhibits',
    schema: {
      type: 'object',
      properties: {
        exhibits: {
          type: 'array',
          items: { type: 'object' }
        }
      }
    }
  })
  async getExhibitCollections() {
    const exhibits = await this.collectionsService.getExhibitCollections();
    return { exhibits };
  }

  @Get('subject-guides')
  @ApiOperation({ summary: 'Get subject research guides' })
  @ApiResponse({ 
    status: 200, 
    description: 'Subject guides',
    schema: {
      type: 'object',
      properties: {
        guides: {
          type: 'array',
          items: { type: 'object' }
        }
      }
    }
  })
  async getSubjectGuides() {
    const guides = await this.collectionsService.getSubjectGuides();
    return { guides };
  }

  @Get('local-history')
  @ApiOperation({ summary: 'Get local history collection' })
  @ApiResponse({ 
    status: 200, 
    description: 'Local history collection',
    schema: { type: 'object' }
  })
  async getLocalHistoryCollection() {
    return this.collectionsService.getLocalHistoryCollection();
  }

  @Get('theme/:theme')
  @ApiOperation({ summary: 'Get collection by theme' })
  @ApiParam({ name: 'theme', description: 'Collection theme' })
  @ApiResponse({ 
    status: 200, 
    description: 'Themed collection',
    schema: { type: 'object' }
  })
  async getCollectionByTheme(@Param('theme') theme: string) {
    return this.collectionsService.getCollectionByTheme(theme);
  }
}
