/**
 * Filter options for pencil text enhancement
 */
export interface PencilTextFilterOptions {
  /**
   * Strength of the enhancement (0.0 to 1.0)
   * Higher values increase contrast more aggressively
   * @default 0.7
   */
  strength?: number;

  /**
   * Whether to reduce notebook lines
   * @default true
   */
  reduceNotebookLines?: boolean;

  /**
   * Sharpness enhancement (0.0 to 1.0)
   * Higher values make text edges sharper
   * @default 0.5
   */
  sharpness?: number;

  /**
   * Noise reduction level (0.0 to 1.0)
   * @default 0.3
   */
  noiseReduction?: number;
}

/**
 * Filter result containing the enhanced image data
 */
export interface FilterResult {
  /**
   * Base64-encoded filtered image
   */
  base64: string;

  /**
   * Image URI (if applicable)
   */
  uri?: string;

  /**
   * Processing metadata
   */
  metadata: {
    /**
     * Time taken to process in milliseconds
     */
    processingTime: number;

    /**
     * Original image dimensions
     */
    originalDimensions: {
      width: number;
      height: number;
    };

    /**
     * Filtered image dimensions
     */
    filteredDimensions: {
      width: number;
      height: number;
    };

    /**
     * Applied filter options
     */
    appliedOptions: PencilTextFilterOptions;
  };
}

/**
 * Image service error
 */
export class ImageFilterError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = "ImageFilterError";
  }
}
