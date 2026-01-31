export default {
  // App Metadata
  name: "Numy",
  bundleId: "ai.moruk.numy",
  scheme: "numy",
  version: "1.0.0", // Syncs with package.json via CI

  // Feature Flags
  features: {
    darkMode: true,
    ads: true,
    analytics: true,
    crashlytics: true,
    sentry: true,
  },

  // Services & Credentials
  sentry: {
    dsn: "https://examplePublicKey@o0.ingest.sentry.io/0", // Placeholder
  },

  // AdMob Configuration (Source of Truth for IDs)
  ads: {
    iosAppId: "ca-app-pub-9347276405837051~7950500913",
    androidAppId: "ca-app-pub-9347276405837051~7950500913",
    // Unit IDs (Production)
    units: {
      ios: {
        appOpen: "ca-app-pub-9347276405837051/3715040109",
        interstitial: "ca-app-pub-9347276405837051/2888378946",
        banner: "",
        rewarded: "",
      },
      android: {
        appOpen: "",
        interstitial: "",
        banner: "",
        rewarded: "",
      },
    },
    // Default Pacing (Can be overridden by Remote Config)
    defaults: {
      appOpen: {
        frequency: 1,
        interval: 1, // Days
        intervalUnit: "days",
      },
      interstitial: {
        frequency: 1,
        interval: 1, // Hours
        intervalUnit: "hours",
      },
    },
  },

  // Support & Links
  links: {
    privacyPolicy: "https://moruk.link/com.moruk.numy/privacy",
    termsOfService: "https://moruk.link/com.moruk.numy/terms",
    support: "https://moruk.link/com.moruk.numy/support",
    review: "https://moruk.link/com.moruk.numy/review",
  },
} as const;
