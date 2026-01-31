import { useCallback, useRef } from "react";
import { adService } from "../model/AdService";

interface AdCondition {
  screen: string;
  condition: string;
  event: string;
}

interface UseConditionalInterstitialProps {
  screenName: string;
  eventName: string;
  conditions: AdCondition[];
}

/**
 * Hook to show interstitial ads based on conditional logic from ads.yaml
 * Example: Show ad on "examples" screen after "example_viewed" event count > 3
 */
export function useConditionalInterstitial({
  screenName,
  eventName,
  conditions,
}: UseConditionalInterstitialProps) {
  const eventCountRef = useRef(0);
  const hasShownAdRef = useRef(false);

  const checkAndShowAd = useCallback(() => {
    // Find matching condition for this screen/event
    const matchingCondition = conditions.find(
      (c) => c.screen === screenName && c.event === eventName
    );

    if (!matchingCondition) return false;

    // Parse condition (e.g., "count > 3")
    const match = matchingCondition.condition.match(/count\s*([><=]+)\s*(\d+)/);
    if (!match) {
      console.warn("Invalid condition format:", matchingCondition.condition);
      return false;
    }

    const [, operator, thresholdStr] = match;
    const threshold = parseInt(thresholdStr, 10);

    const count = eventCountRef.current;
    let conditionMet = false;

    switch (operator) {
      case ">":
        conditionMet = count > threshold;
        break;
      case ">=":
        conditionMet = count >= threshold;
        break;
      case "=":
      case "==":
        conditionMet = count === threshold;
        break;
      default:
        console.warn("Unsupported operator:", operator);
    }

    // Show ad if condition met and not already shown
    if (conditionMet && !hasShownAdRef.current && adService.isReady("interstitial")) {
      adService.showInterstitial();
      hasShownAdRef.current = true;
      return true;
    }

    return false;
  }, [screenName, eventName, conditions]);

  const triggerEvent = useCallback(() => {
    eventCountRef.current += 1;
    checkAndShowAd();
  }, [checkAndShowAd]);

  const resetCount = useCallback(() => {
    eventCountRef.current = 0;
    hasShownAdRef.current = false;
  }, []);

  return {
    triggerEvent,
    resetCount,
    getCount: () => eventCountRef.current,
  };
}
