# Services Style Guide - Backend

**Generated**: February 9, 2026  
**Source**: Pattern extraction from existing services

---

## Overview

Services in this codebase contain business logic and data access. They are injectable singletons that interact with Firestore and external services.

---

## File Structure

```typescript
// 1. Imports - NestJS first, then external, then local
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { FirestoreService } from '../config/firestore/firestore.service';
import { CreateEventDto } from '../auth/dto/create-event.dto';
import { Event } from './event.interface';

// 2. Injectable decorator
@Injectable()
export class EventsService {
  // 3. Collection constant
  private readonly collection = 'events';

  // 4. Constructor with dependency injection
  constructor(
    private readonly firestoreService: FirestoreService,
    private readonly jwtService: JwtService,  // if needed
  ) {}

  // 5. Public methods with JSDoc comments
  // 6. Private helper methods at bottom
}
```

---

## Dependency Injection

### Constructor Pattern

```typescript
@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}
}
```

**Conventions**:
- Use `private readonly` for injected dependencies
- Order: Services first, then utilities (JwtService, etc.)
- No property initialization outside constructor

---

## Firestore Operations

### Collection Constant

```typescript
@Injectable()
export class EventsService {
  private readonly collection = 'events';
  
  constructor(private readonly firestoreService: FirestoreService) {}
}
```

### Create Operation

```typescript
/**
 * Create a new event
 */
async create(createEventDto: CreateEventDto): Promise<Event> {
  const { id, data } = await this.firestoreService.create<CreateEventDto>(
    this.collection,
    createEventDto,
  );

  return { id, ...data } as Event;
}
```

### Read by ID

```typescript
/**
 * Find an event by ID
 */
async findById(id: string): Promise<Event | null> {
  const eventData = await this.firestoreService.get<Omit<Event, 'id'>>(
    this.collection,
    id,
  );

  if (!eventData) {
    throw new NotFoundException('Event not found');
  }

  return { id, ...eventData } as Event;
}
```

### Find All with Filtering

```typescript
/**
 * Find all events with optional filtering
 */
async findAll(stage?: string, date?: string): Promise<Event[]> {
  let events: Event[];

  if (stage || date) {
    const conditions: Array<{ field: string; operator: string; value: any }> = [];
    
    if (stage) {
      conditions.push({ field: 'stage', operator: '==', value: stage });
    }
    if (date) {
      conditions.push({ field: 'date', operator: '==', value: date });
    }

    events = await this.queryCompound<Event>(this.collection, conditions);
  } else {
    events = await this.firestoreService.getAll<Event>(this.collection);
  }

  return events;
}
```

### Update Operation

```typescript
/**
 * Update an existing event
 */
async update(id: string, updateEventDto: UpdateEventDto): Promise<Event> {
  // Check if exists
  await this.findById(id);  // Throws NotFoundException if not found

  await this.firestoreService.update(
    this.collection,
    id,
    {
      ...updateEventDto,
      updatedAt: new Date(),
    },
  );

  return this.findById(id);
}
```

### Delete Operation

```typescript
/**
 * Delete an event
 */
async delete(id: string): Promise<void> {
  await this.findById(id);  // Throws NotFoundException if not found
  await this.firestoreService.delete(this.collection, id);
}
```

---

## Error Handling

### Standard NestJS Exceptions

```typescript
import {
  NotFoundException,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';

// Not found
if (!user) {
  throw new NotFoundException('User not found');
}

// Conflict (duplicate)
if (existingUser) {
  throw new ConflictException('User with this email already exists');
}

// Unauthorized
if (!isPasswordValid) {
  throw new UnauthorizedException('Invalid credentials');
}

// Bad request
if (!isValid) {
  throw new BadRequestException('Invalid input data');
}
```

### Error Messages

- Use descriptive, user-friendly messages
- Don't expose internal details
- Be consistent with terminology

---

## Authentication Patterns

### Password Hashing

```typescript
private async hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

private async comparePasswords(
  plainPassword: string,
  hashedPassword: string,
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}
```

### JWT Generation

```typescript
private generateToken(user: User): string {
  const payload = {
    sub: user.id,      // Subject (user ID)
    email: user.email,
    role: user.role,
  };

  return this.jwtService.sign(payload);
}
```

### User Sanitization

```typescript
private sanitizeUser(user: User): Omit<User, 'password'> {
  const { password, ...sanitizedUser } = user;
  return sanitizedUser;
}
```

---

## Method Documentation

### JSDoc Format

```typescript
/**
 * Register a new user
 * 
 * @param registerDto - User registration data
 * @returns Created user and JWT token
 * @throws ConflictException if email already exists
 */
async register(registerDto: RegisterDto) {
  // ...
}
```

### Simpler Format (also acceptable)

```typescript
/**
 * Find all events with optional filtering
 */
async findAll(stage?: string, date?: string): Promise<Event[]> {
  // ...
}
```

---

## Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Class | `{Domain}Service` | `EventsService` |
| File | `{domain}.service.ts` | `events.service.ts` |
| Public methods | Verb + noun | `findById`, `create`, `update` |
| Private methods | Descriptive | `hashPassword`, `sanitizeUser` |
| Collection constants | `collection` | `private readonly collection = 'events'` |

### Common Method Names

| Operation | Method Name |
|-----------|-------------|
| Get all | `findAll` |
| Get by ID | `findById` |
| Get by field | `findBy{Field}` (e.g., `findByEmail`) |
| Create | `create` |
| Update | `update` |
| Delete | `delete` |
| Validate | `validate{Thing}` |

---

## Anti-Patterns to Avoid

❌ **Direct Firestore access in multiple places**
```typescript
// BAD - accessing firestore directly
const doc = await firestore.collection('events').doc(id).get();
```

✅ **Use FirestoreService abstraction**
```typescript
// GOOD
const event = await this.firestoreService.get(this.collection, id);
```

❌ **Returning password in responses**
```typescript
// BAD
return user;
```

✅ **Sanitize sensitive data**
```typescript
// GOOD
return this.sanitizeUser(user);
```

❌ **Swallowing errors**
```typescript
// BAD
try {
  await this.doSomething();
} catch (e) {
  console.log(e);
  return null;
}
```

✅ **Throw appropriate exceptions**
```typescript
// GOOD
try {
  await this.doSomething();
} catch (e) {
  throw new BadRequestException('Operation failed');
}
```

---

## Template

```typescript
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { FirestoreService } from '../config/firestore/firestore.service';
import { Create{Domain}Dto } from './dto/create-{domain}.dto';
import { Update{Domain}Dto } from './dto/update-{domain}.dto';
import { {Domain} } from './{domain}.interface';

@Injectable()
export class {Domain}Service {
  private readonly collection = '{domain}';

  constructor(private readonly firestoreService: FirestoreService) {}

  /**
   * Create a new {domain}
   */
  async create(dto: Create{Domain}Dto): Promise<{Domain}> {
    const { id, data } = await this.firestoreService.create<Create{Domain}Dto>(
      this.collection,
      dto,
    );
    return { id, ...data } as {Domain};
  }

  /**
   * Find {domain} by ID
   */
  async findById(id: string): Promise<{Domain}> {
    const data = await this.firestoreService.get<Omit<{Domain}, 'id'>>(
      this.collection,
      id,
    );
    
    if (!data) {
      throw new NotFoundException('{Domain} not found');
    }

    return { id, ...data } as {Domain};
  }

  /**
   * Find all {domain}
   */
  async findAll(): Promise<{Domain}[]> {
    return this.firestoreService.getAll<{Domain}>(this.collection);
  }

  /**
   * Update {domain}
   */
  async update(id: string, dto: Update{Domain}Dto): Promise<{Domain}> {
    await this.findById(id);
    
    await this.firestoreService.update(this.collection, id, {
      ...dto,
      updatedAt: new Date(),
    });

    return this.findById(id);
  }

  /**
   * Delete {domain}
   */
  async delete(id: string): Promise<void> {
    await this.findById(id);
    await this.firestoreService.delete(this.collection, id);
  }
}
```
