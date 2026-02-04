import { toMs } from "@/app-shared/utils/time";

export interface AdPacing {
  /** Maximum number of impressions allowed within the interval */
  frequency: number;
  /** Duration in milliseconds before the frequency cap resets (e.g., 24 hours) */
  intervalMs: number;
}

/**
 * Configuration for a specific Ad Unit.
 */
export interface AdUnitConfig extends AdPacing {
  /** Master toggle to enable/disable this ad unit */
  enabled: boolean;
  /** The Ad Unit ID (Test ID in DEV, Real ID in PROD) */
  adUnitId: string;
  /** The AdMob App ID associated with this unit */
  appId: string;
  /** Safety limit: max impressions per app session */
  maxImpressionsPerSession: number;
  /** Max impressions per day */
  maxImpressionsPerDay: number;
}

/**
 * Application-wide Ad Configuration.
 */
export interface AdConfiguration {
  interstitial: AdUnitConfig;
  appOpen: AdUnitConfig;
  /** Storage keys for persisting ad state */
  storageKeys: {
    interstitialLastShown: string;
    appOpenLastShown: string;
    interstitialDailyCount: string;
    appOpenDailyCount: string;
  };
}

/**
 * Maps raw validation config (e.g. from Firebase/YAML) to strictly typed AdConfiguration.
 * This function helps bridge the gap between human-readable YAML and runtime ms logic.
 */
export const createAdConfig = (rawConfig: any, settings: any): AdConfiguration => {
  // Logic to merge defaults from settings.ts with remote/yaml values can go here.
  // For now we map the static settings structure.

  // Force 60 minutes interval and 1 per session as per strict requirements
  const STRICT_INTERVAL_MS = 60 * 60 * 1000;
  const STRICT_MAX_SESSION = 1;
  const STRICT_MAX_DAILY = 24;

  const units = settings.ads.units.ios; // Defaulting to iOS for now, platform logic should be in hook

  return {
    interstitial: {
      frequency: 1, // Pacing frequency (how many in interval)
      intervalMs: STRICT_INTERVAL_MS,
      enabled: settings.features.ads,
      adUnitId: units.interstitial,
      appId: settings.ads.iosAppId,
      maxImpressionsPerSession: STRICT_MAX_SESSION,
      maxImpressionsPerDay: STRICT_MAX_DAILY,
    },
    appOpen: {
      frequency: 1,
      intervalMs: STRICT_INTERVAL_MS,
      enabled: settings.features.ads,
      adUnitId: units.appOpen,
      appId: settings.ads.iosAppId,
      maxImpressionsPerSession: STRICT_MAX_SESSION,
      maxImpressionsPerDay: STRICT_MAX_DAILY,
    },
    storageKeys: {
      interstitialLastShown: "ads_interstitial_last_shown",
      appOpenLastShown: "ads_app_open_last_shown",
      interstitialDailyCount: "ads_interstitial_daily_count",
      appOpenDailyCount: "ads_app_open_daily_count",
    },
  };
};
