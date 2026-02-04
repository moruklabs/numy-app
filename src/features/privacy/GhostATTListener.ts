import {
  PermissionStatus,
  getTrackingPermissionsAsync,
  requestTrackingPermissionsAsync,
} from "expo-tracking-transparency";
import { useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";

const ATT_CHECK_KEY = "has_checked_att_change";

export const useGhostATTListener = () => {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === "active") {
        // App has come to foreground
        await checkATTStatusChange();
      }
      appState.current = nextAppState;
    };

    const checkATTStatusChange = async () => {
      try {
        const { status } = await getTrackingPermissionsAsync();

        // Logic: If user specifically *changed* from denied/restricted to authorized or undetermined (which allows request),
        // we might want to re-prompt or just log it.
        // The requirement: "If a user has 'Allow Apps to Request to Track' DISABLED ... but later ENABLES it ... trigger ATT request".

        // Scenario:
        // 1. Initial Launch: System setting OFF -> status is DENIED (or RESTRICTED).
        // 2. User goes to Settings -> Privacy -> Tracking -> ON.
        // 3. App Launch (or Foreground) -> status is now UNDETERMINED (or allows request).
        //    Wait, if they enable the transform switch, does it revert to UNDETERMINED?
        //    Yes, usually it allows the app to request.

        // We need to track if we have already requested successfully.
        // But requested is system state.

        if (status === PermissionStatus.UNDETERMINED) {
          // We can request!
          // Check if we already requested or if we should.
          // Requirement says: "trigger the ATT request sequence if it hasn't been shown yet."
          // "if it hasn't been shown yet" is key.
          // If status is UNDETERMINED, it means it hasn't been shown (or was reset).

          // So we simply request it.
          await requestTrackingPermissionsAsync();
        }
      } catch (e) {
        console.error("Ghost ATT check failed", e);
      }
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);

    // Also run on mount
    checkATTStatusChange();

    return () => {
      subscription.remove();
    };
  }, []);
};
