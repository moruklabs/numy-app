import {
  getTrackingPermissionsAsync,
  requestTrackingPermissionsAsync,
} from "expo-tracking-transparency";
import { useEffect, useRef, useState } from "react";
import { AdsConsent } from "react-native-google-mobile-ads";

export function usePrivacySequence() {
  const [initialized, setInitialized] = useState(false);
  const running = useRef(false);

  useEffect(() => {
    if (initialized || running.current) return;

    const runSequence = async () => {
      running.current = true;
      try {
        // Step 1: AdMob User Messaging Platform (UMP)
        const umpInfo = await AdsConsent.requestInfoUpdate();

        if (umpInfo.isConsentFormAvailable && umpInfo.status === "REQUIRED") {
          await AdsConsent.loadAndShowConsentFormIfRequired();
        }

        // Delay for stability as per requirements
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Step 2: Check ATT Status
        const currentStatus = await getTrackingPermissionsAsync();

        if (currentStatus.status === "undetermined") {
          await requestTrackingPermissionsAsync();
        }

        setInitialized(true);
        running.current = false;
      } catch (error) {
        console.error("Privacy sequence failed", error);
        setInitialized(true);
        running.current = false;
      }
    };

    runSequence();
  }, [initialized]);

  return { initialized };
}
