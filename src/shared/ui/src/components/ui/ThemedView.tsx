import { useTheme } from "@moruk/context";
import React from "react";
import { View, ViewProps } from "react-native";

interface ThemedViewProps extends ViewProps {
  lightColor?: string;
  darkColor?: string;
  noBackground?: boolean;
  /** Whether dark mode is active. Defaults to true for backward compatibility. */
  isDarkMode?: boolean;
}

export function ThemedView({
  style,
  lightColor,
  darkColor,
  noBackground,
  isDarkMode = true,
  ...otherProps
}: ThemedViewProps) {
  const { theme } = useTheme();

  const backgroundColor = noBackground
    ? undefined
    : (isDarkMode ? darkColor : lightColor) || theme.colors.backgroundSecondary;

  return (
    <View
      style={[
        backgroundColor && {
          backgroundColor,
        },
        style,
      ]}
      accessible={true}
      accessibilityRole="none"
      {...otherProps}
    />
  );
}

export type { ThemedViewProps };
