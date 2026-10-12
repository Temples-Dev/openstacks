import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for Digital Repository service access
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:3000', 
      'http://localhost:3001',
      'https://*.openstacks.com',
      'https://*.library.org'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'X-Tenant-ID', 
      'X-Library-ID', 
      'X-User-ID',
      'X-Collection-ID',
      'X-Upload-Session'
    ],
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger documentation for Digital Repository API
  const config = new DocumentBuilder()
    .setTitle('OpenStacks Digital Repository Service')
    .setDescription('Institutional repository with digital preservation and scholarly communication')
    .setVersion('2.0')
    .addBearerAuth()
    .addTag('collections', 'Digital collection management')
    .addTag('objects', 'Digital object lifecycle management')
    .addTag('files', 'File upload, storage, and preservation')
    .addTag('metadata', 'Metadata schemas and validation')
    .addTag('preservation', 'Digital preservation and fixity')
    .addTag('oai-pmh', 'OAI-PMH harvesting protocol')
    .addTag('analytics', 'Repository analytics and statistics')
    .addTag('health', 'Health check endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT || 3011;
  await app.listen(port);

  console.log(`📖 OpenStacks Digital Repository Service running on port ${port}`);
  console.log(`📊 API Documentation: http://localhost:${port}/docs`);
  console.log(`🏛️ Institutional Repository: Ready for scholarly communication`);
}

bootstrap();
