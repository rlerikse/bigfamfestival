/**
 * Centralized logging utility
 * In production, logs are sent to Sentry
 * In development, logs are sent to console
 */

interface LogContext {
  [key: string]: any;
}

class Logger {
  private isDevelopment = __DEV__;

  private formatMessage(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level}] ${message}${contextStr}`;
  }

  debug(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      console.debug(this.formatMessage('DEBUG', message, context));
    }
  }

  info(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      console.info(this.formatMessage('INFO', message, context));
    }
    // In production, could send to analytics
  }

  warn(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      console.warn(this.formatMessage('WARN', message, context));
    }
    // In production, send to Sentry as warning
    if (!this.isDevelopment && typeof globalThis !== 'undefined' && (globalThis as any).Sentry) {
      (globalThis as any).Sentry.captureMessage(message, {
        level: 'warning',
        extra: context,
      });
    }
  }

  error(message: string, error?: Error | unknown, context?: LogContext) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    
    if (this.isDevelopment) {
      console.error(this.formatMessage('ERROR', message, context), errorObj);
    }

    // In production, send to Sentry
    if (!this.isDevelopment && typeof globalThis !== 'undefined' && (globalThis as any).Sentry) {
      (globalThis as any).Sentry.captureException(errorObj, {
        level: 'error',
        extra: {
          message,
          ...context,
        },
      });
    }
  }
}

export const logger = new Logger();

