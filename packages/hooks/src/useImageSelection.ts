/**
 * @moruk/hooks - useImageSelection
 * Image selection and management hook for identifier apps
 */

import { useCallback, useState } from "react";
import { Alert } from "react-native";
import type { ImageData, TranslateFunction } from "./types";

export interface UseImageSelectionOptions {
  /** Maximum number of images allowed */
  maxImages?: number;
  /** Translation function for error messages */
  t?: TranslateFunction;
}

export interface UseImageSelectionReturn {
  /** Currently selected images */
  selectedImages: ImageData[];
  /** Whether more images can be added */
  canAddMore: boolean;
  /** Number of remaining image slots */
  remainingSlots: number;
  /** Add images by URI */
  addImages: (uris: string[]) => Promise<void>;
  /** Remove image at index */
  removeImage: (index: number) => void;
  /** Clear all selected images */
  clearAllImages: () => void;
}

/**
 * Generate a unique ID for images
 */
const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

/**
 * Hook for managing image selection in identifier apps
 *
 * @example
 * const { selectedImages, addImages, removeImage } = useImageSelection({
 *   maxImages: 5,
 *   t: translationFunction
 * });
 */
export const useImageSelection = (
  options: UseImageSelectionOptions = {}
): UseImageSelectionReturn => {
  const { maxImages = 5, t } = options;

  const [selectedImages, setSelectedImages] = useState<ImageData[]>([]);

  // Computed values
  const canAddMore = selectedImages.length < maxImages;
  const remainingSlots = maxImages - selectedImages.length;

  // Get translated or default messages
  const getErrorTitle = useCallback(() => (t ? t("common.error") : "Error"), [t]);
  const getTooManyImagesMessage = useCallback(
    () =>
      t ? t("common.tooManyImages", { max: maxImages }) : `Maximum ${maxImages} images allowed`,
    [t, maxImages]
  );
  const getUploadErrorMessage = useCallback(
    () => (t ? t("common.imageUploadError") : "Failed to add images"),
    [t]
  );

  const addImages = useCallback(
    async (uris: string[]) => {
      try {
        // Validate number of images
        if (selectedImages.length + uris.length > maxImages) {
          Alert.alert(getErrorTitle(), getTooManyImagesMessage());
          return;
        }

        // Create new image objects with IDs
        const newImages: ImageData[] = uris.map((uri) => ({
          uri,
          id: generateId(),
        }));

        setSelectedImages((prev) => [...prev, ...newImages]);
      } catch {
        Alert.alert(getErrorTitle(), getUploadErrorMessage());
      }
    },
    [
      selectedImages.length,
      maxImages,
      getErrorTitle,
      getTooManyImagesMessage,
      getUploadErrorMessage,
    ]
  );

  const removeImage = useCallback((index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clearAllImages = useCallback(() => {
    setSelectedImages([]);
  }, []);

  return {
    selectedImages,
    canAddMore,
    remainingSlots,
    addImages,
    removeImage,
    clearAllImages,
  };
};
