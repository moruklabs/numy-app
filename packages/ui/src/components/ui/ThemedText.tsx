import React from "react";
import { Text, TextProps, TextStyle } from "react-native";
import { useTheme } from "@moruk/context";

type TextVariant = "h1" | "h2" | "h3" | "h4" | "body" | "caption" | "label";

interface ThemedTextProps extends TextProps {
  lightColor?: string;
  darkColor?: string;
  variant?: TextVariant;
}

const variantStyles: Record<TextVariant, TextStyle> = {
  h1: { fontSize: 32, fontWeight: "700", lineHeight: 40 },
  h2: { fontSize: 24, fontWeight: "600", lineHeight: 32 },
  h3: { fontSize: 20, fontWeight: "600", lineHeight: 28 },
  h4: { fontSize: 18, fontWeight: "600", lineHeight: 24 },
  body: { fontSize: 16, fontWeight: "400", lineHeight: 24 },
  caption: { fontSize: 14, fontWeight: "400", lineHeight: 20 },
  label: { fontSize: 12, fontWeight: "500", lineHeight: 16 },
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  variant,
  ...otherProps
}: ThemedTextProps) {
  const { theme } = useTheme();
  const variantStyle = variant ? variantStyles[variant] : undefined;

  return (
    <Text
      style={[
        {
          color: darkColor || theme.colors.text,
          fontFamily: theme.fontFamily.default,
        },
        variantStyle,
        style,
      ]}
      accessible={true}
      accessibilityRole="text"
      {...otherProps}
    />
  );
}

export type { ThemedTextProps };
