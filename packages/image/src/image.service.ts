import { logger } from "@moruk/logger";
import { File } from "expo-file-system";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { CameraOptions, CompressionOptions, ImagePickerOptions, ImageServiceError } from "./types";

/**
 * Interface for processed image data ready for API upload
 */
export interface ProcessedImageData {
  base64: string; // Clean base64 data without prefix
  uri: string; // Original URI
  size?: number; // Estimated size in bytes
}

/**
 * Service for handling image-related operations
 * Encapsulates image compression, picking from library, and camera functionality
 */
export class ImageService {
  /**
   * Process images for API upload with proper base64 encoding
   * @param uris - Array of image URIs to process
   * @param options - Compression options
   * @returns Promise<ProcessedImageData[]> - Array of processed image data
   */
  static async processImagesForUpload(
    uris: string[],
    options: CompressionOptions = {}
  ): Promise<ProcessedImageData[]> {
    try {
      const processedImages: ProcessedImageData[] = [];

      for (const uri of uris) {
        // Compress and get base64 data
        const base64Data = await this.compressImage(uri, {
          quality: 0.7, // Slightly higher quality for analysis
          maxWidth: 800, // Higher resolution for better analysis
          format: "jpeg",
          ...options,
        });

        // Ensure clean base64 data (remove data URI prefix if present)
        const cleanBase64 = this.extractBase64Data(base64Data);

        // Estimate size (base64 is ~33% larger than binary)
        const estimatedSize = Math.round((cleanBase64.length * 3) / 4);

        processedImages.push({
          base64: cleanBase64,
          uri,
          size: estimatedSize,
        });
      }

      return processedImages;
    } catch (error) {
      logger.debug("Error processing images for upload:", error);

      if (error instanceof ImageServiceError) {
        throw error;
      }

      throw new ImageServiceError("Failed to process images for upload", "PROCESSING_ERROR");
    }
  }

  /**
   * Extract clean base64 data from various formats
   * @param data - Base64 data that might have data URI prefix
   * @returns string - Clean base64 data
   */
  static extractBase64Data(data: string): string {
    // If data starts with data URI prefix, extract just the base64 part
    if (data.startsWith("data:")) {
      const base64Index = data.indexOf(",");
      if (base64Index !== -1) {
        return data.substring(base64Index + 1);
      }
    }

    // Return as-is if already clean base64
    return data;
  }

  /**
   * Validate base64 data
   * @param base64 - Base64 string to validate
   * @returns boolean - True if valid base64
   */
  static isValidBase64(base64: string): boolean {
    try {
      // Check if string is valid base64
      const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
      return base64Regex.test(base64) && base64.length % 4 === 0;
    } catch {
      return false;
    }
  }

  /**
   * Compress an image to reduce file size and convert to base64
   * @param uri - The URI of the image to compress
   * @param options - Compression options
   * @returns Promise<string> - Base64 encoded compressed image
   */
  static async compressImage(uri: string, options: CompressionOptions = {}): Promise<string> {
    try {
      logger.info("[ImageService] Compressing image:", uri);
      const { quality = 0.5, maxWidth = 600, format = "jpeg" } = options;

      const manipulatorFormat =
        format === "jpeg" ? ImageManipulator.SaveFormat.JPEG : ImageManipulator.SaveFormat.PNG;

      logger.info("[ImageService] Starting manipulateAsync with format:", manipulatorFormat);

      const { base64 } = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: maxWidth } }],
        {
          compress: quality,
          format: manipulatorFormat,
          base64: true,
        }
      );

      if (!base64) {
        throw new ImageServiceError("Image compression failed: base64 data is missing.");
      }

      logger.info("[ImageService] Compression successful, base64 length:", base64.length);
      return base64;
    } catch (error) {
      logger.debug("[ImageService] Error compressing image:", error);
      logger.debug("[ImageService] Failed URI:", uri);

      if (error instanceof ImageServiceError) {
        throw error;
      }

      // Provide more detailed error message
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new ImageServiceError(`Image compression failed: ${errorMessage}`, "COMPRESSION_ERROR");
    }
  }

  /**
   * Pick images from the photo library
   * @param options - Image picker options
   * @returns Promise<string[]> - Array of image URIs
   */
  static async pickFromLibrary(options: ImagePickerOptions = {}): Promise<string[]> {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        throw new ImageServiceError("Photo library permission denied", "PERMISSION_DENIED");
      }

      const {
        allowsMultipleSelection = true,
        selectionLimit = 5,
        quality = 0.8,
        allowsEditing = false,
        aspect = [3, 4],
      } = options;

      logger.info("[ImageService] Launching image library picker...");
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing,
        aspect,
        quality,
        allowsMultipleSelection,
        selectionLimit,
        // Request images in a format iOS can easily process
        base64: false,
        exif: false,
        // Force conversion to current format (JPEG) to avoid HEIC issues
        preferredAssetRepresentationMode:
          ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Current,
      });

      logger.info("[ImageService] Picker result:", {
        canceled: result.canceled,
        assetsCount: result.assets?.length || 0,
      });

      if (!result.canceled && result.assets.length > 0) {
        const uris = result.assets.map((asset) => asset.uri);
        logger.info("[ImageService] Selected image URIs:", uris);
        return uris;
      }

      logger.info("[ImageService] No images selected");
      return [];
    } catch (error) {
      if (error instanceof ImageServiceError && error.code === "PERMISSION_DENIED") {
        logger.debug("[ImageService] Photo library permission denied");
      } else {
        logger.debug("Error picking images from library:", error);
      }

      if (error instanceof ImageServiceError) {
        throw error;
      }

      throw new ImageServiceError("Failed to pick images from library", "LIBRARY_PICKER_ERROR");
    }
  }

  /**
   * Take a photo using the camera
   * @param options - Camera options
   * @returns Promise<string> - URI of the captured image
   */
  static async takePhoto(options: CameraOptions = {}): Promise<string> {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

      if (!permissionResult.granted) {
        throw new ImageServiceError("Camera permission denied", "PERMISSION_DENIED");
      }

      const { allowsEditing = false, aspect = [3, 4], quality = 0.6 } = options;

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing,
        aspect,
        quality,
      });

      if (!result.canceled && result.assets.length > 0) {
        return result.assets[0].uri;
      }

      throw new ImageServiceError("No photo taken", "NO_PHOTO_TAKEN");
    } catch (error) {
      if (error instanceof ImageServiceError && error.code === "NO_PHOTO_TAKEN") {
        logger.debug("[ImageService] No photo taken (user cancelled camera)");
        throw error;
      }

      if (error instanceof ImageServiceError && error.code === "PERMISSION_DENIED") {
        logger.debug("[ImageService] Camera permission denied");
        throw error;
      }

      logger.debug("Error taking photo:", error);

      if (error instanceof ImageServiceError) {
        throw error;
      }

      throw new ImageServiceError("Failed to take photo", "CAMERA_ERROR");
    }
  }

  /**
   * Validate if an image URI is valid
   * @param uri - The image URI to validate
   * @param allowedTypes - Array of allowed MIME types
   * @returns boolean - True if valid, false otherwise
   */
  static validateImage(uri: string, allowedTypes: string[] = ["image/jpeg", "image/png"]): boolean {
    try {
      // Basic URI validation
      if (!uri || typeof uri !== "string") {
        return false;
      }

      // Check if URI starts with expected schemes
      const validSchemes = ["file://", "content://", "data:", "http://", "https://"];
      const hasValidScheme = validSchemes.some((scheme) => uri.startsWith(scheme));

      if (!hasValidScheme) {
        return false;
      }

      // For data URIs, check MIME type
      if (uri.startsWith("data:")) {
        const mimeTypeMatch = uri.match(/^data:([^;]+);/);
        if (mimeTypeMatch) {
          const mimeType = mimeTypeMatch[1];
          return allowedTypes.includes(mimeType);
        }
      }

      // For file URIs, basic validation (more comprehensive validation would require file system access)
      return true;
    } catch (error) {
      logger.debug("Error validating image:", error);
      return false;
    }
  }

  /**
   * Generate a unique ID for an image
   * @returns string - Unique identifier
   */
  static generateId(): string {
    return `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Read an image file and convert it to base64
   * Uses the new Expo File API (expo-file-system v19+)
   * @param uri - The URI of the image file to read
   * @returns Promise<string> - Base64 encoded image data (without data URI prefix)
   */
  static async readImageAsBase64(uri: string): Promise<string> {
    try {
      // If already base64 data URI, extract just the base64 portion
      if (uri.startsWith("data:")) {
        const base64Index = uri.indexOf(",");
        if (base64Index !== -1) {
          return uri.substring(base64Index + 1);
        }
        // If no comma, assume entire string after "data:" is base64
        return uri.replace(/^data:[^;]*;base64,?/, "");
      }

      // Use the new File API for file URIs
      const file = new File(uri);
      const base64 = await file.base64();

      if (!base64) {
        throw new ImageServiceError("Failed to read image as base64", "READ_ERROR");
      }

      return base64;
    } catch (error) {
      logger.debug("[ImageService] Error reading image as base64:", error);
      logger.debug("[ImageService] Failed URI:", uri);

      if (error instanceof ImageServiceError) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new ImageServiceError(`Failed to read image as base64: ${errorMessage}`, "READ_ERROR");
    }
  }
}
