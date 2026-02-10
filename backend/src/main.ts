import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as compression from 'compression';
import helmet from 'helmet';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { festivalConfig } from './config/festival.config';

async function bootstrap() {
  // Create NestJS application
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true, // Buffer logs for custom logger
  });

  // Get configuration service
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 8080);
  const environment = configService.get<string>('NODE_ENV', 'production');

  // Set up logger
  const logger = app.get(Logger);
  app.useLogger(logger);
  
  // Log startup information
  logger.log(`Starting application in ${environment} mode`);
  if (environment !== 'production') {
    logger.log(`API documentation available at /api/docs`);
  }

  // Enable CORS for frontend
  const corsOrigin = configService.get<string>('CORS_ORIGIN', '*');
  app.enableCors({
    origin: corsOrigin === '*' ? true : corsOrigin.split(',').map(o => o.trim()),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global error filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Enable request compression
  app.use(compression());

  // Security headers
  app.use(helmet());

  // Set global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties not in DTO
      transform: true, // Transform payloads to DTO instances
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are present
    }),
  );

  // Set global API prefix
  app.setGlobalPrefix('api/v1');

  // Set up Swagger documentation
  if (environment !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle(festivalConfig.apiTitle)
      .setDescription(festivalConfig.apiDescription)
      .setVersion(festivalConfig.apiVersion)
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
  }

  // Start the server
  await app.listen(port, '0.0.0.0');
  logger.log(`Application is running on port ${port} in ${environment} mode`);
}

bootstrap();
