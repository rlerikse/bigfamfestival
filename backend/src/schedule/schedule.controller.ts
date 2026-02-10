import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
  Param,
  Request,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ScheduleService } from './schedule.service';
import {
  CreateScheduleItemDto,
  RemoveScheduleItemDto,
} from './interfaces/schedule.interface';
// Auth handled by global FirebaseAuthGuard

@ApiTags('schedule')
@ApiBearerAuth()
@Controller('schedule')
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  // Add event to user's schedule
  @Post()
  @ApiOperation({ summary: 'Add event to current user\'s schedule' })
  @ApiResponse({ status: 201, description: 'Event added to schedule' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async addToSchedule(
    @Request() req,
    @Body() createScheduleItemDto: CreateScheduleItemDto,
  ) {
    return this.scheduleService.addToSchedule(
      req.user.id,
      createScheduleItemDto,
    );
  }

  // Remove an event by eventId path param
  @Delete(':eventId')
  @ApiOperation({ summary: 'Remove event from current user\'s schedule' })
  @ApiParam({ name: 'eventId', description: 'ID of the event to remove' })
  @ApiResponse({ status: 200, description: 'Event removed from schedule' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Event not found in schedule' })
  async removeFromSchedule(@Request() req, @Param('eventId') eventId: string) {
    const removeDto: RemoveScheduleItemDto = { event_id: eventId };
    await this.scheduleService.removeFromSchedule(req.user.id, removeDto);
    return { message: 'Event removed from schedule successfully' };
  }

  // Get current user's schedule
  @Get()
  @ApiOperation({ summary: 'Get current user\'s schedule' })
  @ApiResponse({ status: 200, description: 'Returns list of scheduled events' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCurrentUserSchedule(@Request() req) {
    return this.scheduleService.getSchedule(req.user.id);
  }

  // Get another user's schedule by userId param
  @Get(':userId')
  @ApiOperation({ summary: 'Get another user\'s schedule by user ID' })
  @ApiParam({ name: 'userId', description: 'ID of the user' })
  @ApiResponse({ status: 200, description: 'Returns list of scheduled events for the user' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserSchedule(@Param('userId') userId: string) {
    return this.scheduleService.getSchedule(userId);
  }
}
