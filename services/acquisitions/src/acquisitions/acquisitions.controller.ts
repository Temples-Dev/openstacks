import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AcquisitionsService } from './acquisitions.service';

@ApiTags('acquisitions')
@ApiBearerAuth()
@Controller('acquisitions')
export class AcquisitionsController {
  constructor(private readonly acquisitionsService: AcquisitionsService) {}

  @Post('purchase-orders')
  @ApiOperation({ summary: 'Create a new purchase order' })
  @ApiResponse({ status: 201, description: 'Purchase order created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid order data' })
  async createPurchaseOrder(
    @Body() orderData: any,
    @Query('userId') userId: string,
  ) {
    return this.acquisitionsService.createPurchaseOrder(orderData, userId);
  }

  @Put('purchase-orders/:id/approve')
  @ApiOperation({ summary: 'Approve a purchase order' })
  @ApiParam({ name: 'id', description: 'Purchase order ID' })
  @ApiResponse({ status: 200, description: 'Purchase order approved' })
  @ApiResponse({ status: 404, description: 'Purchase order not found' })
  async approvePurchaseOrder(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('userId') userId: string,
    @Body() body: { notes?: string },
  ) {
    return this.acquisitionsService.approvePurchaseOrder(id, userId, body.notes);
  }

  @Put('purchase-orders/:id/send')
  @ApiOperation({ summary: 'Send purchase order to vendor' })
  @ApiParam({ name: 'id', description: 'Purchase order ID' })
  @ApiResponse({ status: 200, description: 'Purchase order sent to vendor' })
  @ApiResponse({ status: 404, description: 'Purchase order not found' })
  async sendPurchaseOrder(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('userId') userId: string,
  ) {
    return this.acquisitionsService.sendPurchaseOrder(id, userId);
  }

  @Post('purchase-orders/:id/receive')
  @ApiOperation({ summary: 'Receive items for a purchase order' })
  @ApiParam({ name: 'id', description: 'Purchase order ID' })
  @ApiResponse({ status: 201, description: 'Items received successfully' })
  @ApiResponse({ status: 404, description: 'Purchase order not found' })
  async receiveItems(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() receiptData: any,
    @Query('userId') userId: string,
  ) {
    return this.acquisitionsService.receiveItems(id, receiptData, userId);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get acquisitions statistics and metrics' })
  @ApiResponse({ 
    status: 200, 
    description: 'Acquisitions statistics',
    schema: {
      type: 'object',
      properties: {
        orders: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            active: { type: 'number' },
            overdue: { type: 'number' }
          }
        },
        financial: {
          type: 'object',
          properties: {
            totalSpent: { type: 'number' },
            pendingInvoices: { type: 'number' },
            budgetUtilization: { type: 'object' }
          }
        }
      }
    }
  })
  async getStatistics() {
    return this.acquisitionsService.getAcquisitionsStatistics();
  }

  @Post('process/overdue-orders')
  @ApiOperation({ summary: 'Manually trigger overdue order processing' })
  @ApiResponse({ status: 200, description: 'Overdue orders processed' })
  async processOverdueOrders() {
    await this.acquisitionsService.processOverdueOrders();
    return { message: 'Overdue orders processing initiated' };
  }

  @Post('process/claim-reports')
  @ApiOperation({ summary: 'Manually trigger claim report generation' })
  @ApiResponse({ status: 200, description: 'Claim reports generated' })
  async generateClaimReports() {
    await this.acquisitionsService.generateClaimReports();
    return { message: 'Claim reports generation initiated' };
  }
}
