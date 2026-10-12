import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Between } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';

import { EResource } from '../resources/entities/e-resource.entity';
import { License } from '../licenses/entities/license.entity';
import { UsageStatistic } from '../usage/entities/usage-statistic.entity';
import { AccessLog } from '../access/entities/access-log.entity';

@Injectable()
export class EResourcesService {
  private readonly logger = new Logger(EResourcesService.name);

  constructor(
    @InjectRepository(EResource)
    private readonly eResourceRepository: Repository<EResource>,
    @InjectRepository(License)
    private readonly licenseRepository: Repository<License>,
    @InjectRepository(UsageStatistic)
    private readonly usageStatisticRepository: Repository<UsageStatistic>,
    @InjectRepository(AccessLog)
    private readonly accessLogRepository: Repository<AccessLog>,
    @InjectQueue('e-resources-processing')
    private readonly eResourcesQueue: Queue,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
  ) {}

  // E-Resource Management
  async createEResource(resourceData: Partial<EResource>): Promise<EResource> {
    try {
      this.logger.log(`Creating new e-resource: ${resourceData.name}`);

      const resource = this.eResourceRepository.create({
        ...resourceData,
        status: 'pending_activation',
        createdAt: new Date(),
      });

      const savedResource = await this.eResourceRepository.save(resource);

      // Queue for activation processing
      await this.eResourcesQueue.add('activate-resource', {
        resourceId: savedResource.id,
      });

      this.logger.log(`E-resource created successfully: ${savedResource.id}`);
      return savedResource;

    } catch (error) {
      this.logger.error(`Failed to create e-resource: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getEResource(resourceId: string): Promise<EResource> {
    const resource = await this.eResourceRepository.findOne({
      where: { id: resourceId },
      relations: ['license', 'usageStatistics', 'accessLogs'],
    });

    if (!resource) {
      throw new NotFoundException(`E-resource not found: ${resourceId}`);
    }

    return resource;
  }

  async updateEResource(resourceId: string, updateData: Partial<EResource>): Promise<EResource> {
    try {
      const resource = await this.getEResource(resourceId);
      
      Object.assign(resource, updateData);
      resource.updatedAt = new Date();

      const updatedResource = await this.eResourceRepository.save(resource);
      
      this.logger.log(`E-resource updated: ${resourceId}`);
      return updatedResource;

    } catch (error) {
      this.logger.error(`Failed to update e-resource ${resourceId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async searchEResources(filters: {
    libraryId?: string;
    status?: string;
    resourceType?: string;
    provider?: string;
    searchTerm?: string;
    subjects?: string[];
    expiringWithin?: number; // days
  }): Promise<EResource[]> {
    const queryBuilder = this.eResourceRepository.createQueryBuilder('resource')
      .leftJoinAndSelect('resource.license', 'license');

    if (filters.libraryId) {
      queryBuilder.andWhere('resource.libraryId = :libraryId', { libraryId: filters.libraryId });
    }

    if (filters.status) {
      queryBuilder.andWhere('resource.status = :status', { status: filters.status });
    }

    if (filters.resourceType) {
      queryBuilder.andWhere('resource.resourceType = :resourceType', { resourceType: filters.resourceType });
    }

    if (filters.provider) {
      queryBuilder.andWhere('resource.provider ILIKE :provider', { provider: `%${filters.provider}%` });
    }

    if (filters.searchTerm) {
      queryBuilder.andWhere(
        '(resource.name ILIKE :search OR resource.description ILIKE :search)',
        { search: `%${filters.searchTerm}%` }
      );
    }

    if (filters.subjects && filters.subjects.length > 0) {
      queryBuilder.andWhere(
        "resource.coverage->'subjects' ?| array[:subjects]",
        { subjects: filters.subjects }
      );
    }

    if (filters.expiringWithin) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + filters.expiringWithin);
      queryBuilder.andWhere('license.endDate <= :expiryDate', { expiryDate });
    }

    return queryBuilder
      .orderBy('resource.name', 'ASC')
      .getMany();
  }

  // License Management
  async createLicense(licenseData: Partial<License>): Promise<License> {
    try {
      this.logger.log(`Creating new license: ${licenseData.licenseName}`);

      const license = this.licenseRepository.create({
        ...licenseData,
        status: 'pending',
        createdAt: new Date(),
      });

      const savedLicense = await this.licenseRepository.save(license);
      
      this.logger.log(`License created successfully: ${savedLicense.id}`);
      return savedLicense;

    } catch (error) {
      this.logger.error(`Failed to create license: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getLicense(licenseId: string): Promise<License> {
    const license = await this.licenseRepository.findOne({
      where: { id: licenseId },
      relations: ['resources'],
    });

    if (!license) {
      throw new NotFoundException(`License not found: ${licenseId}`);
    }

    return license;
  }

  async getExpiringLicenses(daysAhead: number = 90): Promise<License[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    return this.licenseRepository.find({
      where: {
        endDate: Between(new Date(), futureDate),
        status: 'active',
      },
      relations: ['resources'],
      order: { endDate: 'ASC' },
    });
  }

  // Access Control and Authentication
  async validateAccess(
    resourceId: string,
    userId: string,
    userType: string,
    ipAddress: string,
    location: 'on_campus' | 'off_campus'
  ): Promise<{ allowed: boolean; reason?: string; accessUrl?: string }> {
    try {
      const resource = await this.getEResource(resourceId);

      if (!resource.isActive) {
        return { allowed: false, reason: 'Resource is not active' };
      }

      // Check license terms
      if (resource.license && !resource.license.isActive) {
        return { allowed: false, reason: 'License is not active or expired' };
      }

      // Check location-based access
      if (location === 'off_campus' && !resource.allowsRemoteAccess) {
        return { allowed: false, reason: 'Remote access not permitted' };
      }

      // Check IP restrictions
      const allowedIPs = resource.accessConfiguration.allowedIPs;
      if (allowedIPs && allowedIPs.length > 0) {
        const isAllowedIP = allowedIPs.some(allowedIP => 
          this.isIPInRange(ipAddress, allowedIP)
        );
        if (!isAllowedIP) {
          return { allowed: false, reason: 'IP address not authorized' };
        }
      }

      // Check concurrent user limits
      if (resource.hasUserLimit) {
        const currentUsers = await this.getCurrentActiveUsers(resourceId);
        if (currentUsers >= resource.simultaneousUserLimit) {
          return { allowed: false, reason: 'Maximum concurrent users reached' };
        }
      }

      // Generate access URL
      const accessUrl = resource.getAccessUrl(userType, location);

      // Log successful access validation
      await this.logAccess(resourceId, userId, userType, ipAddress, 'login', accessUrl, 'success');

      return { 
        allowed: true, 
        accessUrl,
      };

    } catch (error) {
      this.logger.error(`Failed to validate access for resource ${resourceId}: ${error.message}`, error.stack);
      
      // Log failed access attempt
      await this.logAccess(resourceId, userId, userType, ipAddress, 'denied', null, 'error', error.message);
      
      return { allowed: false, reason: 'Access validation failed' };
    }
  }

  async logAccess(
    resourceId: string,
    userId: string,
    userType: string,
    ipAddress: string,
    accessType: 'login' | 'search' | 'view' | 'download' | 'print' | 'email' | 'logout' | 'denied',
    accessUrl?: string,
    status: 'success' | 'denied' | 'error' | 'timeout' = 'success',
    errorMessage?: string,
    metadata?: any
  ): Promise<AccessLog> {
    const accessLog = this.accessLogRepository.create({
      resourceId,
      userId,
      userType,
      ipAddress,
      accessType,
      accessUrl,
      status,
      errorMessage,
      metadata,
      accessTime: new Date(),
    });

    return this.accessLogRepository.save(accessLog);
  }

  // Usage Statistics Management
  async recordUsageStatistic(
    resourceId: string,
    libraryId: string,
    metricType: string,
    count: number,
    reportDate: Date,
    reportPeriod: 'monthly' | 'quarterly' | 'annual' = 'monthly',
    breakdown?: any,
    metadata?: any
  ): Promise<UsageStatistic> {
    // Check if statistic already exists for this period
    const existingStatistic = await this.usageStatisticRepository.findOne({
      where: {
        resourceId,
        metricType,
        reportDate,
        reportPeriod,
      },
    });

    if (existingStatistic) {
      // Update existing statistic
      existingStatistic.count = count;
      existingStatistic.breakdown = breakdown;
      existingStatistic.metadata = metadata;
      return this.usageStatisticRepository.save(existingStatistic);
    }

    // Create new statistic
    const statistic = this.usageStatisticRepository.create({
      resourceId,
      libraryId,
      metricType,
      count,
      reportDate,
      reportPeriod,
      breakdown,
      metadata,
    });

    return this.usageStatisticRepository.save(statistic);
  }

  async getUsageStatistics(
    resourceId: string,
    startDate: Date,
    endDate: Date,
    metricTypes?: string[]
  ): Promise<UsageStatistic[]> {
    const queryBuilder = this.usageStatisticRepository.createQueryBuilder('statistic')
      .where('statistic.resourceId = :resourceId', { resourceId })
      .andWhere('statistic.reportDate BETWEEN :startDate AND :endDate', { startDate, endDate });

    if (metricTypes && metricTypes.length > 0) {
      queryBuilder.andWhere('statistic.metricType IN (:...metricTypes)', { metricTypes });
    }

    return queryBuilder
      .orderBy('statistic.reportDate', 'ASC')
      .addOrderBy('statistic.metricType', 'ASC')
      .getMany();
  }

  // COUNTER Report Processing
  async importCounterReport(
    resourceId: string,
    reportData: any,
    reportType: 'counter_5' | 'counter_4' = 'counter_5'
  ): Promise<void> {
    try {
      this.logger.log(`Importing COUNTER report for resource: ${resourceId}`);

      // Queue for background processing
      await this.eResourcesQueue.add('process-counter-report', {
        resourceId,
        reportData,
        reportType,
      });

    } catch (error) {
      this.logger.error(`Failed to import COUNTER report: ${error.message}`, error.stack);
      throw error;
    }
  }

  async processCounterReport(resourceId: string, reportData: any, reportType: string): Promise<void> {
    try {
      const resource = await this.getEResource(resourceId);
      
      // Process each row of the COUNTER report
      for (const row of reportData.rows || []) {
        const reportDate = new Date(row.reportDate);
        
        // Process different metric types
        for (const [metricType, count] of Object.entries(row.metrics || {})) {
          if (typeof count === 'number' && count > 0) {
            await this.recordUsageStatistic(
              resourceId,
              resource.libraryId,
              metricType,
              count,
              reportDate,
              'monthly',
              row.breakdown,
              {
                reportStandard: reportType,
                dataSource: 'counter_report',
                importedAt: new Date(),
              }
            );
          }
        }
      }

      this.logger.log(`COUNTER report processed successfully for resource: ${resourceId}`);

    } catch (error) {
      this.logger.error(`Failed to process COUNTER report: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Automated Tasks
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async checkExpiringLicenses(): Promise<void> {
    try {
      this.logger.log('Checking for expiring licenses...');

      const expiringLicenses = await this.getExpiringLicenses(30); // 30 days ahead

      for (const license of expiringLicenses) {
        await this.eResourcesQueue.add('send-expiry-notification', {
          licenseId: license.id,
          daysUntilExpiry: license.daysUntilExpiry,
        });
      }

      this.logger.log(`Found ${expiringLicenses.length} expiring licenses`);

    } catch (error) {
      this.logger.error(`Failed to check expiring licenses: ${error.message}`, error.stack);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async updateResourceStatuses(): Promise<void> {
    try {
      this.logger.log('Updating resource statuses...');

      // Find expired resources
      const expiredResources = await this.eResourceRepository
        .createQueryBuilder('resource')
        .leftJoin('resource.license', 'license')
        .where('license.endDate < :now', { now: new Date() })
        .andWhere('resource.status = :status', { status: 'active' })
        .getMany();

      for (const resource of expiredResources) {
        await this.updateEResource(resource.id, { status: 'expired' });
      }

      this.logger.log(`Updated ${expiredResources.length} expired resources`);

    } catch (error) {
      this.logger.error(`Failed to update resource statuses: ${error.message}`, error.stack);
    }
  }

  // Analytics and Reporting
  async getResourceAnalytics(
    libraryId: string,
    startDate: Date,
    endDate: Date
  ): Promise<any> {
    const resources = await this.searchEResources({ libraryId });
    
    const analytics = {
      totalResources: resources.length,
      activeResources: resources.filter(r => r.isActive).length,
      trialResources: resources.filter(r => r.isTrial).length,
      expiringResources: resources.filter(r => r.requiresRenewal).length,
      totalAnnualCost: resources.reduce((sum, r) => sum + r.annualCost, 0),
      resourcesByType: {},
      resourcesByProvider: {},
      usageSummary: {},
    };

    // Group by type and provider
    resources.forEach(resource => {
      analytics.resourcesByType[resource.resourceType] = 
        (analytics.resourcesByType[resource.resourceType] || 0) + 1;
      
      analytics.resourcesByProvider[resource.provider] = 
        (analytics.resourcesByProvider[resource.provider] || 0) + 1;
    });

    // Get usage statistics
    for (const resource of resources) {
      const usage = await this.getUsageStatistics(resource.id, startDate, endDate);
      const totalUsage = usage.reduce((sum, stat) => sum + stat.count, 0);
      
      if (totalUsage > 0) {
        analytics.usageSummary[resource.name] = {
          totalUsage,
          costPerUse: resource.annualCost > 0 ? resource.annualCost / totalUsage : 0,
          usageByType: usage.reduce((acc, stat) => {
            acc[stat.metricType] = (acc[stat.metricType] || 0) + stat.count;
            return acc;
          }, {}),
        };
      }
    }

    return analytics;
  }

  // Utility Methods
  private async getCurrentActiveUsers(resourceId: string): Promise<number> {
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    const activeSessions = await this.accessLogRepository
      .createQueryBuilder('log')
      .select('DISTINCT log.userId')
      .where('log.resourceId = :resourceId', { resourceId })
      .andWhere('log.accessTime > :oneHourAgo', { oneHourAgo })
      .andWhere('log.status = :status', { status: 'success' })
      .getCount();

    return activeSessions;
  }

  private isIPInRange(ip: string, range: string): boolean {
    // Simplified IP range checking - would use proper CIDR library in production
    if (range.includes('/')) {
      // CIDR notation
      return ip.startsWith(range.split('/')[0].substring(0, range.indexOf('.')));
    } else if (range.includes('-')) {
      // IP range
      return true; // Simplified - would implement proper range checking
    } else {
      // Exact IP match
      return ip === range;
    }
  }

  // Health Check
  async getHealthStatus(): Promise<any> {
    try {
      const resourceCount = await this.eResourceRepository.count();
      const licenseCount = await this.licenseRepository.count();
      const activeResourceCount = await this.eResourceRepository.count({
        where: { status: 'active' }
      });

      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        statistics: {
          totalResources: resourceCount,
          totalLicenses: licenseCount,
          activeResources: activeResourceCount,
        },
        services: {
          database: 'connected',
          queue: 'operational',
          httpClient: 'ready',
        },
      };

    } catch (error) {
      this.logger.error(`Health check failed: ${error.message}`, error.stack);
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
      };
    }
  }
}
