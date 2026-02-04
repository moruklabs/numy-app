import { ConfigContext, ExpoConfig } from "expo/config";
import pkg from "./package.json";
import withModularHeaders from "./src/shared/config/src/plugins/withModularHeaders";
const config = ({ config }: ConfigContext): ExpoConfig => {
  // Firebase configuration files (from root directory)
  const iosGoogleServicesFile = "./GoogleService-Info.plist";

  // App settings (synced manualy with src/config/settings.ts due to resolution issues)
  const appSettings = {
    name: "Numy",
    bundleId: "ai.moruk.numy",
    scheme: "numy",
    version: pkg.version,
    ads: {
      iosAppId: "ca-app-pub-9347276405837051~7950500913",
      androidAppId: "ca-app-pub-9347276405837051~7950500913",
    },
    sentry: {
      dsn: "https://fc334c47ed5d1e6b4be2302e4b5bd93c@o4510417138352128.ingest.de.sentry.io/4510812305358928",
    },
  };

  const plugins = [
    [
      "expo-tracking-transparency",
      {
        userTrackingPermission: "This identifier will be used to deliver personalized ads to you.",
      },
    ],
    [
      "react-native-google-mobile-ads",
      {
        androidAppId: appSettings.ads.androidAppId,
        iosAppId: appSettings.ads.iosAppId,
        userTrackingPermission: "This identifier will be used to deliver personalized ads to you.",
      },
    ],
    [
      "@sentry/react-native/expo",
      {
        url: "https://sentry.io/",
        project: "numy",
        organization: "moruk",
      },
    ],
  ];

  return {
    ...config,
    name: appSettings.name,
    slug: appSettings.scheme,
    version: appSettings.version,
    ios: {
      ...config.ios,
      bundleIdentifier: appSettings.bundleId,
      googleServicesFile: iosGoogleServicesFile,
      infoPlist: {
        ...config.ios?.infoPlist,
      },
    },
    runtimeVersion: appSettings.version,
    updates: {
      enabled: true,
      fallbackToCacheTimeout: 0,
    },
    plugins: [...plugins, withModularHeaders] as any,
    extra: {
      ...config.extra,
      SENTRY_DSN: appSettings.sentry.dsn,
      sentry: {
        organization: "moruk",
        project: "numy",
      },
    },
  } as ExpoConfig;
};

export default config;
