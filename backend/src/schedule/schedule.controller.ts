import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
  Param,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import {
  CreateScheduleItemDto,
  RemoveScheduleItemDto,
} from './interfaces/schedule.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('schedule')
@UseGuards(JwtAuthGuard)
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Post()
  async addToSchedule(
    @Request() req,
    @Body() createScheduleItemDto: CreateScheduleItemDto,
  ) {
    // Use userId from JWT token, not from request body
    return this.scheduleService.addToSchedule(
      req.user.id,
      createScheduleItemDto,
    );
  }

  @Delete()
  async removeFromSchedule(
    @Request() req,
    @Body() removeScheduleItemDto: RemoveScheduleItemDto,
  ) {
    await this.scheduleService.removeFromSchedule(
      req.user.id,
      removeScheduleItemDto,
    );
    return { message: 'Event removed from schedule successfully' };
  }

  @Get()
  async getCurrentUserSchedule(@Request() req) {
    return this.scheduleService.getSchedule(req.user.id);
  }

  @Get(':userId')
  async getUserSchedule(@Param('userId') userId: string) {
    return this.scheduleService.getSchedule(userId);
  }
}
