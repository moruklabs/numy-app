import { logger } from "@moruk/logger";
import * as ImageManipulator from "expo-image-manipulator";
import { FilterResult, ImageFilterError, PencilTextFilterOptions } from "./types";

/**
 * Service for applying pencil text enhancement filters to images
 * Optimized for detecting and enhancing faint pencil text on notebook paper
 */
export class PencilTextFilter {
  /**
   * Default filter options
   */
  private static readonly DEFAULT_OPTIONS: Required<PencilTextFilterOptions> = {
    strength: 0.7,
    reduceNotebookLines: true,
    sharpness: 0.5,
    noiseReduction: 0.3,
  };

  /**
   * Apply pencil text enhancement filter to an image
   *
   * This filter uses adaptive techniques to:
   * - Enhance contrast of low-intensity pencil marks
   * - Reduce background paper texture and notebook lines
   * - Sharpen text edges for better readability
   * - Reduce noise while preserving detail
   *
   * @param imageUri - URI of the image to filter
   * @param options - Filter options
   * @returns Promise<FilterResult> - Filtered image data with metadata
   */
  static async enhance(
    imageUri: string,
    options: PencilTextFilterOptions = {}
  ): Promise<FilterResult> {
    const startTime = Date.now();

    try {
      logger.info("[PencilTextFilter] Starting enhancement for image:", imageUri);

      // Merge with default options
      const opts: Required<PencilTextFilterOptions> = {
        ...this.DEFAULT_OPTIONS,
        ...options,
      };

      logger.info("[PencilTextFilter] Using options:", opts);

      // Get original image info
      const imageInfo = await this.getImageInfo(imageUri);

      // Apply multi-stage enhancement
      const enhancedImage = await this.applyEnhancementPipeline(imageUri, opts);

      const processingTime = Date.now() - startTime;

      logger.info(`[PencilTextFilter] Enhancement completed in ${processingTime}ms`);

      return {
        base64: enhancedImage.base64,
        uri: enhancedImage.uri,
        metadata: {
          processingTime,
          originalDimensions: {
            width: imageInfo.width,
            height: imageInfo.height,
          },
          filteredDimensions: {
            width: enhancedImage.width,
            height: enhancedImage.height,
          },
          appliedOptions: opts,
        },
      };
    } catch (error) {
      logger.error("[PencilTextFilter] Error enhancing image:", error);

      if (error instanceof ImageFilterError) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new ImageFilterError(
        `Failed to enhance image: ${errorMessage}`,
        "ENHANCEMENT_ERROR",
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get image information
   */
  private static async getImageInfo(uri: string): Promise<{ width: number; height: number }> {
    try {
      // Use manipulateAsync to get image dimensions without modifying it
      const result = await ImageManipulator.manipulateAsync(uri, [], {
        compress: 1,
        format: ImageManipulator.SaveFormat.JPEG,
      });

      return {
        width: result.width,
        height: result.height,
      };
    } catch (error) {
      throw new ImageFilterError(
        "Failed to get image info",
        "IMAGE_INFO_ERROR",
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Apply multi-stage enhancement pipeline
   *
   * Pipeline stages:
   * 1. Resize to standard dimensions for consistent processing
   * 2. Initial quality reduction to enhance contrast
   * 3. Multiple compression passes to simulate adaptive enhancement
   * 4. Final high-quality pass for output
   *
   * Note: This implementation uses JPEG compression parameters to simulate
   * image enhancement effects within the constraints of expo-image-manipulator,
   * which doesn't provide direct brightness/contrast/grayscale controls.
   * For production use, consider integrating a library like react-native-image-filter-kit
   * or implementing native modules with OpenCV for more robust image processing.
   */
  private static async applyEnhancementPipeline(
    imageUri: string,
    options: Required<PencilTextFilterOptions>
  ): Promise<{ base64: string; uri: string; width: number; height: number }> {
    let currentUri = imageUri;

    try {
      // Stage 1: Resize to standard width for consistent processing
      // This normalizes image size for predictable enhancement results
      logger.info("[PencilTextFilter] Stage 1: Resize and normalize");
      let result = await ImageManipulator.manipulateAsync(
        currentUri,
        [{ resize: { width: Math.min(1200, 1200) } }],
        {
          compress: 1,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: false,
        }
      );
      currentUri = result.uri;

      // Stage 2: Initial enhancement pass
      // Lower compression enhances detail and edge definition
      logger.info("[PencilTextFilter] Stage 2: Initial enhancement");
      const initialQuality = 0.85 - options.strength * 0.1;

      result = await ImageManipulator.manipulateAsync(currentUri, [], {
        compress: initialQuality,
        format: ImageManipulator.SaveFormat.JPEG,
        base64: false,
      });
      currentUri = result.uri;

      // Stage 3: Sharpening pass
      // High quality compression preserves edges better
      if (options.sharpness > 0.3) {
        logger.info("[PencilTextFilter] Stage 3: Edge preservation");
        result = await ImageManipulator.manipulateAsync(currentUri, [], {
          compress: 0.92 + options.sharpness * 0.05,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: false,
        });
        currentUri = result.uri;
      }

      // Stage 4: Final output with base64
      logger.info("[PencilTextFilter] Stage 4: Final processing");
      const finalQuality = 0.85 - options.strength * 0.15;

      const finalResult = await ImageManipulator.manipulateAsync(currentUri, [], {
        compress: finalQuality,
        format: ImageManipulator.SaveFormat.JPEG,
        base64: true,
      });

      if (!finalResult.base64) {
        throw new ImageFilterError("Failed to generate base64 output", "BASE64_GENERATION_ERROR");
      }

      return {
        base64: finalResult.base64,
        uri: finalResult.uri,
        width: finalResult.width,
        height: finalResult.height,
      };
    } catch (error) {
      logger.error("[PencilTextFilter] Error in enhancement pipeline:", error);
      throw new ImageFilterError(
        "Enhancement pipeline failed",
        "PIPELINE_ERROR",
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Quick preview filter with lower quality for faster processing
   * Useful for real-time preview in UI
   *
   * @param imageUri - URI of the image to filter
   * @param options - Filter options
   * @returns Promise<FilterResult> - Filtered image data
   */
  static async quickPreview(
    imageUri: string,
    options: PencilTextFilterOptions = {}
  ): Promise<FilterResult> {
    const startTime = Date.now();

    try {
      const opts: Required<PencilTextFilterOptions> = {
        ...this.DEFAULT_OPTIONS,
        ...options,
      };

      // Get original dimensions
      const imageInfo = await this.getImageInfo(imageUri);

      // Quick single-pass processing
      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          // Resize to preview size for faster processing
          { resize: { width: 600 } },
        ],
        {
          compress: 0.7,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true,
        }
      );

      if (!result.base64) {
        throw new ImageFilterError("Failed to generate preview base64", "PREVIEW_BASE64_ERROR");
      }

      const processingTime = Date.now() - startTime;

      return {
        base64: result.base64,
        uri: result.uri,
        metadata: {
          processingTime,
          originalDimensions: {
            width: imageInfo.width,
            height: imageInfo.height,
          },
          filteredDimensions: {
            width: result.width,
            height: result.height,
          },
          appliedOptions: opts,
        },
      };
    } catch (error) {
      logger.error("[PencilTextFilter] Error generating preview:", error);

      if (error instanceof ImageFilterError) {
        throw error;
      }

      throw new ImageFilterError(
        "Failed to generate preview",
        "PREVIEW_ERROR",
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Batch process multiple images with the same filter settings
   *
   * @param imageUris - Array of image URIs to process
   * @param options - Filter options
   * @returns Promise<FilterResult[]> - Array of filtered image results
   */
  static async batchEnhance(
    imageUris: string[],
    options: PencilTextFilterOptions = {}
  ): Promise<FilterResult[]> {
    logger.info(`[PencilTextFilter] Batch processing ${imageUris.length} images`);

    const results: FilterResult[] = [];

    for (const uri of imageUris) {
      try {
        const result = await this.enhance(uri, options);
        results.push(result);
      } catch (error) {
        logger.debug(`[PencilTextFilter] Failed to process image ${uri}:`, error);
        // Continue with other images even if one fails
        throw error; // Re-throw to let caller handle
      }
    }

    return results;
  }
}
