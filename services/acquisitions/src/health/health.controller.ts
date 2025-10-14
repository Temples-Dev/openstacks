import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Get service health status' })
  @ApiResponse({ status: 200, description: 'Health check successful' })
  @ApiResponse({ status: 503, description: 'Service unhealthy' })
  async getHealth() {
    return this.healthService.check();
  }

  @Get('ready')
  @ApiOperation({ summary: 'Get service readiness status' })
  @ApiResponse({ status: 200, description: 'Service is ready' })
  @ApiResponse({ status: 503, description: 'Service not ready' })
  async getReadiness() {
    return this.healthService.check();
  }

  @Get('live')
  @ApiOperation({ summary: 'Get service liveness status' })
  @ApiResponse({ status: 200, description: 'Service is alive' })
  async getLiveness() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  @Get('detailed')
  @ApiOperation({ summary: 'Get detailed health information' })
  @ApiResponse({ status: 200, description: 'Detailed health information' })
  async getDetailedHealth() {
    return this.healthService.getDetailedHealth();
  }
}
