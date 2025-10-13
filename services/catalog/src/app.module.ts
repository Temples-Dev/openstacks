import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

// Feature modules
import { CatalogModule } from './catalog/catalog.module';
import { MarcModule } from './marc/marc.module';
import { ItemsModule } from './items/items.module';
import { HoldingsModule } from './holdings/holdings.module';
import { AuthoritiesModule } from './authorities/authorities.module';
import { HealthModule } from './health/health.module';

// Entities
import { CatalogRecord } from './catalog/entities/catalog-record.entity';
import { MarcRecord } from './marc/entities/marc-record.entity';
import { MarcField } from './marc/entities/marc-field.entity';
import { MarcSubfield } from './marc/entities/marc-subfield.entity';
import { Item } from './items/entities/item.entity';
import { Holdings } from './holdings/entities/holdings.entity';
import { Location } from './holdings/entities/location.entity';
import { AuthorityRecord } from './authorities/entities/authority-record.entity';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'shellnexa_app'),
        password: configService.get('DB_PASSWORD', 'shellnexa_app_dev'),
        database: configService.get('DB_DATABASE', 'catalog_service'),
        entities: [
          CatalogRecord,
          MarcRecord,
          MarcField,
          MarcSubfield,
          Item,
          Holdings,
          Location,
          AuthorityRecord,
        ],
        synchronize: configService.get('NODE_ENV') === 'development',
        logging: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),

    // Feature modules
    CatalogModule,
    MarcModule,
    ItemsModule,
    HoldingsModule,
    AuthoritiesModule,
    HealthModule,
  ],
})
export class AppModule {}
