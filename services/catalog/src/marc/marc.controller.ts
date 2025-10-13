import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiConsumes,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { MarcService } from './marc.service';

@ApiTags('marc')
@ApiBearerAuth()
@Controller('marc')
export class MarcController {
  constructor(private readonly marcService: MarcService) {}

  @Post('import')
  @ApiOperation({ summary: 'Import a MARC record' })
  @ApiResponse({ status: 201, description: 'MARC record imported successfully' })
  @ApiResponse({ status: 400, description: 'Invalid MARC data' })
  async importMarc(
    @Body() body: { marcData: string; format?: 'iso2709' | 'marcxml' | 'json' },
  ) {
    const { marcData, format = 'iso2709' } = body;
    
    if (!marcData) {
      throw new BadRequestException('MARC data is required');
    }

    return this.marcService.importMarcRecord(marcData, format);
  }

  @Post('import/file')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Import MARC records from file' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'MARC file imported successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file or MARC data' })
  async importMarcFile(
    @UploadedFile() file: any,
    @Query('format') format: 'iso2709' | 'marcxml' | 'json' = 'iso2709',
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const marcData = file.buffer.toString('utf-8');
    return this.marcService.importMarcRecord(marcData, format);
  }

  @Get(':id/export')
  @ApiOperation({ summary: 'Export a MARC record' })
  @ApiParam({ name: 'id', description: 'MARC record UUID' })
  @ApiQuery({ 
    name: 'format', 
    enum: ['iso2709', 'marcxml', 'json'], 
    required: false,
    description: 'Export format'
  })
  @ApiResponse({ status: 200, description: 'MARC record exported successfully' })
  @ApiResponse({ status: 404, description: 'MARC record not found' })
  async exportMarc(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('format') format: 'iso2709' | 'marcxml' | 'json' = 'marcxml',
  ) {
    const exportedData = await this.marcService.exportMarcRecord(id, format);
    
    return {
      format,
      data: exportedData,
    };
  }
}
