# @moruk/event-tracking

Event tracking hooks and utilities for user engagement analytics. Track returning users and their usage patterns.

## Installation

This package is part of the moruk monorepo and is automatically available to all apps in the workspace.

```bash
# In your app's package.json dependencies
{
  "dependencies": {
    "@moruk/event-tracking": "1.0.0"
  }
}
```

## Usage

### Track Returning Users

The `useReturnUserTracking` hook automatically tracks when users return to your app:

```tsx
import { useReturnUserTracking } from "@moruk/event-tracking";

export function App() {
  // Automatically tracks user returns and days since last visit
  useReturnUserTracking((eventName, properties) => {
    console.log(`Event: ${eventName}`, properties);
  });

  return <YourAppContent />;
}
```

### With Custom Event Tracking

Integrate with your analytics service:

```tsx
import { useReturnUserTracking } from "@moruk/event-tracking";
import analytics from "@react-native-firebase/analytics";

export function App() {
  useReturnUserTracking(async (eventName, properties) => {
    // Send to Firebase Analytics
    await analytics().logEvent(eventName, properties);
  });

  return <YourAppContent />;
}
```

## API

### useReturnUserTracking

Hook that tracks user return behavior and reports analytics events.

**Signature:**

```typescript
function useReturnUserTracking(track: TrackFunction): void;
```

**Parameters:**

- `track: TrackFunction` - Callback function to handle analytics events

**Events Tracked:**

- `user_returned` - Fired when a user returns after being away
  - `days_since_last_visit: number` - Days since the user's last visit

**How It Works:**

1. On mount, checks the last visit timestamp from storage
2. If this is a return visit (previous timestamp exists), calculates days since last visit
3. Fires `user_returned` event with the number of days
4. Updates the last visit timestamp to current time
5. Cleans up on unmount

## Types

### TrackFunction

Function type for the tracking callback:

```typescript
type TrackFunction = (eventName: string, properties?: Record<string, any>) => void | Promise<void>;
```

**Parameters:**

- `eventName: string` - Name of the analytics event
- `properties?: Record<string, any>` - Optional event properties/metadata

## Example: Complete Implementation

```tsx
import React from "react";
import { useReturnUserTracking } from "@moruk/event-tracking";
import analytics from "@react-native-firebase/analytics";

export default function App() {
  // Track returning users with Firebase Analytics
  useReturnUserTracking(async (eventName, properties) => {
    try {
      await analytics().logEvent(eventName, properties);
      console.log(`Tracked ${eventName}:`, properties);
    } catch (error) {
      console.error("Failed to track event:", error);
    }
  });

  return (
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>
  );
}
```

## Storage

This package uses `@moruk/storage` internally to persist the last visit timestamp. The key used is:

- `lastVisitTimestamp` - ISO 8601 timestamp of the user's last visit

## Dependencies

- `@moruk/storage` - For persisting visit timestamps
- `react` - For hooks
- `react-native` - For useEffect hook
