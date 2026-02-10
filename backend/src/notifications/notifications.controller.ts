import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Logger,
} from '@nestjs/common';
import {
  NotificationsService,
  AdminNotification,
} from './notifications.service';
// Auth handled by global FirebaseAuthGuard + RolesGuard
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import {
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

interface CreateNotificationDto {
  title: string;
  body: string;
  data?: Record<string, any>;
  sentBy: string;
  category?: string;
  priority?: 'normal' | 'high';
  receiverGroups?: string[];
}

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Create a new notification and send to all devices',
  })
  @ApiBody({
    type: 'object',
    description: 'Notification data',
    examples: {
      example1: {
        summary: 'Basic notification',
        value: {
          title: 'Important Announcement',
          body: 'The main stage schedule has been updated!',
          sentBy: 'admin123',
          priority: 'normal',
        },
      },
      example2: {
        summary: 'Targeted notification with data',
        value: {
          title: 'VIP Area Open',
          body: 'The VIP area is now open for access',
          sentBy: 'admin123',
          category: 'vip',
          priority: 'high',
          receiverGroups: ['vip'],
          data: { area: 'vip-tent', openUntil: '23:00' },
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'The notification has been successfully created and sent.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - requires admin role.' })
  async createNotification(
    @Body() notificationDto: CreateNotificationDto,
  ): Promise<{ id: string; fcmWarning?: string }> {
    try {
      // Create the notification without any FCM checks
      const result = await this.notificationsService.createNotification(
        notificationDto,
      );

      // Return the result directly, including any warnings
      return result;
    } catch (error) {
      // Log the error
      this.logger.error('Error creating notification:', error);

      // Rethrow for the global exception filter
      throw error;
    }
  }

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get recent notifications' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Limit the number of notifications returned (default: 50)',
  })
  @ApiResponse({ status: 200, description: 'List of notifications' })
  async getNotifications(
    @Query('limit') limit?: number,
  ): Promise<AdminNotification[]> {
    return this.notificationsService.getNotifications(limit);
  }
}
