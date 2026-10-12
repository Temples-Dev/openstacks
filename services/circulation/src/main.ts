import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-User-ID', 'X-User-Roles', 'X-User-Permissions'],
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

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('OpenStacks Circulation Service')
    .setDescription('Library Circulation Management API - Check-outs, returns, holds, fines, and patron management')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('patrons', 'Patron management')
    .addTag('loans', 'Check-out and return operations')
    .addTag('holds', 'Hold and reservation management')
    .addTag('fines', 'Fine and fee management')
    .addTag('renewals', 'Loan renewal operations')
    .addTag('circulation', 'General circulation operations')
    .addTag('health', 'Health check endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT || 3004;
  await app.listen(port);

  console.log(`🔄 OpenStacks Circulation Service running on port ${port}`);
  console.log(`📋 API Documentation: http://localhost:${port}/docs`);
}

bootstrap();
