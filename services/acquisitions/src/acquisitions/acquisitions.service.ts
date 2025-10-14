import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Like } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

import { PurchaseOrder } from '../purchase-orders/entities/purchase-order.entity';
import { PurchaseOrderLine } from '../purchase-orders/entities/purchase-order-line.entity';
import { Vendor } from '../vendors/entities/vendor.entity';
import { Budget } from '../budgets/entities/budget.entity';
import { BudgetAllocation } from '../budgets/entities/budget-allocation.entity';
import { Invoice } from '../invoices/entities/invoice.entity';
import { Receipt } from '../receipts/entities/receipt.entity';
import { ReceiptLine } from '../receipts/entities/receipt-line.entity';

@Injectable()
export class AcquisitionsService {
  private readonly logger = new Logger(AcquisitionsService.name);
  private readonly catalogServiceUrl: string;

  constructor(
    @InjectRepository(PurchaseOrder)
    private readonly purchaseOrderRepository: Repository<PurchaseOrder>,
    @InjectRepository(PurchaseOrderLine)
    private readonly purchaseOrderLineRepository: Repository<PurchaseOrderLine>,
    @InjectRepository(Vendor)
    private readonly vendorRepository: Repository<Vendor>,
    @InjectRepository(Budget)
    private readonly budgetRepository: Repository<Budget>,
    @InjectRepository(BudgetAllocation)
    private readonly budgetAllocationRepository: Repository<BudgetAllocation>,
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    @InjectRepository(Receipt)
    private readonly receiptRepository: Repository<Receipt>,
    private readonly dataSource: DataSource,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.catalogServiceUrl = this.configService.get('CATALOG_SERVICE_URL', 'http://localhost:3003');
  }

  async createPurchaseOrder(orderData: any, userId: string): Promise<PurchaseOrder> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      this.logger.log(`Creating purchase order for vendor ${orderData.vendorId}`);

      // Validate vendor
      const vendor = await this.vendorRepository.findOne({
        where: { id: orderData.vendorId, status: 'active' }
      });

      if (!vendor) {
        throw new BadRequestException('Vendor not found or not active');
      }

      // Validate budget
      const budget = await this.budgetRepository.findOne({
        where: { id: orderData.budgetId, status: 'active' }
      });

      if (!budget) {
        throw new BadRequestException('Budget not found or not active');
      }

      // Generate order number
      const orderNumber = await this.generateOrderNumber();

      // Create purchase order
      const purchaseOrder = queryRunner.manager.create(PurchaseOrder, {
        orderNumber,
        vendorId: orderData.vendorId,
        budgetId: orderData.budgetId,
        orderDate: new Date(),
        expectedDeliveryDate: orderData.expectedDeliveryDate,
        orderType: orderData.orderType || 'standard',
        specialInstructions: orderData.specialInstructions,
        isRushOrder: orderData.isRushOrder || false,
        rushJustification: orderData.rushJustification,
        rushDeadline: orderData.rushDeadline,
        shippingAddress: orderData.shippingAddress,
        createdBy: userId,
        status: 'draft',
      });

      const savedOrder = await queryRunner.manager.save(PurchaseOrder, purchaseOrder);

      // Create order lines
      let subtotal = 0;
      let totalItems = 0;

      for (let i = 0; i < orderData.orderLines.length; i++) {
        const lineData = orderData.orderLines[i];
        
        // Validate fund allocation
        if (lineData.fundCode) {
          await this.validateFundAllocation(lineData.fundCode, lineData.lineTotal, budget);
        }

        const orderLine = queryRunner.manager.create(PurchaseOrderLine, {
          purchaseOrderId: savedOrder.id,
          lineNumber: i + 1,
          title: lineData.title,
          author: lineData.author,
          isbn: lineData.isbn,
          publisher: lineData.publisher,
          publicationYear: lineData.publicationYear,
          materialType: lineData.materialType || 'book',
          quantityOrdered: lineData.quantityOrdered,
          unitPrice: lineData.unitPrice,
          listPrice: lineData.listPrice,
          discountPercentage: lineData.discountPercentage || 0,
          netPrice: lineData.unitPrice,
          lineTotal: lineData.unitPrice * lineData.quantityOrdered,
          fundCode: lineData.fundCode,
          specialInstructions: lineData.specialInstructions,
          expectedReceiptDate: lineData.expectedReceiptDate,
          createdBy: userId,
        });

        await queryRunner.manager.save(PurchaseOrderLine, orderLine);

        subtotal += orderLine.lineTotal;
        totalItems += orderLine.quantityOrdered;

        // Create budget encumbrance
        if (lineData.fundCode) {
          await this.createEncumbrance(queryRunner, lineData.fundCode, orderLine.lineTotal, savedOrder.id);
        }
      }

      // Update order totals
      const taxAmount = subtotal * 0.08; // 8% default tax rate
      const totalAmount = subtotal + taxAmount + (orderData.shippingAmount || 0);

      await queryRunner.manager.update(PurchaseOrder, savedOrder.id, {
        subtotal,
        taxAmount,
        shippingAmount: orderData.shippingAmount || 0,
        totalAmount,
        totalItemsOrdered: totalItems,
      });

      await queryRunner.commitTransaction();

      this.logger.log(`Purchase order ${orderNumber} created successfully`);
      return this.purchaseOrderRepository.findOne({
        where: { id: savedOrder.id },
        relations: ['vendor', 'budget', 'orderLines'],
      });

    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to create purchase order: ${error.message}`, error.stack);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async approvePurchaseOrder(orderId: string, userId: string, notes?: string): Promise<PurchaseOrder> {
    try {
      const order = await this.purchaseOrderRepository.findOne({
        where: { id: orderId },
        relations: ['vendor', 'budget', 'orderLines'],
      });

      if (!order) {
        throw new NotFoundException('Purchase order not found');
      }

      if (!order.canBeModified) {
        throw new BadRequestException('Purchase order cannot be modified in current status');
      }

      // Validate budget availability
      await this.validateBudgetAvailability(order.budgetId, order.totalAmount);

      // Update order status
      await this.purchaseOrderRepository.update(orderId, {
        status: 'approved',
        approvedBy: userId,
        approvedAt: new Date(),
        approvalNotes: notes,
      });

      this.logger.log(`Purchase order ${order.orderNumber} approved by user ${userId}`);

      return this.purchaseOrderRepository.findOne({
        where: { id: orderId },
        relations: ['vendor', 'budget', 'orderLines'],
      });

    } catch (error) {
      this.logger.error(`Failed to approve purchase order: ${error.message}`, error.stack);
      throw error;
    }
  }

  async sendPurchaseOrder(orderId: string, userId: string): Promise<PurchaseOrder> {
    try {
      const order = await this.purchaseOrderRepository.findOne({
        where: { id: orderId, status: 'approved' },
        relations: ['vendor', 'orderLines'],
      });

      if (!order) {
        throw new NotFoundException('Approved purchase order not found');
      }

      // Send order to vendor (mock implementation)
      await this.sendOrderToVendor(order);

      // Update order status
      await this.purchaseOrderRepository.update(orderId, {
        status: 'sent',
        sentDate: new Date(),
        updatedBy: userId,
      });

      this.logger.log(`Purchase order ${order.orderNumber} sent to vendor ${order.vendor.name}`);

      return this.purchaseOrderRepository.findOne({
        where: { id: orderId },
        relations: ['vendor', 'budget', 'orderLines'],
      });

    } catch (error) {
      this.logger.error(`Failed to send purchase order: ${error.message}`, error.stack);
      throw error;
    }
  }

  async receiveItems(orderId: string, receiptData: any, userId: string): Promise<Receipt> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      this.logger.log(`Receiving items for purchase order ${orderId}`);

      const order = await this.purchaseOrderRepository.findOne({
        where: { id: orderId },
        relations: ['orderLines'],
      });

      if (!order) {
        throw new NotFoundException('Purchase order not found');
      }

      if (!order.canBeReceived) {
        throw new BadRequestException('Purchase order cannot be received in current status');
      }

      // Generate receipt number
      const receiptNumber = await this.generateReceiptNumber();

      // Create receipt
      const receipt = queryRunner.manager.create(Receipt, {
        receiptNumber,
        purchaseOrderId: orderId,
        receiptDate: new Date(),
        receiptType: receiptData.receiptType || 'complete',
        notes: receiptData.notes,
        receivedBy: userId,
        totalItemsReceived: 0,
        totalValue: 0,
      });

      const savedReceipt = await queryRunner.manager.save(Receipt, receipt);

      let totalReceived = 0;
      let totalValue = 0;

      // Process receipt lines
      for (const lineData of receiptData.receiptLines) {
        const orderLine = order.orderLines.find(ol => ol.id === lineData.purchaseOrderLineId);
        
        if (!orderLine) {
          throw new BadRequestException(`Order line ${lineData.purchaseOrderLineId} not found`);
        }

        const receiptLine = queryRunner.manager.create(ReceiptLine, {
          receiptId: savedReceipt.id,
          purchaseOrderLineId: lineData.purchaseOrderLineId,
          lineNumber: lineData.lineNumber,
          quantityReceived: lineData.quantityReceived,
          quantityDamaged: lineData.quantityDamaged || 0,
          quantityReturned: lineData.quantityReturned || 0,
          condition: lineData.condition || 'good',
          conditionNotes: lineData.conditionNotes,
          notes: lineData.notes,
        });

        await queryRunner.manager.save(ReceiptLine, receiptLine);

        // Update order line
        const newQuantityReceived = orderLine.quantityReceived + receiptLine.quantityAccepted;
        const newStatus = newQuantityReceived >= orderLine.quantityOrdered ? 'received' : 'partially_received';

        await queryRunner.manager.update(PurchaseOrderLine, orderLine.id, {
          quantityReceived: newQuantityReceived,
          status: newStatus,
          actualReceiptDate: newQuantityReceived >= orderLine.quantityOrdered ? new Date() : orderLine.actualReceiptDate,
        });

        totalReceived += receiptLine.quantityAccepted;
        totalValue += receiptLine.quantityAccepted * orderLine.netPrice;

        // Convert encumbrance to expenditure
        if (orderLine.fundCode && receiptLine.quantityAccepted > 0) {
          await this.convertEncumbranceToExpenditure(
            queryRunner,
            orderLine.fundCode,
            receiptLine.quantityAccepted * orderLine.netPrice
          );
        }

        // Add to catalog if needed
        if (receiptLine.quantityAccepted > 0 && orderLine.requiresCataloging) {
          await this.addToCatalog(orderLine, receiptLine.quantityAccepted);
        }
      }

      // Update receipt totals
      await queryRunner.manager.update(Receipt, savedReceipt.id, {
        totalItemsReceived: totalReceived,
        totalValue,
      });

      // Update order status
      const allLinesReceived = order.orderLines.every(ol => 
        ol.quantityReceived >= ol.quantityOrdered
      );

      const newOrderStatus = allLinesReceived ? 'received' : 'partially_received';
      const updates: any = {
        status: newOrderStatus,
        totalItemsReceived: order.totalItemsReceived + totalReceived,
        fulfillmentPercentage: ((order.totalItemsReceived + totalReceived) / order.totalItemsOrdered) * 100,
      };

      if (!order.firstReceiptDate) {
        updates.firstReceiptDate = new Date();
      }
      updates.lastReceiptDate = new Date();

      if (allLinesReceived) {
        updates.actualDeliveryDate = new Date();
      }

      await queryRunner.manager.update(PurchaseOrder, orderId, updates);

      await queryRunner.commitTransaction();

      this.logger.log(`Receipt ${receiptNumber} created for order ${order.orderNumber}`);

      return this.receiptRepository.findOne({
        where: { id: savedReceipt.id },
        relations: ['purchaseOrder', 'receiptLines'],
      });

    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to receive items: ${error.message}`, error.stack);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getAcquisitionsStatistics(): Promise<any> {
    try {
      const [
        totalOrders,
        activeOrders,
        overdueOrders,
        totalSpent,
        pendingInvoices,
        budgetUtilization,
      ] = await Promise.all([
        this.purchaseOrderRepository.count(),
        this.purchaseOrderRepository.count({ where: { status: 'sent' } }),
        this.purchaseOrderRepository.createQueryBuilder('po')
          .where('po.expectedDeliveryDate < :today', { today: new Date() })
          .andWhere('po.status IN (:...statuses)', { statuses: ['sent', 'partially_received'] })
          .getCount(),
        this.purchaseOrderRepository
          .createQueryBuilder('po')
          .select('SUM(po.totalAmount)', 'total')
          .where('po.status IN (:...statuses)', { statuses: ['received', 'closed'] })
          .getRawOne(),
        this.invoiceRepository.count({ where: { status: 'received' } }),
        this.getBudgetUtilizationSummary(),
      ]);

      return {
        orders: {
          total: totalOrders,
          active: activeOrders,
          overdue: overdueOrders,
        },
        financial: {
          totalSpent: totalSpent?.total || 0,
          pendingInvoices,
          budgetUtilization,
        },
        timestamp: new Date().toISOString(),
      };

    } catch (error) {
      this.logger.error(`Failed to get acquisitions statistics: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Automated Tasks
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async processOverdueOrders(): Promise<void> {
    try {
      this.logger.log('Processing overdue purchase orders');

      const overdueOrders = await this.purchaseOrderRepository
        .createQueryBuilder('po')
        .leftJoinAndSelect('po.vendor', 'vendor')
        .where('po.expectedDeliveryDate < :today', { today: new Date() })
        .andWhere('po.status IN (:...statuses)', { statuses: ['sent', 'partially_received'] })
        .getMany();

      for (const order of overdueOrders) {
        // Send notification to staff
        await this.sendOverdueNotification(order);
        
        // Update vendor performance metrics
        await this.updateVendorPerformance(order.vendorId, 'overdue');
      }

      this.logger.log(`Processed ${overdueOrders.length} overdue orders`);

    } catch (error) {
      this.logger.error(`Failed to process overdue orders: ${error.message}`, error.stack);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async generateClaimReports(): Promise<void> {
    try {
      this.logger.log('Generating claim reports for overdue items');

      const claimableLines = await this.purchaseOrderLineRepository
        .createQueryBuilder('pol')
        .leftJoinAndSelect('pol.purchaseOrder', 'po')
        .leftJoinAndSelect('po.vendor', 'vendor')
        .where('pol.expectedReceiptDate < :sevenDaysAgo', { 
          sevenDaysAgo: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) 
        })
        .andWhere('pol.status = :status', { status: 'active' })
        .andWhere('pol.quantityOutstanding > 0')
        .getMany();

      // Group by vendor for efficient claiming
      const claimsByVendor = claimableLines.reduce((acc, line) => {
        const vendorId = line.purchaseOrder.vendorId;
        if (!acc[vendorId]) {
          acc[vendorId] = [];
        }
        acc[vendorId].push(line);
        return acc;
      }, {});

      for (const [vendorId, lines] of Object.entries(claimsByVendor)) {
        await this.generateVendorClaimReport(vendorId, lines as PurchaseOrderLine[]);
      }

      this.logger.log(`Generated claim reports for ${Object.keys(claimsByVendor).length} vendors`);

    } catch (error) {
      this.logger.error(`Failed to generate claim reports: ${error.message}`, error.stack);
    }
  }

  // Private helper methods
  private async generateOrderNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.purchaseOrderRepository.count({
      where: {
        orderNumber: Like(`PO${year}%`)
      }
    });
    return `PO${year}${String(count + 1).padStart(6, '0')}`;
  }

  private async generateReceiptNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.receiptRepository.count();
    return `REC${year}${String(count + 1).padStart(6, '0')}`;
  }

  private async validateFundAllocation(fundCode: string, amount: number, budget: Budget): Promise<void> {
    const allocation = await this.budgetAllocationRepository.findOne({
      where: { budgetId: budget.id, fundCode }
    });

    if (!allocation) {
      throw new BadRequestException(`Fund ${fundCode} not found in budget`);
    }

    if (!allocation.canSpend) {
      throw new BadRequestException(`Fund ${fundCode} is not available for spending`);
    }

    if (allocation.availableBalance < amount) {
      throw new BadRequestException(`Insufficient funds in ${fundCode}. Available: ${allocation.availableBalance}, Required: ${amount}`);
    }
  }

  private async validateBudgetAvailability(budgetId: string, amount: number): Promise<void> {
    const budget = await this.budgetRepository.findOne({ where: { id: budgetId } });
    
    if (!budget.canSpend) {
      throw new BadRequestException('Budget is not available for spending');
    }

    if (budget.availableBalance < amount) {
      throw new BadRequestException(`Insufficient budget. Available: ${budget.availableBalance}, Required: ${amount}`);
    }
  }

  private async createEncumbrance(queryRunner: any, fundCode: string, amount: number, orderId: string): Promise<void> {
    // Update budget allocation encumbrance
    await queryRunner.manager.increment(
      BudgetAllocation,
      { fundCode },
      'encumberedAmount',
      amount
    );

    // Update budget encumbrance
    const allocation = await queryRunner.manager.findOne(BudgetAllocation, { where: { fundCode } });
    await queryRunner.manager.increment(
      Budget,
      { id: allocation.budgetId },
      'totalEncumbered',
      amount
    );
  }

  private async convertEncumbranceToExpenditure(queryRunner: any, fundCode: string, amount: number): Promise<void> {
    // Update budget allocation
    await queryRunner.manager.decrement(
      BudgetAllocation,
      { fundCode },
      'encumberedAmount',
      amount
    );
    await queryRunner.manager.increment(
      BudgetAllocation,
      { fundCode },
      'expendedAmount',
      amount
    );

    // Update budget
    const allocation = await queryRunner.manager.findOne(BudgetAllocation, { where: { fundCode } });
    await queryRunner.manager.decrement(
      Budget,
      { id: allocation.budgetId },
      'totalEncumbered',
      amount
    );
    await queryRunner.manager.increment(
      Budget,
      { id: allocation.budgetId },
      'totalExpended',
      amount
    );
  }

  private async sendOrderToVendor(order: PurchaseOrder): Promise<void> {
    // Mock implementation - in real system would integrate with vendor systems
    this.logger.log(`Sending order ${order.orderNumber} to vendor ${order.vendor.name} via ${order.vendor.orderingPreferences?.preferredOrderMethod || 'email'}`);
  }

  private async addToCatalog(orderLine: PurchaseOrderLine, quantity: number): Promise<void> {
    try {
      // Create catalog record via catalog service
      const catalogData = {
        title: orderLine.title,
        author: orderLine.author,
        isbn: orderLine.isbn,
        publisher: orderLine.publisher,
        publicationYear: orderLine.publicationYear,
        materialType: orderLine.materialType,
        copies: quantity,
      };

      await firstValueFrom(
        this.httpService.post(`${this.catalogServiceUrl}/catalog`, catalogData)
      );

      this.logger.log(`Added ${quantity} copies of "${orderLine.title}" to catalog`);

    } catch (error) {
      this.logger.error(`Failed to add item to catalog: ${error.message}`);
    }
  }

  private async getBudgetUtilizationSummary(): Promise<any> {
    const budgets = await this.budgetRepository.find({ where: { status: 'active' } });
    
    const summary = budgets.reduce((acc, budget) => {
      acc.totalAllocation += budget.adjustedAllocation;
      acc.totalEncumbered += budget.totalEncumbered;
      acc.totalExpended += budget.totalExpended;
      return acc;
    }, { totalAllocation: 0, totalEncumbered: 0, totalExpended: 0 });

    const utilizationPercentage = summary.totalAllocation > 0 
      ? ((summary.totalEncumbered + summary.totalExpended) / summary.totalAllocation) * 100 
      : 0;

    return {
      ...summary,
      utilizationPercentage,
    };
  }

  private async sendOverdueNotification(order: PurchaseOrder): Promise<void> {
    // Mock notification - in real system would send emails/alerts
    this.logger.warn(`Order ${order.orderNumber} is ${order.daysOverdue} days overdue from vendor ${order.vendor.name}`);
  }

  private async updateVendorPerformance(vendorId: string, metric: string): Promise<void> {
    // Update vendor performance metrics
    this.logger.log(`Updating vendor ${vendorId} performance for ${metric}`);
  }

  private async generateVendorClaimReport(vendorId: string, lines: PurchaseOrderLine[]): Promise<void> {
    // Generate claim report for vendor
    this.logger.log(`Generated claim report for vendor ${vendorId} with ${lines.length} items`);
  }
}
