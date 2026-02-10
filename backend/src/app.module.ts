import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { FirestoreModule } from './config/firestore/firestore.module';
import { FirebaseAdminModule } from './config/firebase/firebase-admin.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { EventsModule } from './events/events.module';
import { ScheduleModule } from './schedule/schedule.module';
// import { TicketsModule } from './tickets/tickets.module';
// import { MapModule } from './map/map.module';
// import { FriendsModule } from './friends/friends.module';
import { HealthModule } from './health/health.module';
import { CampsitesModule } from './campsites/campsites.module';
import { NotificationsModule } from './notifications/notifications.module';
import { DebugModule } from './debug/debug.module'; // Debug endpoints
import * as Joi from 'joi';
import { APP_GUARD } from '@nestjs/core';
import { HybridAuthGuard } from './auth/guards/hybrid-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { ArtistsModule } from './artists/artists.module';
import { TenantMiddleware } from './common/middleware/tenant.middleware';

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
        GOOGLE_APPLICATION_CREDENTIALS: Joi.string().optional(), // Changed from .required()
        GOOGLE_PROJECT_ID: Joi.string().required(),
        STORAGE_BUCKET: Joi.string().required(),
        THROTTLE_TTL: Joi.number().default(60),
        THROTTLE_LIMIT: Joi.number().default(100),
        FESTIVAL_ID: Joi.string().optional(), // Optional for single-tenant mode
      }),
    }),

    // Rate limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          throttlers: [{
            ttl: configService.get<number>('THROTTLE_TTL', 60) * 1000, // Convert to milliseconds
            limit: configService.get<number>('THROTTLE_LIMIT', 100),
          }],
        };
      },
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
    FirebaseAdminModule, // Add Firebase Admin initialization

    // Application modules
    AuthModule,
    UsersModule,
    EventsModule,
    ScheduleModule,
    // TicketsModule,
    // MapModule,
    // FriendsModule,
    HealthModule,
    CampsitesModule,
    ArtistsModule,
    NotificationsModule,

    // Debug modules (non-production only)
    ...(process.env.NODE_ENV !== 'production' ? [DebugModule] : []),
  ],
  controllers: [],
  providers: [
    // Global authentication guard (Firebase + legacy JWT during transition)
    {
      provide: APP_GUARD,
      useClass: HybridAuthGuard,
    },
    // Global roles guard
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    // Global rate limiting guard
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply tenant middleware to all routes except health check
    consumer
      .apply(TenantMiddleware)
      .exclude('api/v1/health')
      .forRoutes('*');
  }
}
