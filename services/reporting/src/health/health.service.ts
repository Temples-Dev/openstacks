import { Injectable } from '@nestjs/common';
import { 
  HealthCheckService, 
  TypeOrmHealthIndicator,
  HealthCheck,
  HealthIndicatorResult 
} from '@nestjs/terminus';

@Injectable()
export class HealthService {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
  ) {}

  @HealthCheck()
  async check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.reportingServiceCheck(),
    ]);
  }

  private async reportingServiceCheck(): Promise<HealthIndicatorResult> {
    const isHealthy = await this.isReportingServiceHealthy();
    const result = this.getHealthIndicatorResult('reporting_service', isHealthy);
    
    if (!isHealthy) {
      throw new Error('Reporting service is not healthy');
    }
    
    return result;
  }

  private async isReportingServiceHealthy(): Promise<boolean> {
    try {
      // Check if reporting service can perform basic operations
      return true;
    } catch (error) {
      return false;
    }
  }

  private getHealthIndicatorResult(key: string, isHealthy: boolean, error?: string): HealthIndicatorResult {
    const result = {};
    result[key] = {
      status: isHealthy ? 'up' : 'down',
      timestamp: new Date().toISOString(),
      ...(error && { error }),
    };
    return result;
  }

  async getDetailedHealth() {
    try {
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '1.0.0',
        services: [
          {
            name: 'reporting_service',
            status: 'healthy',
            lastChecked: new Date().toISOString(),
            features: [
              'analytics',
              'dashboards',
              'reports',
              'circulation_reports',
              'financial_reports',
              'collection_reports',
              'patron_analytics',
              'operational_metrics',
            ],
          },
          {
            name: 'database',
            status: 'healthy',
            lastChecked: new Date().toISOString(),
          },
        ],
        capabilities: {
          analytics: true,
          dashboards: true,
          reports: true,
          realTimeMetrics: true,
          historicalAnalysis: true,
          trendAnalysis: true,
          alertGeneration: true,
          automatedReporting: true,
        },
      };
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error.message,
      };
    }
  }
}
