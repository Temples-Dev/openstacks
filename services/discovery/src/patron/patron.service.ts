import { Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class PatronService {
  private readonly logger = new Logger(PatronService.name);
  private readonly circulationServiceUrl: string;
  private readonly authServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.circulationServiceUrl = this.configService.get('CIRCULATION_SERVICE_URL', 'http://localhost:3004');
    this.authServiceUrl = this.configService.get('AUTH_SERVICE_URL', 'http://localhost:3002');
  }

  async getPatronProfile(patronId: string): Promise<any> {
    try {
      this.logger.log(`Fetching profile for patron: ${patronId}`);

      const response = await firstValueFrom(
        this.httpService.get(`${this.circulationServiceUrl}/patrons/${patronId}`)
      );

      const patron = response.data;

      // Remove sensitive information for public API
      const publicProfile = {
        id: patron.id,
        barcode: patron.barcode,
        firstName: patron.firstName,
        lastName: patron.lastName,
        email: patron.email,
        patronType: patron.patronType,
        status: patron.status,
        expirationDate: patron.expirationDate,
        homeLibrary: patron.homeLibrary,
        preferredLanguage: patron.preferredLanguage,
        checkoutLimit: patron.checkoutLimit,
        holdLimit: patron.holdLimit,
        renewalLimit: patron.renewalLimit,
        // Virtual properties
        fullName: patron.fullName,
        isActive: patron.isActive,
        isExpired: patron.isExpired,
        daysUntilExpiration: patron.daysUntilExpiration,
        statusDescription: patron.statusDescription,
      };

      return publicProfile;

    } catch (error) {
      this.logger.error(`Failed to get patron profile: ${error.message}`, error.stack);
      if (error.response?.status === 404) {
        throw new NotFoundException(`Patron ${patronId} not found`);
      }
      throw error;
    }
  }

  async getPatronLoans(patronId: string): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.circulationServiceUrl}/patrons/${patronId}/loans`)
      );

      const loans = response.data.loans || [];

      // Enhance loans with additional information
      const enhancedLoans = loans.map(loan => ({
        ...loan,
        canRenew: loan.canRenew,
        daysUntilDue: loan.daysUntilDue,
        daysOverdue: loan.daysOverdue,
        statusDescription: loan.statusDescription,
        renewalsRemaining: loan.renewalsRemaining,
      }));

      return {
        loans: enhancedLoans,
        totalCount: enhancedLoans.length,
        activeCount: enhancedLoans.filter(loan => loan.isActive).length,
        overdueCount: enhancedLoans.filter(loan => loan.isOverdue).length,
      };

    } catch (error) {
      this.logger.error(`Failed to get patron loans: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getPatronHolds(patronId: string): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.circulationServiceUrl}/patrons/${patronId}/holds`)
      );

      const holds = response.data.holds || [];

      // Enhance holds with additional information
      const enhancedHolds = holds.map(hold => ({
        ...hold,
        queuePosition: hold.queuePosition,
        estimatedWaitTime: hold.estimatedWaitTime,
        statusDescription: hold.statusDescription,
        canBeCancelled: hold.canBeCancelled,
        canBeSuspended: hold.canBeSuspended,
        daysInQueue: hold.daysInQueue,
      }));

      return {
        holds: enhancedHolds,
        totalCount: enhancedHolds.length,
        activeCount: enhancedHolds.filter(hold => hold.status === 'active').length,
        availableCount: enhancedHolds.filter(hold => hold.status === 'available').length,
      };

    } catch (error) {
      this.logger.error(`Failed to get patron holds: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getPatronFines(patronId: string): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.circulationServiceUrl}/patrons/${patronId}/fines`)
      );

      const fines = response.data.fines || [];

      // Enhance fines with additional information
      const enhancedFines = fines.map(fine => ({
        ...fine,
        balanceOwed: fine.balanceOwed,
        statusDescription: fine.statusDescription,
        fineTypeDescription: fine.fineTypeDescription,
        canAcceptPayment: fine.canAcceptPayment,
        daysSinceCreated: fine.daysSinceCreated,
        ageCategory: fine.ageCategory,
      }));

      const totalOwed = enhancedFines.reduce((sum, fine) => sum + fine.balanceOwed, 0);
      const unpaidCount = enhancedFines.filter(fine => fine.status === 'unpaid').length;

      return {
        fines: enhancedFines,
        totalCount: enhancedFines.length,
        unpaidCount,
        totalOwed,
      };

    } catch (error) {
      this.logger.error(`Failed to get patron fines: ${error.message}`, error.stack);
      throw error;
    }
  }

  async renewLoan(patronId: string, loanId: string): Promise<any> {
    try {
      this.logger.log(`Patron ${patronId} renewing loan ${loanId}`);

      const response = await firstValueFrom(
        this.httpService.post(`${this.circulationServiceUrl}/circulation/renew/${loanId}`)
      );

      return response.data;

    } catch (error) {
      this.logger.error(`Failed to renew loan: ${error.message}`, error.stack);
      throw error;
    }
  }

  async placeHold(patronId: string, catalogRecordId: string, pickupLibrary: string): Promise<any> {
    try {
      this.logger.log(`Patron ${patronId} placing hold on ${catalogRecordId}`);

      // First get patron barcode
      const patron = await this.getPatronProfile(patronId);

      const holdData = {
        patronBarcode: patron.barcode,
        catalogRecordId,
        pickupLibrary,
      };

      const response = await firstValueFrom(
        this.httpService.post(`${this.circulationServiceUrl}/circulation/holds`, holdData)
      );

      return response.data;

    } catch (error) {
      this.logger.error(`Failed to place hold: ${error.message}`, error.stack);
      throw error;
    }
  }

  async cancelHold(patronId: string, holdId: string): Promise<any> {
    try {
      this.logger.log(`Patron ${patronId} cancelling hold ${holdId}`);

      const response = await firstValueFrom(
        this.httpService.delete(`${this.circulationServiceUrl}/holds/${holdId}`)
      );

      return response.data;

    } catch (error) {
      this.logger.error(`Failed to cancel hold: ${error.message}`, error.stack);
      throw error;
    }
  }

  async suspendHold(patronId: string, holdId: string, suspendUntil: Date): Promise<any> {
    try {
      this.logger.log(`Patron ${patronId} suspending hold ${holdId} until ${suspendUntil}`);

      const response = await firstValueFrom(
        this.httpService.patch(`${this.circulationServiceUrl}/holds/${holdId}/suspend`, {
          suspendUntil,
        })
      );

      return response.data;

    } catch (error) {
      this.logger.error(`Failed to suspend hold: ${error.message}`, error.stack);
      throw error;
    }
  }

  async updateNotificationPreferences(patronId: string, preferences: any): Promise<any> {
    try {
      this.logger.log(`Updating notification preferences for patron ${patronId}`);

      const response = await firstValueFrom(
        this.httpService.patch(`${this.circulationServiceUrl}/patrons/${patronId}/preferences`, {
          notificationPreferences: JSON.stringify(preferences),
        })
      );

      return response.data;

    } catch (error) {
      this.logger.error(`Failed to update preferences: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getPatronHistory(patronId: string, type: 'loans' | 'holds' | 'fines' = 'loans'): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.circulationServiceUrl}/patrons/${patronId}/history/${type}`)
      );

      return response.data;

    } catch (error) {
      this.logger.error(`Failed to get patron history: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getPatronSummary(patronId: string): Promise<any> {
    try {
      // Get all patron data in parallel
      const [profile, loans, holds, fines] = await Promise.all([
        this.getPatronProfile(patronId),
        this.getPatronLoans(patronId),
        this.getPatronHolds(patronId),
        this.getPatronFines(patronId),
      ]);

      return {
        profile,
        summary: {
          loans: {
            active: loans.activeCount,
            overdue: loans.overdueCount,
            total: loans.totalCount,
          },
          holds: {
            active: holds.activeCount,
            available: holds.availableCount,
            total: holds.totalCount,
          },
          fines: {
            unpaid: fines.unpaidCount,
            totalOwed: fines.totalOwed,
            total: fines.totalCount,
          },
        },
      };

    } catch (error) {
      this.logger.error(`Failed to get patron summary: ${error.message}`, error.stack);
      throw error;
    }
  }

  async authenticatePatron(barcode: string, pin: string): Promise<any> {
    try {
      this.logger.log(`Authenticating patron with barcode: ${barcode}`);

      const response = await firstValueFrom(
        this.httpService.post(`${this.authServiceUrl}/auth/patron-login`, {
          barcode,
          pin,
        })
      );

      return response.data;

    } catch (error) {
      this.logger.error(`Patron authentication failed: ${error.message}`, error.stack);
      if (error.response?.status === 401) {
        throw new UnauthorizedException('Invalid barcode or PIN');
      }
      throw error;
    }
  }
}
