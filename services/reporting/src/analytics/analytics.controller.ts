import {
  Controller,
  Get,
  Query,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';

@ApiTags('analytics')
@ApiBearerAuth()
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get comprehensive system overview and analytics' })
  @ApiResponse({ 
    status: 200, 
    description: 'System overview with all key metrics',
    schema: {
      type: 'object',
      properties: {
        timestamp: { type: 'string' },
        circulation: { type: 'object' },
        financial: { type: 'object' },
        collection: { type: 'object' },
        patron: { type: 'object' },
        system: { type: 'object' },
        alerts: { type: 'array' },
        trends: { type: 'object' }
      }
    }
  })
  async getSystemOverview() {
    return this.analyticsService.getSystemOverview();
  }

  @Get('circulation')
  @ApiOperation({ summary: 'Get circulation analytics and metrics' })
  @ApiResponse({ status: 200, description: 'Circulation metrics and statistics' })
  async getCirculationMetrics() {
    return this.analyticsService.getCirculationMetrics();
  }

  @Get('financial')
  @ApiOperation({ summary: 'Get financial analytics and budget metrics' })
  @ApiResponse({ status: 200, description: 'Financial metrics and budget statistics' })
  async getFinancialMetrics() {
    return this.analyticsService.getFinancialMetrics();
  }

  @Get('collection')
  @ApiOperation({ summary: 'Get collection analytics and statistics' })
  @ApiResponse({ status: 200, description: 'Collection metrics and analysis' })
  async getCollectionMetrics() {
    return this.analyticsService.getCollectionMetrics();
  }

  @Get('patron')
  @ApiOperation({ summary: 'Get patron analytics and usage statistics' })
  @ApiResponse({ status: 200, description: 'Patron metrics and demographics' })
  async getPatronMetrics() {
    return this.analyticsService.getPatronMetrics();
  }

  @Get('system')
  @ApiOperation({ summary: 'Get system health and performance metrics' })
  @ApiResponse({ status: 200, description: 'System health and performance statistics' })
  async getSystemMetrics() {
    return this.analyticsService.getSystemMetrics();
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Get current system alerts and warnings' })
  @ApiResponse({ 
    status: 200, 
    description: 'Current alerts and warnings',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: { type: 'string' },
          severity: { type: 'string' },
          message: { type: 'string' },
          timestamp: { type: 'string' }
        }
      }
    }
  })
  async getAlerts() {
    return this.analyticsService.generateAlerts();
  }

  @Get('trends')
  @ApiOperation({ summary: 'Get trend analysis for key metrics' })
  @ApiResponse({ 
    status: 200, 
    description: 'Trend analysis for circulation, financial, collection, and patron metrics' 
  })
  async getTrends() {
    return this.analyticsService.calculateTrends();
  }

  @Get('process/hourly')
  @ApiOperation({ summary: 'Manually trigger hourly metrics collection' })
  @ApiResponse({ status: 200, description: 'Hourly metrics collection initiated' })
  async processHourlyMetrics() {
    await this.analyticsService.collectHourlyMetrics();
    return { message: 'Hourly metrics collection initiated' };
  }

  @Get('process/daily')
  @ApiOperation({ summary: 'Manually trigger daily summary generation' })
  @ApiResponse({ status: 200, description: 'Daily summary generation initiated' })
  async processDailySummary() {
    await this.analyticsService.generateDailySummary();
    return { message: 'Daily summary generation initiated' };
  }

  @Get('process/weekly')
  @ApiOperation({ summary: 'Manually trigger weekly summary generation' })
  @ApiResponse({ status: 200, description: 'Weekly summary generation initiated' })
  async processWeeklySummary() {
    await this.analyticsService.generateWeeklySummary();
    return { message: 'Weekly summary generation initiated' };
  }

  @Get('process/monthly')
  @ApiOperation({ summary: 'Manually trigger monthly summary generation' })
  @ApiResponse({ status: 200, description: 'Monthly summary generation initiated' })
  async processMonthlySummary() {
    await this.analyticsService.generateMonthlySummary();
    return { message: 'Monthly summary generation initiated' };
  }
}
