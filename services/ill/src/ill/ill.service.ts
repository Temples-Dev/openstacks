import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';

import { ILLRequest } from '../requests/entities/ill-request.entity';
import { ILLPartner } from '../partners/entities/ill-partner.entity';
import { ILLTransaction } from '../requests/entities/ill-transaction.entity';

@Injectable()
export class ILLService {
  private readonly logger = new Logger(ILLService.name);

  constructor(
    @InjectRepository(ILLRequest)
    private readonly illRequestRepository: Repository<ILLRequest>,
    @InjectRepository(ILLPartner)
    private readonly illPartnerRepository: Repository<ILLPartner>,
    @InjectRepository(ILLTransaction)
    private readonly illTransactionRepository: Repository<ILLTransaction>,
    @InjectQueue('ill-processing')
    private readonly illQueue: Queue,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
  ) {}

  // Request Management
  async createILLRequest(requestData: Partial<ILLRequest>): Promise<ILLRequest> {
    try {
      this.logger.log(`Creating new ILL request for patron: ${requestData.patronId}`);

      // Generate unique request number
      const requestNumber = await this.generateRequestNumber();

      const request = this.illRequestRepository.create({
        ...requestData,
        requestNumber,
        status: 'pending',
        routing: {
          attempts: [],
          maxAttempts: 5,
        },
        createdAt: new Date(),
      });

      const savedRequest = await this.illRequestRepository.save(request);

      // Create initial transaction
      await this.createTransaction(
        savedRequest.id,
        'request_created',
        'system',
        `ILL request created: ${savedRequest.requestNumber}`,
        null,
        'System'
      );

      // Queue for automated processing
      await this.illQueue.add('process-new-request', {
        requestId: savedRequest.id,
      }, {
        delay: 1000, // 1 second delay to ensure transaction is committed
      });

      this.logger.log(`ILL request created successfully: ${savedRequest.id}`);
      return savedRequest;

    } catch (error) {
      this.logger.error(`Failed to create ILL request: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getILLRequest(requestId: string): Promise<ILLRequest> {
    const request = await this.illRequestRepository.findOne({
      where: { id: requestId },
      relations: ['lendingPartner', 'transactions'],
    });

    if (!request) {
      throw new NotFoundException(`ILL request not found: ${requestId}`);
    }

    return request;
  }

  async updateILLRequest(requestId: string, updateData: Partial<ILLRequest>): Promise<ILLRequest> {
    try {
      const request = await this.getILLRequest(requestId);
      const previousStatus = request.status;

      Object.assign(request, updateData);
      request.updatedAt = new Date();

      const updatedRequest = await this.illRequestRepository.save(request);

      // Create transaction if status changed
      if (updateData.status && updateData.status !== previousStatus) {
        await this.createTransaction(
          requestId,
          'status_updated',
          'system',
          `Status changed from ${previousStatus} to ${updateData.status}`,
          null,
          'System',
          {
            previousStatus,
            newStatus: updateData.status,
          }
        );
      }

      this.logger.log(`ILL request updated: ${requestId}`);
      return updatedRequest;

    } catch (error) {
      this.logger.error(`Failed to update ILL request ${requestId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async searchILLRequests(filters: {
    status?: string;
    patronId?: string;
    requestingLibraryId?: string;
    lendingPartnerId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    searchTerm?: string;
  }): Promise<ILLRequest[]> {
    const queryBuilder = this.illRequestRepository.createQueryBuilder('request')
      .leftJoinAndSelect('request.lendingPartner', 'partner')
      .leftJoinAndSelect('request.transactions', 'transactions');

    if (filters.status) {
      queryBuilder.andWhere('request.status = :status', { status: filters.status });
    }

    if (filters.patronId) {
      queryBuilder.andWhere('request.patronId = :patronId', { patronId: filters.patronId });
    }

    if (filters.requestingLibraryId) {
      queryBuilder.andWhere('request.requestingLibraryId = :libraryId', { 
        libraryId: filters.requestingLibraryId 
      });
    }

    if (filters.lendingPartnerId) {
      queryBuilder.andWhere('request.lendingPartnerId = :partnerId', { 
        partnerId: filters.lendingPartnerId 
      });
    }

    if (filters.dateFrom) {
      queryBuilder.andWhere('request.createdAt >= :dateFrom', { dateFrom: filters.dateFrom });
    }

    if (filters.dateTo) {
      queryBuilder.andWhere('request.createdAt <= :dateTo', { dateTo: filters.dateTo });
    }

    if (filters.searchTerm) {
      queryBuilder.andWhere(
        '(request.requestNumber ILIKE :search OR request.patronName ILIKE :search OR request.itemDetails::text ILIKE :search)',
        { search: `%${filters.searchTerm}%` }
      );
    }

    return queryBuilder
      .orderBy('request.createdAt', 'DESC')
      .getMany();
  }

  // Partner Management
  async createILLPartner(partnerData: Partial<ILLPartner>): Promise<ILLPartner> {
    try {
      this.logger.log(`Creating new ILL partner: ${partnerData.name}`);

      // Validate partner code uniqueness
      const existingPartner = await this.illPartnerRepository.findOne({
        where: { code: partnerData.code }
      });

      if (existingPartner) {
        throw new BadRequestException(`Partner with code '${partnerData.code}' already exists`);
      }

      const partner = this.illPartnerRepository.create({
        ...partnerData,
        status: 'active',
        createdAt: new Date(),
      });

      const savedPartner = await this.illPartnerRepository.save(partner);
      
      this.logger.log(`ILL partner created successfully: ${savedPartner.id}`);
      return savedPartner;

    } catch (error) {
      this.logger.error(`Failed to create ILL partner: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getILLPartner(partnerId: string): Promise<ILLPartner> {
    const partner = await this.illPartnerRepository.findOne({
      where: { id: partnerId },
      relations: ['requests'],
    });

    if (!partner) {
      throw new NotFoundException(`ILL partner not found: ${partnerId}`);
    }

    return partner;
  }

  async getActivePartners(): Promise<ILLPartner[]> {
    return this.illPartnerRepository.find({
      where: { status: 'active' },
      order: { name: 'ASC' },
    });
  }

  // Automated Request Processing
  async processNewRequest(requestId: string): Promise<void> {
    try {
      this.logger.log(`Processing new ILL request: ${requestId}`);

      const request = await this.getILLRequest(requestId);
      
      if (request.status !== 'pending') {
        this.logger.warn(`Request ${requestId} is not in pending status, skipping processing`);
        return;
      }

      // Update status to searching
      await this.updateILLRequest(requestId, { status: 'searching' });

      // Create transaction
      await this.createTransaction(
        requestId,
        'search_initiated',
        'automated',
        'Automated search for lending partners initiated',
        null,
        'System'
      );

      // Find suitable partners
      const suitablePartners = await this.findSuitablePartners(request);

      if (suitablePartners.length === 0) {
        await this.updateILLRequest(requestId, { status: 'unfilled' });
        await this.createTransaction(
          requestId,
          'request_cancelled',
          'automated',
          'No suitable lending partners found',
          null,
          'System'
        );
        return;
      }

      // Start routing to partners
      await this.initiatePartnerRouting(request, suitablePartners);

    } catch (error) {
      this.logger.error(`Failed to process new request ${requestId}: ${error.message}`, error.stack);
      
      // Update request status to indicate error
      await this.updateILLRequest(requestId, { status: 'pending' });
      await this.createTransaction(
        requestId,
        'status_updated',
        'system',
        `Processing error: ${error.message}`,
        null,
        'System'
      );
    }
  }

  async findSuitablePartners(request: ILLRequest): Promise<ILLPartner[]> {
    const queryBuilder = this.illPartnerRepository.createQueryBuilder('partner')
      .where('partner.status = :status', { status: 'active' });

    // Filter by lending capability
    queryBuilder.andWhere("partner.capabilities->>'lends' = 'true'");

    // Filter by material type if specified
    if (request.itemDetails.itemType) {
      queryBuilder.andWhere(
        "partner.capabilities->'lendingMaterialTypes' @> :materialType",
        { materialType: JSON.stringify([request.itemDetails.itemType]) }
      );
    }

    // Filter by request type capability
    if (request.requestType === 'copy') {
      queryBuilder.andWhere("partner.capabilities->>'providesCopies' = 'true'");
    }

    const partners = await queryBuilder.getMany();

    // Sort partners by performance score and cost
    return partners.sort((a, b) => {
      const scoreA = a.performanceScore;
      const scoreB = b.performanceScore;
      
      if (scoreA !== scoreB) {
        return scoreB - scoreA; // Higher score first
      }
      
      // If scores are equal, prefer lower cost
      const costA = a.getEstimatedCost(request.requestType, request.priority !== 'normal');
      const costB = b.getEstimatedCost(request.requestType, request.priority !== 'normal');
      
      return costA - costB;
    });
  }

  async initiatePartnerRouting(request: ILLRequest, partners: ILLPartner[]): Promise<void> {
    try {
      // Start with the first (best) partner
      const firstPartner = partners[0];
      
      // Add routing attempt
      request.addRoutingAttempt(firstPartner.id, firstPartner.name);
      
      // Update request with first partner
      await this.updateILLRequest(request.id, {
        routing: request.routing,
        status: 'requested',
        lendingPartnerId: firstPartner.id,
      });

      // Create transaction
      await this.createTransaction(
        request.id,
        'partner_contacted',
        'automated',
        `Request sent to ${firstPartner.name}`,
        null,
        'System',
        {
          partnerId: firstPartner.id,
          partnerName: firstPartner.name,
        }
      );

      // Send request to partner
      await this.sendRequestToPartner(request, firstPartner);

      // Schedule follow-up check
      await this.illQueue.add('check-partner-response', {
        requestId: request.id,
        partnerId: firstPartner.id,
        attemptIndex: 0,
      }, {
        delay: firstPartner.getEstimatedProcessingTime(request.requestType, request.isUrgent) * 60 * 60 * 1000, // Convert hours to milliseconds
      });

    } catch (error) {
      this.logger.error(`Failed to initiate partner routing for request ${request.id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async sendRequestToPartner(request: ILLRequest, partner: ILLPartner): Promise<void> {
    try {
      this.logger.log(`Sending request ${request.requestNumber} to partner ${partner.name}`);

      const protocol = partner.connectionDetails.protocol;

      switch (protocol) {
        case 'rest_api':
          await this.sendRestApiRequest(request, partner);
          break;
        case 'email':
          await this.sendEmailRequest(request, partner);
          break;
        case 'iso_ill':
          await this.sendIsoIllRequest(request, partner);
          break;
        case 'oclc_ill':
          await this.sendOclcIllRequest(request, partner);
          break;
        default:
          this.logger.warn(`Unsupported protocol ${protocol} for partner ${partner.name}`);
          // For manual protocols, create a task for staff
          await this.createManualTask(request, partner);
      }

    } catch (error) {
      this.logger.error(`Failed to send request to partner ${partner.name}: ${error.message}`, error.stack);
      
      // Mark attempt as failed and try next partner
      const attemptIndex = request.routing.attempts.length - 1;
      request.updateRoutingAttempt(attemptIndex, 'error', error.message);
      
      await this.updateILLRequest(request.id, { routing: request.routing });
      
      // Try next partner if available
      await this.tryNextPartner(request);
    }
  }

  private async sendRestApiRequest(request: ILLRequest, partner: ILLPartner): Promise<void> {
    const endpoint = partner.connectionDetails.endpoint;
    const auth = partner.connectionDetails.authentication;

    const requestPayload = {
      requestNumber: request.requestNumber,
      requestType: request.requestType,
      priority: request.priority,
      patron: {
        name: request.patronName,
        email: request.patronEmail,
        barcode: request.patronBarcode,
        type: request.patronType,
      },
      item: request.itemDetails,
      citation: request.citationDetails,
      delivery: request.deliveryInfo,
      neededBy: request.neededBy,
      maxCost: request.costInfo?.maxCost,
    };

    const headers: any = {
      'Content-Type': 'application/json',
    };

    // Add authentication headers
    if (auth?.type === 'api_key') {
      headers['Authorization'] = `Bearer ${auth.credentials.apiKey}`;
    } else if (auth?.type === 'basic') {
      const credentials = Buffer.from(`${auth.credentials.username}:${auth.credentials.password}`).toString('base64');
      headers['Authorization'] = `Basic ${credentials}`;
    }

    const response = await this.httpService.post(endpoint, requestPayload, { headers }).toPromise();
    
    this.logger.log(`Request sent successfully to ${partner.name}, response: ${response.status}`);
  }

  private async sendEmailRequest(request: ILLRequest, partner: ILLPartner): Promise<void> {
    // Implementation would use email service to send formatted request
    this.logger.log(`Sending email request to ${partner.illContactEmail}`);
    
    // For now, just log - would integrate with actual email service
    const emailContent = this.formatEmailRequest(request, partner);
    
    // TODO: Integrate with email service (NodeMailer, SendGrid, etc.)
    this.logger.log(`Email content prepared for ${partner.name}`);
  }

  private async sendIsoIllRequest(request: ILLRequest, partner: ILLPartner): Promise<void> {
    // Implementation would use ISO ILL protocol
    this.logger.log(`Sending ISO ILL request to ${partner.name}`);
    // TODO: Implement ISO ILL protocol integration
  }

  private async sendOclcIllRequest(request: ILLRequest, partner: ILLPartner): Promise<void> {
    // Implementation would use OCLC ILL API
    this.logger.log(`Sending OCLC ILL request to ${partner.name}`);
    // TODO: Implement OCLC ILL API integration
  }

  private async createManualTask(request: ILLRequest, partner: ILLPartner): Promise<void> {
    // Create a task for staff to manually process
    this.logger.log(`Creating manual task for request ${request.requestNumber} to ${partner.name}`);
    
    await this.createTransaction(
      request.id,
      'note_added',
      'system',
      `Manual processing required for partner ${partner.name} (${partner.connectionDetails.protocol})`,
      null,
      'System'
    );
  }

  async tryNextPartner(request: ILLRequest): Promise<void> {
    try {
      if (!request.hasMoreAttempts) {
        await this.updateILLRequest(request.id, { status: 'unfilled' });
        await this.createTransaction(
          request.id,
          'request_cancelled',
          'automated',
          'Maximum routing attempts reached, request unfilled',
          null,
          'System'
        );
        return;
      }

      // Find next suitable partner (excluding already tried ones)
      const triedPartnerIds = request.routing.attempts.map(a => a.partnerId);
      const suitablePartners = await this.findSuitablePartners(request);
      const nextPartner = suitablePartners.find(p => !triedPartnerIds.includes(p.id));

      if (!nextPartner) {
        await this.updateILLRequest(request.id, { status: 'unfilled' });
        await this.createTransaction(
          request.id,
          'request_cancelled',
          'automated',
          'No more suitable partners available',
          null,
          'System'
        );
        return;
      }

      // Try next partner
      await this.initiatePartnerRouting(request, [nextPartner]);

    } catch (error) {
      this.logger.error(`Failed to try next partner for request ${request.id}: ${error.message}`, error.stack);
    }
  }

  // Transaction Management
  async createTransaction(
    requestId: string,
    transactionType: string,
    initiatedBy: 'system' | 'staff' | 'patron' | 'partner' | 'automated',
    description: string,
    userId?: string,
    userName?: string,
    transactionData?: any
  ): Promise<ILLTransaction> {
    const transaction = this.illTransactionRepository.create({
      requestId,
      transactionType,
      initiatedBy,
      description,
      userId,
      userName,
      transactionData,
      createdAt: new Date(),
    });

    return this.illTransactionRepository.save(transaction);
  }

  // Utility Methods
  private async generateRequestNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.illRequestRepository.count({
      where: {
        createdAt: new Date(year, 0, 1), // Start of year
      }
    });
    
    return `ILL-${year}-${(count + 1).toString().padStart(6, '0')}`;
  }

  private formatEmailRequest(request: ILLRequest, partner: ILLPartner): string {
    return `
Subject: Interlibrary Loan Request - ${request.requestNumber}

Dear ${partner.name} ILL Staff,

We would like to request the following item for our patron:

Request Details:
- Request Number: ${request.requestNumber}
- Request Type: ${request.requestTypeDisplayName}
- Priority: ${request.priorityDisplayName}

Item Information:
- Title: ${request.itemDetails.title}
- Author: ${request.itemDetails.author || 'Unknown'}
- ISBN/ISSN: ${request.itemDetails.isbn || request.itemDetails.issn || 'Not provided'}
- Publication Year: ${request.itemDetails.publicationYear || 'Not provided'}
- Item Type: ${request.itemTypeDisplayName}

Patron Information:
- Name: ${request.patronName}
- Email: ${request.patronEmail}
- Patron Type: ${request.patronType}

Delivery Information:
- Method: ${request.deliveryInfo.method}
- Address: ${request.deliveryInfo.address ? 
  `${request.deliveryInfo.address.name}, ${request.deliveryInfo.address.institution}, ${request.deliveryInfo.address.street}, ${request.deliveryInfo.address.city}, ${request.deliveryInfo.address.state} ${request.deliveryInfo.address.zipCode}` : 
  'See delivery preferences'}

${request.neededBy ? `Needed By: ${request.neededBy.toDateString()}` : ''}
${request.costInfo?.maxCost ? `Maximum Cost: $${request.costInfo.maxCost}` : ''}

Please let us know if you can fulfill this request.

Thank you,
${request.requestingLibraryName} ILL Department
    `.trim();
  }

  // Analytics and Reporting
  async getILLStatistics(libraryId?: string, dateFrom?: Date, dateTo?: Date): Promise<any> {
    const queryBuilder = this.illRequestRepository.createQueryBuilder('request');

    if (libraryId) {
      queryBuilder.where('request.requestingLibraryId = :libraryId', { libraryId });
    }

    if (dateFrom) {
      queryBuilder.andWhere('request.createdAt >= :dateFrom', { dateFrom });
    }

    if (dateTo) {
      queryBuilder.andWhere('request.createdAt <= :dateTo', { dateTo });
    }

    const requests = await queryBuilder.getMany();

    const statistics = {
      totalRequests: requests.length,
      statusBreakdown: {},
      typeBreakdown: {},
      priorityBreakdown: {},
      fillRate: 0,
      averageProcessingTime: 0,
      totalCost: 0,
      averageCost: 0,
    };

    // Calculate statistics
    let filledRequests = 0;
    let totalProcessingTime = 0;
    let totalCost = 0;
    let requestsWithCost = 0;

    requests.forEach(request => {
      // Status breakdown
      statistics.statusBreakdown[request.status] = 
        (statistics.statusBreakdown[request.status] || 0) + 1;

      // Type breakdown
      statistics.typeBreakdown[request.requestType] = 
        (statistics.typeBreakdown[request.requestType] || 0) + 1;

      // Priority breakdown
      statistics.priorityBreakdown[request.priority] = 
        (statistics.priorityBreakdown[request.priority] || 0) + 1;

      // Fill rate calculation
      if (['received', 'returned'].includes(request.status)) {
        filledRequests++;
      }

      // Processing time
      if (request.processingTimeHours > 0) {
        totalProcessingTime += request.processingTimeHours;
      }

      // Cost calculation
      if (request.actualCost > 0) {
        totalCost += request.actualCost;
        requestsWithCost++;
      }
    });

    statistics.fillRate = requests.length > 0 ? (filledRequests / requests.length) * 100 : 0;
    statistics.averageProcessingTime = requests.length > 0 ? totalProcessingTime / requests.length : 0;
    statistics.totalCost = totalCost;
    statistics.averageCost = requestsWithCost > 0 ? totalCost / requestsWithCost : 0;

    return statistics;
  }

  // Health Check
  async getHealthStatus(): Promise<any> {
    try {
      const requestCount = await this.illRequestRepository.count();
      const partnerCount = await this.illPartnerRepository.count();
      const activePartnerCount = await this.illPartnerRepository.count({
        where: { status: 'active' }
      });

      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        statistics: {
          totalRequests: requestCount,
          totalPartners: partnerCount,
          activePartners: activePartnerCount,
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
