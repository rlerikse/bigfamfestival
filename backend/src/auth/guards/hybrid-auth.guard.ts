import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as admin from 'firebase-admin';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * Hybrid authentication guard that supports both Firebase ID tokens and legacy JWT tokens.
 *
 * This guard is designed for the migration transition period:
 * 1. First attempts to verify the token as a Firebase ID token
 * 2. If Firebase verification fails, falls back to legacy JWT verification
 *
 * This allows the backend to accept tokens from both:
 * - New mobile app versions using Firebase Auth
 * - Old mobile app versions still using legacy JWT
 *
 * @example
 * ```typescript
 * @UseGuards(HybridAuthGuard)
 * @Controller('protected')
 * export class ProtectedController {}
 * ```
 */
@Injectable()
export class HybridAuthGuard implements CanActivate {
  private readonly logger = new Logger(HybridAuthGuard.name);
  private readonly jwtService: JwtService;
  private readonly jwtSecret: string;

  constructor(
    private reflector: Reflector,
    private configService: ConfigService,
  ) {
    // Create JWT service instance for legacy token verification
    this.jwtSecret = this.configService.get<string>('JWT_SECRET');
    this.jwtService = new JwtService({
      secret: this.jwtSecret,
    });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      this.logger.debug('No token provided in request');
      throw new UnauthorizedException('No authentication token provided');
    }

    // Try Firebase first
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);

      request.user = {
        sub: decodedToken.uid,
        uid: decodedToken.uid,
        email: decodedToken.email,
        role: decodedToken.role || 'ATTENDEE',
        emailVerified: decodedToken.email_verified,
        authProvider: 'firebase',
      };

      this.logger.debug(
        `Firebase token verified for user ${decodedToken.uid}`,
      );
      return true;
    } catch (firebaseError) {
      this.logger.debug(
        `Firebase verification failed, trying legacy JWT: ${firebaseError.message}`,
      );
    }

    // Fallback to legacy JWT
    try {
      const payload = this.jwtService.verify(token);

      request.user = {
        sub: payload.sub,
        uid: payload.sub,
        email: payload.email,
        role: payload.role || 'ATTENDEE',
        authProvider: 'jwt-legacy',
      };

      this.logger.debug(
        `Legacy JWT verified for user ${payload.sub}`,
      );
      return true;
    } catch (jwtError) {
      this.logger.debug(
        `Legacy JWT verification also failed: ${jwtError.message}`,
      );
    }

    // Both verification methods failed
    throw new UnauthorizedException(
      'Invalid authentication token. Please re-authenticate.',
    );
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return undefined;
    }

    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}
