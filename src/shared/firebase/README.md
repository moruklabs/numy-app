# @moruk/firebase

Firebase services integration for moruk apps. Provides centralized access to Firebase Analytics, Crashlytics, and Remote Config.

## Installation

This package is part of the moruk monorepo and is automatically available to all apps in the workspace.

```bash
# In your app's package.json dependencies
{
  "dependencies": {
    "@moruk/firebase": "1.0.0"
  }
}
```

## Features

- **Crashlytics** - Error and crash reporting
- **Analytics** - User analytics and event tracking (configuration)
- **Remote Config** - Feature flags and remote configuration (configuration)

## Usage

### Crashlytics

Report errors and crashes to Firebase Crashlytics:

```tsx
import { getCrashlyticsService } from "@moruk/firebase";

// Get the singleton instance
const crashlytics = getCrashlyticsService();

// Record an error
try {
  throw new Error("Something went wrong");
} catch (error) {
  await crashlytics.recordError(error as Error, "MyComponent");
}

// Log a message
crashlytics.log("User performed action X");

// Set user identifier
crashlytics.setUserId("user123");

// Set custom attributes
crashlytics.setAttribute("screen", "HomeScreen");
crashlytics.setAttributes({
  environment: "production",
  version: "1.0.0",
});
```

### Configuration

Check if Firebase services are enabled:

```tsx
import {
  FIREBASE_CRASHLYTICS_ENABLED,
  FIREBASE_ANALYTICS_ENABLED,
  FIREBASE_REMOTE_CONFIG_ENABLED,
} from "@moruk/firebase";

if (FIREBASE_CRASHLYTICS_ENABLED) {
  // Crashlytics is enabled
}
```

## API

### CrashlyticsService

Singleton service for Firebase Crashlytics integration.

#### Methods

##### `recordError(error: Error, context?: string): Promise<void>`

Record a non-fatal error to Crashlytics.

**Parameters:**

- `error: Error` - The error to record
- `context?: string` - Optional context (e.g., component name, screen name)

**Example:**

```tsx
try {
  await riskyOperation();
} catch (error) {
  await crashlytics.recordError(error as Error, "PaymentScreen");
}
```

##### `log(message: string): void`

Log a message to Crashlytics. Logs are included in crash reports.

**Parameters:**

- `message: string` - The message to log

**Example:**

```tsx
crashlytics.log("User clicked checkout button");
```

##### `setUserId(userId: string): Promise<void>`

Set the user identifier for crash reports.

**Parameters:**

- `userId: string` - The user ID

**Example:**

```tsx
await crashlytics.setUserId("user-12345");
```

##### `setAttribute(key: string, value: string): Promise<void>`

Set a custom attribute (max 64 attributes).

**Parameters:**

- `key: string` - Attribute key
- `value: string` - Attribute value

**Example:**

```tsx
await crashlytics.setAttribute("subscription_tier", "premium");
```

##### `setAttributes(attributes: Record<string, string>): Promise<void>`

Set multiple custom attributes at once.

**Parameters:**

- `attributes: Record<string, string>` - Key-value pairs of attributes

**Example:**

```tsx
await crashlytics.setAttributes({
  screen: "ProfileScreen",
  experiment: "variant_a",
  platform: "ios",
});
```

##### `checkForUnsentReports(): Promise<boolean>`

Check if there are unsent crash reports.

**Returns:**

- `Promise<boolean>` - True if there are unsent reports

##### `sendUnsentReports(): Promise<void>`

Manually send any unsent crash reports.

##### `deleteUnsentReports(): Promise<void>`

Delete any unsent crash reports.

##### `didCrashOnPreviousExecution(): Promise<boolean>`

Check if the app crashed during the previous execution.

**Returns:**

- `Promise<boolean>` - True if the app crashed previously

##### `setCrashlyticsCollectionEnabled(enabled: boolean): Promise<void>`

Enable or disable Crashlytics data collection.

**Parameters:**

- `enabled: boolean` - Whether to enable collection

### Helper Functions

##### `getCrashlyticsService(): CrashlyticsService`

Get the singleton Crashlytics service instance.

**Returns:**

- `CrashlyticsService` - The service instance

##### `resetCrashlyticsService(): void`

Reset the singleton instance (useful for testing).

### Configuration Constants

- `FIREBASE_CRASHLYTICS_ENABLED: boolean` - Whether Crashlytics is enabled
- `FIREBASE_ANALYTICS_ENABLED: boolean` - Whether Analytics is enabled
- `FIREBASE_REMOTE_CONFIG_ENABLED: boolean` - Whether Remote Config is enabled

## Types

### AnalyticsConfig

Configuration for Firebase Analytics:

```typescript
interface AnalyticsConfig {
  enabled: boolean;
}
```

## Example: Complete Setup

```tsx
import { useEffect } from "react";
import { getCrashlyticsService, FIREBASE_CRASHLYTICS_ENABLED } from "@moruk/firebase";

export default function App() {
  useEffect(() => {
    if (FIREBASE_CRASHLYTICS_ENABLED) {
      const crashlytics = getCrashlyticsService();

      // Set up error boundary
      ErrorUtils.setGlobalHandler(async (error, isFatal) => {
        await crashlytics.recordError(error, "GlobalErrorHandler");
        if (isFatal) {
          // Handle fatal error
        }
      });

      // Check for previous crashes
      crashlytics.didCrashOnPreviousExecution().then((didCrash) => {
        if (didCrash) {
          console.log("App crashed on previous execution");
        }
      });
    }
  }, []);

  return <YourApp />;
}
```

## Dependencies

- `@react-native-firebase/app` - Firebase core
- `@react-native-firebase/analytics` - Firebase Analytics
- `@react-native-firebase/crashlytics` - Firebase Crashlytics
- `@react-native-firebase/remote-config` - Firebase Remote Config
- `expo` - Expo framework
- `react-native` - React Native framework

## Testing

The package includes Jest configuration for testing. Run tests with:

```bash
yarn test
```
