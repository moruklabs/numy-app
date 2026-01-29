# @moruk/info

Device, network, system, and user information utilities for React Native apps. Provides comprehensive access to device capabilities, network status, system resources, and user preferences.

## Installation

This package is part of the moruk monorepo and is automatically available to all apps in the workspace.

```bash
# In your app's package.json dependencies
{
  "dependencies": {
    "@moruk/info": "1.0.0"
  }
}
```

## Usage

### Device Information

Get device-specific information:

```tsx
import { getDeviceInfo } from "@moruk/info";

const deviceInfo = await getDeviceInfo();
console.log("Device:", deviceInfo.brand, deviceInfo.modelName);
console.log("OS:", deviceInfo.osName, deviceInfo.osVersion);
console.log("Device ID:", deviceInfo.deviceId);
```

### Network Information

Monitor network connectivity:

```tsx
import { getNetworkInfo } from "@moruk/info";

const networkInfo = await getNetworkInfo();
console.log("Connected:", networkInfo.isConnected);
console.log("Connection type:", networkInfo.type); // wifi, cellular, etc.
console.log("IP Address:", networkInfo.details.ipAddress);
```

### System Information

Access system-level information:

```tsx
import { getSystemInfo, getAppInfo } from "@moruk/info";

// App information
const appInfo = await getAppInfo();
console.log("App version:", appInfo.version);
console.log("Build number:", appInfo.buildNumber);
console.log("Bundle ID:", appInfo.applicationId);

// System information (includes app, battery, cellular, resources)
const systemInfo = await getSystemInfo();
console.log("Battery level:", systemInfo.battery.level);
console.log("Charging:", systemInfo.battery.state === "charging");
```

### User Information

Manage user preferences and session data:

```tsx
import {
  getUserPreferences,
  setUserPreferences,
  getUserSession,
  getLocalizationInfo,
  getUserOrCreateUserId,
} from "@moruk/info";

// Get or create user ID
const userId = await getUserOrCreateUserId();

// User preferences
const prefs = await getUserPreferences();
console.log("Theme:", prefs.theme);
console.log("Language:", prefs.language);

// Update preferences
await setUserPreferences({
  theme: "dark",
  language: "en",
  notificationsEnabled: true,
});

// Session info
const session = await getUserSession();
console.log("Session ID:", session.sessionId);
console.log("Start time:", session.startTime);

// Localization
const locale = await getLocalizationInfo();
console.log("Locale:", locale.locale);
console.log("Timezone:", locale.timezone);
```

## API

### Device Info

##### `getDeviceInfo(): Promise<DeviceInfo>`

Get comprehensive device information.

**Returns:**

```typescript
interface DeviceInfo {
  brand: string; // e.g., "Apple"
  manufacturer: string; // e.g., "Apple"
  modelName: string; // e.g., "iPhone 14 Pro"
  modelId: string; // e.g., "iPhone15,2"
  deviceName: string; // User-set device name
  deviceId: string; // Unique device identifier
  osName: string; // e.g., "iOS"
  osVersion: string; // e.g., "16.4"
  osBuildId: string; // Build identifier
  isDevice: boolean; // true if physical device
  deviceType: number; // Device type enum
  totalMemory: number; // Total RAM in bytes
}
```

### Network Info

##### `getNetworkInfo(): Promise<NetworkInfo>`

Get current network connection status and details.

**Returns:**

```typescript
interface NetworkInfo {
  type: string; // "wifi", "cellular", "ethernet", etc.
  isConnected: boolean; // Is connected to any network
  isInternetReachable: boolean; // Can reach the internet
  details: {
    isConnectionExpensive: boolean;
    ipAddress?: string;
    subnet?: string;
    cellular?: {
      carrier?: string;
      generation?: string; // "2g", "3g", "4g", "5g"
    };
  };
}
```

### System Info

##### `getSystemInfo(): Promise<SystemInfo>`

Get complete system information including app, battery, cellular, and resources.

**Returns:**

```typescript
interface SystemInfo {
  app: AppInfo;
  battery: BatteryInfo;
  cellular: CellularInfo;
  resources: SystemResources;
}
```

##### `getAppInfo(): Promise<AppInfo>`

Get application-specific information.

**Returns:**

```typescript
interface AppInfo {
  applicationId: string; // Bundle identifier
  applicationName: string; // App display name
  version: string; // Version string
  buildNumber: string; // Build number
  nativeAppVersion: string; // Native version
  nativeBuildVersion: string; // Native build
  installTime: number; // Install timestamp
}
```

### User Info

##### `getUserOrCreateUserId(): Promise<string>`

Get existing user ID or create a new one.

**Returns:**

- `Promise<string>` - Unique user identifier

##### `getUserPreferences(): Promise<UserPreferences>`

Get user preferences from storage.

**Returns:**

```typescript
interface UserPreferences {
  theme?: "light" | "dark";
  language?: string;
  notificationsEnabled?: boolean;
  [key: string]: any; // Extensible
}
```

##### `setUserPreferences(preferences: Partial<UserPreferences>): Promise<void>`

Update user preferences.

**Parameters:**

- `preferences: Partial<UserPreferences>` - Preferences to update

##### `getUserSession(): Promise<UserSession>`

Get current user session information.

**Returns:**

```typescript
interface UserSession {
  sessionId: string; // Unique session ID
  userId: string; // User ID
  startTime: string; // ISO 8601 timestamp
  deviceInfo: DeviceInfo; // Device information
  appInfo: AppInfo; // App information
}
```

##### `getLocalizationInfo(): Promise<LocalizationInfo>`

Get device localization settings.

**Returns:**

```typescript
interface LocalizationInfo {
  locale: string; // e.g., "en-US"
  locales: string[]; // Preferred locales
  timezone: string; // e.g., "America/New_York"
  region: string; // e.g., "US"
  currency: string; // e.g., "USD"
}
```

##### `getDeviceLanguage(): string`

Get the device's primary language code.

**Returns:**

- `string` - Language code (e.g., "en", "es", "fr")

##### `isLanguageSupported(languageCode: string, supportedLanguages: string[]): boolean`

Check if a language is supported.

**Parameters:**

- `languageCode: string` - Language code to check
- `supportedLanguages: string[]` - List of supported languages

**Returns:**

- `boolean` - True if language is supported

## Type Definitions

### BatteryInfo

```typescript
interface BatteryInfo {
  level: number; // 0.0 to 1.0
  state: "unknown" | "unplugged" | "charging" | "full";
  lowPowerMode: boolean;
}
```

### CellularInfo

```typescript
interface CellularInfo {
  carrier?: string;
  isoCountryCode?: string;
  mobileCountryCode?: string;
  mobileNetworkCode?: string;
}
```

### SystemResources

```typescript
interface SystemResources {
  totalMemory: number; // Total RAM in bytes
  // Additional resource info
}
```

## Example: Complete Device Info Screen

```tsx
import React, { useEffect, useState } from "react";
import { View, Text, ScrollView } from "react-native";
import {
  getDeviceInfo,
  getNetworkInfo,
  getSystemInfo,
  getUserSession,
  getLocalizationInfo,
} from "@moruk/info";
import type { DeviceInfo, NetworkInfo, SystemInfo } from "@moruk/info";

export function DeviceInfoScreen() {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);

  useEffect(() => {
    async function loadInfo() {
      const device = await getDeviceInfo();
      const network = await getNetworkInfo();
      const system = await getSystemInfo();
      const session = await getUserSession();
      const locale = await getLocalizationInfo();

      setDeviceInfo(device);
      setNetworkInfo(network);
      setSystemInfo(system);

      console.log("Session:", session);
      console.log("Locale:", locale);
    }

    loadInfo();
  }, []);

  return (
    <ScrollView style={{ padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: "bold" }}>Device Info</Text>
      {deviceInfo && (
        <View>
          <Text>Brand: {deviceInfo.brand}</Text>
          <Text>Model: {deviceInfo.modelName}</Text>
          <Text>
            OS: {deviceInfo.osName} {deviceInfo.osVersion}
          </Text>
          <Text>Device ID: {deviceInfo.deviceId}</Text>
        </View>
      )}

      <Text style={{ fontSize: 24, fontWeight: "bold", marginTop: 20 }}>Network Info</Text>
      {networkInfo && (
        <View>
          <Text>Type: {networkInfo.type}</Text>
          <Text>Connected: {networkInfo.isConnected ? "Yes" : "No"}</Text>
          <Text>IP: {networkInfo.details.ipAddress}</Text>
        </View>
      )}

      <Text style={{ fontSize: 24, fontWeight: "bold", marginTop: 20 }}>System Info</Text>
      {systemInfo && (
        <View>
          <Text>
            App: {systemInfo.app.applicationName} v{systemInfo.app.version}
          </Text>
          <Text>Battery: {(systemInfo.battery.level * 100).toFixed(0)}%</Text>
          <Text>Charging: {systemInfo.battery.state === "charging" ? "Yes" : "No"}</Text>
        </View>
      )}
    </ScrollView>
  );
}
```

## Dependencies

- `@moruk/storage` - For persisting user data
- `@react-native-community/netinfo` - Network information
- `expo` - Expo framework
- `expo-application` - Application information
- `expo-battery` - Battery status
- `expo-constants` - Device constants
- `expo-crypto` - Cryptographic functions
- `expo-device` - Device information
- `expo-localization` - Localization data
- `react-native` - React Native framework
