# Components Style Guide - Mobile (React Native)

**Generated**: February 9, 2026  
**Source**: Pattern extraction from existing components

---

## Overview

Components in this codebase are React Native functional components using TypeScript. They follow a consistent pattern for props, styling, and composition.

---

## File Structure

```tsx
// 1. Imports - React first, then RN, then external, then local
import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import OptimizedImage from './OptimizedImage';
import { ScheduleEvent } from '../types/event';

// 2. Styles - defined BEFORE component (or at bottom)
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // ...
});

// 3. Props interface
export interface EventCardProps {
  item: ScheduleEvent;
  isInUserSchedule: boolean;
  onToggleSchedule: (event: ScheduleEvent) => void;
  onEventPress: (event: ScheduleEvent) => void;
  theme: {
    border: string;
    card: string;
    text: string;
    muted: string;
  };
}

// 4. Component with React.memo for optimization
const EventCard = React.memo<EventCardProps>(({ 
  item, 
  isInUserSchedule, 
  theme, 
  onToggleSchedule, 
  onEventPress 
}) => {
  // 5. Hooks at top
  // 6. Derived state / memoized values
  // 7. Callbacks
  // 8. Return JSX
});

// 9. Export
export default EventCard;
```

---

## Props Pattern

### Interface Definition

```tsx
export interface ComponentProps {
  // Required props first
  item: SomeType;
  onPress: (item: SomeType) => void;
  
  // Optional props with defaults
  showBadge?: boolean;
  theme?: ThemeObject;
}
```

### Destructuring with Defaults

```tsx
const MyComponent: React.FC<ComponentProps> = ({
  item,
  onPress,
  showBadge = false,
  theme = defaultTheme,
}) => {
  // ...
};
```

### Theme Props Pattern

```tsx
interface Props {
  theme: {
    border: string;
    card: string;
    text: string;
    muted: string;
  };
}

// Usage in styles
<View style={[styles.container, { backgroundColor: theme.card }]}>
```

---

## Styling Patterns

### StyleSheet at Top or Bottom

```tsx
// Option 1: At top (after imports, before component)
const styles = StyleSheet.create({
  container: { flex: 1 },
});

const MyComponent = () => { /* ... */ };

// Option 2: At bottom (after component)
const MyComponent = () => { /* ... */ };

const styles = StyleSheet.create({
  container: { flex: 1 },
});
```

### Dynamic Styles with Theme

```tsx
<View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
  <Text style={[styles.title, { color: theme.text }]}>
    {item.name}
  </Text>
</View>
```

### Platform-Specific Styles

```tsx
const styles = StyleSheet.create({
  shadow: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
});
```

---

## Memoization Patterns

### React.memo for Components

```tsx
const EventCard = React.memo<EventCardProps>(({ item, onPress }) => {
  // Component only re-renders if props change
  return <View>...</View>;
});
```

### useMemo for Computed Values

```tsx
const formattedTime = useMemo(() => {
  if (!item.startTime) return '';
  const [hours, minutes] = item.startTime.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}, [item.startTime]);
```

### useCallback for Event Handlers

```tsx
const handlePress = useCallback(() => {
  onEventPress(item);
}, [item, onEventPress]);

const handleToggle = useCallback((e: GestureResponderEvent) => {
  e.stopPropagation();
  onToggleSchedule(item);
}, [item, onToggleSchedule]);
```

---

## Event Handler Patterns

### Touchable with Callback

```tsx
<TouchableOpacity 
  onPress={handlePress}
  activeOpacity={0.7}
>
  <View>...</View>
</TouchableOpacity>
```

### Stop Propagation for Nested Touchables

```tsx
<TouchableOpacity onPress={handleCardPress}>
  <View>
    {/* Nested button that shouldn't trigger card press */}
    <TouchableOpacity 
      onPress={(e) => {
        e.stopPropagation();
        handleFavoritePress();
      }}
    >
      <Ionicons name="heart" />
    </TouchableOpacity>
  </View>
</TouchableOpacity>
```

---

## Icon Usage

### Ionicons from Expo

```tsx
import { Ionicons } from '@expo/vector-icons';

<Ionicons 
  name={isInSchedule ? 'heart' : 'heart-outline'} 
  size={24} 
  color={theme.text} 
/>
```

### Common Icon Names

| Purpose | Filled | Outline |
|---------|--------|---------|
| Favorite | `heart` | `heart-outline` |
| Settings | `settings` | `settings-outline` |
| Profile | `person` | `person-outline` |
| Home | `home` | `home-outline` |
| Calendar | `calendar` | `calendar-outline` |
| Notifications | `notifications` | `notifications-outline` |
| Map | `map` | `map-outline` |

---

## Conditional Rendering

### Simple Conditional

```tsx
{showBadge && <Badge />}
```

### Ternary for Two States

```tsx
{isLoading ? <ActivityIndicator /> : <Content />}
```

### Multiple Conditions

```tsx
{isLive && <LiveBadge />}
{isUpcoming && <UpcomingBadge />}
{!isLive && !isUpcoming && <DefaultBadge />}
```

---

## SafeAreaView Usage

### Screen-Level Only

```tsx
// ✅ GOOD - SafeAreaView at screen level
const HomeScreen = () => (
  <SafeAreaView style={{ flex: 1 }}>
    <EventCard />
    <EventCard />
  </SafeAreaView>
);

// ❌ BAD - SafeAreaView in component
const EventCard = () => (
  <SafeAreaView>  {/* Don't do this */}
    <View>...</View>
  </SafeAreaView>
);
```

### With Insets Hook

```tsx
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const HomeScreen = () => {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={{ paddingTop: insets.top }}>
      {/* Content */}
    </View>
  );
};
```

---

## Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Component file | `{ComponentName}.tsx` | `EventCard.tsx` |
| Component name | PascalCase | `EventCard` |
| Props interface | `{ComponentName}Props` | `EventCardProps` |
| Style constant | `styles` | `const styles = StyleSheet.create({})` |
| Event handlers | `handle{Action}` | `handlePress`, `handleToggle` |
| Callbacks in props | `on{Action}` | `onPress`, `onToggleSchedule` |

---

## Anti-Patterns to Avoid

❌ **Inline styles for static values**
```tsx
// BAD
<View style={{ flex: 1, padding: 16, marginBottom: 12 }}>
```

✅ **Use StyleSheet**
```tsx
// GOOD
<View style={styles.container}>
```

❌ **Creating styles inside component**
```tsx
// BAD
const MyComponent = () => {
  const styles = StyleSheet.create({ ... });  // Creates new object each render
};
```

✅ **Define styles outside component**
```tsx
// GOOD
const styles = StyleSheet.create({ ... });
const MyComponent = () => { ... };
```

❌ **Anonymous functions in props**
```tsx
// BAD - creates new function each render
<TouchableOpacity onPress={() => handlePress(item)}>
```

✅ **Use useCallback**
```tsx
// GOOD
const handleItemPress = useCallback(() => handlePress(item), [item]);
<TouchableOpacity onPress={handleItemPress}>
```

---

## Template

```tsx
import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface {ComponentName}Props {
  item: ItemType;
  onPress: (item: ItemType) => void;
  theme: {
    text: string;
    card: string;
    border: string;
  };
}

const {ComponentName} = React.memo<{ComponentName}Props>(({ 
  item, 
  onPress,
  theme,
}) => {
  const handlePress = useCallback(() => {
    onPress(item);
  }, [item, onPress]);

  return (
    <TouchableOpacity 
      style={[styles.container, { backgroundColor: theme.card }]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Text style={[styles.title, { color: theme.text }]}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default {ComponentName};
```
