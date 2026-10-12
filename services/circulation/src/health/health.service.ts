import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { 
  HealthCheckService, 
  TypeOrmHealthIndicator, 
  HealthCheck,
  HealthIndicatorResult 
} from '@nestjs/terminus';
import { Patron } from '../patrons/entities/patron.entity';
import { Loan } from '../loans/entities/loan.entity';

@Injectable()
export class HealthService {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
    @InjectRepository(Patron)
    private readonly patronRepository: Repository<Patron>,
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
  ) {}

  @HealthCheck()
  async check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.circulationServiceCheck(),
    ]);
  }

  private async circulationServiceCheck(): Promise<HealthIndicatorResult> {
    const isHealthy = await this.isCirculationServiceHealthy();
    const result = this.getHealthIndicatorResult('circulation_service', isHealthy);
    
    if (!isHealthy) {
      throw new Error('Circulation service is not healthy');
    }
    
    return result;
  }

  private async isCirculationServiceHealthy(): Promise<boolean> {
    try {
      // Check if we can query the main tables
      await this.patronRepository.count();
      await this.loanRepository.count();
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
      const [totalPatrons, activePatrons, totalLoans, activeLoans] = await Promise.all([
        this.patronRepository.count(),
        this.patronRepository.count({ where: { status: 'active' } }),
        this.loanRepository.count(),
        this.loanRepository.count({ where: { status: 'active' } }),
      ]);

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
            name: 'circulation_service',
            status: 'healthy',
            lastChecked: new Date().toISOString(),
            metadata: {
              totalPatrons,
              activePatrons,
              totalLoans,
              activeLoans,
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
      await this.patronRepository.query('SELECT 1');
      return Date.now() - start;
    } catch (error) {
      return -1;
    }
  }
}
