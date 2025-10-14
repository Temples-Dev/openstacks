import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

import { Metric } from './entities/metric.entity';
import { DataSnapshot } from './entities/data-snapshot.entity';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);
  private readonly serviceUrls: Record<string, string>;

  constructor(
    @InjectRepository(Metric)
    private readonly metricRepository: Repository<Metric>,
    @InjectRepository(DataSnapshot)
    private readonly snapshotRepository: Repository<DataSnapshot>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.serviceUrls = {
      auth: this.configService.get('AUTH_SERVICE_URL', 'http://localhost:3002'),
      catalog: this.configService.get('CATALOG_SERVICE_URL', 'http://localhost:3003'),
      circulation: this.configService.get('CIRCULATION_SERVICE_URL', 'http://localhost:3004'),
      acquisitions: this.configService.get('ACQUISITIONS_SERVICE_URL', 'http://localhost:3005'),
      discovery: this.configService.get('DISCOVERY_SERVICE_URL', 'http://localhost:3006'),
    };
  }

  async getSystemOverview(): Promise<any> {
    try {
      this.logger.log('Generating system overview analytics');

      const [
        circulationMetrics,
        financialMetrics,
        collectionMetrics,
        patronMetrics,
        systemMetrics,
      ] = await Promise.all([
        this.getCirculationMetrics(),
        this.getFinancialMetrics(),
        this.getCollectionMetrics(),
        this.getPatronMetrics(),
        this.getSystemMetrics(),
      ]);

      const overview = {
        timestamp: new Date().toISOString(),
        circulation: circulationMetrics,
        financial: financialMetrics,
        collection: collectionMetrics,
        patron: patronMetrics,
        system: systemMetrics,
        alerts: await this.generateAlerts(),
        trends: await this.calculateTrends(),
      };

      // Store as real-time snapshot
      await this.createDataSnapshot('real_time', overview);

      return overview;

    } catch (error) {
      this.logger.error(`Failed to generate system overview: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getCirculationMetrics(): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.serviceUrls.circulation}/circulation/statistics`, {
          timeout: 10000,
        })
      );

      const stats = response.data;
      
      return {
        totalCheckouts: stats.totalCheckouts || 0,
        totalCheckins: stats.totalCheckins || 0,
        totalRenewals: stats.totalRenewals || 0,
        currentLoans: stats.currentLoans || 0,
        overdueItems: stats.overdueItems || 0,
        totalHolds: stats.totalHolds || 0,
        totalFines: stats.totalFines || 0,
        averageLoanDuration: stats.averageLoanDuration || 0,
        turnoverRate: stats.turnoverRate || 0,
        popularItems: stats.popularItems || [],
        busyHours: stats.busyHours || [],
      };

    } catch (error) {
      this.logger.warn(`Failed to fetch circulation metrics: ${error.message}`);
      return this.getDefaultCirculationMetrics();
    }
  }

  async getFinancialMetrics(): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.serviceUrls.acquisitions}/acquisitions/statistics`, {
          timeout: 10000,
        })
      );

      const stats = response.data;
      
      return {
        totalSpending: stats.financial?.totalSpent || 0,
        budgetUtilization: stats.financial?.budgetUtilization?.utilizationPercentage || 0,
        pendingOrders: stats.orders?.active || 0,
        overdueOrders: stats.orders?.overdue || 0,
        vendorCount: stats.vendors?.active || 0,
        averageOrderValue: stats.financial?.averageOrderValue || 0,
        topVendors: stats.vendors?.top || [],
        budgetHealth: stats.financial?.budgetUtilization?.healthStatus || 'unknown',
      };

    } catch (error) {
      this.logger.warn(`Failed to fetch financial metrics: ${error.message}`);
      return this.getDefaultFinancialMetrics();
    }
  }

  async getCollectionMetrics(): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.serviceUrls.catalog}/catalog/statistics`, {
          timeout: 10000,
        })
      );

      const stats = response.data;
      
      return {
        totalItems: stats.totalItems || 0,
        totalTitles: stats.totalTitles || 0,
        newAcquisitions: stats.newAcquisitions || 0,
        itemsWithdrawn: stats.itemsWithdrawn || 0,
        collectionValue: stats.collectionValue || 0,
        averageAge: stats.averageAge || 0,
        formatDistribution: stats.formatDistribution || {},
        subjectDistribution: stats.subjectDistribution || {},
        languageDistribution: stats.languageDistribution || {},
        duplicateRecords: stats.duplicateRecords || 0,
      };

    } catch (error) {
      this.logger.warn(`Failed to fetch collection metrics: ${error.message}`);
      return this.getDefaultCollectionMetrics();
    }
  }

  async getPatronMetrics(): Promise<any> {
    try {
      const [circulationResponse, discoveryResponse] = await Promise.all([
        firstValueFrom(
          this.httpService.get(`${this.serviceUrls.circulation}/patrons/statistics`, {
            timeout: 10000,
          })
        ).catch(() => null),
        firstValueFrom(
          this.httpService.get(`${this.serviceUrls.discovery}/search/popular`, {
            timeout: 10000,
          })
        ).catch(() => null),
      ]);

      const circulationStats = circulationResponse?.data || {};
      const discoveryStats = discoveryResponse?.data || {};
      
      return {
        totalPatrons: circulationStats.totalPatrons || 0,
        activePatrons: circulationStats.activePatrons || 0,
        newRegistrations: circulationStats.newRegistrations || 0,
        patronsByType: circulationStats.patronsByType || {},
        averageItemsPerPatron: circulationStats.averageItemsPerPatron || 0,
        digitalUsage: discoveryStats.digitalSearches || 0,
        popularSearches: discoveryStats.popularSearches || [],
        patronSatisfaction: circulationStats.patronSatisfaction || 0,
        demographicBreakdown: circulationStats.demographicBreakdown || {},
      };

    } catch (error) {
      this.logger.warn(`Failed to fetch patron metrics: ${error.message}`);
      return this.getDefaultPatronMetrics();
    }
  }

  async getSystemMetrics(): Promise<any> {
    try {
      const healthChecks = await Promise.all([
        this.checkServiceHealth('auth'),
        this.checkServiceHealth('catalog'),
        this.checkServiceHealth('circulation'),
        this.checkServiceHealth('acquisitions'),
        this.checkServiceHealth('discovery'),
      ]);

      const healthyServices = healthChecks.filter(h => h.healthy).length;
      const totalServices = healthChecks.length;
      
      return {
        systemUptime: (healthyServices / totalServices) * 100,
        servicesHealthy: healthyServices,
        servicesTotal: totalServices,
        averageResponseTime: healthChecks.reduce((sum, h) => sum + h.responseTime, 0) / totalServices,
        errorRate: healthChecks.reduce((sum, h) => sum + h.errorRate, 0) / totalServices,
        lastSystemCheck: new Date().toISOString(),
        serviceStatus: healthChecks.reduce((acc, h) => {
          acc[h.service] = {
            healthy: h.healthy,
            responseTime: h.responseTime,
            lastCheck: h.lastCheck,
          };
          return acc;
        }, {}),
      };

    } catch (error) {
      this.logger.warn(`Failed to fetch system metrics: ${error.message}`);
      return this.getDefaultSystemMetrics();
    }
  }

  async generateAlerts(): Promise<any[]> {
    const alerts = [];

    try {
      // Check for system issues
      const systemMetrics = await this.getSystemMetrics();
      if (systemMetrics.systemUptime < 95) {
        alerts.push({
          type: 'system',
          severity: 'high',
          message: `System uptime is ${systemMetrics.systemUptime.toFixed(1)}% - below 95% threshold`,
          timestamp: new Date().toISOString(),
        });
      }

      // Check for financial issues
      const financialMetrics = await this.getFinancialMetrics();
      if (financialMetrics.budgetUtilization > 90) {
        alerts.push({
          type: 'financial',
          severity: 'warning',
          message: `Budget utilization is ${financialMetrics.budgetUtilization.toFixed(1)}% - approaching limit`,
          timestamp: new Date().toISOString(),
        });
      }

      if (financialMetrics.overdueOrders > 10) {
        alerts.push({
          type: 'operational',
          severity: 'medium',
          message: `${financialMetrics.overdueOrders} orders are overdue`,
          timestamp: new Date().toISOString(),
        });
      }

      // Check for circulation issues
      const circulationMetrics = await this.getCirculationMetrics();
      if (circulationMetrics.overdueItems > 100) {
        alerts.push({
          type: 'circulation',
          severity: 'medium',
          message: `${circulationMetrics.overdueItems} items are overdue`,
          timestamp: new Date().toISOString(),
        });
      }

    } catch (error) {
      this.logger.error(`Failed to generate alerts: ${error.message}`);
    }

    return alerts;
  }

  async calculateTrends(): Promise<any> {
    try {
      // Get historical data for trend analysis
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const historicalSnapshots = await this.snapshotRepository.find({
        where: {
          snapshotType: 'daily_summary',
          timestamp: { $gte: thirtyDaysAgo } as any,
        },
        order: { timestamp: 'ASC' },
        take: 30,
      });

      if (historicalSnapshots.length < 7) {
        return { message: 'Insufficient historical data for trend analysis' };
      }

      const trends = {
        circulation: this.calculateMetricTrend(historicalSnapshots, 'circulation.totalCheckouts'),
        financial: this.calculateMetricTrend(historicalSnapshots, 'financial.totalSpending'),
        collection: this.calculateMetricTrend(historicalSnapshots, 'collection.totalItems'),
        patron: this.calculateMetricTrend(historicalSnapshots, 'patron.activePatrons'),
      };

      return trends;

    } catch (error) {
      this.logger.error(`Failed to calculate trends: ${error.message}`);
      return { error: 'Trend calculation failed' };
    }
  }

  // Automated Data Collection
  @Cron(CronExpression.EVERY_HOUR)
  async collectHourlyMetrics(): Promise<void> {
    try {
      this.logger.log('Collecting hourly metrics');

      const metrics = await this.getSystemOverview();
      
      // Store individual metrics
      await this.storeMetrics(metrics, 'hourly');

    } catch (error) {
      this.logger.error(`Failed to collect hourly metrics: ${error.message}`, error.stack);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async generateDailySummary(): Promise<void> {
    try {
      this.logger.log('Generating daily summary');

      const summary = await this.getSystemOverview();
      await this.createDataSnapshot('daily_summary', summary);

      // Clean up old hourly data (keep last 7 days)
      await this.cleanupOldMetrics('hourly', 7);

    } catch (error) {
      this.logger.error(`Failed to generate daily summary: ${error.message}`, error.stack);
    }
  }

  @Cron('0 0 * * 0') // Every Sunday at midnight
  async generateWeeklySummary(): Promise<void> {
    try {
      this.logger.log('Generating weekly summary');

      const summary = await this.getSystemOverview();
      await this.createDataSnapshot('weekly_summary', summary);

      // Clean up old daily data (keep last 90 days)
      await this.cleanupOldMetrics('daily', 90);

    } catch (error) {
      this.logger.error(`Failed to generate weekly summary: ${error.message}`, error.stack);
    }
  }

  @Cron('0 0 1 * *') // First day of every month
  async generateMonthlySummary(): Promise<void> {
    try {
      this.logger.log('Generating monthly summary');

      const summary = await this.getSystemOverview();
      await this.createDataSnapshot('monthly_summary', summary);

      // Clean up old weekly data (keep last 2 years)
      await this.cleanupOldMetrics('weekly', 104);

    } catch (error) {
      this.logger.error(`Failed to generate monthly summary: ${error.message}`, error.stack);
    }
  }

  // Helper Methods
  private async checkServiceHealth(service: string): Promise<any> {
    const startTime = Date.now();
    
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.serviceUrls[service]}/health`, {
          timeout: 5000,
        })
      );

      const responseTime = Date.now() - startTime;
      
      return {
        service,
        healthy: response.status === 200,
        responseTime,
        errorRate: 0,
        lastCheck: new Date().toISOString(),
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      return {
        service,
        healthy: false,
        responseTime,
        errorRate: 100,
        lastCheck: new Date().toISOString(),
        error: error.message,
      };
    }
  }

  private async createDataSnapshot(type: string, data: any): Promise<DataSnapshot> {
    const snapshot = this.snapshotRepository.create({
      snapshotType: type as any,
      timestamp: new Date(),
      snapshotDate: new Date(),
      source: 'analytics_service',
      data,
      metadata: {
        generatedBy: 'AnalyticsService',
        processingTime: Date.now(),
        dataQuality: 'high',
        completeness: 100,
      },
    });

    return this.snapshotRepository.save(snapshot);
  }

  private async storeMetrics(data: any, aggregationPeriod: string): Promise<void> {
    const timestamp = new Date();
    const metrics = [];

    // Store circulation metrics
    if (data.circulation) {
      Object.entries(data.circulation).forEach(([key, value]) => {
        if (typeof value === 'number') {
          metrics.push(this.createMetric('circulation', key, value as number, timestamp, aggregationPeriod));
        }
      });
    }

    // Store financial metrics
    if (data.financial) {
      Object.entries(data.financial).forEach(([key, value]) => {
        if (typeof value === 'number') {
          metrics.push(this.createMetric('financial', key, value as number, timestamp, aggregationPeriod));
        }
      });
    }

    // Store collection metrics
    if (data.collection) {
      Object.entries(data.collection).forEach(([key, value]) => {
        if (typeof value === 'number') {
          metrics.push(this.createMetric('collection', key, value as number, timestamp, aggregationPeriod));
        }
      });
    }

    // Store patron metrics
    if (data.patron) {
      Object.entries(data.patron).forEach(([key, value]) => {
        if (typeof value === 'number') {
          metrics.push(this.createMetric('patron', key, value as number, timestamp, aggregationPeriod));
        }
      });
    }

    // Store system metrics
    if (data.system) {
      Object.entries(data.system).forEach(([key, value]) => {
        if (typeof value === 'number') {
          metrics.push(this.createMetric('system', key, value as number, timestamp, aggregationPeriod));
        }
      });
    }

    await this.metricRepository.save(metrics);
  }

  private createMetric(category: string, key: string, value: number, timestamp: Date, aggregationPeriod: string): Metric {
    return this.metricRepository.create({
      metricKey: key,
      name: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
      category: category as any,
      value,
      unit: this.getMetricUnit(key),
      source: 'analytics_service',
      timestamp,
      aggregationPeriod: aggregationPeriod as any,
    });
  }

  private getMetricUnit(key: string): string {
    if (key.includes('total') || key.includes('count') || key.includes('items')) return 'count';
    if (key.includes('spending') || key.includes('value') || key.includes('fines')) return 'currency';
    if (key.includes('utilization') || key.includes('rate') || key.includes('uptime')) return 'percentage';
    if (key.includes('time') || key.includes('duration')) return 'milliseconds';
    if (key.includes('age')) return 'days';
    return 'count';
  }

  private calculateMetricTrend(snapshots: DataSnapshot[], metricPath: string): any {
    const values = snapshots
      .map(s => s.getMetricValue(metricPath))
      .filter(v => v !== null && typeof v === 'number');

    if (values.length < 2) {
      return { trend: 'insufficient_data', values: values.length };
    }

    const firstValue = values[0];
    const lastValue = values[values.length - 1];
    const change = lastValue - firstValue;
    const percentageChange = firstValue !== 0 ? (change / firstValue) * 100 : 0;

    let trend = 'stable';
    if (Math.abs(percentageChange) > 5) {
      trend = percentageChange > 0 ? 'increasing' : 'decreasing';
    }

    return {
      trend,
      change,
      percentageChange,
      firstValue,
      lastValue,
      dataPoints: values.length,
    };
  }

  private async cleanupOldMetrics(aggregationPeriod: string, daysToKeep: number): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    await this.metricRepository.delete({
      aggregationPeriod: aggregationPeriod as any,
      timestamp: { $lt: cutoffDate } as any,
    });

    this.logger.log(`Cleaned up ${aggregationPeriod} metrics older than ${daysToKeep} days`);
  }

  // Default fallback data
  private getDefaultCirculationMetrics(): any {
    return {
      totalCheckouts: 0,
      totalCheckins: 0,
      totalRenewals: 0,
      currentLoans: 0,
      overdueItems: 0,
      totalHolds: 0,
      totalFines: 0,
      averageLoanDuration: 0,
      turnoverRate: 0,
      popularItems: [],
      busyHours: [],
    };
  }

  private getDefaultFinancialMetrics(): any {
    return {
      totalSpending: 0,
      budgetUtilization: 0,
      pendingOrders: 0,
      overdueOrders: 0,
      vendorCount: 0,
      averageOrderValue: 0,
      topVendors: [],
      budgetHealth: 'unknown',
    };
  }

  private getDefaultCollectionMetrics(): any {
    return {
      totalItems: 0,
      totalTitles: 0,
      newAcquisitions: 0,
      itemsWithdrawn: 0,
      collectionValue: 0,
      averageAge: 0,
      formatDistribution: {},
      subjectDistribution: {},
      languageDistribution: {},
      duplicateRecords: 0,
    };
  }

  private getDefaultPatronMetrics(): any {
    return {
      totalPatrons: 0,
      activePatrons: 0,
      newRegistrations: 0,
      patronsByType: {},
      averageItemsPerPatron: 0,
      digitalUsage: 0,
      popularSearches: [],
      patronSatisfaction: 0,
      demographicBreakdown: {},
    };
  }

  private getDefaultSystemMetrics(): any {
    return {
      systemUptime: 0,
      servicesHealthy: 0,
      servicesTotal: 5,
      averageResponseTime: 0,
      errorRate: 100,
      lastSystemCheck: new Date().toISOString(),
      serviceStatus: {},
    };
  }
}
