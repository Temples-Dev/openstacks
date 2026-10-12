import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for dashboard access
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:3000', 
      'http://localhost:3001',
      'https://*.openstacks.com'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-User-ID', 'X-Request-ID'],
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
    .setTitle('OpenStacks Reporting Service')
    .setDescription('Analytics, dashboards, and business intelligence API')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('analytics', 'Data analytics and metrics')
    .addTag('dashboards', 'Executive and operational dashboards')
    .addTag('reports', 'Generated reports and exports')
    .addTag('circulation', 'Circulation analytics and reports')
    .addTag('financial', 'Financial reporting and budget analytics')
    .addTag('collection', 'Collection development and usage reports')
    .addTag('patron', 'Patron usage and demographic analytics')
    .addTag('operational', 'Operational metrics and KPIs')
    .addTag('health', 'Health check endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT || 3007;
  await app.listen(port);

  console.log(`📊 OpenStacks Reporting Service running on port ${port}`);
  console.log(`📈 API Documentation: http://localhost:${port}/docs`);
  console.log(`🎯 Business Intelligence: Service ready for analytics and reporting`);
}

bootstrap();
