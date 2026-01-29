/**
 * Global Logger Service
 *
 * Centralized logging service with support for multiple log levels,
 * prefixes, environment-based configuration, and automatic error reporting
 * to the Monitor API.
 */

// __DEV__ is provided globally by React Native / Expo runtime
// We declare it here so TypeScript can type-check usages in this package
declare const __DEV__: boolean;

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

/**
 * Minimal interface for monitoring clients used by the logger.
 *
 * This avoids hard-coupling @moruk/logger to any specific implementation
 * (such as the React Native / Expo-based @moruk/monitoring-client), which
 * keeps the logger safe to use in Node/Jest and non-RN environments.
 */
export interface MonitoringClientLike {
  reportError(
    message: string,
    options?: {
      prefix?: string;
      error?: Error;
      args?: unknown[];
      // Optional extra metadata, supported by concrete clients
      metadata?: Record<string, unknown>;
    }
  ): void;
}

interface LoggerConfig {
  minLevel: LogLevel;
  enabled: boolean;
  prefix?: string;
  monitorClient?: MonitoringClientLike;
  reportErrors?: boolean;
}

const noopMonitorClient: MonitoringClientLike = {
  // Default no-op implementation so logger is safe in any environment
  reportError: () => {},
};

export class Logger {
  private config: LoggerConfig;
  private monitorClient: MonitoringClientLike;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      minLevel: typeof __DEV__ !== "undefined" && __DEV__ ? LogLevel.DEBUG : LogLevel.INFO,
      enabled: true,
      prefix: config.prefix || "",
      reportErrors: config.reportErrors ?? true,
      ...config,
    };
    this.monitorClient = config.monitorClient || noopMonitorClient;
  }

  /**
   * Create a child logger with a prefix
   */
  createLogger(prefix: string): Logger {
    return new Logger({
      ...this.config,
      prefix,
      monitorClient: this.monitorClient,
    });
  }

  /**
   * Set the minimum log level
   */
  setLevel(level: LogLevel): void {
    this.config.minLevel = level;
  }

  /**
   * Enable or disable logging
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
  }

  /**
   * Enable or disable error reporting to Monitor API
   */
  setReportErrors(report: boolean): void {
    this.config.reportErrors = report;
  }

  /**
   * Debug level logging - for detailed diagnostic information
   * Only shown in development mode
   */
  debug(message: string, ...args: unknown[]): void {
    this.log(LogLevel.DEBUG, message, ...args);
  }

  /**
   * Info level logging - for general informational messages
   */
  info(message: string, ...args: unknown[]): void {
    this.log(LogLevel.INFO, message, ...args);
  }

  /**
   * Warning level logging - for potentially harmful situations
   */
  warn(message: string, ...args: unknown[]): void {
    this.log(LogLevel.WARN, message, ...args);
  }

  /**
   * Error level logging - for error events
   * Automatically reports to Monitor API
   */
  error(message: string, ...args: unknown[]): void {
    this.log(LogLevel.ERROR, message, ...args);
  }

  /**
   * Internal logging method
   */
  private log(level: LogLevel, message: string, ...args: unknown[]): void {
    if (!this.config.enabled || level < this.config.minLevel) {
      return;
    }

    const prefix = this.config.prefix ? `${this.config.prefix} ` : "";
    const formattedMessage = `${prefix}${message}`;

    // Only log to console in development
    if (typeof __DEV__ !== "undefined" && __DEV__) {
      switch (level) {
        case LogLevel.DEBUG:
        case LogLevel.INFO:
          console.log(formattedMessage, ...args);
          break;
        case LogLevel.WARN:
          console.warn(formattedMessage, ...args);
          break;
        case LogLevel.ERROR:
          console.error(formattedMessage, ...args);
          break;
      }
    }

    // Report ERROR level logs to Monitor API (fire-and-forget)
    // This happens in both dev and production
    if (level === LogLevel.ERROR && this.config.reportErrors) {
      // Extract error object if present in args
      const errorArg = args.find((arg) => arg instanceof Error);
      const otherArgs = args.filter((arg) => !(arg instanceof Error));

      this.monitorClient.reportError(message, {
        prefix: this.config.prefix,
        error: errorArg instanceof Error ? errorArg : undefined,
        args: otherArgs.length > 0 ? otherArgs : undefined,
      });
    }
  }
}

// Global logger instance
export const logger = new Logger();

// Convenience method to create named loggers
export function createLogger(prefix: string): Logger {
  return logger.createLogger(prefix);
}
