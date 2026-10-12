import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';

import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { Metric } from './entities/metric.entity';
import { DataSnapshot } from './entities/data-snapshot.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Metric, DataSnapshot]),
    HttpModule,
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
