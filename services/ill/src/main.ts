import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for ILL service access
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
      'X-Request-ID',
      'X-Partner-ID'
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

  // Swagger documentation for ILL API
  const config = new DocumentBuilder()
    .setTitle('OpenStacks Interlibrary Loan Service')
    .setDescription('Resource sharing and interlibrary loan management for library networks')
    .setVersion('2.0')
    .addBearerAuth()
    .addTag('requests', 'ILL request management')
    .addTag('partners', 'Partner library management')
    .addTag('routing', 'Automated request routing')
    .addTag('transactions', 'Transaction history and audit trail')
    .addTag('analytics', 'ILL statistics and reporting')
    .addTag('health', 'Health check endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT || 3009;
  await app.listen(port);

  console.log(`📚 OpenStacks ILL Service running on port ${port}`);
  console.log(`🔗 API Documentation: http://localhost:${port}/docs`);
  console.log(`🌐 Interlibrary Loan Management: Ready for resource sharing`);
}

bootstrap();
