jest.mock("react-native-google-mobile-ads", () => {
  const mockMobileAds = {
    initialize: jest.fn(() => Promise.resolve()),
    setRequestConfiguration: jest.fn(),
  };
  return {
    __esModule: true,
    default: jest.fn(() => mockMobileAds),
    AdsConsent: {
      requestInfoUpdate: jest.fn(() => Promise.resolve()),
      loadAndShowConsentFormIfRequired: jest.fn(() =>
        Promise.resolve({ canRequestAds: true, status: "OBTAINED" })
      ),
      getStatus: jest.fn(() => Promise.resolve("OBTAINED")),
      showForm: jest.fn(),
      reset: jest.fn(),
    },
    AdsConsentStatus: {
      REQUIRED: "REQUIRED",
      NOT_REQUIRED: "NOT_REQUIRED",
      OBTAINED: "OBTAINED",
      UNKNOWN: "UNKNOWN",
    },
    TestIds: {
      APP_OPEN: "ca-app-pub-3940256099942544/3419835294",
      INTERSTITIAL: "ca-app-pub-3940256099942544/1033173712",
      BANNER: "ca-app-pub-3940256099942544/6300978111",
    },
    InterstitialAd: {
      createForAdRequest: jest.fn(() => ({
        load: jest.fn(),
        show: jest.fn(),
        addAdEventListener: jest.fn((event, callback) => {
          // Mock event firing if needed, or return unsubscribe
          return jest.fn();
        }),
      })),
    },
    AdEventType: {
      LOADED: "loaded",
      OPENED: "opened",
      CLOSED: "closed",
      ERROR: "error",
      CLICKED: "clicked",
    },
    BannerAd: () => null,
    BannerAdSize: {
      BANNER: "BANNER",
    },
    MaxAdContentRating: {
      PG: "PG",
    },
  };
});

jest.mock("expo-tracking-transparency", () => ({
  requestTrackingPermissionsAsync: jest.fn(() => Promise.resolve({ status: "granted" })),
  getTrackingPermissionsAsync: jest.fn(() => Promise.resolve({ status: "granted" })),
}));
