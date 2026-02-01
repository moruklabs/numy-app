/**
 * Timing Constants
 *
 * Centralized timing values for debouncing, animations, and delays.
 * Eliminates magic numbers throughout the codebase.
 */

export const TIMING = {
  /**
   * Debounce delay for auto-calculation after user stops typing.
   * Short enough to feel responsive, long enough to avoid excess calculations.
   */
  DEBOUNCE_CALCULATION_MS: 300,

  /**
   * Debounce delay for analytics input tracking.
   * Longer than calculation to reduce analytics events.
   */
  DEBOUNCE_ANALYTICS_MS: 1000,

  /**
   * Delay before auto-scrolling to new content.
   * Allows UI to settle before scrolling.
   */
  SCROLL_DELAY_MS: 100,
} as const;

export type TimingKey = keyof typeof TIMING;
