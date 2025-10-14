import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for E-Resources service access
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:3000', 
      'http://localhost:3001',
      'https://*.shellnexa.com',
      'https://*.library.org'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'X-Tenant-ID', 
      'X-Library-ID', 
      'X-User-ID',
      'X-IP-Address',
      'X-Location'
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

  // Swagger documentation for E-Resources API
  const config = new DocumentBuilder()
    .setTitle('ShellNexa E-Resource Management Service')
    .setDescription('Digital license and access control for electronic resources')
    .setVersion('2.0')
    .addBearerAuth()
    .addTag('resources', 'E-resource management')
    .addTag('licenses', 'License management and compliance')
    .addTag('access', 'Access control and authentication')
    .addTag('usage', 'Usage statistics and COUNTER reports')
    .addTag('analytics', 'Resource analytics and reporting')
    .addTag('health', 'Health check endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT || 3010;
  await app.listen(port);

  console.log(`🌐 ShellNexa E-Resources Service running on port ${port}`);
  console.log(`📊 API Documentation: http://localhost:${port}/docs`);
  console.log(`🔐 Digital License Management: Ready for e-resource access control`);
}

bootstrap();
