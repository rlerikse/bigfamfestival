# Hooks Style Guide - Mobile (React Native)

**Generated**: February 9, 2026  
**Source**: Pattern extraction from existing hooks

---

## Overview

Custom hooks in this codebase encapsulate reusable stateful logic. They follow React conventions with the `use` prefix.

---

## File Structure

```typescript
// 1. Imports - React hooks first, then external libraries, then local
import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { useQueryClient } from '@tanstack/react-query';

// 2. JSDoc documentation
/**
 * Hook to detect offline/online state and manage offline mode
 * Provides network status and helper functions for offline handling
 */

// 3. Export named function
export const useOffline = () => {
  // 4. State declarations
  const [isOffline, setIsOffline] = useState(false);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  
  // 5. External hooks
  const queryClient = useQueryClient();

  // 6. Effects
  useEffect(() => {
    // Setup and cleanup
  }, [dependencies]);

  // 7. Return value
  return {
    isOffline,
    isConnected,
    isOnline: isConnected === true,
  };
};
```

---

## Hook Categories

### State Management Hooks

```typescript
/**
 * Hook to manage countdown timer
 */
export const useCountdown = (targetDate: Date) => {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(targetDate));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(targetDate));
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return timeLeft;
};
```

### Side Effect Hooks

```typescript
/**
 * Hook to detect offline/online state
 */
export const useOffline = () => {
  const [isOffline, setIsOffline] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    // Initial check
    NetInfo.fetch().then(state => {
      setIsOffline(!state.isConnected);
    });

    // Subscribe to changes
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected);
      
      // Refetch when coming back online
      if (state.isConnected) {
        queryClient.refetchQueries();
      }
    });

    return () => unsubscribe();
  }, [queryClient]);

  return { isOffline, isOnline: !isOffline };
};
```

### Resource Loading Hooks

```typescript
/**
 * Hook to load and cache app resources (fonts, images)
 */
export default function useCachedResources() {
  const [isLoadingComplete, setLoadingComplete] = useState(false);

  useEffect(() => {
    async function loadResourcesAsync() {
      try {
        // Load fonts
        await Font.loadAsync({
          'space-mono': require('../assets/fonts/SpaceMono-Regular.ttf'),
        });
        
        // Preload images
        await Asset.loadAsync([
          require('../assets/images/logo.png'),
        ]);
      } catch (e) {
        console.warn(e);
      } finally {
        setLoadingComplete(true);
      }
    }

    loadResourcesAsync();
  }, []);

  return isLoadingComplete;
}
```

---

## Return Value Patterns

### Object Return (Preferred for Multiple Values)

```typescript
export const useOffline = () => {
  const [isOffline, setIsOffline] = useState(false);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  // ... logic

  return {
    isOffline,
    isConnected,
    isOnline: isConnected === true,  // Derived value
  };
};

// Usage
const { isOffline, isOnline } = useOffline();
```

### Single Value Return

```typescript
export default function useCachedResources() {
  const [isLoadingComplete, setLoadingComplete] = useState(false);
  // ... logic
  return isLoadingComplete;
}

// Usage
const isReady = useCachedResources();
```

### Tuple Return (for Value + Setter)

```typescript
export const useToggle = (initialValue = false) => {
  const [value, setValue] = useState(initialValue);
  const toggle = useCallback(() => setValue(v => !v), []);
  
  return [value, toggle] as const;
};

// Usage
const [isOpen, toggleOpen] = useToggle();
```

---

## Effect Cleanup Patterns

### Subscription Cleanup

```typescript
useEffect(() => {
  const unsubscribe = NetInfo.addEventListener(state => {
    setIsConnected(state.isConnected);
  });

  return () => {
    unsubscribe();  // Clean up subscription
  };
}, []);
```

### Timer Cleanup

```typescript
useEffect(() => {
  const timer = setInterval(() => {
    setTimeLeft(calculateTimeLeft());
  }, 1000);

  return () => {
    clearInterval(timer);  // Clean up timer
  };
}, [targetDate]);
```

### Mounted Flag Pattern

```typescript
useEffect(() => {
  let mounted = true;

  async function fetchData() {
    const data = await api.getData();
    if (mounted) {
      setData(data);  // Only update if still mounted
    }
  }

  fetchData();

  return () => {
    mounted = false;
  };
}, []);
```

---

## Integration with TanStack Query

### Using QueryClient in Hooks

```typescript
import { useQueryClient } from '@tanstack/react-query';

export const useOffline = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected) {
        // Refetch all queries when coming back online
        queryClient.refetchQueries();
      }
    });

    return () => unsubscribe();
  }, [queryClient]);
};
```

---

## Dependency Array Guidelines

### Include All Referenced Values

```typescript
// ✅ GOOD - includes all dependencies
useEffect(() => {
  fetchData(userId);
}, [userId]);  // userId is referenced, so include it

// ❌ BAD - missing dependency
useEffect(() => {
  fetchData(userId);
}, []);  // Missing userId
```

### Stable References for Callbacks

```typescript
const queryClient = useQueryClient();  // Stable reference

useEffect(() => {
  queryClient.refetchQueries();
}, [queryClient]);  // Safe to include
```

### Empty Array for One-Time Effects

```typescript
useEffect(() => {
  initializeApp();
}, []);  // Only runs once on mount
```

---

## Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Hook file | `use{Name}.ts` | `useOffline.ts` |
| Hook function | `use{Name}` | `useOffline` |
| State variables | Descriptive | `isOffline`, `timeLeft` |
| Setters | `set{Variable}` | `setIsOffline` |
| Return properties | Descriptive | `isOnline`, `refetch` |

---

## Documentation Pattern

```typescript
/**
 * Hook to detect offline/online state and manage offline mode
 * Provides network status and helper functions for offline handling
 * 
 * @returns Object with network status
 * @example
 * const { isOffline, isOnline } = useOffline();
 * 
 * if (isOffline) {
 *   // Show offline message
 * }
 */
export const useOffline = () => {
  // ...
};
```

---

## Anti-Patterns to Avoid

❌ **Conditionally calling hooks**
```typescript
// BAD
if (condition) {
  const [state, setState] = useState(false);  // Error!
}
```

✅ **Call hooks unconditionally**
```typescript
// GOOD
const [state, setState] = useState(false);
// Use condition in the effect or return
```

❌ **Missing cleanup for subscriptions**
```typescript
// BAD
useEffect(() => {
  NetInfo.addEventListener(handler);  // Never cleaned up!
}, []);
```

✅ **Always return cleanup function**
```typescript
// GOOD
useEffect(() => {
  const unsubscribe = NetInfo.addEventListener(handler);
  return () => unsubscribe();
}, []);
```

❌ **Updating state without mounted check**
```typescript
// BAD - may update unmounted component
useEffect(() => {
  fetchData().then(data => setState(data));
}, []);
```

✅ **Check if mounted before updating**
```typescript
// GOOD
useEffect(() => {
  let mounted = true;
  fetchData().then(data => {
    if (mounted) setState(data);
  });
  return () => { mounted = false; };
}, []);
```

---

## Template

```typescript
import { useState, useEffect, useCallback } from 'react';

/**
 * Hook description - what it does and when to use it
 * 
 * @param param - Description of parameter
 * @returns Description of return value
 * @example
 * const { value, action } = use{Name}(initialValue);
 */
export const use{Name} = (param: ParamType) => {
  // State
  const [value, setValue] = useState<ValueType>(initialValue);

  // Effects
  useEffect(() => {
    let mounted = true;

    const setup = async () => {
      // Setup logic
      if (mounted) {
        setValue(newValue);
      }
    };

    setup();

    return () => {
      mounted = false;
      // Cleanup logic
    };
  }, [param]);

  // Callbacks
  const action = useCallback(() => {
    // Action logic
  }, []);

  // Return
  return {
    value,
    action,
    derivedValue: calculateDerived(value),
  };
};
```
