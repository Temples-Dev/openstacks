import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { HealthCheckResponse, ServiceHealth } from '@openstacks/types';

@Injectable()
export class HealthService {
  private readonly startTime = Date.now();

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

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

    return services;
  }

  private async checkDatabase(): Promise<ServiceHealth> {
    try {
      const startTime = Date.now();
      await this.userRepository.query('SELECT 1');
      const responseTime = Date.now() - startTime;

      return {
        name: 'postgresql',
        status: 'healthy',
        lastChecked: new Date().toISOString(),
        responseTime,
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
}
