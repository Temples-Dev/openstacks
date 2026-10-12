import { Injectable } from '@nestjs/common';
import { HealthCheckResponse, ServiceHealth } from '@openstacks/types';

@Injectable()
export class HealthService {
  private readonly startTime = Date.now();

  async check(): Promise<HealthCheckResponse> {
    const services = await this.checkServices();
    const hasUnhealthyServices = services.some(
      (service) => service.status === 'unhealthy',
    );

    return {
      status: hasUnhealthyServices ? 'error' : 'ok',
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
      version: process.env.npm_package_version || '1.0.0',
      services,
    };
  }

  async isReady(): Promise<boolean> {
    const services = await this.checkServices();
    return services.every((service) => service.status !== 'unhealthy');
  }

  private async checkServices(): Promise<ServiceHealth[]> {
    const services: ServiceHealth[] = [];

    // Check database connectivity
    services.push(await this.checkDatabase());

    // Check Redis connectivity
    services.push(await this.checkRedis());

    // Check Elasticsearch connectivity
    services.push(await this.checkElasticsearch());

    return services;
  }

  private async checkDatabase(): Promise<ServiceHealth> {
    try {
      // TODO: Implement actual database health check
      return {
        name: 'postgresql',
        status: 'healthy',
        lastChecked: new Date().toISOString(),
        responseTime: 10,
      };
    } catch (error) {
      return {
        name: 'postgresql',
        status: 'unhealthy',
        lastChecked: new Date().toISOString(),
        details: error.message,
      };
    }
  }

  private async checkRedis(): Promise<ServiceHealth> {
    try {
      // TODO: Implement actual Redis health check
      return {
        name: 'redis',
        status: 'healthy',
        lastChecked: new Date().toISOString(),
        responseTime: 5,
      };
    } catch (error) {
      return {
        name: 'redis',
        status: 'unhealthy',
        lastChecked: new Date().toISOString(),
        details: error.message,
      };
    }
  }

  private async checkElasticsearch(): Promise<ServiceHealth> {
    try {
      // TODO: Implement actual Elasticsearch health check
      return {
        name: 'elasticsearch',
        status: 'healthy',
        lastChecked: new Date().toISOString(),
        responseTime: 15,
      };
    } catch (error) {
      return {
        name: 'elasticsearch',
        status: 'unhealthy',
        lastChecked: new Date().toISOString(),
        details: error.message,
      };
    }
  }
}
