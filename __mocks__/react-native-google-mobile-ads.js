/* eslint-env jest */
module.exports = {
  __esModule: true,
  default: jest.fn(() => ({
    initialize: jest.fn(() => Promise.resolve()),
    setRequestConfiguration: jest.fn(() => Promise.resolve()),
  })),
  AdsConsent: {
    requestInfoUpdate: jest.fn(() => Promise.resolve()),
    loadAndShowConsentFormIfRequired: jest.fn(() =>
      Promise.resolve({ canRequestAds: true, status: "OBTAINED" })
    ),
    reset: jest.fn(() => Promise.resolve()),
    showPrivacyOptionsForm: jest.fn(() => Promise.resolve()),
  },
  InterstitialAd: {
    createForAdRequest: jest.fn(),
  },
  AppOpenAd: {
    createForAdRequest: jest.fn(),
  },
  TestIds: {
    INTERSTITIAL: "ca-app-pub-3940256099942544/1033173712",
    APP_OPEN: "ca-app-pub-3940256099942544/9257395921",
    BANNER: "ca-app-pub-3940256099942544/6300978111",
    REWARDED: "ca-app-pub-3940256099942544/5224354917",
  },
  AdEventType: {
    LOADED: "loaded",
    ERROR: "error",
    CLOSED: "closed",
    OPENED: "opened",
    CLICKED: "clicked",
  },
  MaxAdContentRating: {
    G: "G",
    PG: "PG",
    T: "T",
    MA: "MA",
  },
};
