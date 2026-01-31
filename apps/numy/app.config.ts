import { ConfigContext, ExpoConfig } from "expo/config";
import * as path from "node:path";

/**
 * Expo Native Configuration
 *
 * This file drives the native project settings and config plugins.
 * It consumes settings from src/config/settings.ts as the source of truth.
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  // Use absolute path for settings to avoid resolution issues in monorepo
  // @ts-ignore
  const settingsPath = path.resolve(__dirname, "src/config/settings.ts");
  const settings = require(settingsPath).default;

  const resolvePlugin = (name: string) => {
    try {
      return require.resolve(`${name}/app.plugin.js`);
    } catch {
      return name;
    }
  };

  return {
    ...config,
    name: settings.name,
    slug: "numy",
    version: settings.version,
    ios: {
      ...config.ios,
      bundleIdentifier: settings.bundleId,
      infoPlist: {
        ...config.ios?.infoPlist,
        GADApplicationIdentifier: settings.ads.iosAppId,
      },
    },
    android: {
      ...config.android,
      package: settings.bundleId,
    },
    plugins: [
      // @ts-ignore
      path.resolve(__dirname, "../../packages/config/src/plugins/withModularHeaders.js"),
      "expo-dev-client",
      "expo-router",
      [
        "expo-build-properties",
        {
          ios: {
            deploymentTarget: "15.1",
          },
        },
      ],
      [
        resolvePlugin("@react-native-firebase/app"),
        {
          ios: {
            googleServicesFile: "./GoogleService-Info.plist",
          },
          android: {
            googleServicesFile: "./google-services.json",
          },
        },
      ],
      resolvePlugin("@react-native-firebase/crashlytics"),
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#1a1a1a",
        },
      ],
      "expo-updates",
      [
        resolvePlugin("react-native-google-mobile-ads"),
        {
          androidAppId: settings.ads.androidAppId,
          iosAppId: settings.ads.iosAppId,
          userTrackingUsageDescription:
            "This identifier will be used to deliver personalized ads to you.",
        },
      ],
      [
        "expo-tracking-transparency",
        {
          userTrackingUsageDescription:
            "This identifier will be used to deliver personalized ads to you.",
        },
      ],
    ],
  };
};
