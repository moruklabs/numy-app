# @moruk/ui

Themed UI primitives for React Native apps. Provides reusable, theme-aware components for consistent design across the monorepo.

## Installation

This package is part of the moruk monorepo and is automatically available to all apps in the workspace.

```bash
# In your app's package.json dependencies
{
  "dependencies": {
    "@moruk/ui": "1.0.0"
  }
}
```

## Usage

### Themed Components

Use themed components that automatically adapt to your app's theme:

```tsx
import { ThemedView, ThemedText } from "@moruk/ui";

export function MyScreen() {
  return (
    <ThemedView style={{ flex: 1, padding: 20 }}>
      <ThemedText type="title">Welcome</ThemedText>
      <ThemedText type="default">This text uses the theme colors automatically.</ThemedText>
    </ThemedView>
  );
}
```

### Typography Components

Pre-styled typography components for consistent text hierarchy:

```tsx
import { Heading1, Heading2, Heading3, BodyText, Caption, ButtonText, Subtitle } from "@moruk/ui";

export function TypographyExample() {
  return (
    <View>
      <Heading1>Main Title</Heading1>
      <Heading2>Section Title</Heading2>
      <Heading3>Subsection Title</Heading3>

      <BodyText>This is body text with proper sizing and line height.</BodyText>

      <Subtitle>Additional context or subtitle</Subtitle>
      <Caption>Small caption or metadata text</Caption>

      <ButtonText>Action Button</ButtonText>
    </View>
  );
}
```

### Custom Styling

Combine with custom styles while maintaining theme colors:

```tsx
import { ThemedView, ThemedText } from "@moruk/ui";
import { useTheme } from "@moruk/context";

export function CustomCard() {
  const { theme } = useTheme();

  return (
    <ThemedView
      style={{
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        marginBottom: theme.spacing.sm,
      }}
    >
      <ThemedText type="defaultSemiBold" style={{ marginBottom: 8 }}>
        Card Title
      </ThemedText>
      <ThemedText type="default">Card content goes here.</ThemedText>
    </ThemedView>
  );
}
```

## API

### ThemedView

View component that uses theme background color.

**Props:**

```typescript
interface ThemedViewProps extends ViewProps {
  lightColor?: string; // Override light theme background
  darkColor?: string; // Override dark theme background
}
```

**Example:**

```tsx
<ThemedView style={{ flex: 1 }}>
  <Content />
</ThemedView>

// With color overrides
<ThemedView
  lightColor="#f0f0f0"
  darkColor="#1a1a1a"
  style={{ padding: 20 }}
>
  <Content />
</ThemedView>
```

### ThemedText

Text component that uses theme text color.

**Props:**

```typescript
interface ThemedTextProps extends TextProps {
  lightColor?: string; // Override light theme text color
  darkColor?: string; // Override dark theme text color
  type?: TextType; // Predefined text style
}

type TextType = "default" | "title" | "defaultSemiBold" | "subtitle" | "link";
```

**Example:**

```tsx
<ThemedText type="title">Page Title</ThemedText>
<ThemedText type="default">Regular text</ThemedText>
<ThemedText type="defaultSemiBold">Bold text</ThemedText>
<ThemedText type="subtitle">Subtle text</ThemedText>
<ThemedText type="link" onPress={handlePress}>
  Click here
</ThemedText>

// With color override
<ThemedText lightColor="#666" darkColor="#999">
  Custom colored text
</ThemedText>
```

### Typography

Generic typography component with theme integration.

**Props:**

```typescript
interface TypographyProps extends TextProps {
  variant?: TypographyVariant;
  color?: string;
}

type TypographyVariant = "h1" | "h2" | "h3" | "body" | "caption" | "button" | "subtitle";
```

**Example:**

```tsx
<Typography variant="h1">Heading 1</Typography>
<Typography variant="body" color="#ff0000">
  Red body text
</Typography>
```

### Typography Convenience Components

Pre-configured typography components:

#### Heading1

```tsx
<Heading1>Large heading text</Heading1>
```

#### Heading2

```tsx
<Heading2>Section heading</Heading2>
```

#### Heading3

```tsx
<Heading3>Subsection heading</Heading3>
```

#### BodyText

```tsx
<BodyText>Regular paragraph text</BodyText>
```

#### Caption

```tsx
<Caption>Small caption text</Caption>
```

#### ButtonText

```tsx
<ButtonText>Action Button</ButtonText>
```

#### Subtitle

```tsx
<Subtitle>Secondary information</Subtitle>
```

## Examples

### Complete Screen

```tsx
import React from "react";
import { ScrollView, TouchableOpacity } from "react-native";
import { ThemedView, ThemedText, Heading1, Heading2, BodyText, ButtonText } from "@moruk/ui";
import { useTheme } from "@moruk/context";

export function ProfileScreen() {
  const { theme } = useTheme();

  return (
    <ThemedView style={{ flex: 1 }}>
      <ScrollView style={{ padding: theme.spacing.md }}>
        {/* Header */}
        <Heading1 style={{ marginBottom: theme.spacing.sm }}>Profile</Heading1>

        {/* Info Section */}
        <ThemedView
          style={{
            padding: theme.spacing.md,
            borderRadius: theme.borderRadius.md,
            marginBottom: theme.spacing.md,
          }}
        >
          <Heading2 style={{ marginBottom: theme.spacing.sm }}>User Information</Heading2>
          <BodyText>Name: John Doe</BodyText>
          <BodyText>Email: john@example.com</BodyText>
        </ThemedView>

        {/* Action Button */}
        <TouchableOpacity
          style={{
            backgroundColor: theme.colors.primary,
            padding: theme.spacing.md,
            borderRadius: theme.borderRadius.md,
            alignItems: "center",
          }}
        >
          <ButtonText style={{ color: theme.colors.textInverse }}>Edit Profile</ButtonText>
        </TouchableOpacity>
      </ScrollView>
    </ThemedView>
  );
}
```

### Card Component

```tsx
import React from "react";
import { TouchableOpacity } from "react-native";
import { ThemedView, Heading3, BodyText, Caption } from "@moruk/ui";
import { useTheme } from "@moruk/context";

interface CardProps {
  title: string;
  description: string;
  metadata?: string;
  onPress?: () => void;
}

export function Card({ title, description, metadata, onPress }: CardProps) {
  const { theme } = useTheme();

  return (
    <TouchableOpacity onPress={onPress} disabled={!onPress}>
      <ThemedView
        style={{
          padding: theme.spacing.md,
          borderRadius: theme.borderRadius.lg,
          marginBottom: theme.spacing.sm,
          shadowColor: theme.colors.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 2,
        }}
      >
        <Heading3 style={{ marginBottom: theme.spacing.xs }}>{title}</Heading3>
        <BodyText style={{ marginBottom: theme.spacing.xs }}>{description}</BodyText>
        {metadata && <Caption>{metadata}</Caption>}
      </ThemedView>
    </TouchableOpacity>
  );
}
```

### List Item

```tsx
import React from "react";
import { TouchableOpacity } from "react-native";
import { ThemedView, ThemedText } from "@moruk/ui";
import { useTheme } from "@moruk/context";

interface ListItemProps {
  title: string;
  subtitle?: string;
  onPress?: () => void;
}

export function ListItem({ title, subtitle, onPress }: ListItemProps) {
  const { theme } = useTheme();

  return (
    <TouchableOpacity onPress={onPress}>
      <ThemedView
        style={{
          padding: theme.spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        }}
      >
        <ThemedText type="defaultSemiBold">{title}</ThemedText>
        {subtitle && (
          <ThemedText type="subtitle" style={{ marginTop: 4 }}>
            {subtitle}
          </ThemedText>
        )}
      </ThemedView>
    </TouchableOpacity>
  );
}
```

### Empty State

```tsx
import React from "react";
import { ThemedView, Heading2, BodyText } from "@moruk/ui";
import { useTheme } from "@moruk/context";

interface EmptyStateProps {
  title: string;
  message: string;
}

export function EmptyState({ title, message }: EmptyStateProps) {
  const { theme } = useTheme();

  return (
    <ThemedView
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: theme.spacing.xl,
      }}
    >
      <Heading2 style={{ marginBottom: theme.spacing.sm, textAlign: "center" }}>{title}</Heading2>
      <BodyText style={{ textAlign: "center", color: theme.colors.textSecondary }}>
        {message}
      </BodyText>
    </ThemedView>
  );
}
```

## Theme Integration

All components use `@moruk/context` for theme access. Make sure your app is wrapped with `ThemeProvider`:

```tsx
import { ThemeProvider } from "@moruk/context";
import { theme } from "./theme";

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <YourApp />
    </ThemeProvider>
  );
}
```

## Best Practices

1. **Use ThemedView for containers** - Automatic background color adaptation
2. **Use typography components for text hierarchy** - Consistent sizing and spacing
3. **Combine with theme values** - Access `theme.spacing`, `theme.colors`, etc. for custom styles
4. **Override colors sparingly** - Use `lightColor`/`darkColor` props only when necessary
5. **Maintain accessibility** - Ensure sufficient color contrast

## Accessibility

All components support standard React Native accessibility props:

```tsx
<ThemedText accessible={true} accessibilityLabel="Welcome message" accessibilityRole="header">
  Welcome
</ThemedText>
```

## Testing

Components can be tested with standard React Native testing libraries:

```tsx
import { render } from "@testing-library/react-native";
import { ThemedText } from "@moruk/ui";
import { ThemeProvider } from "@moruk/context";

it("renders themed text", () => {
  const { getByText } = render(
    <ThemeProvider theme={mockTheme}>
      <ThemedText>Hello</ThemedText>
    </ThemeProvider>
  );

  expect(getByText("Hello")).toBeTruthy();
});
```

## Dependencies

- `@moruk/context` - For theme integration
- `react` - React library
- `react-native` - React Native framework
