import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LibrarySystem } from './entities/library-system.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LibrarySystem])],
  controllers: [],
  providers: [],
  exports: [],
})
export class LibrarySystemsModule {}
