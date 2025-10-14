import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CollectionsService } from './collections.service';
import { CollectionsController } from './collections.controller';

@Module({
  imports: [HttpModule],
  controllers: [CollectionsController],
  providers: [CollectionsService],
  exports: [CollectionsService],
})
export class CollectionsModule {}
