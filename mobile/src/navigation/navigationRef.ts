// Commit: Add navigationRef and helper to navigate to Notifications tab on notification tap
// Author: GitHub Copilot, 2025-09-24

import { CommonActions, createNavigationContainerRef } from '@react-navigation/native';

// Use a generic ParamList to avoid tight coupling to type definitions
export const navigationRef = createNavigationContainerRef();

/**
 * Navigate to the Notifications tab inside the Main tab navigator.
 * Works from anywhere as long as the NavigationContainer is ready.
 */
export function goToNotifications() {
  if (!navigationRef.isReady()) return;
  // Navigate to the nested Notifications route under Main tab navigator
  navigationRef.dispatch(
    CommonActions.navigate({
      name: 'Main',
      params: {
        screen: 'Notifications',
      },
    })
  );
}

/**
 * Retry navigating to Notifications until the NavigationContainer and routes are ready.
 */
export async function goToNotificationsSafe(retries = 12, delayMs = 150): Promise<void> {
  const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));
  for (let i = 0; i < retries; i += 1) {
    if (navigationRef.isReady()) {
      try {
        goToNotifications();
        return;
      } catch {
        // swallow and retry
      }
    }
    await sleep(delayMs);
  }
  // Final attempt
  if (navigationRef.isReady()) {
    goToNotifications();
  }
}
