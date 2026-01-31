import { useCallback, useEffect, useRef } from "react";
import { adService } from "../model/AdService";

interface UseInterstitialAdProps {
  /** The feature requesting the ad (for logging/analytics) */
  feature: string;
  /** Whether the feature is currently processing/loading */
  isProcessing: boolean;
  /** Whether to automatically show the ad when loaded */
  autoShow?: boolean;
}

export function useInterstitialAd({
  feature,
  isProcessing,
  autoShow = false,
}: UseInterstitialAdProps) {
  const hasTriggeredLoad = useRef(false);

  const showAdIfReady = useCallback(() => {
    if (adService.isReady("interstitial")) {
      adService.showInterstitial();
    }
  }, []);

  useEffect(() => {
    // When processing starts, we optimistically load an ad
    if (isProcessing && !hasTriggeredLoad.current) {
      hasTriggeredLoad.current = true;

      adService.loadInterstitial({
        onLoaded: () => {
          if (autoShow) {
            showAdIfReady();
          }
        },
        onError: (e) => {
          // Silently fail or log, don't interrupt user flow
        },
      });
    }

    // Reset trigger when processing finishes (so next time we can load again)
    if (!isProcessing) {
      hasTriggeredLoad.current = false;
    }
  }, [isProcessing, autoShow, showAdIfReady]);

  return { showAdIfReady };
}
