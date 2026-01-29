/**
 * Message Queue for Monitoring Client
 *
 * Implements queuing and deduplication to prevent burst of Telegram messages.
 */

import type { MonitorErrorReport } from "./types";

interface QueuedMessage {
  report: MonitorErrorReport;
  hash: string;
  timestamp: number;
  retryCount: number;
}

interface QueueConfig {
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

  /**
   * Maximum number of retry attempts
   * @default 3
   */
  maxRetries?: number;

  /**
   * Delay between retries in milliseconds
   * @default 1000
   */
  retryDelay?: number;
}

/**
 * Generate a hash for deduplication
 * Uses a simple hash based on error message, appId, and error name
 */
function generateHash(report: MonitorErrorReport): string {
  const key = `${report.appId}:${report.content.error}:${report.content.name || ""}`;
  return key;
}

export class MessageQueue {
  private queue: QueuedMessage[] = [];
  private sentHashes: Map<string, number> = new Map();
  private isProcessing = false;
  private config: Required<QueueConfig>;

  constructor(config: QueueConfig = {}) {
    this.config = {
      maxMessagesPerMinute: config.maxMessagesPerMinute ?? 5,
      deduplicationWindow: config.deduplicationWindow ?? 60000,
      maxRetries: config.maxRetries ?? 3,
      retryDelay: config.retryDelay ?? 1000,
    };

    // Clean up old hashes periodically
    setInterval(() => this.cleanupHashes(), this.config.deduplicationWindow);
  }

  /**
   * Add a message to the queue
   * Returns false if the message is a duplicate within the deduplication window
   */
  enqueue(report: MonitorErrorReport): boolean {
    const hash = generateHash(report);
    const now = Date.now();

    // Check for duplicates
    const lastSent = this.sentHashes.get(hash);
    if (lastSent && now - lastSent < this.config.deduplicationWindow) {
      // Duplicate message within deduplication window - skip
      return false;
    }

    // Add to queue
    this.queue.push({
      report,
      hash,
      timestamp: now,
      retryCount: 0,
    });

    // Mark as sent for deduplication
    this.sentHashes.set(hash, now);

    // Start processing if not already running
    if (!this.isProcessing) {
      this.processQueue();
    }

    return true;
  }

  /**
   * Process queued messages with rate limiting
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      const messagesPerInterval = this.config.maxMessagesPerMinute;
      const intervalMs = 60000; // 1 minute
      const delayBetweenMessages = intervalMs / messagesPerInterval;

      while (this.queue.length > 0) {
        const message = this.queue.shift();
        if (!message) break;

        try {
          await this.sendMessage(message.report);
          // Wait before sending next message to respect rate limit
          await this.delay(delayBetweenMessages);
        } catch (error) {
          // eslint-disable-next-line no-console -- fallback logging when monitoring itself fails
          console.error("[MessageQueue] Failed to send message, will retry:", error);
          // Retry logic
          if (message.retryCount < this.config.maxRetries) {
            message.retryCount++;
            this.queue.push(message); // Re-queue for retry
            await this.delay(this.config.retryDelay);
          }
          // If max retries reached, message is dropped
        }
      }
    } finally {
      this.isProcessing = false;

      // If more messages arrived while processing, continue
      if (this.queue.length > 0) {
        setTimeout(() => this.processQueue(), 0);
      }
    }
  }

  /**
   * Send a message to the Monitor API
   */
  private async sendMessage(report: MonitorErrorReport): Promise<void> {
    const response = await fetch("https://monitor-api.moruk.workers.dev/error", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(report),
    });

    if (!response.ok) {
      throw new Error(`Monitor API returned ${response.status}`);
    }
  }

  /**
   * Clean up old hashes from the deduplication map
   */
  private cleanupHashes(): void {
    const now = Date.now();
    const cutoff = now - this.config.deduplicationWindow;

    for (const [hash, timestamp] of this.sentHashes.entries()) {
      if (timestamp < cutoff) {
        this.sentHashes.delete(hash);
      }
    }
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get queue statistics
   */
  getStats(): {
    queueSize: number;
    deduplicationCacheSize: number;
    isProcessing: boolean;
  } {
    return {
      queueSize: this.queue.length,
      deduplicationCacheSize: this.sentHashes.size,
      isProcessing: this.isProcessing,
    };
  }

  /**
   * Clear the queue (for testing purposes)
   */
  clear(): void {
    this.queue = [];
    this.sentHashes.clear();
  }
}
