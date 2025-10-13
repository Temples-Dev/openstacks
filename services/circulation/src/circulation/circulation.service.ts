import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { addDays, addHours, isAfter, isBefore } from 'date-fns';

import { Patron } from '../patrons/entities/patron.entity';
import { Loan } from '../loans/entities/loan.entity';
import { LoanRenewal } from '../loans/entities/loan-renewal.entity';
import { Hold } from '../holds/entities/hold.entity';
import { Fine } from '../fines/entities/fine.entity';

@Injectable()
export class CirculationService {
  private readonly logger = new Logger(CirculationService.name);

  constructor(
    @InjectRepository(Patron)
    private readonly patronRepository: Repository<Patron>,
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    @InjectRepository(LoanRenewal)
    private readonly loanRenewalRepository: Repository<LoanRenewal>,
    @InjectRepository(Hold)
    private readonly holdRepository: Repository<Hold>,
    @InjectRepository(Fine)
    private readonly fineRepository: Repository<Fine>,
  ) {}

  // Check-out operations
  async checkoutItem(patronBarcode: string, itemBarcode: string, staffId?: string): Promise<Loan> {
    const patron = await this.patronRepository.findOne({
      where: { barcode: patronBarcode },
      relations: ['loans', 'fines', 'holds'],
    });

    if (!patron) {
      throw new NotFoundException(`Patron with barcode ${patronBarcode} not found`);
    }

    // Validate patron can checkout
    if (!patron.canCheckout) {
      throw new BadRequestException(
        `Patron cannot checkout: ${this.getPatronBlockReason(patron)}`
      );
    }

    // Check if item is already on loan
    const existingLoan = await this.loanRepository.findOne({
      where: { itemBarcode, status: 'active' },
    });

    if (existingLoan) {
      throw new BadRequestException(`Item ${itemBarcode} is already checked out`);
    }

    // Check for holds on this item
    const itemHold = await this.holdRepository.findOne({
      where: { 
        itemBarcode, 
        status: 'active',
        patron: { id: patron.id }
      },
    });

    // Create the loan
    const dueDate = addDays(new Date(), patron.loanPeriodDays);
    const loan = this.loanRepository.create({
      patron,
      itemBarcode,
      checkoutDate: new Date(),
      dueDate,
      originalDueDate: dueDate,
      status: 'active',
      checkoutStaff: staffId,
      maxRenewals: patron.renewalLimit,
    });

    const savedLoan = await this.loanRepository.save(loan);

    // If patron had a hold on this item, mark it as picked up
    if (itemHold) {
      itemHold.status = 'picked_up';
      itemHold.pickupDate = new Date();
      await this.holdRepository.save(itemHold);
    }

    // Update patron's last activity
    patron.lastActivityDate = new Date();
    await this.patronRepository.save(patron);

    this.logger.log(`Item ${itemBarcode} checked out to patron ${patronBarcode}`);
    return savedLoan;
  }

  // Return operations
  async returnItem(itemBarcode: string, staffId?: string): Promise<{ loan: Loan; fine?: Fine }> {
    const loan = await this.loanRepository.findOne({
      where: { itemBarcode, status: 'active' },
      relations: ['patron'],
    });

    if (!loan) {
      throw new NotFoundException(`No active loan found for item ${itemBarcode}`);
    }

    const returnDate = new Date();
    loan.returnDate = returnDate;
    loan.status = 'returned';
    loan.returnStaff = staffId;

    // Calculate fine if overdue
    let fine: Fine = null;
    if (isAfter(returnDate, loan.dueDate)) {
      fine = await this.createOverdueFine(loan);
    }

    await this.loanRepository.save(loan);

    // Check if there are holds waiting for this item
    await this.processWaitingHolds(itemBarcode);

    // Update patron's last activity
    loan.patron.lastActivityDate = new Date();
    await this.patronRepository.save(loan.patron);

    this.logger.log(`Item ${itemBarcode} returned by patron ${loan.patron.barcode}`);
    return { loan, fine };
  }

  // Renewal operations
  async renewLoan(loanId: string, staffId?: string): Promise<LoanRenewal> {
    const loan = await this.loanRepository.findOne({
      where: { id: loanId },
      relations: ['patron', 'renewals'],
    });

    if (!loan) {
      throw new NotFoundException(`Loan ${loanId} not found`);
    }

    if (!loan.canRenew) {
      throw new BadRequestException('Loan cannot be renewed');
    }

    // Check for holds on this item
    const hasHolds = await this.holdRepository.count({
      where: { itemBarcode: loan.itemBarcode, status: 'active' },
    });

    if (hasHolds > 0) {
      throw new BadRequestException('Item has holds and cannot be renewed');
    }

    const previousDueDate = loan.dueDate;
    const newDueDate = addDays(loan.dueDate, loan.patron.loanPeriodDays);

    // Create renewal record
    const renewal = this.loanRenewalRepository.create({
      loan,
      renewalDate: new Date(),
      previousDueDate,
      newDueDate,
      renewalType: staffId ? 'manual' : 'automatic',
      renewedByStaff: staffId,
    });

    // Update loan
    loan.dueDate = newDueDate;
    loan.renewalCount += 1;
    loan.status = 'renewed';

    await this.loanRenewalRepository.save(renewal);
    await this.loanRepository.save(loan);

    this.logger.log(`Loan ${loanId} renewed until ${newDueDate.toISOString()}`);
    return renewal;
  }

  // Hold operations
  async placeHold(patronBarcode: string, catalogRecordId: string, pickupLibrary: string): Promise<Hold> {
    const patron = await this.patronRepository.findOne({
      where: { barcode: patronBarcode },
      relations: ['holds'],
    });

    if (!patron) {
      throw new NotFoundException(`Patron with barcode ${patronBarcode} not found`);
    }

    if (!patron.canPlaceHold) {
      throw new BadRequestException('Patron cannot place holds');
    }

    // Check if patron already has a hold on this item
    const existingHold = await this.holdRepository.findOne({
      where: { 
        patron: { id: patron.id },
        catalogRecordId,
        status: 'active'
      },
    });

    if (existingHold) {
      throw new BadRequestException('Patron already has a hold on this item');
    }

    // Calculate queue position
    const queuePosition = await this.holdRepository.count({
      where: { catalogRecordId, status: 'active' }
    }) + 1;

    const hold = this.holdRepository.create({
      patron,
      catalogRecordId,
      holdDate: new Date(),
      expirationDate: addDays(new Date(), 365), // 1 year expiration
      status: 'active',
      pickupLibrary,
      queuePosition,
      priority: patron.patronType === 'faculty' ? 1 : 2, // Faculty gets higher priority
    });

    const savedHold = await this.holdRepository.save(hold);

    this.logger.log(`Hold placed for patron ${patronBarcode} on record ${catalogRecordId}`);
    return savedHold;
  }

  // Fine operations
  async createOverdueFine(loan: Loan): Promise<Fine> {
    const daysOverdue = Math.ceil(
      (new Date().getTime() - loan.dueDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const dailyRate = loan.loanType === 'reserve' ? 1.00 : 0.25;
    const maxFine = 25.00;
    const fineAmount = Math.min(dailyRate * daysOverdue, maxFine);

    const fine = this.fineRepository.create({
      patron: loan.patron,
      fineType: 'overdue',
      amount: fineAmount,
      itemBarcode: loan.itemBarcode,
      loanId: loan.id,
      description: `Overdue fine for ${daysOverdue} days`,
      dailyFineRate: dailyRate,
      maxFineAmount: maxFine,
      accrualStartDate: loan.dueDate,
      accrualEndDate: new Date(),
      dueDate: addDays(new Date(), 30), // Fine due in 30 days
    });

    return this.fineRepository.save(fine);
  }

  // Automated processes
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async processOverdueItems() {
    this.logger.log('Processing overdue items...');

    const overdueLoans = await this.loanRepository.find({
      where: { status: 'active' },
      relations: ['patron'],
    });

    const now = new Date();
    let processedCount = 0;

    for (const loan of overdueLoans) {
      if (isAfter(now, loan.dueDate)) {
        loan.status = 'overdue';
        await this.loanRepository.save(loan);

        // Create or update overdue fine
        const existingFine = await this.fineRepository.findOne({
          where: { loanId: loan.id, fineType: 'overdue' },
        });

        if (!existingFine) {
          await this.createOverdueFine(loan);
        }

        processedCount++;
      }
    }

    this.logger.log(`Processed ${processedCount} overdue items`);
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async processAutoRenewals() {
    this.logger.log('Processing auto-renewals...');

    const eligibleLoans = await this.loanRepository.find({
      where: { 
        status: 'active',
        autoRenewalEnabled: true,
      },
      relations: ['patron'],
    });

    let renewedCount = 0;

    for (const loan of eligibleLoans) {
      // Auto-renew if due in 3 days and eligible
      const threeDaysFromNow = addDays(new Date(), 3);
      
      if (isAfter(loan.dueDate, threeDaysFromNow) && loan.canRenew) {
        try {
          await this.renewLoan(loan.id);
          renewedCount++;
        } catch (error) {
          this.logger.warn(`Failed to auto-renew loan ${loan.id}: ${error.message}`);
        }
      }
    }

    this.logger.log(`Auto-renewed ${renewedCount} loans`);
  }

  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  async processExpiredHolds() {
    this.logger.log('Processing expired holds...');

    const expiredHolds = await this.holdRepository.find({
      where: { status: 'active' },
    });

    const now = new Date();
    let expiredCount = 0;

    for (const hold of expiredHolds) {
      if (isAfter(now, hold.expirationDate)) {
        hold.status = 'expired';
        await this.holdRepository.save(hold);
        expiredCount++;
      }
    }

    this.logger.log(`Expired ${expiredCount} holds`);
  }

  // Helper methods
  private getPatronBlockReason(patron: Patron): string {
    if (!patron.isActive) return 'Patron account is not active';
    if (patron.isExpired) return 'Patron account is expired';
    if (patron.currentLoansCount >= patron.checkoutLimit) return 'Checkout limit reached';
    if (patron.totalFinesAmount >= patron.fineLimit) return 'Fine limit exceeded';
    return 'Unknown reason';
  }

  private async processWaitingHolds(itemBarcode: string) {
    const waitingHolds = await this.holdRepository.find({
      where: { 
        itemBarcode,
        status: 'active'
      },
      order: { priority: 'ASC', holdDate: 'ASC' },
      take: 1,
    });

    if (waitingHolds.length > 0) {
      const hold = waitingHolds[0];
      hold.status = 'available';
      hold.filledDate = new Date();
      hold.pickupDeadline = addDays(new Date(), 7); // 7 days to pickup
      
      await this.holdRepository.save(hold);
      
      // TODO: Send notification to patron
      this.logger.log(`Hold ${hold.id} is now available for pickup`);
    }
  }

  // Statistics and reporting
  async getCirculationStatistics(): Promise<any> {
    const [
      totalLoans,
      activeLoans,
      overdueLoans,
      totalHolds,
      activeHolds,
      totalFines,
      unpaidFines,
    ] = await Promise.all([
      this.loanRepository.count(),
      this.loanRepository.count({ where: { status: 'active' } }),
      this.loanRepository.count({ where: { status: 'overdue' } }),
      this.holdRepository.count(),
      this.holdRepository.count({ where: { status: 'active' } }),
      this.fineRepository.count(),
      this.fineRepository.count({ where: { status: 'unpaid' } }),
    ]);

    return {
      loans: {
        total: totalLoans,
        active: activeLoans,
        overdue: overdueLoans,
      },
      holds: {
        total: totalHolds,
        active: activeHolds,
      },
      fines: {
        total: totalFines,
        unpaid: unpaidFines,
      },
    };
  }
}
