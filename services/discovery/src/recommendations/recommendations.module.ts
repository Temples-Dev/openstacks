import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { RecommendationsService } from './recommendations.service';
import { RecommendationsController } from './recommendations.controller';

@Module({
  imports: [HttpModule],
  controllers: [RecommendationsController],
  providers: [RecommendationsService],
  exports: [RecommendationsService],
})
export class RecommendationsModule {}
