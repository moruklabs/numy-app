import settings from "@/config/settings";
import { createAdConfig } from "@/app-shared/config/ads-config";
import { useEffect, useState } from "react";
import { adService } from "../model/AdService";

export function useAdManager() {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const init = async () => {
      // Create config from settings + remote config (if needed)
      const config = createAdConfig({}, settings);
      await adService.initialize(config);
      setInitialized(true);
    };

    init();
  }, []);

  return { initialized };
}
