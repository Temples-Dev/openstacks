import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PatronService } from './patron.service';

@ApiTags('patron')
@ApiBearerAuth()
@Controller('patron')
export class PatronController {
  constructor(private readonly patronService: PatronService) {}

  @Post('login')
  @ApiOperation({ summary: 'Authenticate patron with barcode and PIN' })
  @ApiResponse({ status: 200, description: 'Authentication successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginData: { barcode: string; pin: string }) {
    return this.patronService.authenticatePatron(loginData.barcode, loginData.pin);
  }

  @Get(':id/profile')
  @ApiOperation({ summary: 'Get patron profile information' })
  @ApiParam({ name: 'id', description: 'Patron ID' })
  @ApiResponse({ status: 200, description: 'Patron profile retrieved' })
  @ApiResponse({ status: 404, description: 'Patron not found' })
  async getProfile(@Param('id', ParseUUIDPipe) id: string) {
    return this.patronService.getPatronProfile(id);
  }

  @Get(':id/summary')
  @ApiOperation({ summary: 'Get patron account summary' })
  @ApiParam({ name: 'id', description: 'Patron ID' })
  @ApiResponse({ status: 200, description: 'Patron summary retrieved' })
  async getSummary(@Param('id', ParseUUIDPipe) id: string) {
    return this.patronService.getPatronSummary(id);
  }

  @Get(':id/loans')
  @ApiOperation({ summary: 'Get patron current loans' })
  @ApiParam({ name: 'id', description: 'Patron ID' })
  @ApiResponse({ status: 200, description: 'Patron loans retrieved' })
  async getLoans(@Param('id', ParseUUIDPipe) id: string) {
    return this.patronService.getPatronLoans(id);
  }

  @Get(':id/holds')
  @ApiOperation({ summary: 'Get patron current holds' })
  @ApiParam({ name: 'id', description: 'Patron ID' })
  @ApiResponse({ status: 200, description: 'Patron holds retrieved' })
  async getHolds(@Param('id', ParseUUIDPipe) id: string) {
    return this.patronService.getPatronHolds(id);
  }

  @Get(':id/fines')
  @ApiOperation({ summary: 'Get patron fines and fees' })
  @ApiParam({ name: 'id', description: 'Patron ID' })
  @ApiResponse({ status: 200, description: 'Patron fines retrieved' })
  async getFines(@Param('id', ParseUUIDPipe) id: string) {
    return this.patronService.getPatronFines(id);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Get patron transaction history' })
  @ApiParam({ name: 'id', description: 'Patron ID' })
  @ApiQuery({ 
    name: 'type', 
    required: false,
    enum: ['loans', 'holds', 'fines'],
    description: 'History type'
  })
  @ApiResponse({ status: 200, description: 'Patron history retrieved' })
  async getHistory(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('type') type?: 'loans' | 'holds' | 'fines',
  ) {
    return this.patronService.getPatronHistory(id, type);
  }

  @Post(':id/loans/:loanId/renew')
  @ApiOperation({ summary: 'Renew a loan' })
  @ApiParam({ name: 'id', description: 'Patron ID' })
  @ApiParam({ name: 'loanId', description: 'Loan ID' })
  @ApiResponse({ status: 200, description: 'Loan renewed successfully' })
  @ApiResponse({ status: 400, description: 'Loan cannot be renewed' })
  async renewLoan(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('loanId', ParseUUIDPipe) loanId: string,
  ) {
    return this.patronService.renewLoan(id, loanId);
  }

  @Post(':id/holds')
  @ApiOperation({ summary: 'Place a hold on an item' })
  @ApiParam({ name: 'id', description: 'Patron ID' })
  @ApiResponse({ status: 201, description: 'Hold placed successfully' })
  @ApiResponse({ status: 400, description: 'Cannot place hold' })
  async placeHold(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() holdData: { catalogRecordId: string; pickupLibrary: string },
  ) {
    return this.patronService.placeHold(id, holdData.catalogRecordId, holdData.pickupLibrary);
  }

  @Delete(':id/holds/:holdId')
  @ApiOperation({ summary: 'Cancel a hold' })
  @ApiParam({ name: 'id', description: 'Patron ID' })
  @ApiParam({ name: 'holdId', description: 'Hold ID' })
  @ApiResponse({ status: 200, description: 'Hold cancelled successfully' })
  async cancelHold(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('holdId', ParseUUIDPipe) holdId: string,
  ) {
    return this.patronService.cancelHold(id, holdId);
  }

  @Patch(':id/holds/:holdId/suspend')
  @ApiOperation({ summary: 'Suspend a hold' })
  @ApiParam({ name: 'id', description: 'Patron ID' })
  @ApiParam({ name: 'holdId', description: 'Hold ID' })
  @ApiResponse({ status: 200, description: 'Hold suspended successfully' })
  async suspendHold(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('holdId', ParseUUIDPipe) holdId: string,
    @Body() suspendData: { suspendUntil: Date },
  ) {
    return this.patronService.suspendHold(id, holdId, suspendData.suspendUntil);
  }

  @Patch(':id/preferences')
  @ApiOperation({ summary: 'Update notification preferences' })
  @ApiParam({ name: 'id', description: 'Patron ID' })
  @ApiResponse({ status: 200, description: 'Preferences updated successfully' })
  async updatePreferences(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() preferences: any,
  ) {
    return this.patronService.updateNotificationPreferences(id, preferences);
  }
}
