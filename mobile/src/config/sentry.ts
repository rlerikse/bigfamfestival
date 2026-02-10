/**
 * Sentry configuration for error tracking and monitoring
 * Only initialized in production builds
 */

let isInitialized = false;

export const initSentry = async () => {
  // Only initialize in production
  if (__DEV__) {
    return;
  }

  if (isInitialized) {
    return;
  }

  try {
    // Dynamic import to avoid including Sentry in development bundle
    const Sentry = await import('@sentry/react-native');
    
    Sentry.init({
      dsn: process.env.EXPO_PUBLIC_SENTRY_DSN || undefined,
      debug: false,
      environment: process.env.EXPO_PUBLIC_APP_ENV || 'production',
      tracesSampleRate: 0.1, // 10% of transactions
      beforeSend(event, hint) {
        // Filter out sensitive data
        if (event.request) {
          delete event.request.cookies;
          delete event.request.headers?.Authorization;
        }
        return event;
      },
    });

    isInitialized = true;
  } catch (error) {
    console.error('Failed to initialize Sentry:', error);
  }
};

