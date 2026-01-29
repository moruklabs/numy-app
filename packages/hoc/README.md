# @moruk/hoc

Higher-Order Components (HOCs) for React Native apps. Provides reusable component wrappers for common patterns like accessibility, keyboard handling, and safe areas.

## Installation

This package is part of the moruk monorepo and is automatically available to all apps in the workspace.

```bash
# In your app's package.json dependencies
{
  "dependencies": {
    "@moruk/hoc": "1.0.0"
  }
}
```

## Usage

### withAccessibility

Enhance components with accessibility features:

```tsx
import { withAccessibility } from "@moruk/hoc";
import { View, Text } from "react-native";

function MyButton({ onPress, children }) {
  return (
    <View>
      <Text>{children}</Text>
    </View>
  );
}

// Add accessibility props automatically
export default withAccessibility(MyButton);

// Usage
<MyButton
  onPress={handlePress}
  accessible={true}
  accessibilityLabel="Submit button"
  accessibilityHint="Double tap to submit the form"
>
  Submit
</MyButton>;
```

### withKeyboardAvoidance

Automatically handle keyboard appearance:

```tsx
import { withKeyboardAvoidance } from "@moruk/hoc";
import { View, TextInput } from "react-native";

function LoginForm() {
  return (
    <View>
      <TextInput placeholder="Email" />
      <TextInput placeholder="Password" secureTextEntry />
    </View>
  );
}

// Wrap with keyboard avoidance
export default withKeyboardAvoidance(LoginForm);

// Now the form automatically adjusts when keyboard appears
```

### withSafeArea

Wrap components with safe area padding:

```tsx
import { withSafeArea } from "@moruk/hoc";
import { View, Text } from "react-native";

function Header() {
  return (
    <View>
      <Text>My App Header</Text>
    </View>
  );
}

// Add safe area padding
export default withSafeArea(Header);

// Component now respects notches, status bars, and home indicators
```

### Composing Multiple HOCs

Combine multiple HOCs for complex behaviors:

```tsx
import { withAccessibility, withKeyboardAvoidance, withSafeArea } from "@moruk/hoc";

function MyScreen() {
  return <View>{/* Screen content */}</View>;
}

// Compose HOCs (apply from right to left)
export default withSafeArea(withKeyboardAvoidance(withAccessibility(MyScreen)));

// Or use a compose utility
import { compose } from "lodash/fp";

export default compose(withSafeArea, withKeyboardAvoidance, withAccessibility)(MyScreen);
```

## API

### withAccessibility

Higher-order component that adds accessibility props support to any component.

**Signature:**

```typescript
function withAccessibility<P>(Component: ComponentType<P>): ComponentType<P & AccessibilityProps>;
```

**Added Props:**

- `accessible?: boolean` - Whether the element is accessible
- `accessibilityLabel?: string` - Screen reader label
- `accessibilityHint?: string` - Screen reader hint
- `accessibilityRole?: AccessibilityRole` - Component role (button, link, etc.)
- `accessibilityState?: AccessibilityState` - Component state (disabled, selected, etc.)
- All other React Native accessibility props

**Example:**

```tsx
const AccessibleButton = withAccessibility(Button);

<AccessibleButton
  accessibilityLabel="Delete item"
  accessibilityHint="Removes this item from your list"
  accessibilityRole="button"
  onPress={handleDelete}
/>;
```

### withKeyboardAvoidance

Higher-order component that wraps content in a KeyboardAvoidingView.

**Signature:**

```typescript
function withKeyboardAvoidance<P>(
  Component: ComponentType<P>
): ComponentType<P & KeyboardAvoidingViewProps>;
```

**Features:**

- Automatically adjusts layout when keyboard appears
- Platform-specific behavior (iOS vs Android)
- Customizable keyboard offset and behavior

**Added Props:**

- `behavior?: "height" | "position" | "padding"` - How to adjust (default: platform-specific)
- `keyboardVerticalOffset?: number` - Additional offset
- All other KeyboardAvoidingView props

**Example:**

```tsx
const KeyboardAwareForm = withKeyboardAvoidance(MyForm);

<KeyboardAwareForm behavior="padding" keyboardVerticalOffset={100} />;
```

### withSafeArea

Higher-order component that wraps content in a SafeAreaView.

**Signature:**

```typescript
function withSafeArea<P>(Component: ComponentType<P>): ComponentType<P & SafeAreaViewProps>;
```

**Features:**

- Respects device safe areas (notches, home indicators, status bars)
- Customizable edge insets
- Theme-aware (uses background color from theme)

**Added Props:**

- `edges?: Edge[]` - Which edges to apply safe area to (default: all)
- All other SafeAreaView props

**Example:**

```tsx
const SafeScreen = withSafeArea(MyScreen);

// Only apply safe area to top and bottom
<SafeScreen edges={["top", "bottom"]} />;
```

## Type Definitions

All HOCs are fully typed and preserve the component's original prop types while adding their own props.

```typescript
// Original component
interface MyComponentProps {
  title: string;
  onPress: () => void;
}

// With accessibility HOC
type EnhancedProps = MyComponentProps & AccessibilityProps;

// With multiple HOCs
type FullyEnhancedProps = MyComponentProps &
  AccessibilityProps &
  KeyboardAvoidingViewProps &
  SafeAreaViewProps;
```

## Best Practices

### 1. Apply HOCs in the Right Order

```tsx
// ✅ Correct order: Safe area → Keyboard → Accessibility
export default withSafeArea(withKeyboardAvoidance(withAccessibility(Component)));

// ❌ Incorrect: Keyboard outside safe area may cause layout issues
export default withKeyboardAvoidance(withSafeArea(Component));
```

### 2. Use Accessibility HOC for Interactive Components

```tsx
// ✅ Good: Buttons, links, and interactive elements
const AccessibleButton = withAccessibility(Button);
const AccessibleLink = withAccessibility(Link);

// ❌ Not needed: Static content like text or images
const StaticText = withAccessibility(Text); // Unnecessary
```

### 3. Combine with Theme Context

```tsx
import { withSafeArea } from "@moruk/hoc";
import { useTheme } from "@moruk/context";

function ThemedScreen() {
  const { theme } = useTheme();

  return <View style={{ backgroundColor: theme.colors.background }}>{/* Content */}</View>;
}

export default withSafeArea(ThemedScreen);
```

## Example: Complete Screen

```tsx
import React from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { withAccessibility, withKeyboardAvoidance, withSafeArea } from "@moruk/hoc";
import { useTheme } from "@moruk/context";

function LoginScreen() {
  const { theme } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Text style={{ fontSize: theme.fontSizes.xl }}>Login</Text>

      <TextInput
        placeholder="Email"
        accessibilityLabel="Email input"
        style={{ padding: theme.spacing.md }}
      />

      <TextInput
        placeholder="Password"
        secureTextEntry
        accessibilityLabel="Password input"
        style={{ padding: theme.spacing.md }}
      />

      <TouchableOpacity
        accessibilityLabel="Login button"
        accessibilityHint="Double tap to log in"
        accessibilityRole="button"
      >
        <Text>Login</Text>
      </TouchableOpacity>
    </View>
  );
}

// Apply HOCs for safe area, keyboard handling, and accessibility
export default withSafeArea(withKeyboardAvoidance(withAccessibility(LoginScreen)));
```

## Dependencies

- `@moruk/context` - For theme integration
- `react` - React library
- `react-native` - React Native framework
