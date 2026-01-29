/**
 * @moruk/monitoring-client
 *
 * Error reporting client for the Monitor API.
 * Sends error reports to centralized logging with Telegram notifications.
 */

export { MonitorClient, monitorClient } from "./monitor-client";
export { MessageQueue } from "./queue";
export type {
  MonitorClientConfig,
  MonitorErrorReport,
  MonitorErrorContent,
  MonitorResponse,
  ReportErrorOptions,
} from "./types";
