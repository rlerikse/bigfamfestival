import { Controller, Get, Post, Body, Logger } from '@nestjs/common';
import {
  NotificationsService,
  CreateNotificationDto,
} from '../notifications/notifications.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('debug')
@Controller('debug/notifications')
export class NotificationsDebugController {
  private readonly logger = new Logger(NotificationsDebugController.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('token-count')
  @Public()
  @ApiOperation({ summary: 'Get count of registered push tokens' })
  @ApiResponse({ status: 200, description: 'Token count information' })
  async getTokenCount() {
    return this.notificationsService.getTokenCount();
  }

  @Get('fcm-config')
  @Public()
  @ApiOperation({ summary: 'Verify Firebase Cloud Messaging configuration' })
  @ApiResponse({ status: 200, description: 'FCM configuration status' })
  async verifyFcmConfig() {
    return this.notificationsService.verifyFcmConfig();
  }

  @Post('test-token')
  @Public()
  @ApiOperation({ summary: 'Test sending notification to a specific token' })
  @ApiResponse({ status: 200, description: 'Test notification result' })
  async testNotification() {
    return this.notificationsService.sendTestNotification();
  }

  @Post('minimal-test')
  @Public()
  @ApiOperation({ summary: 'Create a minimal test notification' })
  @ApiResponse({ status: 201, description: 'Notification created' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', example: 'Test Notification' },
        body: { type: 'string', example: 'This is a test notification' },
        sentBy: { type: 'string', example: 'debug-user' },
      },
      required: ['title', 'body', 'sentBy'],
    },
  })
  async createMinimalNotification(@Body() data: CreateNotificationDto) {
    try {
      this.logger.log('Creating minimal test notification');

      // Create a minimal notification with only the required fields
      const result = await this.notificationsService.createNotification({
        title: data.title || 'Debug Test',
        body: data.body || 'This is a debug test notification',
        sentBy: data.sentBy || 'debug-user',
      });

      this.logger.log('Minimal test notification created:', result);
      return {
        success: true,
        ...result,
        message: 'Minimal test notification created successfully',
      };
    } catch (error) {
      this.logger.error('Error creating minimal test notification:', error);
      return {
        success: false,
        error: error.message || 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      };
    }
  }
}
