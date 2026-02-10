import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FirebaseAuthGuard } from './guards/firebase-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  @UseGuards(FirebaseAuthGuard)
  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile from Firebase token' })
  @ApiResponse({ status: 200, description: 'User profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getProfile(@Request() req) {
    return req.user;
  }

  /**
   * Verify a Firebase ID token and return decoded user info.
   * This endpoint is used to validate Firebase tokens from the mobile app.
   */
  @UseGuards(FirebaseAuthGuard)
  @Get('verify')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify Firebase ID token' })
  @ApiResponse({
    status: 200,
    description: 'Token is valid',
    schema: {
      type: 'object',
      properties: {
        uid: { type: 'string', description: 'User ID' },
        email: { type: 'string', description: 'User email' },
        role: { type: 'string', description: 'User role (ADMIN, ATTENDEE)' },
        emailVerified: {
          type: 'boolean',
          description: 'Email verification status',
        },
        authProvider: {
          type: 'string',
          description: 'Authentication provider',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired token' })
  verifyToken(@Request() req) {
    return req.user;
  }
}
