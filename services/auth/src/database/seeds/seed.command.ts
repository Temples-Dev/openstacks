import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';

import { SeedModule } from './seed.module';
import { SeedService } from './seed.service';
import { User } from '../../users/entities/user.entity';
import { Role } from '../../roles/entities/role.entity';
import { Permission } from '../../roles/entities/permission.entity';
import { Session } from '../../auth/entities/session.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'shellnexa_app'),
        password: configService.get('DB_PASSWORD', 'shellnexa_app_dev'),
        database: configService.get('DB_DATABASE', 'auth_service'),
        entities: [User, Role, Permission, Session],
        synchronize: true,
        logging: false,
      }),
      inject: [ConfigService],
    }),
    SeedModule,
  ],
})
class SeedAppModule {}

async function bootstrap() {
  const app = await NestFactory.create(SeedAppModule);
  const seedService = app.get(SeedService);

  try {
    await seedService.seed();
    console.log('✅ Database seeding completed successfully');
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

bootstrap();
