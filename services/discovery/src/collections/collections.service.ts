import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class CollectionsService {
  private readonly logger = new Logger(CollectionsService.name);
  private readonly catalogServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.catalogServiceUrl = this.configService.get('CATALOG_SERVICE_URL', 'http://localhost:3003');
  }

  async getFeaturedCollections(): Promise<any[]> {
    try {
      this.logger.log('Fetching featured collections');

      // Get curated collections from various sources
      const [
        newBooks,
        popularBooks,
        digitalResources,
        specialCollections,
      ] = await Promise.all([
        this.getNewBooksCollection(),
        this.getPopularBooksCollection(),
        this.getDigitalResourcesCollection(),
        this.getSpecialCollections(),
      ]);

      return [
        newBooks,
        popularBooks,
        digitalResources,
        ...specialCollections,
      ].filter(Boolean);

    } catch (error) {
      this.logger.error(`Failed to get featured collections: ${error.message}`, error.stack);
      return this.getMockCollections();
    }
  }

  async getCollectionByTheme(theme: string): Promise<any> {
    try {
      this.logger.log(`Fetching collection for theme: ${theme}`);

      const response = await firstValueFrom(
        this.httpService.get(`${this.catalogServiceUrl}/catalog/collections/theme/${theme}`)
      );

      return this.enhanceCollection(response.data);

    } catch (error) {
      this.logger.error(`Failed to get collection by theme: ${error.message}`, error.stack);
      return this.getMockCollectionByTheme(theme);
    }
  }

  async getSeasonalCollections(): Promise<any[]> {
    const currentMonth = new Date().getMonth() + 1;
    const season = this.getCurrentSeason(currentMonth);
    
    try {
      const collections = [];

      // Add season-specific collections
      switch (season) {
        case 'spring':
          collections.push(
            await this.createSeasonalCollection('Spring Reading', 'gardening, nature, renewal'),
            await this.createSeasonalCollection('Earth Day Resources', 'environment, sustainability')
          );
          break;
        case 'summer':
          collections.push(
            await this.createSeasonalCollection('Summer Beach Reads', 'fiction, romance, adventure'),
            await this.createSeasonalCollection('Travel Guides', 'travel, vacation, culture')
          );
          break;
        case 'fall':
          collections.push(
            await this.createSeasonalCollection('Back to School', 'education, study guides, textbooks'),
            await this.createSeasonalCollection('Cozy Fall Reads', 'mystery, horror, autumn')
          );
          break;
        case 'winter':
          collections.push(
            await this.createSeasonalCollection('Holiday Traditions', 'holidays, cooking, family'),
            await this.createSeasonalCollection('Winter Reading', 'classics, biography, history')
          );
          break;
      }

      return collections.filter(Boolean);

    } catch (error) {
      this.logger.error(`Failed to get seasonal collections: ${error.message}`, error.stack);
      return [];
    }
  }

  async getExhibitCollections(): Promise<any[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.catalogServiceUrl}/catalog/exhibits`)
      );

      const exhibits = response.data.exhibits || [];
      
      return exhibits.map(exhibit => this.enhanceExhibitCollection(exhibit));

    } catch (error) {
      this.logger.warn(`Failed to get exhibit collections: ${error.message}`);
      return this.getMockExhibits();
    }
  }

  async getSubjectGuides(): Promise<any[]> {
    try {
      const guides = [
        {
          title: 'Research Guides',
          description: 'Curated resources for academic research',
          subjects: ['research methods', 'citation styles', 'databases'],
        },
        {
          title: 'Business Resources',
          description: 'Essential materials for business students and professionals',
          subjects: ['business', 'economics', 'management', 'entrepreneurship'],
        },
        {
          title: 'STEM Collection',
          description: 'Science, Technology, Engineering, and Mathematics resources',
          subjects: ['science', 'technology', 'engineering', 'mathematics'],
        },
        {
          title: 'Arts & Humanities',
          description: 'Creative and cultural resources',
          subjects: ['art', 'literature', 'history', 'philosophy', 'music'],
        },
      ];

      const enhancedGuides = await Promise.all(
        guides.map(guide => this.createSubjectGuideCollection(guide))
      );

      return enhancedGuides;

    } catch (error) {
      this.logger.error(`Failed to get subject guides: ${error.message}`, error.stack);
      return [];
    }
  }

  async getLocalHistoryCollection(): Promise<any> {
    try {
      const collection = {
        id: 'local-history',
        title: 'Local History & Archives',
        description: 'Discover the rich history of our community through photographs, documents, and oral histories.',
        type: 'special',
        imageUrl: '/assets/images/local-history-banner.jpg',
        itemCount: 0,
        items: [],
      };

      // Get local history items
      const response = await firstValueFrom(
        this.httpService.get(`${this.catalogServiceUrl}/catalog/search`, {
          params: {
            subject: 'local history',
            materialType: 'manuscript,photograph,document',
            limit: 20,
          }
        })
      );

      collection.items = response.data.items || [];
      collection.itemCount = response.data.totalCount || 0;

      return collection;

    } catch (error) {
      this.logger.error(`Failed to get local history collection: ${error.message}`, error.stack);
      return this.getMockLocalHistoryCollection();
    }
  }

  private async getNewBooksCollection(): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.catalogServiceUrl}/catalog/new-acquisitions`, {
          params: { days: 30, limit: 12 }
        })
      );

      return {
        id: 'new-books',
        title: 'New Arrivals',
        description: 'Recently added to our collection',
        type: 'featured',
        imageUrl: '/assets/images/new-books-banner.jpg',
        items: response.data.items || [],
        itemCount: response.data.totalCount || 0,
      };

    } catch (error) {
      return null;
    }
  }

  private async getPopularBooksCollection(): Promise<any> {
    try {
      // Mock popular books - would come from circulation statistics
      return {
        id: 'popular-books',
        title: 'Popular This Month',
        description: 'Most borrowed items this month',
        type: 'featured',
        imageUrl: '/assets/images/popular-books-banner.jpg',
        items: this.getMockPopularItems(),
        itemCount: 15,
      };

    } catch (error) {
      return null;
    }
  }

  private async getDigitalResourcesCollection(): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.catalogServiceUrl}/catalog/material-type/ebook`, {
          params: { limit: 12 }
        })
      );

      return {
        id: 'digital-resources',
        title: 'Digital Resources',
        description: 'eBooks, audiobooks, and online databases',
        type: 'digital',
        imageUrl: '/assets/images/digital-resources-banner.jpg',
        items: response.data.items || [],
        itemCount: response.data.totalCount || 0,
      };

    } catch (error) {
      return null;
    }
  }

  private async getSpecialCollections(): Promise<any[]> {
    return [
      {
        id: 'rare-books',
        title: 'Rare Books & Manuscripts',
        description: 'Unique and historically significant materials',
        type: 'special',
        imageUrl: '/assets/images/rare-books-banner.jpg',
        items: [],
        itemCount: 0,
        accessNote: 'Special access required - contact library staff',
      },
      {
        id: 'thesis-collection',
        title: 'Thesis & Dissertations',
        description: 'Academic works by our graduates',
        type: 'academic',
        imageUrl: '/assets/images/thesis-banner.jpg',
        items: [],
        itemCount: 0,
      },
    ];
  }

  private async createSeasonalCollection(title: string, subjects: string): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.catalogServiceUrl}/catalog/search`, {
          params: {
            q: subjects,
            limit: 10,
          }
        })
      );

      return {
        id: title.toLowerCase().replace(/\s+/g, '-'),
        title,
        description: `Curated selection for ${title.toLowerCase()}`,
        type: 'seasonal',
        items: response.data.items || [],
        itemCount: response.data.totalCount || 0,
      };

    } catch (error) {
      return null;
    }
  }

  private async createSubjectGuideCollection(guide: any): Promise<any> {
    try {
      const subjectQuery = guide.subjects.join(' OR ');
      
      const response = await firstValueFrom(
        this.httpService.get(`${this.catalogServiceUrl}/catalog/search`, {
          params: {
            subject: subjectQuery,
            limit: 15,
          }
        })
      );

      return {
        id: guide.title.toLowerCase().replace(/\s+/g, '-'),
        title: guide.title,
        description: guide.description,
        type: 'subject-guide',
        subjects: guide.subjects,
        items: response.data.items || [],
        itemCount: response.data.totalCount || 0,
      };

    } catch (error) {
      return {
        ...guide,
        id: guide.title.toLowerCase().replace(/\s+/g, '-'),
        type: 'subject-guide',
        items: [],
        itemCount: 0,
      };
    }
  }

  private enhanceCollection(collection: any): any {
    return {
      ...collection,
      enhancedAt: new Date().toISOString(),
      viewUrl: `/collections/${collection.id}`,
    };
  }

  private enhanceExhibitCollection(exhibit: any): any {
    return {
      ...exhibit,
      type: 'exhibit',
      viewUrl: `/exhibits/${exhibit.id}`,
    };
  }

  private getCurrentSeason(month: number): string {
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    if (month >= 9 && month <= 11) return 'fall';
    return 'winter';
  }

  private getMockCollections(): any[] {
    return [
      {
        id: 'featured-fiction',
        title: 'Featured Fiction',
        description: 'Handpicked novels and short stories',
        type: 'featured',
        itemCount: 25,
      },
      {
        id: 'staff-recommendations',
        title: 'Staff Recommendations',
        description: 'Our librarians\' favorite picks',
        type: 'curated',
        itemCount: 15,
      },
    ];
  }

  private getMockCollectionByTheme(theme: string): any {
    return {
      id: theme,
      title: `${theme.charAt(0).toUpperCase() + theme.slice(1)} Collection`,
      description: `Curated resources related to ${theme}`,
      type: 'themed',
      items: [],
      itemCount: 0,
    };
  }

  private getMockPopularItems(): any[] {
    return [
      {
        id: '1',
        title: 'The Seven Husbands of Evelyn Hugo',
        author: 'Taylor Jenkins Reid',
        materialType: 'book',
      },
      {
        id: '2',
        title: 'Atomic Habits',
        author: 'James Clear',
        materialType: 'book',
      },
    ];
  }

  private getMockExhibits(): any[] {
    return [
      {
        id: 'local-artists',
        title: 'Local Artists Showcase',
        description: 'Celebrating creativity in our community',
        type: 'exhibit',
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      },
    ];
  }

  private getMockLocalHistoryCollection(): any {
    return {
      id: 'local-history',
      title: 'Local History & Archives',
      description: 'Community history and heritage materials',
      type: 'special',
      items: [],
      itemCount: 0,
    };
  }
}
