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
import { CatalogService } from './catalog.service';

@ApiTags('catalog')
@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('item/:id')
  @ApiOperation({ summary: 'Get detailed information about a catalog item' })
  @ApiParam({ name: 'id', description: 'Catalog record ID' })
  @ApiResponse({ status: 200, description: 'Item details retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Item not found' })
  async getItemDetails(@Param('id', ParseUUIDPipe) id: string) {
    return this.catalogService.getItemDetails(id);
  }

  @Get('browse/subject')
  @ApiOperation({ summary: 'Browse items by subject' })
  @ApiQuery({ name: 'subject', description: 'Subject heading' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiResponse({ status: 200, description: 'Browse results' })
  async browseBySubject(
    @Query('subject') subject: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.catalogService.browseBySubject(subject, page, limit);
  }

  @Get('browse/author')
  @ApiOperation({ summary: 'Browse items by author' })
  @ApiQuery({ name: 'author', description: 'Author name' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiResponse({ status: 200, description: 'Browse results' })
  async browseByAuthor(
    @Query('author') author: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.catalogService.browseByAuthor(author, page, limit);
  }

  @Get('browse/call-number')
  @ApiOperation({ summary: 'Browse items by call number range' })
  @ApiQuery({ name: 'callNumber', description: 'Call number or range start' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiResponse({ status: 200, description: 'Browse results' })
  async browseByCallNumber(
    @Query('callNumber') callNumber: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.catalogService.browseByCallNumber(callNumber, page, limit);
  }

  @Get('material-type/:type')
  @ApiOperation({ summary: 'Get items by material type' })
  @ApiParam({ 
    name: 'type', 
    description: 'Material type',
    enum: ['book', 'ebook', 'journal', 'dvd', 'cd', 'audiobook', 'map', 'manuscript']
  })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiResponse({ status: 200, description: 'Items by material type' })
  async getItemsByMaterialType(
    @Param('type') type: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.catalogService.getItemsByMaterialType(type, page, limit);
  }

  @Get('new-acquisitions')
  @ApiOperation({ summary: 'Get recently acquired items' })
  @ApiQuery({ name: 'days', required: false, description: 'Number of days back to look' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiResponse({ status: 200, description: 'New acquisitions' })
  async getNewAcquisitions(
    @Query('days') days?: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.catalogService.getNewAcquisitions(days, page, limit);
  }

  @Get('featured')
  @ApiOperation({ summary: 'Get featured items and collections' })
  @ApiResponse({ 
    status: 200, 
    description: 'Featured items',
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
  async getFeaturedItems() {
    const items = await this.catalogService.getFeaturedItems();
    return { items };
  }

  @Get('item/:id/related')
  @ApiOperation({ summary: 'Get items related to the specified item' })
  @ApiParam({ name: 'id', description: 'Catalog record ID' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of related items' })
  @ApiResponse({ status: 200, description: 'Related items' })
  async getRelatedItems(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('limit') limit?: number,
  ) {
    const items = await this.catalogService.getRelatedItems(id, limit);
    return { items };
  }
}
