import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';

// Feature modules
import { SearchModule } from './search/search.module';
import { CatalogModule } from './catalog/catalog.module';
import { PatronModule } from './patron/patron.module';
import { RecommendationsModule } from './recommendations/recommendations.module';
import { CollectionsModule } from './collections/collections.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // HTTP client for service communication
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
    }),

    // Feature modules
    SearchModule,
    CatalogModule,
    PatronModule,
    RecommendationsModule,
    CollectionsModule,
    HealthModule,
  ],
})
export class AppModule {}
