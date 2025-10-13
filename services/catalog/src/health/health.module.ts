import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { CatalogRecord } from '../catalog/entities/catalog-record.entity';

@Module({
  imports: [
    TerminusModule,
    TypeOrmModule.forFeature([CatalogRecord]),
  ],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
