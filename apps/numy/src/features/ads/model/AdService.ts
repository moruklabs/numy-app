import { AdConfiguration, AdUnitConfig } from "@/shared/config/ads-config";
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

  // Storage for frequency capping (Mocked for now, needs persistence layer)
  private lastShownTimestamps: Record<string, number> = {};
  private sessionImpressions: Record<string, number> = {
    interstitial: 0,
    appOpen: 0,
  };

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
      // Update with actual test device IDs
      testDeviceIdentifiers: ["EMULATOR"],
      maxAdContentRating: MaxAdContentRating.PG,
      tagForChildDirectedTreatment: true,
      tagForUnderAgeOfConsent: true,
    });

    // Load persisted timestamps
    if (this.config.storageKeys) {
      try {
        const interstitialLastShown = await AsyncStorage.getItem(
          this.config.storageKeys.interstitialLastShown
        );
        if (interstitialLastShown) {
          this.lastShownTimestamps["interstitial"] = parseInt(interstitialLastShown, 10);
        }
      } catch (e) {
        console.warn("Failed to load ad timestamps", e);
      }
    }

    console.log("AdMob Initialized");
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
      // Preload next?
    });

    this.interstitial.load();
  }

  public showInterstitial() {
    if (this.interstitial && this.isInterstitialLoaded) {
      this.interstitial.show();
    } else {
      console.warn("Interstitial not ready");
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
      // Simple interval check (real implementation needs counting within interval)
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

    return false;
  }

  private recordImpression(type: "interstitial" | "appOpen") {
    this.sessionImpressions[type] = (this.sessionImpressions[type] || 0) + 1;
    const now = Date.now();
    this.lastShownTimestamps[type] = now;

    // Persist to storage here
    if (this.config?.storageKeys) {
      const key =
        type === "interstitial"
          ? this.config.storageKeys.interstitialLastShown
          : this.config.storageKeys.appOpenLastShown;
      if (key) {
        AsyncStorage.setItem(key, now.toString()).catch((e) =>
          console.warn("Failed to save ad timestamp", e)
        );
      }
    }
  }

  public getDebugInfo() {
    return {
      config: this.config,
      isInterstitialLoaded: this.isInterstitialLoaded,
      lastShownTimestamps: this.lastShownTimestamps,
      sessionImpressions: this.sessionImpressions,
    };
  }

  public __resetForTests() {
    this.isInterstitialLoaded = false;
    this.isInterstitialLoading = false;
    this.isAppOpenLoaded = false;
    this.isAppOpenLoading = false;
    this.lastShownTimestamps = {};
    this.sessionImpressions = { interstitial: 0, appOpen: 0 };
    this.config = null;
    this.interstitial = null;
    this.appOpenAd = null;
  }
}

export const adService = AdService.getInstance();
