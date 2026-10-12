import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for service communication
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:3000', 
      'http://localhost:3001',
      'https://*.shellnexa.com'
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
    .setTitle('ShellNexa Acquisitions Service')
    .setDescription('Purchase orders, vendors, budgets, and collection development API')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('vendors', 'Vendor and supplier management')
    .addTag('purchase-orders', 'Purchase order lifecycle management')
    .addTag('budgets', 'Budget and fund management')
    .addTag('invoices', 'Invoice processing and payment')
    .addTag('receipts', 'Item receiving and inventory')
    .addTag('acquisitions', 'Core acquisitions workflow')
    .addTag('reports', 'Financial and operational reporting')
    .addTag('health', 'Health check endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT || 3005;
  await app.listen(port);

  console.log(`💰 ShellNexa Acquisitions Service running on port ${port}`);
  console.log(`📋 API Documentation: http://localhost:${port}/docs`);
  console.log(`🏢 Financial Management: Service ready for procurement operations`);
}

bootstrap();
