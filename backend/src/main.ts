import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as compression from 'compression';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';

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
  app.useLogger(app.get(Logger));

  // Enable CORS for frontend
  app.enableCors({
    origin: configService.get<string>('CORS_ORIGIN', '*'),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Enable request compression
  app.use(compression());

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
      .setTitle('Big Fam Festival API')
      .setDescription('API for the Big Fam Festival App')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
  }

  // Start the server
  await app.listen(port, '0.0.0.0');
  console.log(`Application is running on port ${port} in ${environment} mode`);
}

bootstrap();
