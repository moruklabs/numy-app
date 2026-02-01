/**
 * Common service types and interfaces
 */

export interface ImageData {
  uri: string;
  id: string;
}

export interface CompressionOptions {
  quality?: number;
  maxWidth?: number;
  format?: "jpeg" | "png";
}

export interface ImagePickerOptions {
  allowsMultipleSelection?: boolean;
  selectionLimit?: number;
  quality?: number;
  allowsEditing?: boolean;
  aspect?: [number, number];
}

export interface CameraOptions {
  allowsEditing?: boolean;
  aspect?: [number, number];
  quality?: number;
}

export class ImageServiceError extends Error {
  code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = "ImageServiceError";
    this.code = code;
  }
}

export class AnalysisError extends Error {
  code?: string;
  status?: number;

  constructor(message: string, originalError?: any) {
    super(message);
    this.name = "AnalysisError";

    if (originalError) {
      this.code = originalError.code;
      this.status = originalError.status;
    }
  }
}
