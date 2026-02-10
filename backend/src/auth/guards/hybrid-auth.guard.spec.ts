import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { HybridAuthGuard } from './hybrid-auth.guard';
import * as admin from 'firebase-admin';

// Mock firebase-admin
jest.mock('firebase-admin', () => ({
  auth: jest.fn(),
}));

describe('HybridAuthGuard', () => {
  let guard: HybridAuthGuard;
  let reflector: Reflector;
  let mockVerifyIdToken: jest.Mock;

  const JWT_SECRET = 'test-jwt-secret';

  const createMockExecutionContext = (
    authHeader?: string,
  ): ExecutionContext => {
    const mockRequest = {
      headers: {
        authorization: authHeader,
      },
      user: null,
    };

    return {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
  };

  // Helper to create a simple JWT token (for testing legacy auth)
  const createLegacyJwt = (payload: object): string => {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    // Note: In real tests you'd use jsonwebtoken to create proper signed tokens
    // This is a simplified version for demonstration
    const crypto = require('crypto');
    const signature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${header}.${body}`)
      .digest('base64url');
    return `${header}.${body}.${signature}`;
  };

  beforeEach(async () => {
    mockVerifyIdToken = jest.fn();
    (admin.auth as jest.Mock).mockReturnValue({
      verifyIdToken: mockVerifyIdToken,
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HybridAuthGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn().mockReturnValue(false),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'JWT_SECRET') return JWT_SECRET;
              return null;
            }),
          },
        },
      ],
    }).compile();

    guard = module.get<HybridAuthGuard>(HybridAuthGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    it('should allow access to public routes', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
      const context = createMockExecutionContext();

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should reject request without token', async () => {
      const context = createMockExecutionContext();

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should accept valid Firebase token (primary auth)', async () => {
      const mockDecodedToken = {
        uid: 'firebase-user-123',
        email: 'firebase@example.com',
        role: 'ADMIN',
        email_verified: true,
      };
      mockVerifyIdToken.mockResolvedValue(mockDecodedToken);

      const context = createMockExecutionContext('Bearer firebase-token');
      const request = context.switchToHttp().getRequest();

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(request.user).toEqual({
        sub: 'firebase-user-123',
        uid: 'firebase-user-123',
        email: 'firebase@example.com',
        role: 'ADMIN',
        emailVerified: true,
        authProvider: 'firebase',
      });
    });

    it('should fall back to legacy JWT when Firebase fails', async () => {
      // Firebase rejects the token
      mockVerifyIdToken.mockRejectedValue(new Error('Not a Firebase token'));

      // Create a valid legacy JWT
      const payload = {
        sub: 'legacy-user-456',
        email: 'legacy@example.com',
        role: 'ATTENDEE',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };
      const legacyToken = createLegacyJwt(payload);

      const context = createMockExecutionContext(`Bearer ${legacyToken}`);
      const request = context.switchToHttp().getRequest();

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(request.user.authProvider).toBe('jwt-legacy');
      expect(request.user.uid).toBe('legacy-user-456');
    });

    it('should reject when both Firebase and JWT fail', async () => {
      // Firebase rejects
      mockVerifyIdToken.mockRejectedValue(new Error('Invalid Firebase token'));

      // JWT also invalid (garbage token)
      const context = createMockExecutionContext('Bearer invalid-garbage-token');

      await expect(guard.canActivate(context)).rejects.toThrow(
        'Invalid authentication token. Please re-authenticate.',
      );
    });

    it('should default role to ATTENDEE for Firebase token without role claim', async () => {
      const mockDecodedToken = {
        uid: 'user-no-role',
        email: 'norole@example.com',
        email_verified: false,
        // No role field
      };
      mockVerifyIdToken.mockResolvedValue(mockDecodedToken);

      const context = createMockExecutionContext('Bearer firebase-token');
      const request = context.switchToHttp().getRequest();

      await guard.canActivate(context);

      expect(request.user.role).toBe('ATTENDEE');
    });

    it('should try Firebase first before JWT for performance', async () => {
      const mockDecodedToken = {
        uid: 'firebase-user',
        email: 'test@example.com',
        role: 'ATTENDEE',
        email_verified: true,
      };
      mockVerifyIdToken.mockResolvedValue(mockDecodedToken);

      const context = createMockExecutionContext('Bearer valid-firebase-token');

      await guard.canActivate(context);

      // Firebase should be called
      expect(mockVerifyIdToken).toHaveBeenCalledWith('valid-firebase-token');
      // And it should succeed without falling back
      expect(context.switchToHttp().getRequest().user.authProvider).toBe('firebase');
    });
  });
});
