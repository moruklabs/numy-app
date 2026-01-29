/**
 * @moruk/info
 *
 * Device, network, system, and user information utilities.
 */

// Device Info
export { getDeviceInfo } from "./deviceInfo";
export type { DeviceInfo } from "./deviceInfo";

// Network Info
export { getNetworkInfo } from "./networkInfo";
export type { NetworkInfo } from "./networkInfo";

// System Info
export { getAppInfo, getSystemInfo } from "./systemInfo";
export type { SystemInfo, AppInfo, BatteryInfo, CellularInfo, SystemResources } from "./systemInfo";

// User Info
export {
  getUserPreferences,
  setUserPreferences,
  getUserSession,
  getLocalizationInfo,
  getDeviceLanguage,
  isLanguageSupported,
  getUserOrCreateUserId,
} from "./userInfo";
export type { UserPreferences, UserSession, LocalizationInfo } from "./userInfo";
