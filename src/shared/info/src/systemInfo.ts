import * as Application from "expo-application";
import * as Battery from "expo-battery";
import Constants from "expo-constants";
import { logger } from "@moruk/logger";

export interface SystemInfo {
  appInfo: AppInfo;
  batteryInfo?: BatteryInfo;
  cellularInfo?: CellularInfo;
  systemResources?: SystemResources;
}

export interface AppInfo {
  name: string;
  version: string;
  buildNumber?: string;
  bundleId: string;
  installationTime?: Date;
  lastUpdateTime?: Date;
  isDebug: boolean;
  isExpoGo: boolean;
}

export interface BatteryInfo {
  batteryLevel: number;
  batteryState: Battery.BatteryState;
  isLowPowerModeEnabled?: boolean;
  powerSaveMode?: boolean;
}

export interface CellularInfo {
  allowsVoip?: boolean;
  carrier?: string;
  isoCountryCode?: string;
  mobileCountryCode?: string;
  mobileNetworkCode?: string;
}

export interface SystemResources {
  availableMemory?: number;
  totalMemory?: number;
  usedMemory?: number;
  freeSpace?: number;
  totalSpace?: number;
}

export const getAppInfo = async (): Promise<AppInfo> => {
  try {
    let installationTime: number | null = null;
    let lastUpdateTime: number | null = null;

    // Safely get installation time
    try {
      if (Application && typeof Application.getInstallationTimeAsync === "function") {
        const installTime = await Application.getInstallationTimeAsync();
        installationTime = installTime?.getTime() || null;
      }
    } catch {
      // Ignore if not available on platform
    }

    // Safely get last update time
    try {
      if (Application && typeof Application.getLastUpdateTimeAsync === "function") {
        const updateTime = await Application.getLastUpdateTimeAsync();
        lastUpdateTime = updateTime?.getTime() || null;
      }
    } catch {
      // Ignore if not available on platform
    }

    return {
      name: Application?.applicationName || Constants.expoConfig?.name || "Unknown",
      version: Application?.nativeApplicationVersion || Constants.expoConfig?.version || "1.0.0",
      buildNumber:
        Application?.nativeBuildVersion ||
        Constants.expoConfig?.ios?.buildNumber ||
        Constants.expoConfig?.android?.versionCode?.toString(),
      bundleId:
        Application?.applicationId ||
        Constants.expoConfig?.ios?.bundleIdentifier ||
        Constants.expoConfig?.android?.package ||
        "com.unknown.app",
      installationTime: installationTime ? new Date(installationTime) : undefined,
      lastUpdateTime: lastUpdateTime ? new Date(lastUpdateTime) : undefined,
      isDebug: __DEV__,
      isExpoGo: Constants.appOwnership === "expo",
    };
  } catch (error) {
    logger.warn("Error getting app info:", error);
    return {
      name: "Unknown",
      version: "1.0.0",
      bundleId: "com.unknown.app",
      isDebug: __DEV__,
      isExpoGo: Constants.appOwnership === "expo",
    };
  }
};

export const getSystemInfo = async (): Promise<SystemInfo> => {
  const [appInfo] = await Promise.all([getAppInfo()]);

  return {
    appInfo,
  };
};
