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
  };
}

/**
 * Maps raw validation config (e.g. from Firebase/YAML) to strictly typed AdConfiguration.
 * This function helps bridge the gap between human-readable YAML and runtime ms logic.
 */
export const createAdConfig = (rawConfig: any, settings: any): AdConfiguration => {
  // Logic to merge defaults from settings.ts with remote/yaml values can go here.
  // For now we map the static settings structure.

  const defaults = settings.ads.defaults;
  const units = settings.ads.units.ios; // Defaulting to iOS for now, platform logic should be in hook

  return {
    interstitial: {
      frequency: defaults.interstitial.frequency,
      intervalMs: toMs(defaults.interstitial.interval, defaults.interstitial.intervalUnit as any),
      enabled: settings.features.ads,
      adUnitId: units.interstitial,
      appId: settings.ads.iosAppId,
      maxImpressionsPerSession: 3, // Safe default
    },
    appOpen: {
      frequency: defaults.appOpen.frequency,
      intervalMs: toMs(defaults.appOpen.interval, defaults.appOpen.intervalUnit as any),
      enabled: settings.features.ads,
      adUnitId: units.appOpen,
      appId: settings.ads.iosAppId,
      maxImpressionsPerSession: 3,
    },
    storageKeys: {
      interstitialLastShown: "ads_interstitial_last_shown",
      appOpenLastShown: "ads_app_open_last_shown",
    },
  };
};
