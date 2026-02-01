import { useState, useCallback } from "react";
import { ResetService } from "../model/ResetService";

export const useGlobalReset = () => {
  const [isResetting, setIsResetting] = useState(false);

  const performReset = useCallback(async () => {
    setIsResetting(true);
    try {
      await ResetService.performGlobalReset();
    } catch (error) {
      console.error("Reset failed:", error);
      setIsResetting(false);
    }
  }, []);

  return {
    isResetting,
    performReset,
  };
};
