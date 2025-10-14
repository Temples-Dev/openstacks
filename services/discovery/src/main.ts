import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for public access
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:3000', 
      'http://localhost:3001',
      'https://*.shellnexa.com'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Patron-ID', 'X-Session-ID'],
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
    .setTitle('ShellNexa Discovery Service')
    .setDescription('Public catalog search and patron self-service API')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('search', 'Catalog search and discovery')
    .addTag('catalog', 'Public catalog browsing')
    .addTag('patron', 'Patron self-service')
    .addTag('recommendations', 'Content recommendations')
    .addTag('collections', 'Featured collections and exhibits')
    .addTag('health', 'Health check endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT || 3006;
  await app.listen(port);

  console.log(`🔍 ShellNexa Discovery Service running on port ${port}`);
  console.log(`📖 API Documentation: http://localhost:${port}/docs`);
  console.log(`🌐 Public Access: Service ready for patron use`);
}

bootstrap();
