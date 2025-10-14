import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Library } from './entities/library.entity';
import { Branch } from './entities/branch.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Library, Branch])],
  controllers: [],
  providers: [],
  exports: [],
})
export class LibrariesModule {}
