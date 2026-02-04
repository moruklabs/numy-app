export default {
  // App Metadata
  name: "Numy",
  bundleId: "ai.moruk.numy",
  scheme: "numy",
  version: "1.0.1", // Syncs with package.json via CI

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
    // Default Pacing
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
    privacyPolicy: "https://moruk.link/ai.moruk.numy/privacy",
    termsOfService: "https://moruk.link/ai.moruk.numy/terms",
    cookiePolicy: "https://moruk.link/ai.moruk.numy/cookie",
    support: "https://moruk.link/ai.moruk.numy/support",
    review: "https://moruk.link/ai.moruk.numy/review",
    community: "https://moruk.link/ai.moruk.numy/community",
    moreApps: "https://moruk.link/app-store",
    share: "https://docs.expo.dev/versions/latest/sdk/sharing/", // Placeholder as per req? No, req says "Make Sure Share App exists -> https://docs.expo.dev/versions/latest/sdk/sharing/" which means USE the lib. The link itself is usually a store link. I will use a generic store link or just not put it in config if it's dynamic.
    // I will add a shareUrl for the content being shared.
    shareUrl: "https://apps.apple.com/app/id6474643146", // Placeholder ID, usually from config
  },
} as const;
