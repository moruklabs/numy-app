/**
 * Sheet Music Processing Service
 *
 * Provides image processing capabilities specifically for sheet music:
 * - Color inversion (for dark mode)
 * - Contrast optimization
 * - Sepia tone mode
 * - Noise reduction
 *
 * Uses expo-image-manipulator for basic transformations.
 * Color transformations are applied via color matrix filters in the UI layer.
 */

import { logger } from "@moruk/logger";
import * as ImageManipulator from "expo-image-manipulator";
import { ImageService } from "./image.service";
import {
  ColorMode,
  COLOR_MATRICES,
  PROCESSING_PRESETS,
  SheetMusicProcessingOptions,
  SheetMusicProcessingResult,
} from "./sheet-music.types";

export class SheetMusicService {
  /**
   * Process a sheet music image with the specified options
   * @param uri - URI of the image to process
   * @param options - Processing options
   * @returns Promise<SheetMusicProcessingResult>
   */
  static async processSheetMusic(
    uri: string,
    options: SheetMusicProcessingOptions = {}
  ): Promise<SheetMusicProcessingResult> {
    try {
      logger.info("[SheetMusicService] Processing sheet music:", uri);

      const {
        colorMode = "normal",
        contrast = 1.0,
        brightness = 1.0,
        removeNoise = false,
        sharpen = false,
      } = options;

      // Start with basic processing
      const actions: ImageManipulator.Action[] = [];

      // For optimal display on high-DPI screens (iPads), ensure good resolution
      // We'll resize if needed but maintain quality
      actions.push({ resize: { width: 2048 } });

      // Apply the manipulations
      const result = await ImageManipulator.manipulateAsync(uri, actions, {
        compress: 0.9, // High quality for sheet music
        format: ImageManipulator.SaveFormat.PNG, // PNG preserves sharp lines better
        base64: false,
      });

      logger.info("[SheetMusicService] Basic processing complete:", result.uri);

      // Color transformations (inversion, sepia) are handled by the UI layer
      // using SVG color matrix filters for real-time performance

      return {
        uri: result.uri,
        options: {
          colorMode,
          contrast,
          brightness,
          removeNoise,
          sharpen,
        },
        originalUri: uri,
      };
    } catch (error) {
      logger.debug("[SheetMusicService] Error processing sheet music:", error);
      throw error;
    }
  }

  /**
   * Process sheet music with a preset configuration
   * @param uri - URI of the image to process
   * @param presetName - Name of the preset to use
   * @returns Promise<SheetMusicProcessingResult>
   */
  static async processWithPreset(
    uri: string,
    presetName: keyof typeof PROCESSING_PRESETS
  ): Promise<SheetMusicProcessingResult> {
    const preset = PROCESSING_PRESETS[presetName];
    return this.processSheetMusic(uri, preset);
  }

  /**
   * Get the color matrix for a specific color mode
   * This is used by UI components to apply color filters
   * @param colorMode - The color mode
   * @returns Color matrix array
   */
  static getColorMatrix(colorMode: ColorMode): readonly number[] {
    return COLOR_MATRICES[colorMode];
  }

  /**
   * Optimize contrast for sheet music
   * This applies contrast enhancement specifically tuned for musical notation
   * @param uri - URI of the image
   * @param contrastValue - Contrast multiplier (1.0 = no change)
   * @returns Promise<string> - URI of the processed image
   */
  static async optimizeContrast(uri: string, contrastValue: number = 1.2): Promise<string> {
    try {
      logger.info("[SheetMusicService] Optimizing contrast:", contrastValue);

      // expo-image-manipulator doesn't have direct contrast control,
      // but we can prepare the image for optimal display
      // Actual contrast is applied via SVG filters in the UI layer

      const result = await ImageManipulator.manipulateAsync(uri, [{ resize: { width: 2048 } }], {
        compress: 0.9,
        format: ImageManipulator.SaveFormat.PNG,
      });

      return result.uri;
    } catch (error) {
      logger.debug("[SheetMusicService] Error optimizing contrast:", error);
      throw error;
    }
  }

  /**
   * Batch process multiple sheet music images
   * @param uris - Array of image URIs
   * @param options - Processing options
   * @returns Promise<SheetMusicProcessingResult[]>
   */
  static async batchProcess(
    uris: string[],
    options: SheetMusicProcessingOptions = {}
  ): Promise<SheetMusicProcessingResult[]> {
    try {
      logger.info("[SheetMusicService] Batch processing", uris.length, "images");

      const results = await Promise.all(uris.map((uri) => this.processSheetMusic(uri, options)));

      logger.info("[SheetMusicService] Batch processing complete");
      return results;
    } catch (error) {
      logger.debug("[SheetMusicService] Error in batch processing:", error);
      throw error;
    }
  }

  /**
   * Validate if an image is suitable for sheet music processing
   * @param uri - Image URI to validate
   * @returns Promise<boolean>
   */
  static async validateSheetMusic(uri: string): Promise<boolean> {
    try {
      // Basic validation using ImageService (synchronous check)
      const isValid = ImageService.validateImage(uri);
      if (!isValid) {
        return false;
      }

      // Additional validation could include:
      // - Checking image dimensions (sheet music typically has specific aspect ratios)
      // - Checking if image has sufficient resolution
      // For now, we'll keep it simple

      return true;
    } catch (error) {
      logger.debug("[SheetMusicService] Error validating sheet music:", error);
      return false;
    }
  }

  /**
   * Calculate optimal settings for a sheet music image
   * Analyzes the image and suggests the best processing options
   * @param uri - Image URI
   * @returns Promise<SheetMusicProcessingOptions>
   */
  static async calculateOptimalSettings(uri: string): Promise<SheetMusicProcessingOptions> {
    try {
      logger.info("[SheetMusicService] Calculating optimal settings for:", uri);

      // For now, return default settings
      // In a more advanced implementation, this could analyze the image
      // to detect if it's faded, has poor contrast, etc.
      return {
        colorMode: "normal",
        contrast: 1.2,
        brightness: 1.0,
        removeNoise: false,
        sharpen: false,
      };
    } catch (error) {
      logger.debug("[SheetMusicService] Error calculating optimal settings:", error);
      // Return safe defaults on error
      return PROCESSING_PRESETS.default;
    }
  }
}
