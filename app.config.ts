import { ConfigContext, ExpoConfig } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => {
  // Firebase configuration files (from root directory)
  const iosGoogleServicesFile = "./GoogleService-Info.plist";

  // App settings (synced with src/config/settings.ts)
  const appSettings = {
    name: "Numy",
    bundleId: "ai.moruk.numy",
    scheme: "numy",
    version: "1.0.0",
    ads: {
      iosAppId: "ca-app-pub-9347276405837051~7950500913",
      androidAppId: "ca-app-pub-9347276405837051~7950500913",
    },
    sentry: {
      dsn: "https://examplePublicKey@o0.ingest.sentry.io/0",
    },
  };

  const plugins = (config.plugins || []).map((plugin) => {
    if (Array.isArray(plugin) && plugin[0] === "@react-native-firebase/app") {
      return [
        "@react-native-firebase/app",
        {
          ios: { googleServicesFile: iosGoogleServicesFile },
        },
      ];
    }
    if (Array.isArray(plugin) && plugin[0] === "react-native-google-mobile-ads") {
      return [
        "react-native-google-mobile-ads",
        {
          androidAppId: appSettings.ads.androidAppId,
          iosAppId: appSettings.ads.iosAppId,
          userTrackingPermission:
            "This app uses ads to provide free access to calculator features.",
        },
      ];
    }
    return plugin;
  });

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
    plugins: [...plugins, require("./src/shared/config/src/plugins/withModularHeaders.js")] as any,
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
