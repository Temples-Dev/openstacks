import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for multi-tenant access
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
      'X-Branch-ID',
      'X-User-ID', 
      'X-Request-ID'
    ],
    credentials: true,
  });

  // Global validation pipe with tenant context
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

  // Swagger documentation for multi-tenant API
  const config = new DocumentBuilder()
    .setTitle('ShellNexa Multi-Tenant Service')
    .setDescription('Library system and branch management for multi-institutional operations')
    .setVersion('2.0')
    .addBearerAuth()
    .addTag('systems', 'Library system management')
    .addTag('libraries', 'Library and branch management')
    .addTag('tenants', 'Tenant context and configuration')
    .addTag('policies', 'Circulation and resource sharing policies')
    .addTag('consortium', 'Consortium and partnership management')
    .addTag('integration', 'System integration and data sync')
    .addTag('analytics', 'Multi-tenant analytics and reporting')
    .addTag('health', 'Health check endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT || 3008;
  await app.listen(port);

  console.log(`🏢 ShellNexa Multi-Tenant Service running on port ${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/docs`);
  console.log(`🌐 Multi-Institutional Support: Ready for library systems and consortiums`);
}

bootstrap();
