# AI Instructions - Big Fam Festival App

**Generated**: February 9, 2026  
**Purpose**: Synthesized guide for consistent code generation

---

## Quick Reference

### This Is a Festival App
- **Backend**: NestJS 10 + TypeScript + Firestore
- **Mobile**: React Native + Expo 54 + TypeScript
- **Functions**: Firebase Cloud Functions

### Key Patterns
1. **Backend**: Module/Controller/Service pattern (NestJS)
2. **Mobile**: Context + Service + Component pattern
3. **Auth**: Firebase Auth (tokens managed by Firebase SDK)
4. **Data**: Firestore with offline caching

---

## When Generating Backend Code

### Controllers

```typescript
// Use these decorators in order
@ApiTags('{domain}')
@Controller('{domain}')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class {Domain}Controller {
  constructor(private readonly {domain}Service: {Domain}Service) {}

  @Get()
  @Public()  // For unauthenticated routes
  @ApiOperation({ summary: 'Description' })
  @ApiResponse({ status: 200, description: 'Success' })
  async findAll() {
    return this.{domain}Service.findAll();
  }

  @Post()
  @Roles(Role.ADMIN)  // For admin-only routes
  @ApiBearerAuth()
  async create(@Body() dto: CreateDto) {
    return this.{domain}Service.create(dto);
  }
}
```

**Remember**:
- Always add Swagger decorators (`@ApiOperation`, `@ApiResponse`)
- Use `@Public()` to opt-out of auth
- Use `@Roles(Role.ADMIN)` for admin routes
- Keep controllers thin - delegate to services

### Services

```typescript
@Injectable()
export class {Domain}Service {
  private readonly collection = '{collection}';

  constructor(private readonly firestoreService: FirestoreService) {}

  async findById(id: string): Promise<{Entity}> {
    const data = await this.firestoreService.get(this.collection, id);
    if (!data) throw new NotFoundException('{Entity} not found');
    return { id, ...data };
  }
}
```

**Remember**:
- Use `FirestoreService` for all Firestore operations
- Throw NestJS exceptions (`NotFoundException`, `ConflictException`)
- Add JSDoc comments for public methods
- Sanitize user data (remove password) before returning

### DTOs

```typescript
export class Create{Entity}Dto {
  @ApiProperty({ description: 'Name', example: 'Example' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;
}
```

**Remember**:
- Always use `class-validator` decorators
- Always use `@ApiProperty()` for Swagger
- Group required fields first, optional last

---

## When Generating Mobile Code

### Screens

```tsx
const {Name}Screen = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<NavigationProp>();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Content */}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
});

export default {Name}Screen;
```

**Remember**:
- Use `useTheme()` for colors
- Use `useAuth()` for user state
- Wrap in `SafeAreaView`
- Define styles with `StyleSheet.create()`

### Components

```tsx
export interface {Name}Props {
  item: ItemType;
  onPress: (item: ItemType) => void;
  theme: { text: string; card: string };
}

const {Name} = React.memo<{Name}Props>(({ item, onPress, theme }) => {
  const handlePress = useCallback(() => onPress(item), [item, onPress]);

  return (
    <TouchableOpacity onPress={handlePress} style={[styles.container, { backgroundColor: theme.card }]}>
      <Text style={{ color: theme.text }}>{item.name}</Text>
    </TouchableOpacity>
  );
});

export default {Name};
```

**Remember**:
- Use `React.memo` for performance
- Use `useCallback` for event handlers
- Accept theme as a prop (don't call useTheme in components)
- Define styles outside component

### Services

```typescript
export const get{Entity} = async (id: string): Promise<{Entity}> => {
  const token = await auth().currentUser?.getIdToken();
  if (!token) throw new Error('Not authenticated');

  const response = await api.get<{Entity}>(`/{entity}/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};
```

**Remember**:
- Services are pure functions (not classes)
- Get token from SecureStore
- Handle offline with NetInfo check
- Cache responses with AsyncStorage

### Hooks

```typescript
export const use{Name} = () => {
  const [value, setValue] = useState<Type>(initial);

  useEffect(() => {
    let mounted = true;
    // Setup
    return () => { mounted = false; };
  }, []);

  return { value };
};
```

**Remember**:
- Start with `use` prefix
- Always clean up effects
- Use mounted flag for async operations
- Return object for multiple values

### Contexts

```tsx
interface {Name}ContextProps {
  value: Type;
  action: () => void;
}

const {Name}Context = createContext<{Name}ContextProps | undefined>(undefined);

export const use{Name} = () => {
  const context = useContext({Name}Context);
  if (!context) throw new Error('use{Name} must be used within {Name}Provider');
  return context;
};

export const {Name}Provider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [value, setValue] = useState<Type>(initial);
  return (
    <{Name}Context.Provider value={{ value, action: () => {} }}>
      {children}
    </{Name}Context.Provider>
  );
};
```

**Remember**:
- Export both Provider and custom hook
- Throw error if used outside provider
- Type the context value interface

---

## File Naming Quick Reference

| Type | Backend | Mobile |
|------|---------|--------|
| Controller | `{domain}.controller.ts` | N/A |
| Service | `{domain}.service.ts` | `{name}Service.ts` |
| Module | `{domain}.module.ts` | N/A |
| DTO | `create-{entity}.dto.ts` | N/A |
| Interface | `{entity}.interface.ts` | N/A |
| Screen | N/A | `{Name}Screen.tsx` |
| Component | N/A | `{ComponentName}.tsx` |
| Hook | N/A | `use{Name}.ts` |
| Context | N/A | `{Name}Context.tsx` |
| Type | N/A | `{name}.ts` |
| Utils | `{name}.util.ts` | `{name}Utils.ts` |

---

## Common Imports

### Backend

```typescript
// NestJS Core
import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { Injectable, NotFoundException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { Module } from '@nestjs/common';

// Swagger
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiProperty, ApiQuery } from '@nestjs/swagger';

// Validation
import { IsString, IsNotEmpty, IsEmail, IsOptional, MinLength } from 'class-validator';

// Auth (Firebase Auth - updated in BFF-50)
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { Role } from '../auth/enums/role.enum';

// Firestore
import { FirestoreService } from '../config/firestore/firestore.service';
```

### Mobile

```tsx
// React
import React, { useState, useEffect, useCallback, useMemo, createContext, useContext } from 'react';

// React Native
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Alert, Platform } from 'react-native';

// Navigation
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Storage
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Network
import NetInfo from '@react-native-community/netinfo';

// Icons
import { Ionicons } from '@expo/vector-icons';

// Local
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
```

---

## Error Handling

### Backend - Throw NestJS Exceptions

```typescript
// Not found
throw new NotFoundException('Event not found');

// Already exists
throw new ConflictException('User already exists');

// Invalid credentials
throw new UnauthorizedException('Invalid credentials');

// Bad input
throw new BadRequestException('Invalid data');
```

### Mobile - Alert + Throw

```typescript
try {
  await api.create(data);
} catch (error) {
  const message = error instanceof Error ? error.message : 'An error occurred';
  Alert.alert('Error', message);
  throw error;
}
```

---

## Authentication Flow

### Backend - Protect Route

```typescript
@UseGuards(FirebaseAuthGuard)  // At controller or method level
@ApiBearerAuth()               // For Swagger
getProfile(@Request() req) {
  const userId = req.user.uid;   // User ID from Firebase token
  const role = req.user.role;    // Role from Firestore user document
}
```

### Mobile - Send Token

```typescript
// Firebase SDK manages tokens automatically
const token = await auth().currentUser?.getIdToken();
const response = await api.get('/protected', {
  headers: { Authorization: `Bearer ${token}` }
});
```

### Mobile - Check Auth

```typescript
const { user, isLoading } = useAuth();

if (!user || isGuestUser(user)) {
  Alert.alert('Login Required', 'Please log in', [
    { text: 'Login', onPress: () => navigation.navigate('Auth') }
  ]);
  return;
}
```

---

## Offline Support Pattern

```typescript
// In service functions
export const getData = async (): Promise<Data[]> => {
  const netInfo = await NetInfo.fetch();
  
  if (!netInfo.isConnected) {
    // Return cached data
    const cached = await AsyncStorage.getItem('cached_data');
    return cached ? JSON.parse(cached) : [];
  }

  // Fetch fresh data
  const response = await api.get('/data');
  
  // Cache for offline
  await AsyncStorage.setItem('cached_data', JSON.stringify(response.data));
  
  return response.data;
};
```

---

## Checklist Before Generating

### Backend Code
- [ ] Added `@Injectable()` decorator to services
- [ ] Used `FirestoreService` for database operations
- [ ] Added Swagger decorators to controllers
- [ ] Used `@Public()` for unauthenticated routes
- [ ] Used NestJS exceptions for errors
- [ ] Added JSDoc comments

### Mobile Code
- [ ] Used `StyleSheet.create()` for styles
- [ ] Used `React.memo` for list item components
- [ ] Used `useCallback` for event handlers
- [ ] Added mounted flag in async effects
- [ ] Used Firebase Auth for authentication (not SecureStore for tokens)
- [ ] Handled offline scenario

---

## Anti-Patterns to Avoid

❌ **Never**:
- Put business logic in controllers (use services)
- Create styles inside components (use StyleSheet outside)
- Use anonymous functions in JSX props (use useCallback)
- Access Firestore directly (use FirestoreService)
- Return password in user objects (sanitize first)
- Forget cleanup in useEffect (return cleanup function)

✅ **Always**:
- Use typed props and interfaces
- Handle loading and error states
- Add Swagger documentation
- Use existing contexts (AuthContext, ThemeContext)
- Follow existing naming patterns
