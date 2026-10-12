import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CirculationService } from './circulation.service';
import { CheckoutItemDto } from './dto/checkout-item.dto';
import { ReturnItemDto } from './dto/return-item.dto';
import { PlaceHoldDto } from './dto/place-hold.dto';

@ApiTags('circulation')
@ApiBearerAuth()
@Controller('circulation')
export class CirculationController {
  constructor(private readonly circulationService: CirculationService) {}

  @Post('checkout')
  @ApiOperation({ summary: 'Check out an item to a patron' })
  @ApiResponse({ status: 201, description: 'Item checked out successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - patron or item issues' })
  @ApiResponse({ status: 404, description: 'Patron or item not found' })
  async checkoutItem(@Body() checkoutItemDto: CheckoutItemDto) {
    return this.circulationService.checkoutItem(
      checkoutItemDto.patronBarcode,
      checkoutItemDto.itemBarcode,
      checkoutItemDto.staffId,
    );
  }

  @Post('return')
  @ApiOperation({ summary: 'Return an item' })
  @ApiResponse({ status: 200, description: 'Item returned successfully' })
  @ApiResponse({ status: 404, description: 'No active loan found for item' })
  async returnItem(@Body() returnItemDto: ReturnItemDto) {
    return this.circulationService.returnItem(
      returnItemDto.itemBarcode,
      returnItemDto.staffId,
    );
  }

  @Post('renew/:loanId')
  @ApiOperation({ summary: 'Renew a loan' })
  @ApiParam({ name: 'loanId', description: 'Loan UUID' })
  @ApiResponse({ status: 200, description: 'Loan renewed successfully' })
  @ApiResponse({ status: 400, description: 'Loan cannot be renewed' })
  @ApiResponse({ status: 404, description: 'Loan not found' })
  async renewLoan(@Param('loanId', ParseUUIDPipe) loanId: string) {
    return this.circulationService.renewLoan(loanId);
  }

  @Post('holds')
  @ApiOperation({ summary: 'Place a hold on an item' })
  @ApiResponse({ status: 201, description: 'Hold placed successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - patron or item issues' })
  @ApiResponse({ status: 404, description: 'Patron or item not found' })
  async placeHold(@Body() placeHoldDto: PlaceHoldDto) {
    return this.circulationService.placeHold(
      placeHoldDto.patronBarcode,
      placeHoldDto.catalogRecordId,
      placeHoldDto.pickupLibrary,
    );
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get circulation statistics' })
  @ApiResponse({ 
    status: 200, 
    description: 'Circulation statistics',
    schema: {
      type: 'object',
      properties: {
        loans: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            active: { type: 'number' },
            overdue: { type: 'number' },
          },
        },
        holds: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            active: { type: 'number' },
          },
        },
        fines: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            unpaid: { type: 'number' },
          },
        },
      },
    },
  })
  async getStatistics() {
    return this.circulationService.getCirculationStatistics();
  }

  @Post('process/overdue')
  @ApiOperation({ summary: 'Manually process overdue items' })
  @ApiResponse({ status: 200, description: 'Overdue processing completed' })
  @HttpCode(HttpStatus.OK)
  async processOverdueItems() {
    await this.circulationService.processOverdueItems();
    return { message: 'Overdue items processed successfully' };
  }

  @Post('process/auto-renewals')
  @ApiOperation({ summary: 'Manually process auto-renewals' })
  @ApiResponse({ status: 200, description: 'Auto-renewal processing completed' })
  @HttpCode(HttpStatus.OK)
  async processAutoRenewals() {
    await this.circulationService.processAutoRenewals();
    return { message: 'Auto-renewals processed successfully' };
  }

  @Post('process/expired-holds')
  @ApiOperation({ summary: 'Manually process expired holds' })
  @ApiResponse({ status: 200, description: 'Expired holds processing completed' })
  @HttpCode(HttpStatus.OK)
  async processExpiredHolds() {
    await this.circulationService.processExpiredHolds();
    return { message: 'Expired holds processed successfully' };
  }
}
