import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import Fuse from 'fuse.js';
import { SearchQueryDto } from './dto/search-query.dto';
import { SearchResultsDto } from './dto/search-results.dto';
import { AdvancedSearchDto } from './dto/advanced-search.dto';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);
  private readonly catalogServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.catalogServiceUrl = this.configService.get('CATALOG_SERVICE_URL', 'http://localhost:3003');
  }

  async search(searchQuery: SearchQueryDto): Promise<SearchResultsDto> {
    try {
      this.logger.log(`Searching for: "${searchQuery.query}" with filters: ${JSON.stringify(searchQuery.filters)}`);

      // Build search parameters for catalog service
      const searchParams = this.buildSearchParams(searchQuery);
      
      // Call catalog service
      const response = await firstValueFrom(
        this.httpService.get(`${this.catalogServiceUrl}/catalog/search`, {
          params: searchParams,
          timeout: 10000,
        })
      );

      const catalogResults = response.data;

      // Enhance results with discovery-specific data
      const enhancedResults = await this.enhanceSearchResults(catalogResults, searchQuery);

      // Apply client-side fuzzy search if needed
      if (searchQuery.fuzzy && catalogResults.items?.length > 0) {
        enhancedResults.items = this.applyFuzzySearch(catalogResults.items, searchQuery.query);
      }

      // Add search suggestions
      enhancedResults.suggestions = await this.generateSearchSuggestions(searchQuery.query);

      // Add facets for filtering
      enhancedResults.facets = this.generateFacets(catalogResults.items || []);

      this.logger.log(`Search completed: ${enhancedResults.totalCount} results found`);
      return enhancedResults;

    } catch (error) {
      this.logger.error(`Search failed: ${error.message}`, error.stack);
      throw new BadRequestException(`Search failed: ${error.message}`);
    }
  }

  async advancedSearch(advancedQuery: AdvancedSearchDto): Promise<SearchResultsDto> {
    try {
      this.logger.log(`Advanced search with ${Object.keys(advancedQuery).length} criteria`);

      // Convert advanced search to catalog service format
      const searchParams = this.buildAdvancedSearchParams(advancedQuery);
      
      const response = await firstValueFrom(
        this.httpService.get(`${this.catalogServiceUrl}/catalog/search`, {
          params: searchParams,
          timeout: 15000,
        })
      );

      const catalogResults = response.data;
      const enhancedResults = await this.enhanceSearchResults(catalogResults, { query: '' });

      // Add advanced search specific enhancements
      enhancedResults.searchType = 'advanced';
      enhancedResults.appliedFilters = this.getAppliedFilters(advancedQuery);

      return enhancedResults;

    } catch (error) {
      this.logger.error(`Advanced search failed: ${error.message}`, error.stack);
      throw new BadRequestException(`Advanced search failed: ${error.message}`);
    }
  }

  async getPopularSearches(): Promise<string[]> {
    // In a real implementation, this would come from analytics/logs
    return [
      'javascript programming',
      'data science',
      'machine learning',
      'web development',
      'python',
      'artificial intelligence',
      'database design',
      'software engineering',
      'cloud computing',
      'cybersecurity'
    ];
  }

  async getRecentSearches(patronId?: string): Promise<string[]> {
    // In a real implementation, this would be stored per patron
    if (!patronId) return [];
    
    // Mock recent searches - would come from database
    return [
      'react hooks',
      'typescript tutorial',
      'node.js best practices'
    ];
  }

  async getSuggestedSearches(query: string): Promise<string[]> {
    if (!query || query.length < 2) return [];

    try {
      // Call catalog service for suggestions
      const response = await firstValueFrom(
        this.httpService.get(`${this.catalogServiceUrl}/catalog/suggestions`, {
          params: { q: query, limit: 10 },
          timeout: 5000,
        })
      );

      return response.data.suggestions || [];
    } catch (error) {
      this.logger.warn(`Failed to get suggestions: ${error.message}`);
      return this.generateLocalSuggestions(query);
    }
  }

  private buildSearchParams(searchQuery: SearchQueryDto): any {
    const params: any = {
      q: searchQuery.query,
      page: searchQuery.page || 1,
      limit: searchQuery.limit || 20,
      sort: searchQuery.sort || 'relevance',
    };

    // Add filters
    if (searchQuery.filters) {
      Object.keys(searchQuery.filters).forEach(key => {
        if (searchQuery.filters[key]) {
          params[key] = searchQuery.filters[key];
        }
      });
    }

    return params;
  }

  private buildAdvancedSearchParams(advancedQuery: AdvancedSearchDto): any {
    const params: any = {
      page: advancedQuery.page || 1,
      limit: advancedQuery.limit || 20,
      sort: advancedQuery.sort || 'relevance',
    };

    // Map advanced search fields to catalog service parameters
    if (advancedQuery.title) params.title = advancedQuery.title;
    if (advancedQuery.author) params.author = advancedQuery.author;
    if (advancedQuery.subject) params.subject = advancedQuery.subject;
    if (advancedQuery.isbn) params.isbn = advancedQuery.isbn;
    if (advancedQuery.publisher) params.publisher = advancedQuery.publisher;
    if (advancedQuery.publicationYear) params.publicationYear = advancedQuery.publicationYear;
    if (advancedQuery.materialType) params.materialType = advancedQuery.materialType;
    if (advancedQuery.language) params.language = advancedQuery.language;

    return params;
  }

  private async enhanceSearchResults(catalogResults: any, searchQuery: any): Promise<SearchResultsDto> {
    const items = catalogResults.items || [];

    // Enhance each item with discovery-specific data
    const enhancedItems = items.map(item => ({
      ...item,
      // Add availability information
      availability: this.determineAvailability(item),
      // Add cover image URL
      coverImageUrl: this.generateCoverImageUrl(item),
      // Add formatted citation
      citation: this.generateCitation(item),
      // Add relevance score
      relevanceScore: this.calculateRelevanceScore(item, searchQuery.query),
      // Add patron-friendly description
      description: this.generateDescription(item),
    }));

    return {
      items: enhancedItems,
      totalCount: catalogResults.totalCount || 0,
      page: catalogResults.page || 1,
      limit: catalogResults.limit || 20,
      totalPages: Math.ceil((catalogResults.totalCount || 0) / (catalogResults.limit || 20)),
      searchTime: catalogResults.searchTime || 0,
      query: searchQuery.query,
      searchType: 'basic',
      facets: [],
      suggestions: [],
      appliedFilters: {},
    };
  }

  private applyFuzzySearch(items: any[], query: string): any[] {
    if (!query) return items;

    const fuse = new Fuse(items, {
      keys: ['title', 'author', 'subjects'],
      threshold: 0.4,
      includeScore: true,
    });

    const results = fuse.search(query);
    return results.map(result => ({
      ...result.item,
      fuzzyScore: 1 - (result.score || 0),
    }));
  }

  private async generateSearchSuggestions(query: string): Promise<string[]> {
    if (!query || query.length < 3) return [];

    // Generate suggestions based on query
    const suggestions = [];
    
    // Add "did you mean" suggestions
    if (query.includes('programing')) suggestions.push('programming');
    if (query.includes('javascrip')) suggestions.push('javascript');
    if (query.includes('machien')) suggestions.push('machine');

    // Add related terms
    const relatedTerms = this.getRelatedTerms(query);
    suggestions.push(...relatedTerms.slice(0, 3));

    return suggestions.slice(0, 5);
  }

  private generateFacets(items: any[]): any[] {
    const facets = [];

    // Material type facet
    const materialTypes = this.aggregateField(items, 'materialType');
    if (materialTypes.length > 0) {
      facets.push({
        name: 'Material Type',
        field: 'materialType',
        values: materialTypes,
      });
    }

    // Language facet
    const languages = this.aggregateField(items, 'language');
    if (languages.length > 0) {
      facets.push({
        name: 'Language',
        field: 'language',
        values: languages,
      });
    }

    // Publication year facet
    const years = this.aggregateField(items, 'publicationYear');
    if (years.length > 0) {
      facets.push({
        name: 'Publication Year',
        field: 'publicationYear',
        values: years.slice(0, 10), // Top 10 years
      });
    }

    return facets;
  }

  private aggregateField(items: any[], field: string): any[] {
    const counts = {};
    
    items.forEach(item => {
      const value = item[field];
      if (value) {
        counts[value] = (counts[value] || 0) + 1;
      }
    });

    return Object.entries(counts)
      .map(([value, count]) => ({ value, count: count as number }))
      .sort((a, b) => (b.count as number) - (a.count as number));
  }

  private determineAvailability(item: any): any {
    // Mock availability - in real implementation, would call circulation service
    const totalCopies = item.totalCopies || 1;
    const availableCopies = Math.floor(Math.random() * (totalCopies + 1));
    
    return {
      status: availableCopies > 0 ? 'available' : 'checked_out',
      totalCopies,
      availableCopies,
      nextAvailableDate: availableCopies === 0 ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : null,
    };
  }

  private generateCoverImageUrl(item: any): string {
    // Generate cover image URL based on ISBN or default
    if (item.isbn) {
      return `https://covers.openlibrary.org/b/isbn/${item.isbn}-M.jpg`;
    }
    return '/assets/images/default-book-cover.png';
  }

  private generateCitation(item: any): string {
    // Generate APA-style citation
    const author = item.author || 'Unknown Author';
    const year = item.publicationYear || 'n.d.';
    const title = item.title || 'Untitled';
    const publisher = item.publisher || '';
    
    return `${author} (${year}). ${title}. ${publisher}`.trim();
  }

  private calculateRelevanceScore(item: any, query: string): number {
    if (!query) return 0;
    
    let score = 0;
    const queryLower = query.toLowerCase();
    
    // Title match
    if (item.title?.toLowerCase().includes(queryLower)) score += 10;
    
    // Author match
    if (item.author?.toLowerCase().includes(queryLower)) score += 8;
    
    // Subject match
    if (item.subjects?.some(subject => subject.toLowerCase().includes(queryLower))) score += 6;
    
    // Description match
    if (item.summary?.toLowerCase().includes(queryLower)) score += 4;
    
    return Math.min(score, 10); // Cap at 10
  }

  private generateDescription(item: any): string {
    if (item.summary) return item.summary;
    
    // Generate description from available metadata
    const parts = [];
    if (item.materialType) parts.push(`${item.materialType}`);
    if (item.publicationYear) parts.push(`published in ${item.publicationYear}`);
    if (item.publisher) parts.push(`by ${item.publisher}`);
    
    return parts.length > 0 ? parts.join(', ') : 'No description available.';
  }

  private getRelatedTerms(query: string): string[] {
    const relatedTermsMap = {
      'programming': ['coding', 'software development', 'computer science'],
      'javascript': ['js', 'web development', 'frontend'],
      'python': ['programming', 'data science', 'machine learning'],
      'database': ['sql', 'data management', 'mysql'],
      'web': ['html', 'css', 'javascript', 'frontend'],
    };

    const queryLower = query.toLowerCase();
    for (const [term, related] of Object.entries(relatedTermsMap)) {
      if (queryLower.includes(term)) {
        return related;
      }
    }

    return [];
  }

  private generateLocalSuggestions(query: string): string[] {
    // Fallback local suggestions
    const commonTerms = [
      'programming', 'javascript', 'python', 'database', 'web development',
      'machine learning', 'data science', 'artificial intelligence', 'software engineering'
    ];

    return commonTerms
      .filter(term => term.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 5);
  }

  private getAppliedFilters(advancedQuery: AdvancedSearchDto): any {
    const filters = {};
    
    if (advancedQuery.materialType) filters['Material Type'] = advancedQuery.materialType;
    if (advancedQuery.language) filters['Language'] = advancedQuery.language;
    if (advancedQuery.publicationYear) filters['Publication Year'] = advancedQuery.publicationYear;
    
    return filters;
  }
}
