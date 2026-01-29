import { logger } from "@moruk/logger";
import { storage } from "@moruk/storage";
import { useCallback, useState } from "react";
import { Alert } from "react-native";

export interface EraseDataOptions {
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  extraActions?: (() => Promise<void> | void)[];
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export interface UseEraseDataResult {
  /** Whether data erasure is in progress */
  isErasing: boolean;
  /** Show confirmation dialog before erasing */
  showConfirmation: (options: EraseDataOptions) => void;
  /** Erase all app data and run extra actions */
  eraseAllData: (extraActions?: (() => Promise<void> | void)[]) => Promise<boolean>;
}

/**
 * Shared hook to manage data erasure functionality across the monorepo.
 * Provides a standardized way to clear AsyncStorage and run app-specific cleanup logic.
 */
export function useEraseData(): UseEraseDataResult {
  const [isErasing, setIsErasing] = useState(false);

  const eraseAllData = useCallback(
    async (extraActions?: (() => Promise<void> | void)[]): Promise<boolean> => {
      setIsErasing(true);
      try {
        // 1. Clear all AsyncStorage data (Standard nuclear option)
        await storage.clear();

        // 2. Run app-specific extra cleanup (e.g., reset in-memory state, stores, etc.)
        if (extraActions && extraActions.length > 0) {
          await Promise.all(
            extraActions.map(async (action) => {
              try {
                await action();
              } catch (e) {
                logger.warn("[useEraseData] Extra action failed:", e);
              }
            })
          );
        }

        return true;
      } catch (error) {
        logger.error("[useEraseData] Failed to erase data:", error);
        throw error;
      } finally {
        setIsErasing(false);
      }
    },
    []
  );

  const showConfirmation = useCallback(
    (options: EraseDataOptions) => {
      const { title, message, confirmText, cancelText, extraActions, onSuccess, onError } = options;

      Alert.alert(title, message, [
        {
          text: cancelText,
          style: "cancel",
        },
        {
          text: confirmText,
          style: "destructive",
          onPress: async () => {
            try {
              await eraseAllData(extraActions);
              onSuccess?.();
            } catch (error) {
              onError?.(error as Error);
            }
          },
        },
      ]);
    },
    [eraseAllData]
  );

  return {
    isErasing,
    showConfirmation,
    eraseAllData,
  };
}

export default useEraseData;
