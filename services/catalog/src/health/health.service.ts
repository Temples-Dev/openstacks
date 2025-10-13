import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { 
  HealthCheckService, 
  TypeOrmHealthIndicator, 
  HealthCheck,
  HealthIndicatorResult 
} from '@nestjs/terminus';
import { CatalogRecord } from '../catalog/entities/catalog-record.entity';

@Injectable()
export class HealthService {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
    @InjectRepository(CatalogRecord)
    private readonly catalogRecordRepository: Repository<CatalogRecord>,
  ) {}

  @HealthCheck()
  async check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.catalogServiceCheck(),
    ]);
  }

  private async catalogServiceCheck(): Promise<HealthIndicatorResult> {
    const isHealthy = await this.isCatalogServiceHealthy();
    const result = this.getHealthIndicatorResult('catalog_service', isHealthy);
    
    if (!isHealthy) {
      throw new Error('Catalog service is not healthy');
    }
    
    return result;
  }

  private async isCatalogServiceHealthy(): Promise<boolean> {
    try {
      // Check if we can query the catalog records table
      await this.catalogRecordRepository.count();
      return true;
    } catch (error) {
      return false;
    }
  }

  private getHealthIndicatorResult(key: string, isHealthy: boolean): HealthIndicatorResult {
    const result = {};
    result[key] = {
      status: isHealthy ? 'up' : 'down',
      timestamp: new Date().toISOString(),
    };
    return result;
  }

  async getDetailedHealth() {
    try {
      const totalRecords = await this.catalogRecordRepository.count();
      const activeRecords = await this.catalogRecordRepository.count({ 
        where: { isActive: true, isSuppressed: false } 
      });

      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '1.0.0',
        services: [
          {
            name: 'postgresql',
            status: 'healthy',
            lastChecked: new Date().toISOString(),
            responseTime: await this.measureDatabaseResponseTime(),
          },
          {
            name: 'catalog_service',
            status: 'healthy',
            lastChecked: new Date().toISOString(),
            metadata: {
              totalRecords,
              activeRecords,
            },
          },
        ],
      };
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error.message,
      };
    }
  }

  private async measureDatabaseResponseTime(): Promise<number> {
    const start = Date.now();
    try {
      await this.catalogRecordRepository.query('SELECT 1');
      return Date.now() - start;
    } catch (error) {
      return -1;
    }
  }
}
