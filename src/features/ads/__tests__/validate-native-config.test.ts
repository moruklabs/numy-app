import { getConfig } from "@expo/config";
import fs from "node:fs";
import path from "node:path";

describe("Native Configuration Integrity", () => {
  // Correct path resolution relative to this test file
  // Location: src/features/ads/__tests__/validate-native-config.test.ts
  const projectRoot = path.resolve(__dirname, "../../../../");
  // ios/Numy/Info.plist is where the plist lives in a standard Expo native project
  const infoPlistPath = path.join(projectRoot, "ios/Numy/Info.plist");

  test("resolved expo config should have react-native-google-mobile-ads plugin configured", () => {
    // Load the final resolved config (merging app.json and app.config.ts)
    const { exp } = getConfig(projectRoot);
    const plugins = exp.plugins || [];

    // Find the plugin. It can be a string (absolute path or name) or an array [name, config]
    const adsPlugin = plugins.find((p: any) => {
      const name = Array.isArray(p) ? p[0] : p;
      return (
        typeof name === "string" &&
        (name.includes("react-native-google-mobile-ads") ||
          name === "react-native-google-mobile-ads")
      );
    });

    if (!adsPlugin) {
      throw new Error("react-native-google-mobile-ads plugin is missing from resolved config");
    }

    // Verify config if it's the array format
    if (Array.isArray(adsPlugin)) {
      const config = adsPlugin[1];
      if (!config.iosAppId) {
        throw new Error("plugin configuration missing iosAppId");
      }
      if (!config.androidAppId) {
        throw new Error("plugin configuration missing androidAppId");
      }
    }
  });

  test("Info.plist should contain GADApplicationIdentifier if ios directory exists", () => {
    if (fs.existsSync(infoPlistPath)) {
      const infoPlistContent = fs.readFileSync(infoPlistPath, "utf8");

      const hasGadIdentifier = infoPlistContent.includes("GADApplicationIdentifier");

      if (!hasGadIdentifier) {
        // We throw an error to fail the test intentionally with a helpful message
        throw new Error(
          "GADApplicationIdentifier is missing from Info.plist. \n" +
            "This causes a SIGABRT crash at launch (GADApplicationVerifyPublisherInitializedCorrectly). \n" +
            'Likely cause: The "ios" directory is stale or "npx expo prebuild" has not been run. \n' +
            'Fix: Delete the "ios" folder or run "npx expo prebuild --platform ios --clean".'
        );
      }
      expect(hasGadIdentifier).toBe(true);
    } else {
      console.warn("Skipping Info.plist check: ios directory does not exist (CNG mode).");
    }
  });
});
