import {
  getTrackingPermissionsAsync,
  requestTrackingPermissionsAsync,
} from "expo-tracking-transparency";
import { useEffect, useRef, useState } from "react";
import { AdsConsent } from "react-native-google-mobile-ads";

export function usePrivacySequence() {
  const [initialized, setInitialized] = useState(false);
  const [showPrimer, setShowPrimer] = useState(false);
  const running = useRef(false);

  // Trigger for continuing after primer
  const [primerAccepted, setPrimerAccepted] = useState(false);

  useEffect(() => {
    if (initialized || running.current) return;

    const runSequence = async () => {
      running.current = true;
      try {
        // Step 1: AdMob User Messaging Platform (UMP)
        await AdsConsent.requestInfoUpdate();
        await AdsConsent.loadAndShowConsentFormIfRequired();

        // Step 2: Check ATT Status
        const currentStatus = await getTrackingPermissionsAsync();

        if (currentStatus.status === "undetermined") {
          // If undetermined, we pause and wait for Primer acceptance
          // BUT if we haven't shown primer yet, show it.
          // Wait, returning from useEffect won't work well with async flow pause.
          // We split the sequence.
          setShowPrimer(true);
          running.current = false; // Pause running so we can resume later?
          // Actually, we should just return here and let the next effect (triggered by primerAccepted) continue.
          return;
        }

        // If authorized/denied or restricted, we are done.
        setInitialized(true);
        running.current = false;
      } catch (error) {
        console.error("Privacy sequence failed", error);
        setInitialized(true);
        running.current = false;
      }
    };

    runSequence();
  }, [initialized]); // We only want this to run once on mount

  // Effect to handle ATT request after Primer
  useEffect(() => {
    if (primerAccepted && !initialized) {
      const requestAtt = async () => {
        try {
          // Hide Primer
          setShowPrimer(false);

          // Request ATT
          await requestTrackingPermissionsAsync();
        } catch (e) {
          console.error("ATT Request failed", e);
        } finally {
          setInitialized(true);
        }
      };
      requestAtt();
    }
  }, [primerAccepted, initialized]);

  const onPrimerContinue = () => {
    setPrimerAccepted(true);
  };

  return { initialized, showPrimer, onPrimerContinue };
}
