import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for AI/ML service access
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
      'X-Model-ID',
      'X-Session-ID'
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

  // Swagger documentation for AI/ML API
  const config = new DocumentBuilder()
    .setTitle('ShellNexa AI/ML Service')
    .setDescription('Intelligent recommendations and predictive analytics for library operations')
    .setVersion('2.0')
    .addBearerAuth()
    .addTag('models', 'ML model management and deployment')
    .addTag('recommendations', 'Personalized and content-based recommendations')
    .addTag('predictions', 'Predictive analytics and forecasting')
    .addTag('analytics', 'AI-powered insights and analysis')
    .addTag('training', 'Model training and retraining')
    .addTag('monitoring', 'Model performance and drift monitoring')
    .addTag('health', 'Health check endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT || 3012;
  await app.listen(port);

  console.log(`🤖 ShellNexa AI/ML Service running on port ${port}`);
  console.log(`📊 API Documentation: http://localhost:${port}/docs`);
  console.log(`🧠 Intelligent Library Analytics: Ready for machine learning`);
}

bootstrap();
