import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class CatalogService {
  private readonly logger = new Logger(CatalogService.name);
  private readonly catalogServiceUrl: string;
  private readonly circulationServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.catalogServiceUrl = this.configService.get('CATALOG_SERVICE_URL', 'http://localhost:3003');
    this.circulationServiceUrl = this.configService.get('CIRCULATION_SERVICE_URL', 'http://localhost:3004');
  }

  async getItemDetails(itemId: string): Promise<any> {
    try {
      this.logger.log(`Fetching details for item: ${itemId}`);

      // Get catalog record
      const catalogResponse = await firstValueFrom(
        this.httpService.get(`${this.catalogServiceUrl}/catalog/${itemId}`)
      );

      const catalogRecord = catalogResponse.data;

      // Enhance with availability and circulation data
      const enhancedRecord = await this.enhanceItemDetails(catalogRecord);

      return enhancedRecord;

    } catch (error) {
      this.logger.error(`Failed to get item details: ${error.message}`, error.stack);
      if (error.response?.status === 404) {
        throw new NotFoundException(`Item ${itemId} not found`);
      }
      throw error;
    }
  }

  async browseBySubject(subject: string, page: number = 1, limit: number = 20): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.catalogServiceUrl}/catalog/browse/subject`, {
          params: { subject, page, limit }
        })
      );

      return this.enhanceBrowseResults(response.data);
    } catch (error) {
      this.logger.error(`Browse by subject failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async browseByAuthor(author: string, page: number = 1, limit: number = 20): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.catalogServiceUrl}/catalog/browse/author`, {
          params: { author, page, limit }
        })
      );

      return this.enhanceBrowseResults(response.data);
    } catch (error) {
      this.logger.error(`Browse by author failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async browseByCallNumber(callNumber: string, page: number = 1, limit: number = 20): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.catalogServiceUrl}/catalog/browse/call-number`, {
          params: { callNumber, page, limit }
        })
      );

      return this.enhanceBrowseResults(response.data);
    } catch (error) {
      this.logger.error(`Browse by call number failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getNewAcquisitions(days: number = 30, page: number = 1, limit: number = 20): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.catalogServiceUrl}/catalog/new-acquisitions`, {
          params: { days, page, limit }
        })
      );

      return this.enhanceBrowseResults(response.data);
    } catch (error) {
      this.logger.error(`Get new acquisitions failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getFeaturedItems(): Promise<any[]> {
    try {
      // Get featured items from catalog service
      const response = await firstValueFrom(
        this.httpService.get(`${this.catalogServiceUrl}/catalog/featured`)
      );

      const items = response.data.items || [];
      
      // Enhance each item
      const enhancedItems = await Promise.all(
        items.map(item => this.enhanceItemSummary(item))
      );

      return enhancedItems;
    } catch (error) {
      this.logger.error(`Get featured items failed: ${error.message}`, error.stack);
      return [];
    }
  }

  async getItemsByMaterialType(materialType: string, page: number = 1, limit: number = 20): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.catalogServiceUrl}/catalog/material-type/${materialType}`, {
          params: { page, limit }
        })
      );

      return this.enhanceBrowseResults(response.data);
    } catch (error) {
      this.logger.error(`Get items by material type failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getRelatedItems(itemId: string, limit: number = 10): Promise<any[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.catalogServiceUrl}/catalog/${itemId}/related`, {
          params: { limit }
        })
      );

      const items = response.data.items || [];
      
      // Enhance each related item
      const enhancedItems = await Promise.all(
        items.map(item => this.enhanceItemSummary(item))
      );

      return enhancedItems;
    } catch (error) {
      this.logger.warn(`Get related items failed: ${error.message}`);
      return [];
    }
  }

  private async enhanceItemDetails(catalogRecord: any): Promise<any> {
    const enhanced = {
      ...catalogRecord,
      // Add cover image
      coverImageUrl: this.generateCoverImageUrl(catalogRecord),
      // Add formatted citation
      citation: this.generateCitation(catalogRecord),
      // Add patron-friendly description
      description: this.generateDescription(catalogRecord),
    };

    // Get availability information
    try {
      enhanced.availability = await this.getItemAvailability(catalogRecord.id);
    } catch (error) {
      this.logger.warn(`Failed to get availability for ${catalogRecord.id}: ${error.message}`);
      enhanced.availability = this.getDefaultAvailability();
    }

    // Get holdings information
    try {
      enhanced.holdings = await this.getItemHoldings(catalogRecord.id);
    } catch (error) {
      this.logger.warn(`Failed to get holdings for ${catalogRecord.id}: ${error.message}`);
      enhanced.holdings = [];
    }

    return enhanced;
  }

  private async enhanceBrowseResults(browseResults: any): Promise<any> {
    const items = browseResults.items || [];
    
    // Enhance each item with basic discovery data
    const enhancedItems = await Promise.all(
      items.map(item => this.enhanceItemSummary(item))
    );

    return {
      ...browseResults,
      items: enhancedItems,
    };
  }

  private async enhanceItemSummary(item: any): Promise<any> {
    return {
      ...item,
      coverImageUrl: this.generateCoverImageUrl(item),
      availability: await this.getItemAvailabilityStatus(item.id),
      description: this.generateShortDescription(item),
    };
  }

  private async getItemAvailability(itemId: string): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.circulationServiceUrl}/circulation/availability/${itemId}`)
      );
      return response.data;
    } catch (error) {
      return this.getDefaultAvailability();
    }
  }

  private async getItemAvailabilityStatus(itemId: string): Promise<string> {
    try {
      const availability = await this.getItemAvailability(itemId);
      return availability.status || 'unknown';
    } catch (error) {
      return 'unknown';
    }
  }

  private async getItemHoldings(itemId: string): Promise<any[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.catalogServiceUrl}/catalog/${itemId}/holdings`)
      );
      return response.data.holdings || [];
    } catch (error) {
      return [];
    }
  }

  private generateCoverImageUrl(item: any): string {
    if (item.isbn) {
      return `https://covers.openlibrary.org/b/isbn/${item.isbn}-M.jpg`;
    }
    return '/assets/images/default-book-cover.png';
  }

  private generateCitation(item: any): string {
    const author = item.author || 'Unknown Author';
    const year = item.publicationYear || 'n.d.';
    const title = item.title || 'Untitled';
    const publisher = item.publisher || '';
    
    return `${author} (${year}). ${title}. ${publisher}`.trim();
  }

  private generateDescription(item: any): string {
    if (item.summary) return item.summary;
    
    const parts = [];
    if (item.materialType) parts.push(`${item.materialType}`);
    if (item.publicationYear) parts.push(`published in ${item.publicationYear}`);
    if (item.publisher) parts.push(`by ${item.publisher}`);
    
    return parts.length > 0 ? parts.join(', ') : 'No description available.';
  }

  private generateShortDescription(item: any): string {
    if (item.summary && item.summary.length > 200) {
      return item.summary.substring(0, 200) + '...';
    }
    return this.generateDescription(item);
  }

  private getDefaultAvailability(): any {
    return {
      status: 'unknown',
      totalCopies: 0,
      availableCopies: 0,
      nextAvailableDate: null,
    };
  }
}
