/**
 * @moruk/hooks - useImageUpload
 * Image picking and upload handling for identifier apps
 */

import { ImageService, ImageServiceError } from "@moruk/image";
import { logger } from "@moruk/logger";
import { useCallback, useState } from "react";
import { ActionSheetIOS, Alert, Platform } from "react-native";
import type { TranslateFunction } from "./types";

export interface UseImageUploadOptions {
  /** Translation function for error messages */
  t?: TranslateFunction;
  /** Image quality for library picks (0-1) */
  libraryQuality?: number;
  /** Image quality for camera captures (0-1) */
  cameraQuality?: number;
  /** Aspect ratio for images */
  aspect?: [number, number];
}

export interface UseImageUploadReturn {
  /** Whether an upload operation is in progress */
  isUploading: boolean;
  /** Pick images from photo library */
  pickFromLibrary: (selectionLimit?: number) => Promise<string[]>;
  /** Capture photo from camera */
  takePhoto: () => Promise<string>;
  /** Show action sheet to choose between camera and library */
  handleImagePicker: (
    onImageSelected: (uris: string[]) => Promise<void>,
    selectionLimit?: number
  ) => Promise<void>;
}

// Default messages when translation is not available
const DEFAULT_MESSAGES = {
  cancel: "Cancel",
  takePhoto: "Take Photo",
  selectFromLibrary: "Select from Library",
  selectPhotoSource: "Select Photo Source",
  permissionRequired: "Permission Required",
  photoLibraryPermission: "Please allow access to your photo library",
  cameraPermission: "Please allow access to your camera",
  error: "Error",
  imageSelectionError: "Failed to select images",
  cameraError: "Failed to capture photo",
};

/**
 * Hook for handling image upload operations
 *
 * @example
 * const { handleImagePicker, isUploading } = useImageUpload({ t });
 *
 * const onAddImages = async () => {
 *   await handleImagePicker(async (uris) => {
 *     await addImages(uris);
 *   }, remainingSlots);
 * };
 */
export const useImageUpload = (options: UseImageUploadOptions = {}): UseImageUploadReturn => {
  const { t, libraryQuality = 0.8, cameraQuality = 0.6, aspect = [3, 4] } = options;

  const [isUploading, setIsUploading] = useState(false);

  // Translation helper
  const getText = useCallback(
    (key: keyof typeof DEFAULT_MESSAGES, translationKey?: string) => {
      if (t && translationKey) {
        return t(translationKey);
      }
      return DEFAULT_MESSAGES[key];
    },
    [t]
  );

  const pickFromLibrary = useCallback(
    async (selectionLimit?: number): Promise<string[]> => {
      setIsUploading(true);
      try {
        const uris = await ImageService.pickFromLibrary({
          allowsMultipleSelection: true,
          quality: libraryQuality,
          allowsEditing: false,
          aspect,
          selectionLimit,
        });

        if (uris.length === 0) {
          // User cancelled or didn't pick anything – this is not an error case.
          logger.debug("No images selected, skipping upload");
          return [];
        }

        return uris;
      } catch (error) {
        if (error instanceof ImageServiceError && error.code === "PERMISSION_DENIED") {
          logger.debug("Pick images failed: Permission denied");
          Alert.alert(
            getText("permissionRequired", "common.permissionRequired"),
            getText("photoLibraryPermission", "common.photoLibraryPermission")
          );
        } else {
          logger.error("Pick images failed:", error);
          Alert.alert(
            getText("error", "common.error"),
            getText("imageSelectionError", "common.imageSelectionError")
          );
        }
        throw error;
      } finally {
        setIsUploading(false);
      }
    },
    [libraryQuality, aspect, getText]
  );

  const takePhoto = useCallback(async (): Promise<string> => {
    setIsUploading(true);
    try {
      return await ImageService.takePhoto({
        allowsEditing: false,
        aspect,
        quality: cameraQuality,
      });
    } catch (error) {
      if (error instanceof ImageServiceError && error.code === "NO_PHOTO_TAKEN") {
        // User cancelled camera – do not treat as an error and do not show an alert.
        logger.debug("No photo taken, skipping upload");
        throw error;
      }

      if (error instanceof ImageServiceError && error.code === "PERMISSION_DENIED") {
        logger.debug("Take photo failed: Permission denied");
        Alert.alert(
          getText("permissionRequired", "common.permissionRequired"),
          getText("cameraPermission", "common.cameraPermission")
        );
      } else {
        logger.error("Take photo failed:", error);
        Alert.alert(getText("error", "common.error"), getText("cameraError", "common.cameraError"));
      }
      throw error;
    } finally {
      setIsUploading(false);
    }
  }, [cameraQuality, aspect, getText]);

  const handleImagePicker = useCallback(
    async (onImageSelected: (uris: string[]) => Promise<void>, selectionLimit?: number) => {
      try {
        if (Platform.OS === "ios") {
          ActionSheetIOS.showActionSheetWithOptions(
            {
              options: [
                getText("cancel", "common.cancel"),
                getText("takePhoto", "home.takePhoto"),
                getText("selectFromLibrary", "home.selectFromLibrary"),
              ],
              cancelButtonIndex: 0,
            },
            async (buttonIndex: number) => {
              if (buttonIndex === 1) {
                try {
                  const uri = await takePhoto();
                  await onImageSelected([uri]);
                } catch {
                  // Error handled in takePhoto
                }
              } else if (buttonIndex === 2) {
                try {
                  const uris = await pickFromLibrary(selectionLimit);
                  await onImageSelected(uris);
                } catch {
                  // Error handled in pickFromLibrary
                }
              }
            }
          );
        } else {
          Alert.alert(getText("selectPhotoSource", "home.selectPhotoSource"), "", [
            { text: getText("cancel", "common.cancel"), style: "cancel" },
            {
              text: getText("takePhoto", "home.takePhoto"),
              onPress: async () => {
                try {
                  const uri = await takePhoto();
                  await onImageSelected([uri]);
                } catch {
                  // Error handled in takePhoto
                }
              },
            },
            {
              text: getText("selectFromLibrary", "home.selectFromLibrary"),
              onPress: async () => {
                try {
                  const uris = await pickFromLibrary(selectionLimit);
                  await onImageSelected(uris);
                } catch {
                  // Error handled in pickFromLibrary
                }
              },
            },
          ]);
        }
      } catch (error) {
        logger.error("Image picker failed:", error);
        // Error is already handled in the upload functions
      }
    },
    [takePhoto, pickFromLibrary, getText]
  );

  return {
    isUploading,
    pickFromLibrary,
    takePhoto,
    handleImagePicker,
  };
};
