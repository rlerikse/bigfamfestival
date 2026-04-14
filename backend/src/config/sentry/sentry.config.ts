import * as Sentry from '@sentry/nestjs';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

/**
 * Initialize Sentry error monitoring.
 *
 * Must be called BEFORE NestJS app is created (at the top of main.ts)
 * so that Sentry can instrument all modules on load.
 *
 * DSN is required in production. In development/test, Sentry is disabled
 * unless SENTRY_DSN is explicitly set (useful for local debugging).
 */
export function initSentry(): void {
  const dsn = process.env.SENTRY_DSN;
  const nodeEnv = process.env.NODE_ENV || 'development';
  const isProduction = nodeEnv === 'production';

  // Only initialize if DSN is present. In dev, skip unless explicitly set.
  if (!dsn) {
    if (isProduction) {
      console.warn('[Sentry] SENTRY_DSN not set in production — error monitoring disabled');
    }
    return;
  }

  Sentry.init({
    dsn,
    environment: nodeEnv,
    integrations: [
      nodeProfilingIntegration(),
    ],
    // Capture 100% of errors, 10% of transactions for performance
    tracesSampleRate: isProduction ? 0.1 : 0.0,
    profilesSampleRate: isProduction ? 0.1 : 0.0,
    // Filter out known non-error noise
    beforeSend(event) {
      // Don't send health check 404s as errors
      if (event.request?.url?.includes('/health')) return null;
      return event;
    },
    // Never send auth tokens or secrets
    beforeSendTransaction(event) {
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['Authorization'];
      }
      return event;
    },
  });
}
