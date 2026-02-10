# Utils Style Guide - Mobile & Backend

**Generated**: February 9, 2026  
**Source**: Pattern extraction from existing utility files

---

## Overview

Utility functions are pure, reusable functions that don't depend on component state or external services. They handle common transformations, validations, and calculations.

---

## File Structure

```typescript
// 1. Imports (if any)
import { User } from '../contexts/AuthContext';

// 2. JSDoc documentation for each function
/**
 * Check if a user is a guest user
 * @param user The user object to check
 * @returns True if the user is a guest, false otherwise
 */
export const isGuestUser = (user: User | null): boolean => {
  if (!user) return false;
  return user.id === 'guest-user' || user.ticketType === 'guest';
};

// 3. Related functions grouped together
/**
 * Check if a user is a logged-in user (not a guest)
 * @param user The user object to check
 * @returns True if the user is logged in (not a guest), false otherwise
 */
export const isLoggedInUser = (user: User | null): boolean => {
  if (!user) return false;
  return !isGuestUser(user);
};
```

---

## Function Patterns

### Type Guard Functions

```typescript
/**
 * Check if a user is a guest user
 */
export const isGuestUser = (user: User | null): boolean => {
  if (!user) return false;
  return user.id === 'guest-user' || user.ticketType === 'guest';
};

/**
 * Check if a user is a logged-in user (not a guest)
 */
export const isLoggedInUser = (user: User | null): boolean => {
  if (!user) return false;
  return !isGuestUser(user);
};
```

### Formatter Functions

```typescript
/**
 * Format time from 24h to 12h format
 */
export const formatTime = (time: string): string => {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
};

/**
 * Format date for display
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};
```

### Validation Functions

```typescript
/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 */
export const isStrongPassword = (password: string): boolean => {
  return password.length >= 8;
};
```

### Calculation Functions

```typescript
/**
 * Calculate time remaining until target date
 */
export const calculateTimeLeft = (targetDate: Date): TimeLeft => {
  const difference = targetDate.getTime() - Date.now();
  
  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  };
};
```

### URL/Config Functions

```typescript
/**
 * Get API URL based on environment
 */
export const getApiUrl = (): string => {
  if (__DEV__) {
    return 'http://localhost:3000/api/v1';
  }
  return 'https://api.bigfamfestival.com/api/v1';
};
```

---

## Documentation Standards

### JSDoc Format

```typescript
/**
 * Brief description of what the function does
 * 
 * @param paramName - Description of the parameter
 * @param optionalParam - Optional parameter description
 * @returns Description of return value
 * @throws Error description (if applicable)
 * @example
 * const result = myFunction('input');
 * // result: 'output'
 */
export const myFunction = (paramName: string, optionalParam?: number): string => {
  // ...
};
```

### Simpler Documentation (for obvious functions)

```typescript
/**
 * Check if a user is a guest user
 * @param user The user object to check
 * @returns True if the user is a guest, false otherwise
 */
export const isGuestUser = (user: User | null): boolean => {
  // ...
};
```

---

## Naming Conventions

| Category | Pattern | Examples |
|----------|---------|----------|
| Boolean checks | `is{Condition}` | `isGuestUser`, `isValidEmail` |
| Format functions | `format{Type}` | `formatTime`, `formatDate` |
| Get functions | `get{Thing}` | `getApiUrl`, `getErrorMessage` |
| Calculate functions | `calculate{Thing}` | `calculateTimeLeft` |
| Parse functions | `parse{Type}` | `parseResponse`, `parseError` |
| Validation | `is{Valid}`, `validate{Thing}` | `isValidEmail`, `validateForm` |

---

## Export Patterns

### Named Exports (Preferred)

```typescript
// userUtils.ts
export const isGuestUser = (user: User | null): boolean => { ... };
export const isLoggedInUser = (user: User | null): boolean => { ... };

// Usage
import { isGuestUser, isLoggedInUser } from '../utils/userUtils';
```

### Grouped Related Functions

```typescript
// dateUtils.ts
export const formatDate = (date: string): string => { ... };
export const formatTime = (time: string): string => { ... };
export const parseDate = (dateString: string): Date => { ... };
export const isDateInPast = (date: Date): boolean => { ... };
```

---

## Error Handling in Utils

### Return Default Values

```typescript
export const formatTime = (time: string): string => {
  if (!time) return '';  // Return empty string for invalid input
  // ...
};
```

### Throw for Critical Errors

```typescript
export const parseRequired = (value: string | undefined): string => {
  if (!value) {
    throw new Error('Required value is missing');
  }
  return value;
};
```

### Return Error Info

```typescript
interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export const validateForm = (data: FormData): ValidationResult => {
  const errors: string[] = [];
  
  if (!data.email) errors.push('Email is required');
  if (!isValidEmail(data.email)) errors.push('Invalid email format');
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};
```

---

## Logger Utility Pattern

```typescript
// logger.ts

const isDev = __DEV__;

export const logger = {
  log: (...args: any[]) => {
    if (isDev) {
      console.log('[App]', ...args);
    }
  },
  
  warn: (...args: any[]) => {
    console.warn('[App]', ...args);
  },
  
  error: (...args: any[]) => {
    console.error('[App]', ...args);
  },
  
  debug: (...args: any[]) => {
    if (isDev) {
      console.debug('[App]', ...args);
    }
  },
};

// Usage
import { logger } from '../utils/logger';
logger.log('User logged in:', userId);
```

---

## Anti-Patterns to Avoid

❌ **Side effects in utils**
```typescript
// BAD - modifies external state
export const formatAndSave = (data: Data) => {
  const formatted = format(data);
  AsyncStorage.setItem('data', formatted);  // Side effect!
  return formatted;
};
```

✅ **Pure functions only**
```typescript
// GOOD - pure function
export const formatData = (data: Data): string => {
  return format(data);
};
```

❌ **Async utils without clear naming**
```typescript
// BAD - unclear that it's async
export const getData = () => {
  return fetch('/api/data');  // Returns Promise
};
```

✅ **Clear async naming**
```typescript
// GOOD - clear it's async
export const fetchData = async (): Promise<Data> => {
  const response = await fetch('/api/data');
  return response.json();
};
```

❌ **Overly generic names**
```typescript
// BAD
export const check = (value: any): boolean => { ... };
export const process = (data: any): any => { ... };
```

✅ **Descriptive names**
```typescript
// GOOD
export const isValidEmail = (email: string): boolean => { ... };
export const formatUserDisplay = (user: User): string => { ... };
```

---

## File Organization

### Single-Domain Utils
```
utils/
├── userUtils.ts      # User-related utilities
├── dateUtils.ts      # Date/time utilities
├── alertUtils.ts     # Alert helpers
├── logger.ts         # Logging utility
```

### Mixed Utils (acceptable for small projects)
```
utils/
├── index.ts          # Re-exports
├── helpers.ts        # General utilities
```

---

## Template

```typescript
// {domain}Utils.ts

import { SomeType } from '../types/someType';

/**
 * Check if [thing] meets [condition]
 * @param input - The input to check
 * @returns True if condition is met
 */
export const is{Condition} = (input: InputType | null): boolean => {
  if (!input) return false;
  return input.property === 'expectedValue';
};

/**
 * Format [thing] for display
 * @param input - The raw input value
 * @returns Formatted string
 */
export const format{Thing} = (input: string): string => {
  if (!input) return '';
  // Formatting logic
  return formattedValue;
};

/**
 * Calculate [thing] from [inputs]
 * @param inputs - The calculation inputs
 * @returns Calculated result
 */
export const calculate{Thing} = (inputs: InputType): ResultType => {
  // Calculation logic
  return result;
};

/**
 * Get [thing] based on [context]
 * @returns The resolved value
 */
export const get{Thing} = (): ReturnType => {
  // Resolution logic
  return value;
};
```
