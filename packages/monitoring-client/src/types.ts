/**
 * Monitor API Types
 *
 * Type definitions for the Monitor API error reporting service.
 */

export interface MonitorClientConfig {
  baseUrl?: string;
  appId?: string;
  appVersion?: string;
  /**
   * Maximum number of messages to send per minute
   * @default 5
   */
  maxMessagesPerMinute?: number;
  /**
   * Time window for deduplication in milliseconds
   * @default 60000 (1 minute)
   */
  deduplicationWindow?: number;
}

export interface MonitorErrorReport {
  os: "ios" | "android";
  appId: string;
  appVersion: string;
  content: MonitorErrorContent;
}

export interface MonitorErrorContent {
  error: string;
  prefix?: string;
  timestamp: string;
  name?: string;
  message?: string;
  stack?: string;
  cause?: string;
  metadata?: Record<string, unknown>;
  args?: unknown[];
}

export interface MonitorResponse {
  success: boolean;
  message: string;
  requestId: string;
}

export interface ReportErrorOptions {
  prefix?: string;
  error?: Error;
  args?: unknown[];
  metadata?: Record<string, unknown>;
}
