import { storage } from "@moruk/storage";
import { useCallback, useEffect } from "react";
import { logger } from "@moruk/logger";

/**
 * Events used by the return user tracking hook.
 */
type ReturnUserEvent = "user_activated" | "return_user_24h";

/**
 * Track function type that accepts specific events used by this hook.
 * Compatible with any tracking function that accepts these event names.
 */
export type TrackFunction = (
  event: ReturnUserEvent,
  properties?: Record<string, string | number | boolean | undefined>
) => void;

/**
 * Hook to track user activation and return user events.
 * Tracks "user_activated" on every call and "return_user_24h" if user returns after 24+ hours.
 *
 * @param userId - The user ID (can be null)
 * @param track - Function to track events (provided by app's tracking system)
 */
export const useReturnUserTracking = (userId: string | null, track: TrackFunction) => {
  const checkReturnUser = useCallback(async () => {
    if (!userId) return;

    try {
      const lastSessionKey = `last_session_${userId}`;
      const lastSessionTime = await storage.getItem<string>(lastSessionKey);
      const now = Date.now();

      track("user_activated");

      if (lastSessionTime) {
        const timeDiff = now - parseInt(lastSessionTime, 10);
        const hoursDiff = timeDiff / (1000 * 60 * 60); // Convert to hours

        if (hoursDiff >= 24) {
          track("return_user_24h", {
            hoursSinceLastSession: Math.round(hoursDiff * 10) / 10, // Round to 1 decimal
          });
        }
      }

      await storage.setItem<string>(lastSessionKey, now.toString());
    } catch (error) {
      logger.warn("[useReturnUserTracking] Failed to check return user:", error);
      track("user_activated");
    }
  }, [track, userId]);

  useEffect(() => {
    checkReturnUser();
  }, [checkReturnUser]);

  return { checkReturnUser };
};
