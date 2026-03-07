import { useState, useCallback } from "react";
import { ResetService } from "../model/ResetService";
import { logger } from "@moruk/logger";

export const useGlobalReset = () => {
  const [isResetting, setIsResetting] = useState(false);

  const performReset = useCallback(async () => {
    setIsResetting(true);
    try {
      await ResetService.performGlobalReset();
    } catch (error) {
      logger.error("Reset failed:", error);
      setIsResetting(false);
    }
  }, []);

  return {
    isResetting,
    performReset,
  };
};
