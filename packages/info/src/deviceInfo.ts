import { Dimensions, Platform } from "react-native";
import * as Device from "expo-device";
import Constants from "expo-constants";
import * as Application from "expo-application";
import { logger } from "@moruk/logger";

export interface DeviceInfo {
  id: string;
  platform: string;
  osVersion: string;
  deviceName?: string;
  deviceModel?: string;
  deviceType?: number;
  isDevice: boolean;
  screenWidth: number;
  screenHeight: number;
  pixelRatio: number;
  fontScale: number;
  appVersion: string;
  buildNumber?: string;
  expoVersion?: string;
  isTablet: boolean;
  isLandscape: boolean;
}

const getDeviceUniqueId = async (): Promise<string> => {
  try {
    // Try to get Android ID first (Android only)
    if (
      Platform.OS === "android" &&
      Application &&
      typeof Application.getAndroidId === "function"
    ) {
      const androidId = Application.getAndroidId();
      if (androidId) return androidId;
    }

    // Try to get iOS identifier for vendor (iOS only)
    if (
      Platform.OS === "ios" &&
      Application &&
      typeof Application.getIosIdForVendorAsync === "function"
    ) {
      const iosId = await Application.getIosIdForVendorAsync();
      if (iosId) return iosId;
    }

    // Fallback: generate a unique ID based on device characteristics
    const deviceName = Device?.deviceName || "unknown";
    const modelName = Device?.modelName || "unknown";
    const osVersion = Platform.Version?.toString() || "unknown";
    const platform = Platform.OS;

    // Create a hash-like string from device characteristics
    const deviceString = `${platform}-${deviceName}-${modelName}-${osVersion}`;
    const hash = deviceString.split("").reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);

    return `device_${Math.abs(hash)}_${Date.now()}`;
  } catch (error) {
    logger.warn("Error getting device unique ID:", error);
    // Ultimate fallback: random ID with timestamp
    return `device_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;
  }
};

export const getDeviceInfo = async (): Promise<DeviceInfo> => {
  try {
    const { width, height } = Dimensions.get("window");
    const { fontScale } = Dimensions.get("window");
    const uniqueId = await getDeviceUniqueId();

    return {
      id: uniqueId,
      platform: Platform.OS,
      osVersion: Platform.Version?.toString() || "unknown",
      deviceName: Device?.deviceName || undefined,
      deviceModel: Device?.modelName || undefined,
      deviceType: Device?.deviceType || undefined,
      isDevice: Device?.isDevice ?? true,
      screenWidth: width,
      screenHeight: height,
      pixelRatio: Dimensions.get("window").scale,
      fontScale,
      appVersion: Constants.expoConfig?.version || "1.0.0",
      buildNumber:
        Constants.expoConfig?.ios?.buildNumber ||
        Constants.expoConfig?.android?.versionCode?.toString(),
      expoVersion: Constants.expoVersion || undefined,
      isTablet: Platform.OS === "ios" && Platform.isPad,
      isLandscape: width > height,
    };
  } catch (error) {
    logger.warn("Error getting device info:", error);
    return {
      id: `device_fallback_${Date.now()}`,
      platform: "unknown",
      osVersion: "unknown",
      isDevice: true,
      screenWidth: 375,
      screenHeight: 667,
      pixelRatio: 2,
      fontScale: 1,
      appVersion: "1.0.0",
      isTablet: false,
      isLandscape: false,
    };
  }
};
