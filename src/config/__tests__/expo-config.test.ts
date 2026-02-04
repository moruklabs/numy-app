import { getConfig } from "@expo/config";
import path from "node:path";

describe("Expo Configuration", () => {
  const projectRoot = path.resolve(__dirname, "../../../");
  let config: ReturnType<typeof getConfig>["exp"];

  beforeAll(() => {
    const { exp } = getConfig(projectRoot);
    config = exp;
  });

  describe("Runtime Version (expo-updates)", () => {
    test("should have runtimeVersion defined", () => {
      expect(config.runtimeVersion).toBeDefined();
      expect(typeof config.runtimeVersion).toBe("string");
    });

    test("runtimeVersion should not be empty", () => {
      expect(config.runtimeVersion).not.toBe("");
    });

    test("runtimeVersion should match a valid semver pattern", () => {
      const semverPattern = /^\d+\.\d+\.\d+$/;
      expect(config.runtimeVersion).toMatch(semverPattern);
    });
  });

  describe("Tracking Transparency", () => {
    test("should have expo-tracking-transparency plugin configured", () => {
      const plugins = config.plugins || [];
      const trackingPlugin = plugins.find((p: unknown) => {
        const name = Array.isArray(p) ? p[0] : p;
        return typeof name === "string" && name.includes("expo-tracking-transparency");
      });

      expect(trackingPlugin).toBeDefined();
    });

    test("expo-tracking-transparency should have userTrackingPermission message", () => {
      const plugins = config.plugins || [];
      const trackingPlugin = plugins.find((p: unknown) => {
        const name = Array.isArray(p) ? p[0] : p;
        return typeof name === "string" && name.includes("expo-tracking-transparency");
      });

      if (Array.isArray(trackingPlugin)) {
        const pluginConfig = trackingPlugin[1] as { userTrackingPermission?: string };
        expect(pluginConfig.userTrackingPermission).toBeDefined();
        expect(pluginConfig.userTrackingPermission?.length).toBeGreaterThan(10);
      } else {
        // Plugin without config array is acceptable - uses default message
        expect(trackingPlugin).toBeDefined();
      }
    });

    test("react-native-google-mobile-ads should have userTrackingPermission", () => {
      const plugins = config.plugins || [];
      const adsPlugin = plugins.find((p: unknown) => {
        const name = Array.isArray(p) ? p[0] : p;
        return typeof name === "string" && name.includes("react-native-google-mobile-ads");
      });

      expect(adsPlugin).toBeDefined();

      if (Array.isArray(adsPlugin)) {
        const pluginConfig = adsPlugin[1] as { userTrackingPermission?: string };
        expect(pluginConfig.userTrackingPermission).toBeDefined();
      }
    });
  });

  describe("iOS Configuration", () => {
    test("should have iOS bundle identifier", () => {
      expect(config.ios?.bundleIdentifier).toBeDefined();
      expect(config.ios?.bundleIdentifier).toMatch(/^[a-z]+\.[a-z]+\.[a-z]+$/i);
    });

    test("should have infoPlist with NSUserTrackingUsageDescription via plugins", () => {
      // The NSUserTrackingUsageDescription is set via the expo-tracking-transparency plugin
      // We verify the plugin is properly configured (tested above)
      // The actual plist key is generated during prebuild
      const plugins = config.plugins || [];
      const hasTrackingPlugin = plugins.some((p: unknown) => {
        const name = Array.isArray(p) ? p[0] : p;
        return typeof name === "string" && name.includes("expo-tracking-transparency");
      });
      expect(hasTrackingPlugin).toBe(true);
    });
  });

  describe("Version Consistency", () => {
    test("version should be defined", () => {
      expect(config.version).toBeDefined();
    });

    test("runtimeVersion should match app version", () => {
      expect(config.runtimeVersion).toBe(config.version);
    });
  });

  describe("Updates Configuration", () => {
    test("should have updates configuration defined", () => {
      expect(config.updates).toBeDefined();
    });

    test("updates should be enabled", () => {
      expect(config.updates?.enabled).toBe(true);
    });

    test("fallbackToCacheTimeout should be defined", () => {
      expect(config.updates?.fallbackToCacheTimeout).toBeDefined();
      expect(typeof config.updates?.fallbackToCacheTimeout).toBe("number");
    });
  });
});
