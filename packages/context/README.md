# @moruk/context

Shared React contexts for moruk apps. Provides theme management with customizable colors, spacing, typography, and animations.

## Installation

This package is part of the moruk monorepo and is automatically available to all apps in the workspace.

```bash
# In your app's package.json dependencies
{
  "dependencies": {
    "@moruk/context": "1.0.0"
  }
}
```

## Usage

### Basic Theme Setup

Wrap your app with `ThemeProvider` and pass your custom theme:

```tsx
import { ThemeProvider } from "@moruk/context";
import type { Theme } from "@moruk/context";

const myTheme: Theme = {
  colors: {
    primary: "#007AFF",
    primaryDark: "#0051D5",
    primaryLight: "#4DA3FF",
    // ... other colors
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  // ... other theme properties
};

export default function App() {
  return (
    <ThemeProvider theme={myTheme}>
      <YourAppContent />
    </ThemeProvider>
  );
}
```

### Using Theme in Components

Access the theme using the `useTheme` hook:

```tsx
import { useTheme } from "@moruk/context";
import { View, Text } from "react-native";

export function MyComponent() {
  const { theme } = useTheme();

  return (
    <View style={{ backgroundColor: theme.colors.background }}>
      <Text
        style={{
          color: theme.colors.text,
          fontSize: theme.fontSizes.lg,
          fontFamily: theme.fontFamilies.regular,
        }}
      >
        Hello World
      </Text>
    </View>
  );
}
```

## API

### ThemeProvider

Provider component that makes theme available to all child components.

**Props:**

- `theme: Theme` - The theme object to provide
- `children: ReactNode` - Child components

### useTheme()

Hook to access the current theme.

**Returns:**

- `theme: Theme` - The current theme object
- `ThemeContext` - The theme context (for advanced use cases)

### ThemeContext

React context that holds the theme. Use this for advanced scenarios or when you need to consume the context directly.

## Types

### Theme

Complete theme object with all design tokens:

```typescript
interface Theme {
  colors: ThemeColors;
  spacing: ThemeSpacing;
  borderRadius: ThemeBorderRadius;
  fontSizes: ThemeFontSizes;
  fontWeights: ThemeFontWeights;
  fontFamilies: ThemeFontFamilies;
  animations: ThemeAnimations;
  shadows: ThemeShadows;
}
```

### ThemeColors

All color tokens used in the app:

```typescript
interface ThemeColors {
  // Primary colors
  primary: string;
  primaryDark: string;
  primaryLight: string;

  // Secondary colors
  secondary: string;
  secondaryDark: string;
  secondaryLight: string;

  // Background colors
  background: string;
  backgroundSecondary: string;
  surface: string;
  surfaceSecondary: string;

  // Text colors
  text: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;

  // State colors
  success: string;
  warning: string;
  error: string;
  info: string;

  // Utility colors
  border: string;
  borderLight: string;
  shadow: string;
  overlay: string;
  divider: string;

  // Accent colors
  accent: string;
  accentLight: string;
  accentDark: string;
}
```

### ThemeSpacing

Spacing scale for consistent margins and padding:

```typescript
interface ThemeSpacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
}
```

### Other Theme Types

- `ThemeBorderRadius` - Border radius values
- `ThemeFontSizes` - Font size scale
- `ThemeFontWeights` - Font weight values
- `ThemeFontFamilies` - Font family names
- `ThemeAnimations` - Animation duration and easing values
- `ThemeShadow` - Shadow configuration
- `ThemeShadows` - Shadow variations (small, medium, large)

## Example: Complete Theme

See individual apps for complete theme examples. Each app defines its own theme values while using these shared type definitions.

```tsx
// Example from an app
import type { Theme } from "@moruk/context";

export const theme: Theme = {
  colors: {
    primary: "#007AFF",
    primaryDark: "#0051D5",
    primaryLight: "#4DA3FF",
    // ... complete color palette
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  // ... other theme properties
};
```
