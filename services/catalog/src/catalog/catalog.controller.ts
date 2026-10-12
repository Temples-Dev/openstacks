import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpStatus,
  HttpCode,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CatalogService } from './catalog.service';
import { CreateCatalogRecordDto } from './dto/create-catalog-record.dto';
import { UpdateCatalogRecordDto } from './dto/update-catalog-record.dto';
import { SearchCatalogDto } from './dto/search-catalog.dto';
import { CatalogRecord } from './entities/catalog-record.entity';

@ApiTags('catalog')
@ApiBearerAuth()
@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new catalog record' })
  @ApiResponse({
    status: 201,
    description: 'Catalog record created successfully',
    type: CatalogRecord,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async create(@Body() createCatalogRecordDto: CreateCatalogRecordDto): Promise<CatalogRecord> {
    return this.catalogService.create(createCatalogRecordDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all catalog records' })
  @ApiResponse({
    status: 200,
    description: 'List of catalog records',
    type: [CatalogRecord],
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of records to return' })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Number of records to skip' })
  async findAll(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<CatalogRecord[]> {
    const options = {};
    if (limit) options['take'] = limit;
    if (offset) options['skip'] = offset;
    
    return this.catalogService.findAll(options);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search catalog records' })
  @ApiResponse({
    status: 200,
    description: 'Search results',
    schema: {
      type: 'object',
      properties: {
        records: { type: 'array', items: { $ref: '#/components/schemas/CatalogRecord' } },
        total: { type: 'number' },
        page: { type: 'number' },
        totalPages: { type: 'number' },
      },
    },
  })
  async search(@Query() searchDto: SearchCatalogDto) {
    return this.catalogService.search(searchDto);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get catalog statistics' })
  @ApiResponse({
    status: 200,
    description: 'Catalog statistics',
    schema: {
      type: 'object',
      properties: {
        totalRecords: { type: 'number' },
        activeRecords: { type: 'number' },
        suppressedRecords: { type: 'number' },
        recordsByMaterialType: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              materialType: { type: 'string' },
              count: { type: 'number' },
            },
          },
        },
        recordsByLanguage: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              language: { type: 'string' },
              count: { type: 'number' },
            },
          },
        },
        recentlyAdded: { type: 'number' },
      },
    },
  })
  async getStatistics() {
    return this.catalogService.getStatistics();
  }

  @Get('isbn/:isbn')
  @ApiOperation({ summary: 'Find catalog records by ISBN' })
  @ApiParam({ name: 'isbn', description: 'ISBN to search for' })
  @ApiResponse({
    status: 200,
    description: 'Catalog records with matching ISBN',
    type: [CatalogRecord],
  })
  async findByIsbn(@Param('isbn') isbn: string): Promise<CatalogRecord[]> {
    return this.catalogService.findByIsbn(isbn);
  }

  @Get('issn/:issn')
  @ApiOperation({ summary: 'Find catalog records by ISSN' })
  @ApiParam({ name: 'issn', description: 'ISSN to search for' })
  @ApiResponse({
    status: 200,
    description: 'Catalog records with matching ISSN',
    type: [CatalogRecord],
  })
  async findByIssn(@Param('issn') issn: string): Promise<CatalogRecord[]> {
    return this.catalogService.findByIssn(issn);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a catalog record by ID' })
  @ApiParam({ name: 'id', description: 'Catalog record UUID' })
  @ApiResponse({
    status: 200,
    description: 'Catalog record details',
    type: CatalogRecord,
  })
  @ApiResponse({ status: 404, description: 'Catalog record not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<CatalogRecord> {
    return this.catalogService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a catalog record' })
  @ApiParam({ name: 'id', description: 'Catalog record UUID' })
  @ApiResponse({
    status: 200,
    description: 'Catalog record updated successfully',
    type: CatalogRecord,
  })
  @ApiResponse({ status: 404, description: 'Catalog record not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCatalogRecordDto: UpdateCatalogRecordDto,
  ): Promise<CatalogRecord> {
    return this.catalogService.update(id, updateCatalogRecordDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a catalog record (soft delete)' })
  @ApiParam({ name: 'id', description: 'Catalog record UUID' })
  @ApiResponse({ status: 204, description: 'Catalog record deleted successfully' })
  @ApiResponse({ status: 404, description: 'Catalog record not found' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.catalogService.remove(id);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore a deleted catalog record' })
  @ApiParam({ name: 'id', description: 'Catalog record UUID' })
  @ApiResponse({
    status: 200,
    description: 'Catalog record restored successfully',
    type: CatalogRecord,
  })
  @ApiResponse({ status: 404, description: 'Catalog record not found' })
  async restore(@Param('id', ParseUUIDPipe) id: string): Promise<CatalogRecord> {
    return this.catalogService.restore(id);
  }

  @Post(':id/suppress')
  @ApiOperation({ summary: 'Suppress a catalog record from public view' })
  @ApiParam({ name: 'id', description: 'Catalog record UUID' })
  @ApiResponse({
    status: 200,
    description: 'Catalog record suppressed successfully',
    type: CatalogRecord,
  })
  @ApiResponse({ status: 404, description: 'Catalog record not found' })
  async suppress(@Param('id', ParseUUIDPipe) id: string): Promise<CatalogRecord> {
    return this.catalogService.suppress(id);
  }

  @Post(':id/unsuppress')
  @ApiOperation({ summary: 'Unsuppress a catalog record' })
  @ApiParam({ name: 'id', description: 'Catalog record UUID' })
  @ApiResponse({
    status: 200,
    description: 'Catalog record unsuppressed successfully',
    type: CatalogRecord,
  })
  @ApiResponse({ status: 404, description: 'Catalog record not found' })
  async unsuppress(@Param('id', ParseUUIDPipe) id: string): Promise<CatalogRecord> {
    return this.catalogService.unsuppress(id);
  }
}
