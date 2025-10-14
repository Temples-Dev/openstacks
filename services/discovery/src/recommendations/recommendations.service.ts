import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class RecommendationsService {
  private readonly logger = new Logger(RecommendationsService.name);
  private readonly catalogServiceUrl: string;
  private readonly circulationServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.catalogServiceUrl = this.configService.get('CATALOG_SERVICE_URL', 'http://localhost:3003');
    this.circulationServiceUrl = this.configService.get('CIRCULATION_SERVICE_URL', 'http://localhost:3004');
  }

  async getPersonalizedRecommendations(patronId: string, limit: number = 10): Promise<any[]> {
    try {
      this.logger.log(`Getting personalized recommendations for patron: ${patronId}`);

      // Get patron's borrowing history
      const borrowingHistory = await this.getPatronBorrowingHistory(patronId);
      
      // Analyze preferences from history
      const preferences = this.analyzePatronPreferences(borrowingHistory);
      
      // Get recommendations based on preferences
      const recommendations = await this.generateRecommendations(preferences, limit);
      
      return recommendations;

    } catch (error) {
      this.logger.error(`Failed to get personalized recommendations: ${error.message}`, error.stack);
      return this.getFallbackRecommendations(limit);
    }
  }

  async getSimilarItems(itemId: string, limit: number = 10): Promise<any[]> {
    try {
      // Get item details
      const itemResponse = await firstValueFrom(
        this.httpService.get(`${this.catalogServiceUrl}/catalog/${itemId}`)
      );
      
      const item = itemResponse.data;
      
      // Find similar items based on subjects, author, and material type
      const similarItems = await this.findSimilarItems(item, limit);
      
      return similarItems;

    } catch (error) {
      this.logger.error(`Failed to get similar items: ${error.message}`, error.stack);
      return [];
    }
  }

  async getPopularItems(period: 'week' | 'month' | 'year' = 'month', limit: number = 10): Promise<any[]> {
    try {
      // Get circulation statistics for popular items
      const response = await firstValueFrom(
        this.httpService.get(`${this.circulationServiceUrl}/circulation/popular`, {
          params: { period, limit }
        })
      );

      return response.data.items || [];

    } catch (error) {
      this.logger.warn(`Failed to get popular items: ${error.message}`);
      return this.getMockPopularItems(limit);
    }
  }

  async getNewAndNoteworthy(limit: number = 10): Promise<any[]> {
    try {
      // Get recently cataloged items
      const response = await firstValueFrom(
        this.httpService.get(`${this.catalogServiceUrl}/catalog/new-acquisitions`, {
          params: { days: 30, limit }
        })
      );

      const newItems = response.data.items || [];
      
      // Enhance with popularity scores
      const enhancedItems = await Promise.all(
        newItems.map(item => this.enhanceWithPopularityScore(item))
      );

      // Sort by popularity and newness
      return enhancedItems.sort((a, b) => 
        (b.popularityScore + b.newScore) - (a.popularityScore + a.newScore)
      );

    } catch (error) {
      this.logger.error(`Failed to get new and noteworthy: ${error.message}`, error.stack);
      return [];
    }
  }

  async getRecommendationsBySubject(subject: string, limit: number = 10): Promise<any[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.catalogServiceUrl}/catalog/browse/subject`, {
          params: { subject, limit, sort: 'popularity' }
        })
      );

      return response.data.items || [];

    } catch (error) {
      this.logger.error(`Failed to get recommendations by subject: ${error.message}`, error.stack);
      return [];
    }
  }

  async getStaffPicks(limit: number = 10): Promise<any[]> {
    try {
      // Get staff-curated recommendations
      const response = await firstValueFrom(
        this.httpService.get(`${this.catalogServiceUrl}/catalog/staff-picks`, {
          params: { limit }
        })
      );

      return response.data.items || [];

    } catch (error) {
      this.logger.warn(`Failed to get staff picks: ${error.message}`);
      return this.getMockStaffPicks(limit);
    }
  }

  async getAwardWinners(year?: number, limit: number = 10): Promise<any[]> {
    try {
      const params: any = { limit };
      if (year) params.year = year;

      const response = await firstValueFrom(
        this.httpService.get(`${this.catalogServiceUrl}/catalog/award-winners`, {
          params
        })
      );

      return response.data.items || [];

    } catch (error) {
      this.logger.warn(`Failed to get award winners: ${error.message}`);
      return this.getMockAwardWinners(limit);
    }
  }

  async getTrendingTopics(): Promise<string[]> {
    try {
      // Analyze recent search queries and popular subjects
      const [searchTrends, subjectTrends] = await Promise.all([
        this.getSearchTrends(),
        this.getSubjectTrends(),
      ]);

      // Combine and deduplicate
      const allTrends = [...searchTrends, ...subjectTrends];
      const uniqueTrends = [...new Set(allTrends)];

      return uniqueTrends.slice(0, 10);

    } catch (error) {
      this.logger.error(`Failed to get trending topics: ${error.message}`, error.stack);
      return this.getMockTrendingTopics();
    }
  }

  private async getPatronBorrowingHistory(patronId: string): Promise<any[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.circulationServiceUrl}/patrons/${patronId}/history/loans`)
      );
      return response.data.loans || [];
    } catch (error) {
      return [];
    }
  }

  private analyzePatronPreferences(borrowingHistory: any[]): any {
    const preferences = {
      subjects: {},
      authors: {},
      materialTypes: {},
      languages: {},
      publicationYears: {},
    };

    borrowingHistory.forEach(loan => {
      // Count subjects
      if (loan.subjects) {
        loan.subjects.forEach(subject => {
          preferences.subjects[subject] = (preferences.subjects[subject] || 0) + 1;
        });
      }

      // Count authors
      if (loan.author) {
        preferences.authors[loan.author] = (preferences.authors[loan.author] || 0) + 1;
      }

      // Count material types
      if (loan.materialType) {
        preferences.materialTypes[loan.materialType] = (preferences.materialTypes[loan.materialType] || 0) + 1;
      }

      // Count languages
      if (loan.language) {
        preferences.languages[loan.language] = (preferences.languages[loan.language] || 0) + 1;
      }

      // Count publication years (by decade)
      if (loan.publicationYear) {
        const decade = Math.floor(loan.publicationYear / 10) * 10;
        preferences.publicationYears[decade] = (preferences.publicationYears[decade] || 0) + 1;
      }
    });

    // Convert to sorted arrays
    return {
      topSubjects: this.getTopEntries(preferences.subjects, 5),
      topAuthors: this.getTopEntries(preferences.authors, 3),
      topMaterialTypes: this.getTopEntries(preferences.materialTypes, 3),
      topLanguages: this.getTopEntries(preferences.languages, 2),
      topDecades: this.getTopEntries(preferences.publicationYears, 3),
    };
  }

  private getTopEntries(obj: Record<string, number>, limit: number): string[] {
    return Object.entries(obj)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([key]) => key);
  }

  private async generateRecommendations(preferences: any, limit: number): Promise<any[]> {
    const recommendations = [];

    // Get recommendations based on top subjects
    for (const subject of preferences.topSubjects.slice(0, 3)) {
      try {
        const subjectRecs = await this.getRecommendationsBySubject(subject, 3);
        recommendations.push(...subjectRecs);
      } catch (error) {
        // Continue with other subjects
      }
    }

    // Get recommendations based on top authors
    for (const author of preferences.topAuthors.slice(0, 2)) {
      try {
        const authorRecs = await this.getRecommendationsByAuthor(author, 2);
        recommendations.push(...authorRecs);
      } catch (error) {
        // Continue with other authors
      }
    }

    // Remove duplicates and limit results
    const uniqueRecs = this.removeDuplicates(recommendations, 'id');
    return uniqueRecs.slice(0, limit);
  }

  private async getRecommendationsByAuthor(author: string, limit: number): Promise<any[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.catalogServiceUrl}/catalog/browse/author`, {
          params: { author, limit }
        })
      );
      return response.data.items || [];
    } catch (error) {
      return [];
    }
  }

  private async findSimilarItems(item: any, limit: number): Promise<any[]> {
    const similarItems = [];

    // Find by same subjects
    if (item.subjects?.length > 0) {
      for (const subject of item.subjects.slice(0, 2)) {
        const subjectItems = await this.getRecommendationsBySubject(subject, 3);
        similarItems.push(...subjectItems.filter(i => i.id !== item.id));
      }
    }

    // Find by same author
    if (item.author) {
      const authorItems = await this.getRecommendationsByAuthor(item.author, 3);
      similarItems.push(...authorItems.filter(i => i.id !== item.id));
    }

    // Remove duplicates and limit
    const uniqueItems = this.removeDuplicates(similarItems, 'id');
    return uniqueItems.slice(0, limit);
  }

  private async enhanceWithPopularityScore(item: any): Promise<any> {
    // Mock popularity scoring - in real implementation would use circulation data
    const popularityScore = Math.random() * 10;
    const daysSinceAdded = Math.floor(Math.random() * 30);
    const newScore = Math.max(0, 10 - (daysSinceAdded / 3));

    return {
      ...item,
      popularityScore,
      newScore,
      daysSinceAdded,
    };
  }

  private async getSearchTrends(): Promise<string[]> {
    // Mock implementation - would analyze search logs
    return [
      'artificial intelligence',
      'climate change',
      'web development',
      'data science',
      'mental health',
    ];
  }

  private async getSubjectTrends(): Promise<string[]> {
    // Mock implementation - would analyze popular subjects
    return [
      'Computer programming',
      'Environmental science',
      'Psychology',
      'Business',
      'History',
    ];
  }

  private removeDuplicates(array: any[], key: string): any[] {
    const seen = new Set();
    return array.filter(item => {
      const value = item[key];
      if (seen.has(value)) {
        return false;
      }
      seen.add(value);
      return true;
    });
  }

  private getFallbackRecommendations(limit: number): any[] {
    // Return popular items as fallback
    return this.getMockPopularItems(limit);
  }

  private getMockPopularItems(limit: number): any[] {
    return [
      {
        id: '1',
        title: 'The Pragmatic Programmer',
        author: 'David Thomas',
        materialType: 'book',
        popularityScore: 9.5,
      },
      {
        id: '2',
        title: 'Clean Code',
        author: 'Robert Martin',
        materialType: 'book',
        popularityScore: 9.2,
      },
    ].slice(0, limit);
  }

  private getMockStaffPicks(limit: number): any[] {
    return [
      {
        id: '3',
        title: 'Educated',
        author: 'Tara Westover',
        materialType: 'book',
        staffRecommendation: 'A powerful memoir about education and family.',
      },
    ].slice(0, limit);
  }

  private getMockAwardWinners(limit: number): any[] {
    return [
      {
        id: '4',
        title: 'The Overstory',
        author: 'Richard Powers',
        materialType: 'book',
        award: 'Pulitzer Prize for Fiction 2019',
      },
    ].slice(0, limit);
  }

  private getMockTrendingTopics(): string[] {
    return [
      'artificial intelligence',
      'climate change',
      'remote work',
      'mental health',
      'cryptocurrency',
    ];
  }
}
