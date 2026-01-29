/**
 * Types for sheet music image processing
 */

export type ColorMode = "normal" | "inverted" | "sepia";

export interface SheetMusicProcessingOptions {
  /**
   * Color mode for the sheet music
   * - normal: Black notes on white background
   * - inverted: White notes on black background
   * - sepia: Sepia tone for reduced eye strain
   */
  colorMode?: ColorMode;

  /**
   * Contrast adjustment value
   * Range: 0.0 to 2.0
   * Default: 1.0 (no adjustment)
   * Values > 1.0 increase contrast
   * Values < 1.0 decrease contrast
   */
  contrast?: number;

  /**
   * Brightness adjustment value
   * Range: 0.0 to 2.0
   * Default: 1.0 (no adjustment)
   * Values > 1.0 increase brightness
   * Values < 1.0 decrease brightness
   */
  brightness?: number;

  /**
   * Whether to apply noise reduction
   * Useful for removing scanner artifacts
   */
  removeNoise?: boolean;

  /**
   * Whether to sharpen the image
   * Useful for making faded notes clearer
   */
  sharpen?: boolean;
}

export interface SheetMusicProcessingResult {
  /**
   * Processed image URI
   */
  uri: string;

  /**
   * Base64 encoded processed image
   */
  base64?: string;

  /**
   * Applied processing options
   */
  options: SheetMusicProcessingOptions;

  /**
   * Original image URI
   */
  originalUri: string;
}

/**
 * Color matrix values for different color modes
 * Color matrices are 5x4 matrices used for color transformation
 * Format: [R, G, B, A, offset] for each row
 */
export const COLOR_MATRICES = {
  /**
   * Identity matrix - no color change
   */
  normal: [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0] as const,

  /**
   * Invert colors - white becomes black and vice versa
   */
  inverted: [-1, 0, 0, 0, 1, 0, -1, 0, 0, 1, 0, 0, -1, 0, 1, 0, 0, 0, 1, 0] as const,

  /**
   * Sepia tone - warmer, easier on eyes
   */
  sepia: [
    0.393, 0.769, 0.189, 0, 0, 0.349, 0.686, 0.168, 0, 0, 0.272, 0.534, 0.131, 0, 0, 0, 0, 0, 1, 0,
  ] as const,
} as const;

/**
 * Preset configurations for common use cases
 */
export const PROCESSING_PRESETS = {
  /**
   * Default - suitable for most sheet music
   */
  default: {
    colorMode: "normal" as const,
    contrast: 1.2,
    brightness: 1.0,
    removeNoise: false,
    sharpen: false,
  },

  /**
   * High contrast - for faded or poor quality scans
   */
  highContrast: {
    colorMode: "normal" as const,
    contrast: 1.5,
    brightness: 1.1,
    removeNoise: true,
    sharpen: true,
  },

  /**
   * Dark mode - inverted colors for low-light environments
   */
  darkMode: {
    colorMode: "inverted" as const,
    contrast: 1.2,
    brightness: 1.0,
    removeNoise: false,
    sharpen: false,
  },

  /**
   * Sepia - easier on eyes for extended reading
   */
  comfortable: {
    colorMode: "sepia" as const,
    contrast: 1.1,
    brightness: 1.0,
    removeNoise: false,
    sharpen: false,
  },
} as const;
