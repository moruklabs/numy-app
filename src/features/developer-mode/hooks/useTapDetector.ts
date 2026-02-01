import { useCallback, useRef } from "react";

interface UseTapDetectorOptions {
  threshold: number;
  timeWindow: number;
  onThresholdReached: () => void;
}

export const useTapDetector = ({
  threshold,
  timeWindow,
  onThresholdReached,
}: UseTapDetectorOptions) => {
  const tapTimestamps = useRef<number[]>([]);

  const handleTap = useCallback(() => {
    const now = Date.now();

    // Remove taps outside the time window
    tapTimestamps.current = tapTimestamps.current.filter(
      (timestamp) => now - timestamp < timeWindow
    );

    // Add current tap
    tapTimestamps.current.push(now);

    // Check if threshold reached
    if (tapTimestamps.current.length >= threshold) {
      tapTimestamps.current = [];
      onThresholdReached();
    }
  }, [threshold, timeWindow, onThresholdReached]);

  return { handleTap };
};
