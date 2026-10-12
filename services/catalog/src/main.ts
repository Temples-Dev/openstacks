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
    .setTitle('ShellNexa Catalog Service')
    .setDescription('Library Catalog Management API - MARC records, bibliographic data, and catalog operations')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('catalog', 'Catalog record management')
    .addTag('marc', 'MARC record operations')
    .addTag('items', 'Physical item management')
    .addTag('holdings', 'Holdings and locations')
    .addTag('authorities', 'Authority records')
    .addTag('health', 'Health check endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT || 3003;
  await app.listen(port);

  console.log(`📚 ShellNexa Catalog Service running on port ${port}`);
  console.log(`📖 API Documentation: http://localhost:${port}/docs`);
}

bootstrap();
