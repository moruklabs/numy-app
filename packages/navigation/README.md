# @moruk/navigation

Navigation utilities and service for Expo Router-based React Native apps. Provides a centralized navigation service with type-safe route navigation.

## Installation

This package is part of the moruk monorepo and is automatically available to all apps in the workspace.

```bash
# In your app's package.json dependencies
{
  "dependencies": {
    "@moruk/navigation": "1.0.0"
  }
}
```

## Usage

### Navigate Between Screens

Use the `NavigationService` for programmatic navigation:

```tsx
import { NavigationService } from "@moruk/navigation";

// Navigate to home (replaces current route)
NavigationService.navigateToHome();

// Navigate to details with data
NavigationService.navigateToDetails({
  imageUris: ["file://image1.jpg", "file://image2.jpg"],
  response: { id: 123, name: "Result" },
});

// Navigate to settings
NavigationService.navigateToSettings();

// Go back
NavigationService.goBack();
```

### Check Navigation State

```tsx
import { NavigationService } from "@moruk/navigation";

// Check if can go back
if (NavigationService.canGoBack()) {
  NavigationService.goBack();
} else {
  console.log("Already at root");
}
```

### Custom Navigation

For custom navigation needs, use `expo-router` directly:

```tsx
import { router } from "expo-router";

// Push a route
router.push("/custom-screen");

// Replace current route
router.replace("/new-screen");

// Navigate with params
router.push({
  pathname: "/details",
  params: { id: "123" },
});
```

## API

### NavigationService

Static service class for common navigation operations.

#### Methods

##### `navigateToHome(): void`

Navigate to the home screen (replaces current route).

**Example:**

```tsx
NavigationService.navigateToHome();
```

##### `navigateToDetails(params: NavigationParams["details"]): void`

Navigate to the details screen with analysis results.

**Parameters:**

```typescript
{
  imageUris?: string[];     // Array of image URIs
  response?: any;           // Analysis response data
}
```

**Example:**

```tsx
NavigationService.navigateToDetails({
  imageUris: ["file://photo.jpg"],
  response: {
    id: 1,
    name: "Coin",
    description: "Ancient Roman coin",
  },
});
```

##### `navigateToSettings(): void`

Navigate to the settings screen.

**Example:**

```tsx
NavigationService.navigateToSettings();
```

##### `goBack(): void`

Go back to the previous screen. If at root, navigates to home.

**Example:**

```tsx
NavigationService.goBack();
```

##### `canGoBack(): boolean`

Check if navigation can go back.

**Returns:**

- `boolean` - True if there's a previous screen

**Example:**

```tsx
if (NavigationService.canGoBack()) {
  NavigationService.goBack();
}
```

## Types

### NavigationParams

Type-safe navigation parameters for all routes:

```typescript
interface NavigationParams {
  home: undefined; // Home screen (no params)
  details: {
    // Details screen
    imageUris?: string[]; // Image URIs
    response?: any; // Analysis response
  };
  settings: undefined; // Settings screen (no params)
}
```

## Examples

### Navigate After Image Analysis

```tsx
import { NavigationService } from "@moruk/navigation";
import { ImageService } from "@moruk/image";
import { geminiClient } from "@moruk/gemini-client";

async function analyzeAndNavigate() {
  // Pick image
  const image = await ImageService.pickImage();
  if (!image) return;

  // Analyze image
  const response = await geminiClient.analyzeImages(
    [{ base64: image.base64!, mimeType: "image/jpeg" }],
    "Describe this image"
  );

  // Navigate to details with results
  NavigationService.navigateToDetails({
    imageUris: [image.uri],
    response,
  });
}
```

### Conditional Navigation

```tsx
import { NavigationService } from "@moruk/navigation";

function handleComplete(success: boolean) {
  if (success) {
    // Navigate to home on success
    NavigationService.navigateToHome();
  } else if (NavigationService.canGoBack()) {
    // Go back on failure if possible
    NavigationService.goBack();
  }
}
```

### Back Button Handler

```tsx
import React, { useEffect } from "react";
import { BackHandler } from "react-native";
import { NavigationService } from "@moruk/navigation";

export function MyScreen() {
  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (NavigationService.canGoBack()) {
        NavigationService.goBack();
        return true; // Prevent default behavior
      }
      return false; // Let default behavior happen
    });

    return () => subscription.remove();
  }, []);

  return <ScreenContent />;
}
```

### Navigate from Notification

```tsx
import { NavigationService } from "@moruk/navigation";

function handleNotificationPress(notification: any) {
  const { screen, data } = notification;

  switch (screen) {
    case "details":
      NavigationService.navigateToDetails({
        response: data,
      });
      break;

    case "settings":
      NavigationService.navigateToSettings();
      break;

    default:
      NavigationService.navigateToHome();
  }
}
```

### Deep Link Handling

```tsx
import { useEffect } from "react";
import { Linking } from "react-native";
import { NavigationService } from "@moruk/navigation";

export function App() {
  useEffect(() => {
    // Handle initial URL
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    // Handle URL changes
    const subscription = Linking.addEventListener("url", ({ url }) => {
      handleDeepLink(url);
    });

    return () => subscription.remove();
  }, []);

  function handleDeepLink(url: string) {
    const route = new URL(url).pathname;

    switch (route) {
      case "/details":
        NavigationService.navigateToDetails({});
        break;
      case "/settings":
        NavigationService.navigateToSettings();
        break;
      default:
        NavigationService.navigateToHome();
    }
  }

  return <RootNavigator />;
}
```

## Route Structure

The navigation service assumes this route structure:

```
app/
├── index.tsx          # Home screen (/)
├── details.tsx        # Details screen (/details)
└── settings.tsx       # Settings screen (/settings)
```

## Expo Router Integration

This package is built on top of `expo-router`. For advanced navigation needs, import from `expo-router` directly:

```tsx
import { router, useRouter, usePathname, useSegments } from "expo-router";

// Get current pathname
const pathname = usePathname();

// Use router hook
const router = useRouter();
router.push("/custom-route");

// Get route segments
const segments = useSegments();
```

## Dependencies

- `expo` - Expo framework
- `expo-constants` - Constants
- `expo-linking` - Deep linking
- `expo-router` - File-based routing
- `react` - React library
- `react-native` - React Native framework
- `react-native-safe-area-context` - Safe area support
- `react-native-screens` - Native screen optimization

## Best Practices

1. **Use NavigationService for common routes** - Centralized navigation logic
2. **Type-safe parameters** - Use `NavigationParams` type for type safety
3. **Handle back navigation** - Always check `canGoBack()` before calling `goBack()`
4. **Serialize complex data** - Pass simple data types or serialize objects when navigating
5. **Prefer replace over push for home** - Use `navigateToHome()` which uses `router.replace()`
