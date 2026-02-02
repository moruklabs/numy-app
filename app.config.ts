import { ConfigContext, ExpoConfig } from "expo/config";
import withModularHeaders from "./src/shared/config/src/plugins/withModularHeaders";
import pkg from "./package.json";

const config = ({ config }: ConfigContext): ExpoConfig => {
  // Firebase configuration files (from root directory)
  const iosGoogleServicesFile = "./GoogleService-Info.plist";

  // App settings (synced with src/config/settings.ts)
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
      "react-native-google-mobile-ads",
      {
        androidAppId: appSettings.ads.androidAppId,
        iosAppId: appSettings.ads.iosAppId,
        userTrackingPermission: "This app uses ads to provide free access to calculator features.",
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
    },
    runtimeVersion: appSettings.version,
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
