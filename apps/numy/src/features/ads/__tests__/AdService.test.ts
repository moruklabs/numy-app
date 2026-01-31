import { AdConfiguration } from "@/shared/config/ads-config";
import mobileAds, { InterstitialAd } from "react-native-google-mobile-ads";
import { adService } from "../model/AdService";

import AsyncStorage from "@react-native-async-storage/async-storage";

// Setup global spies
const mockLoad = jest.fn();
const mockShow = jest.fn();
const mockAddEventListener = jest.fn();

(InterstitialAd.createForAdRequest as jest.Mock).mockReturnValue({
  load: mockLoad,
  show: mockShow,
  addAdEventListener: mockAddEventListener,
  // Add loaded boolean if checked by service
});

// Mock AsyncStorage properly for default export
jest.mock("@react-native-async-storage/async-storage", () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
  },
}));

const mockConfig: AdConfiguration = {
  interstitial: {
    enabled: true,
    frequency: 3,
    intervalMs: 1000 * 60 * 60, // 1 hour
    adUnitId: "test-interstitial",
    appId: "test-app",
    maxImpressionsPerSession: 5,
  },
  appOpen: {
    enabled: true,
    frequency: 1,
    intervalMs: 86400000,
    adUnitId: "test-app-open",
    appId: "test-app",
    maxImpressionsPerSession: 1,
  },
  storageKeys: {
    interstitialLastShown: "key1",
    appOpenLastShown: "key2",
  },
};

describe("AdService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    adService.__resetForTests();
  });

  it("should initialize mobileAds and load storage", async () => {
    await adService.initialize(mockConfig);
    expect(mobileAds().initialize).toHaveBeenCalled();
    expect(AsyncStorage.getItem).toHaveBeenCalledWith("key1");
  });

  it("should load interstitial when requested and not capped", async () => {
    await adService.initialize(mockConfig);

    await adService.loadInterstitial();

    expect(InterstitialAd.createForAdRequest).toHaveBeenCalledWith(
      "ca-app-pub-3940256099942544/1033173712"
    );
    expect(mockLoad).toHaveBeenCalled();
  });

  it("should NOT load interstitial if disabled in config", async () => {
    const disabledConfig = {
      ...mockConfig,
      interstitial: { ...mockConfig.interstitial, enabled: false },
    };
    await adService.initialize(disabledConfig);

    await adService.loadInterstitial();

    expect(InterstitialAd.createForAdRequest).not.toHaveBeenCalled();
  });

  it("should enforce frequency capping from storage", async () => {
    // Mock storage to say ad was shown 1 minute ago (interval is 1 hour)
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(Date.now().toString());

    await adService.initialize(mockConfig);
    await adService.loadInterstitial();

    expect(mockLoad).not.toHaveBeenCalled();
  });

  it("should save timestamp when ad is closed", async () => {
    await adService.initialize(mockConfig);
    await adService.loadInterstitial();

    // Trigger loaded
    const onLoaded = mockAddEventListener.mock.calls.find((c) => c[0] === "loaded")![1];
    onLoaded();

    // Trigger closed
    const onClosed = mockAddEventListener.mock.calls.find((c) => c[0] === "closed")![1];
    onClosed();

    expect(AsyncStorage.setItem).toHaveBeenCalledWith("key1", expect.any(String));
  });
});
