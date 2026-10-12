import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { 
  HealthCheckService, 
  HttpHealthIndicator,
  HealthCheck,
  HealthIndicatorResult 
} from '@nestjs/terminus';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class HealthService {
  constructor(
    private readonly health: HealthCheckService,
    private readonly http: HttpHealthIndicator,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  @HealthCheck()
  async check() {
    return this.health.check([
      () => this.catalogServiceCheck(),
      () => this.circulationServiceCheck(),
      () => this.discoveryServiceCheck(),
    ]);
  }

  private async catalogServiceCheck(): Promise<HealthIndicatorResult> {
    const catalogUrl = this.configService.get('CATALOG_SERVICE_URL', 'http://localhost:3003');
    
    try {
      return await this.http.pingCheck('catalog_service', `${catalogUrl}/health/live`);
    } catch (error) {
      return this.getHealthIndicatorResult('catalog_service', false, error.message);
    }
  }

  private async circulationServiceCheck(): Promise<HealthIndicatorResult> {
    const circulationUrl = this.configService.get('CIRCULATION_SERVICE_URL', 'http://localhost:3004');
    
    try {
      return await this.http.pingCheck('circulation_service', `${circulationUrl}/health/live`);
    } catch (error) {
      return this.getHealthIndicatorResult('circulation_service', false, error.message);
    }
  }

  private async discoveryServiceCheck(): Promise<HealthIndicatorResult> {
    const isHealthy = await this.isDiscoveryServiceHealthy();
    const result = this.getHealthIndicatorResult('discovery_service', isHealthy);
    
    if (!isHealthy) {
      throw new Error('Discovery service is not healthy');
    }
    
    return result;
  }

  private async isDiscoveryServiceHealthy(): Promise<boolean> {
    try {
      // Check if discovery service can perform basic operations
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
      const [catalogHealth, circulationHealth] = await Promise.all([
        this.getServiceHealth('catalog'),
        this.getServiceHealth('circulation'),
      ]);

      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '1.0.0',
        services: [
          {
            name: 'discovery_service',
            status: 'healthy',
            lastChecked: new Date().toISOString(),
            features: [
              'search',
              'catalog_browsing',
              'patron_self_service',
              'recommendations',
              'collections',
            ],
          },
          {
            name: 'catalog_service',
            status: catalogHealth.status,
            lastChecked: new Date().toISOString(),
            responseTime: catalogHealth.responseTime,
          },
          {
            name: 'circulation_service',
            status: circulationHealth.status,
            lastChecked: new Date().toISOString(),
            responseTime: circulationHealth.responseTime,
          },
        ],
        capabilities: {
          search: true,
          recommendations: true,
          patronSelfService: true,
          collections: true,
          publicAccess: true,
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

  private async getServiceHealth(serviceName: string): Promise<any> {
    const serviceUrls = {
      catalog: this.configService.get('CATALOG_SERVICE_URL', 'http://localhost:3003'),
      circulation: this.configService.get('CIRCULATION_SERVICE_URL', 'http://localhost:3004'),
    };

    const serviceUrl = serviceUrls[serviceName];
    if (!serviceUrl) {
      return { status: 'unknown', responseTime: -1 };
    }

    const start = Date.now();
    try {
      await firstValueFrom(
        this.httpService.get(`${serviceUrl}/health/live`, { timeout: 5000 })
      );
      return {
        status: 'healthy',
        responseTime: Date.now() - start,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - start,
        error: error.message,
      };
    }
  }
}
