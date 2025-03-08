import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { FirestoreModule } from './config/firestore/firestore.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { EventsModule } from './events/events.module';
// import { TicketsModule } from './tickets/tickets.module';
// import { MapModule } from './map/map.module';
// import { FriendsModule } from './friends/friends.module';
import { HealthModule } from './health/health.module';
import * as Joi from 'joi';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        PORT: Joi.number().default(3000),
        JWT_SECRET: Joi.string().required(),
        JWT_EXPIRATION: Joi.string().default('1d'),
        CORS_ORIGIN: Joi.string().default('*'),
        GOOGLE_APPLICATION_CREDENTIALS: Joi.string().required(),
        GOOGLE_PROJECT_ID: Joi.string().required(),
        STORAGE_BUCKET: Joi.string().required(),
      }),
    }),

    // Logging
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isProduction = configService.get('NODE_ENV') === 'production';
        return {
          pinoHttp: {
            transport: isProduction ? undefined : { target: 'pino-pretty' },
            level: isProduction ? 'info' : 'debug',
            redact: ['req.headers.authorization'],
          },
        };
      },
    }),

    // Firebase/Firestore
    FirestoreModule,

    // Application modules
    AuthModule,
    UsersModule,
    EventsModule,
    // TicketsModule,
    // MapModule,
    // FriendsModule,
    HealthModule,
  ],
  controllers: [],
  providers: [
    // Global JWT authentication guard
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // Global roles guard
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
