/**
 * @moruk/image
 *
 * Image service utilities for picking, capturing, and processing images.
 */

export { ImageService } from "./image.service";
export type { ProcessedImageData } from "./image.service";

export { ImageServiceError, AnalysisError } from "./types";
export type { ImageData, CompressionOptions, ImagePickerOptions, CameraOptions } from "./types";

export { SheetMusicService } from "./sheet-music.service";
export type {
  ColorMode,
  SheetMusicProcessingOptions,
  SheetMusicProcessingResult,
} from "./sheet-music.types";
export { COLOR_MATRICES, PROCESSING_PRESETS } from "./sheet-music.types";
