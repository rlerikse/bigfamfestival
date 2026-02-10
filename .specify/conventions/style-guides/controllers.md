# Controller Style Guide - Backend

**Generated**: February 9, 2026  
**Source**: Pattern extraction from existing controllers

---

## Overview

Controllers in this codebase handle HTTP requests using NestJS decorators. They are thin - delegating business logic to services.

---

## File Structure

```typescript
// 1. Imports - NestJS decorators first, then Swagger, then local
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
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { Public } from '../auth/decorators/public.decorator';
import { EventsService } from './events.service';
import { CreateEventDto } from '../auth/dto/create-event.dto';

// 2. Class with decorators
@ApiTags('events')
@Controller('events')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class EventsController {
  // 3. Constructor injection
  constructor(private readonly eventsService: EventsService) {}

  // 4. Route handlers in order: GET, POST, PUT/PATCH, DELETE
}
```

---

## Decorator Patterns

### Class-Level Decorators

```typescript
@ApiTags('events')                        // Swagger tag for grouping
@Controller('events')                     // Route prefix
@UseGuards(FirebaseAuthGuard, RolesGuard) // Firebase Auth + Role guards
export class EventsController {}
```

**Order**: `@ApiTags` → `@Controller` → `@UseGuards`

### Method-Level Decorators

```typescript
@Get()                                          // HTTP method + path
@Public()                                       // Auth override (if needed)
@ApiOperation({ summary: 'Get all events' })    // Swagger operation
@ApiQuery({ name: 'stage', required: false })   // Query params
@ApiResponse({ status: 200, description: '...' }) // Response docs
async getAllEvents(@Query('stage') stage?: string) {}
```

**Order**: HTTP method → Auth decorator → Swagger decorators

### Protected Admin Routes

```typescript
@Post()
@Roles(Role.ADMIN)           // Require admin role
@ApiBearerAuth()             // Swagger auth marker
@ApiOperation({ summary: 'Create new event (Admin only)' })
@ApiResponse({ status: 201, description: 'Event created' })
@ApiResponse({ status: 400, description: 'Invalid data' })
async create(@Body() createEventDto: CreateEventDto) {}
```

---

## Handler Patterns

### Basic GET Handler

```typescript
@Get()
@Public()
@ApiOperation({ summary: 'Get all events or filter by stage/date' })
@ApiQuery({ name: 'stage', required: false, description: 'Filter by stage' })
@ApiQuery({ name: 'date', required: false, description: 'Filter by date' })
@ApiResponse({ status: 200, description: 'Returns a list of events' })
async getAllEvents(
  @Query('stage') stage?: string,
  @Query('date') date?: string,
) {
  return this.eventsService.findAll(stage, date);
}
```

### GET by ID Handler

```typescript
@Get(':id')
@Public()
@ApiOperation({ summary: 'Get event by ID' })
@ApiResponse({ status: 200, description: 'Returns the event' })
@ApiResponse({ status: 404, description: 'Event not found' })
async getEventById(@Param('id') id: string) {
  return this.eventsService.findById(id);
}
```

### POST Handler

```typescript
@Post()
@Roles(Role.ADMIN)
@ApiBearerAuth()
@ApiOperation({ summary: 'Create new event (Admin only)' })
@ApiResponse({ status: 201, description: 'Event created successfully' })
@ApiResponse({ status: 400, description: 'Invalid data' })
async create(@Body() createEventDto: CreateEventDto) {
  return this.eventsService.create(createEventDto);
}
```

### PUT Handler

```typescript
@Put(':id')
@Roles(Role.ADMIN)
@ApiBearerAuth()
@ApiOperation({ summary: 'Update event (Admin only)' })
@ApiResponse({ status: 200, description: 'Event updated' })
@ApiResponse({ status: 404, description: 'Event not found' })
async update(
  @Param('id') id: string,
  @Body() updateEventDto: UpdateEventDto,
) {
  return this.eventsService.update(id, updateEventDto);
}
```

### DELETE Handler

```typescript
@Delete(':id')
@Roles(Role.ADMIN)
@ApiBearerAuth()
@ApiOperation({ summary: 'Delete event (Admin only)' })
@ApiResponse({ status: 200, description: 'Event deleted' })
@ApiResponse({ status: 404, description: 'Event not found' })
async delete(@Param('id') id: string) {
  return this.eventsService.delete(id);
}
```

---

## Request Context Access

### Authenticated User

```typescript
@Get('profile')
@ApiBearerAuth()
@ApiOperation({ summary: 'Get current user profile' })
getProfile(@Request() req) {
  return req.user;  // User from Firebase token (uid, email, role)
}
```

### User ID from Firebase Token

```typescript
@Get('my-schedule')
@ApiBearerAuth()
async getMySchedule(@Request() req) {
  const userId = req.user.uid;  // Firebase UID from decoded token
  return this.scheduleService.findByUser(userId);
}
```

---

## Error Handling

Controllers should NOT handle errors directly. Services throw appropriate NestJS exceptions:

```typescript
// Service throws
throw new NotFoundException('Event not found');
throw new ConflictException('User already exists');
throw new UnauthorizedException('Invalid credentials');
throw new BadRequestException('Invalid input');
```

NestJS exception filters handle the HTTP response automatically.

---

## Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Class | `{Domain}Controller` | `EventsController` |
| File | `{domain}.controller.ts` | `events.controller.ts` |
| Route prefix | Lowercase plural | `'events'`, `'users'` |
| Methods | Descriptive verbs | `getAllEvents`, `getEventById` |

---

## Anti-Patterns to Avoid

❌ **Business logic in controllers**
```typescript
// BAD
@Post()
async create(@Body() dto: CreateEventDto) {
  const exists = await this.firestore.get('events', dto.name);
  if (exists) throw new ConflictException();
  // ... more logic
}
```

✅ **Delegate to service**
```typescript
// GOOD
@Post()
async create(@Body() dto: CreateEventDto) {
  return this.eventsService.create(dto);
}
```

❌ **Inconsistent Swagger documentation**
```typescript
// BAD - missing ApiResponse
@Get()
async findAll() {}
```

✅ **Complete Swagger decorators**
```typescript
// GOOD
@Get()
@ApiOperation({ summary: 'Get all items' })
@ApiResponse({ status: 200, description: 'Success' })
async findAll() {}
```

---

## Template

```typescript
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
import { Public } from '../auth/decorators/public.decorator';
import { {Domain}Service } from './{domain}.service';
import { Create{Domain}Dto } from './dto/create-{domain}.dto';
import { Update{Domain}Dto } from './dto/update-{domain}.dto';

@ApiTags('{domain}')
@Controller('{domain}')
@UseGuards(JwtAuthGuard, RolesGuard)
export class {Domain}Controller {
  constructor(private readonly {domain}Service: {Domain}Service) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all {domain}' })
  @ApiResponse({ status: 200, description: 'Returns list of {domain}' })
  async findAll() {
    return this.{domain}Service.findAll();
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get {domain} by ID' })
  @ApiResponse({ status: 200, description: 'Returns {domain}' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async findById(@Param('id') id: string) {
    return this.{domain}Service.findById(id);
  }

  @Post()
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create {domain} (Admin only)' })
  @ApiResponse({ status: 201, description: 'Created' })
  async create(@Body() dto: Create{Domain}Dto) {
    return this.{domain}Service.create(dto);
  }

  @Put(':id')
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update {domain} (Admin only)' })
  @ApiResponse({ status: 200, description: 'Updated' })
  async update(@Param('id') id: string, @Body() dto: Update{Domain}Dto) {
    return this.{domain}Service.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete {domain} (Admin only)' })
  @ApiResponse({ status: 200, description: 'Deleted' })
  async delete(@Param('id') id: string) {
    return this.{domain}Service.delete(id);
  }
}
```
