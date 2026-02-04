import { AdConfiguration, AdUnitConfig } from "@/app-shared/config/ads-config";
import { logger } from "@moruk/logger";
import AsyncStorage from "@react-native-async-storage/async-storage";
import mobileAds, {
  AdEventType,
  AppOpenAd,
  InterstitialAd,
  MaxAdContentRating,
  TestIds,
} from "react-native-google-mobile-ads";

class AdService {
  private static instance: AdService;
  private config: AdConfiguration | null = null;
  private interstitial: InterstitialAd | null = null;
  private appOpenAd: AppOpenAd | null = null;

  private isInterstitialLoaded = false;
  private isInterstitialLoading = false;

  private isAppOpenLoaded = false;
  private isAppOpenLoading = false;

  // Storage for frequency capping
  private lastShownTimestamps: Record<string, number> = {};
  private sessionImpressions: Record<string, number> = {
    interstitial: 0,
    appOpen: 0,
  };
  private dailyImpressions: Record<string, { date: string; count: number }> = {
    interstitial: { date: "", count: 0 },
    appOpen: { date: "", count: 0 },
  };
  private totalShownAds: number = 0;

  private constructor() {}

  public static getInstance(): AdService {
    if (!AdService.instance) {
      AdService.instance = new AdService();
    }
    return AdService.instance;
  }

  public async initialize(config: AdConfiguration) {
    this.config = config;

    await mobileAds().initialize();

    // Set configuration
    await mobileAds().setRequestConfiguration({
      // Update with actual test device IDs or handle via feature flags
      testDeviceIdentifiers: ["SIMULATOR", "EMULATOR"],
      maxAdContentRating: MaxAdContentRating.PG,
      tagForChildDirectedTreatment: true,
      tagForUnderAgeOfConsent: true,
    });

    // Load persisted timestamps and daily counts
    if (this.config.storageKeys) {
      try {
        const interstitialLastShown = await AsyncStorage.getItem(
          this.config.storageKeys.interstitialLastShown
        );
        if (interstitialLastShown) {
          this.lastShownTimestamps["interstitial"] = Number.parseInt(interstitialLastShown, 10);
        }

        const appOpenLastShown = await AsyncStorage.getItem(
          this.config.storageKeys.appOpenLastShown
        );
        if (appOpenLastShown) {
          this.lastShownTimestamps["appOpen"] = Number.parseInt(appOpenLastShown, 10);
        }

        // Load daily counts
        await this.loadDailyCount("interstitial", this.config.storageKeys.interstitialDailyCount);
        await this.loadDailyCount("appOpen", this.config.storageKeys.appOpenDailyCount);
      } catch (e) {
        console.warn("Failed to load ad timestamps", e);
      }
    }

    console.log("AdMob Initialized");
  }

  private async loadDailyCount(type: string, key: string) {
    const data = await AsyncStorage.getItem(key);
    if (data) {
      try {
        const parsed = JSON.parse(data);
        const today = new Date().toISOString().split("T")[0];
        if (parsed.date === today) {
          this.dailyImpressions[type] = parsed;
        } else {
          // Reset if new day
          this.dailyImpressions[type] = { date: today, count: 0 };
          await AsyncStorage.setItem(key, JSON.stringify(this.dailyImpressions[type]));
        }
      } catch (e) {
        // invalid data, reset
      }
    } else {
      // Init for today
      const today = new Date().toISOString().split("T")[0];
      this.dailyImpressions[type] = { date: today, count: 0 };
    }
    // Also track total shown across types if we want a global counter,
    // but for now we sum up specific types for "Total Shown Ads Count"
    this.totalShownAds =
      this.dailyImpressions["interstitial"].count + this.dailyImpressions["appOpen"].count;
  }

  public async loadInterstitial(callbacks?: {
    onLoaded?: () => void;
    onError?: (error: Error) => void;
  }) {
    if (!this.config?.interstitial.enabled) return;

    // Test ID logic: in DEV always use TestIds.INTERSTITIAL
    const adUnitId = __DEV__ ? TestIds.INTERSTITIAL : this.config.interstitial.adUnitId;

    if (this.isInterstitialLoading || this.isInterstitialLoaded) {
      if (this.isInterstitialLoaded) callbacks?.onLoaded?.();
      return;
    }

    // Check frequency caps
    if (this.isFrequencyCapped(this.config.interstitial, "interstitial")) {
      console.log("Interstitial frequency capped");
      return;
    }

    this.isInterstitialLoading = true;
    this.interstitial = InterstitialAd.createForAdRequest(adUnitId);

    this.interstitial.addAdEventListener(AdEventType.LOADED, () => {
      this.isInterstitialLoaded = true;
      this.isInterstitialLoading = false;
      callbacks?.onLoaded?.();
    });

    this.interstitial.addAdEventListener(AdEventType.ERROR, (error) => {
      this.isInterstitialLoading = false;
      console.error("Interstitial load error", error);
      callbacks?.onError?.(error);
    });

    this.interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      this.isInterstitialLoaded = false;
      this.interstitial = null;
      // Record impression
      this.recordImpression("interstitial");
      // Preload next? - Feature requirement says "Preload them once onboarding is complete" and "Show ads on time without extra waiting".
      // We should probably attempt to reload after a delay or immediately if capped.
      // But let's not auto-reload infinitely.
    });

    this.interstitial.load();
  }

  public showInterstitial() {
    if (this.interstitial && this.isInterstitialLoaded) {
      this.interstitial.show();
    } else {
      console.warn("Interstitial not ready");
      // Attempt load if not ready?
      this.loadInterstitial();
    }
  }

  public isReady(type: "interstitial" | "appOpen"): boolean {
    if (type === "interstitial") return this.isInterstitialLoaded;
    if (type === "appOpen") return this.isAppOpenLoaded;
    return false;
  }

  public async loadAppOpenAd(callbacks?: {
    onLoaded?: () => void;
    onError?: (error: Error) => void;
  }) {
    if (!this.config?.appOpen.enabled) return;

    // Test ID logic: in DEV always use TestIds.APP_OPEN
    const adUnitId = __DEV__ ? TestIds.APP_OPEN : this.config.appOpen.adUnitId;

    if (this.isAppOpenLoading || this.isAppOpenLoaded) {
      if (this.isAppOpenLoaded) callbacks?.onLoaded?.();
      return;
    }

    // Check frequency caps
    if (this.isFrequencyCapped(this.config.appOpen, "appOpen")) {
      console.log("App Open Ad frequency capped");
      return;
    }

    this.isAppOpenLoading = true;
    this.appOpenAd = AppOpenAd.createForAdRequest(adUnitId);

    this.appOpenAd.addAdEventListener(AdEventType.LOADED, () => {
      this.isAppOpenLoaded = true;
      this.isAppOpenLoading = false;
      callbacks?.onLoaded?.();
    });

    this.appOpenAd.addAdEventListener(AdEventType.ERROR, (error) => {
      this.isAppOpenLoading = false;
      console.error("App Open Ad load error", error);
      callbacks?.onError?.(error);
    });

    this.appOpenAd.addAdEventListener(AdEventType.CLOSED, () => {
      this.isAppOpenLoaded = false;
      this.appOpenAd = null;
      // Record impression
      this.recordImpression("appOpen");
    });

    this.appOpenAd.load();
  }

  public showAppOpenAd() {
    if (this.appOpenAd && this.isAppOpenLoaded) {
      this.appOpenAd.show();
    } else {
      console.warn("App Open Ad not ready");
    }
  }

  private isFrequencyCapped(config: AdUnitConfig, type: string): boolean {
    const now = Date.now();
    const lastShown = this.lastShownTimestamps[type] || 0;

    // Interval check
    if (now - lastShown < config.intervalMs) {
      console.log(
        `Frequency Capped: ${type}. Time since last: ${now - lastShown}ms < ${config.intervalMs}ms`
      );
      return true;
    }

    // Session Cap
    if (this.sessionImpressions[type] >= config.maxImpressionsPerSession) {
      console.log(
        `Session Capped: ${type}. Impressions: ${this.sessionImpressions[type]} >= ${config.maxImpressionsPerSession}`
      );
      return true;
    }

    // Daily Cap
    const today = new Date().toISOString().split("T")[0];
    const daily = this.dailyImpressions[type];
    // Reset if day changed (in memory check if sync failed or app kept running across midnight)
    if (daily.date !== today) {
      // Reset Logic happens on load, but let's handle runtime cross-day
      this.dailyImpressions[type] = { date: today, count: 0 };
    }

    if (this.dailyImpressions[type].count >= config.maxImpressionsPerDay) {
      console.log(`Daily Capped: ${type}. Count: ${this.dailyImpressions[type].count}`);
      return true;
    }

    return false;
  }

  private recordImpression(type: "interstitial" | "appOpen") {
    const now = Date.now();

    // Update Session
    this.sessionImpressions[type] = (this.sessionImpressions[type] || 0) + 1;

    // Update Interval Timestamp
    this.lastShownTimestamps[type] = now;

    // Update Daily
    const today = new Date().toISOString().split("T")[0];
    if (this.dailyImpressions[type].date !== today) {
      this.dailyImpressions[type] = { date: today, count: 0 };
    }
    this.dailyImpressions[type].count++;
    this.totalShownAds++;

    // Persist
    if (this.config?.storageKeys) {
      const lastShownKey =
        type === "interstitial"
          ? this.config.storageKeys.interstitialLastShown
          : this.config.storageKeys.appOpenLastShown;

      const dailyKey =
        type === "interstitial"
          ? this.config.storageKeys.interstitialDailyCount
          : this.config.storageKeys.appOpenDailyCount;

      AsyncStorage.setItem(lastShownKey, now.toString()).catch((e) =>
        logger.warn("[AdService] Failed to save ad timestamp", e)
      );

      AsyncStorage.setItem(dailyKey, JSON.stringify(this.dailyImpressions[type])).catch((e) =>
        logger.warn("[AdService] Failed to save daily count", e)
      );
    }
  }

  public async resetLimits() {
    // Clear memory
    this.lastShownTimestamps = {};
    this.sessionImpressions = { interstitial: 0, appOpen: 0 };
    const today = new Date().toISOString().split("T")[0];
    this.dailyImpressions = {
      interstitial: { date: today, count: 0 },
      appOpen: { date: today, count: 0 },
    };
    this.totalShownAds = 0;

    // Clear Storage
    if (this.config?.storageKeys) {
      try {
        await AsyncStorage.multiRemove([
          this.config.storageKeys.interstitialLastShown,
          this.config.storageKeys.appOpenLastShown,
          this.config.storageKeys.interstitialDailyCount,
          this.config.storageKeys.appOpenDailyCount,
        ]);
      } catch (e) {
        console.warn("Failed to reset storage", e);
      }
    }

    console.log("Ad Limits Reset");
  }

  public getStats() {
    return {
      interstitial: {
        remainingSession:
          (this.config?.interstitial.maxImpressionsPerSession || 0) -
          this.sessionImpressions.interstitial,
        maxSession: this.config?.interstitial.maxImpressionsPerSession || 0,
        remainingDaily:
          (this.config?.interstitial.maxImpressionsPerDay || 0) -
          this.dailyImpressions.interstitial.count,
        maxDaily: this.config?.interstitial.maxImpressionsPerDay || 0,
        timeSinceLast: this.lastShownTimestamps.interstitial
          ? Date.now() - this.lastShownTimestamps.interstitial
          : null,
        interval: this.config?.interstitial.intervalMs || 0,
      },
      appOpen: {
        remainingSession:
          (this.config?.appOpen.maxImpressionsPerSession || 0) - this.sessionImpressions.appOpen,
        maxSession: this.config?.appOpen.maxImpressionsPerSession || 0,
        remainingDaily:
          (this.config?.appOpen.maxImpressionsPerDay || 0) - this.dailyImpressions.appOpen.count,
        maxDaily: this.config?.appOpen.maxImpressionsPerDay || 0,
        timeSinceLast: this.lastShownTimestamps.appOpen
          ? Date.now() - this.lastShownTimestamps.appOpen
          : null,
        interval: this.config?.appOpen.intervalMs || 0,
      },
      totalShown: this.totalShownAds,
    };
  }

  public __resetForTests() {
    this.isInterstitialLoaded = false;
    this.isInterstitialLoading = false;
    this.isAppOpenLoaded = false;
    this.isAppOpenLoading = false;
    this.lastShownTimestamps = {};
    this.sessionImpressions = { interstitial: 0, appOpen: 0 };
    this.dailyImpressions = {
      interstitial: { date: "", count: 0 },
      appOpen: { date: "", count: 0 },
    };
    this.config = null;
    this.interstitial = null;
    this.appOpenAd = null;
  }
}

export const adService = AdService.getInstance();
