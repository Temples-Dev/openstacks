import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';
import { HealthCheckResponse } from '@openstacks/types';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({
    status: 200,
    description: 'Service health status',
    type: Object,
  })
  async check(): Promise<HealthCheckResponse> {
    return this.healthService.check();
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness check endpoint' })
  @ApiResponse({
    status: 200,
    description: 'Service readiness status',
  })
  async ready(): Promise<{ status: string }> {
    const isReady = await this.healthService.isReady();
    return { status: isReady ? 'ready' : 'not ready' };
  }

  @Get('live')
  @ApiOperation({ summary: 'Liveness check endpoint' })
  @ApiResponse({
    status: 200,
    description: 'Service liveness status',
  })
  live(): { status: string } {
    return { status: 'alive' };
  }
}
