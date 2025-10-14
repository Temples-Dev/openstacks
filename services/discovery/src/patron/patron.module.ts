import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PatronService } from './patron.service';
import { PatronController } from './patron.controller';

@Module({
  imports: [HttpModule],
  controllers: [PatronController],
  providers: [PatronService],
  exports: [PatronService],
})
export class PatronModule {}
