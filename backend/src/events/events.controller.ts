import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Request,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { EventsService } from './events.service';
import { CreateEventDto } from '../auth/dto/create-event.dto';
import { UpdateEventDto } from '../auth/dto/update-event.dto';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('events')
@Controller('events')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all events or filter by stage/date' })
  @ApiQuery({
    name: 'stage',
    required: false,
    description: 'Filter events by stage',
  })
  @ApiQuery({
    name: 'date',
    required: false,
    description: 'Filter events by date (YYYY-MM-DD)',
  })
  @ApiResponse({ status: 200, description: 'Returns a list of events' })
  async getAllEvents(
    @Query('stage') stage?: string,
    @Query('date') date?: string,
  ) {
    return this.eventsService.findAll(stage, date);
  }

  @Get('stages')
  @Public()
  @ApiOperation({ summary: 'Get all unique stages' })
  @ApiResponse({ status: 200, description: 'Returns a list of unique stages' })
  async getStages() {
    return this.eventsService.getUniqueStages();
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get event by ID' })
  @ApiResponse({ status: 200, description: 'Returns the event' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async getEventById(@Param('id') id: string) {
    return this.eventsService.findById(id);
  }

  @Post()
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new event (Admin only)' })
  @ApiResponse({ status: 201, description: 'Event created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  async createEvent(@Body() createEventDto: CreateEventDto, @Request() req) {
    // Set the creator ID to the user making the request
    return this.eventsService.create({
      ...createEventDto,
      createdBy: req.user.id,
    });
  }

  @Put(':id')
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update event by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'Event updated successfully' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async updateEvent(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
    @Request() req,
  ) {
    // Admin can update any event
    return this.eventsService.update(id, updateEventDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete event by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'Event deleted successfully' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async deleteEvent(@Param('id') id: string, @Request() req) {
    return this.eventsService.remove(id);
  }

  // GET /genres
  @Get('genres')
  async getGenres() {
    const genres = await this.eventsService.getAllGenres();
    return genres.map((doc) => ({
      id: doc.id,
      tag: doc.tag,
    }));
  }
}
