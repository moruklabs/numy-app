import React from "react";
import { Text, TextProps } from "react-native";
import { useTheme } from "@moruk/context";

interface TypographyProps extends TextProps {
  variant?: "h1" | "h2" | "h3" | "body" | "caption" | "button" | "subtitle";
  weight?: "light" | "regular" | "medium" | "semiBold" | "bold" | "extraBold";
  color?: string;
}

export const Typography: React.FC<TypographyProps> = ({
  variant = "body",
  weight,
  color,
  style,
  children,
  ...props
}) => {
  const { theme } = useTheme();

  const getVariantStyle = () => {
    switch (variant) {
      case "h1":
        return {
          fontSize: theme.fontSize.xxxl,
          fontWeight: theme.fontWeight.bold,
          fontFamily: theme.fontFamily.bold,
          lineHeight: theme.fontSize.xxxl * 1.2,
        };
      case "h2":
        return {
          fontSize: theme.fontSize.xxl,
          fontWeight: theme.fontWeight.semiBold,
          fontFamily: theme.fontFamily.semiBold,
          lineHeight: theme.fontSize.xxl * 1.3,
        };
      case "h3":
        return {
          fontSize: theme.fontSize.xl,
          fontWeight: theme.fontWeight.semiBold,
          fontFamily: theme.fontFamily.semiBold,
          lineHeight: theme.fontSize.xl * 1.3,
        };
      case "caption":
        return {
          fontSize: theme.fontSize.sm,
          fontWeight: theme.fontWeight.regular,
          fontFamily: theme.fontFamily.regular,
          color: theme.colors.textSecondary,
          lineHeight: theme.fontSize.sm * 1.4,
        };
      case "button":
        return {
          fontSize: theme.fontSize.md,
          fontWeight: theme.fontWeight.semiBold,
          fontFamily: theme.fontFamily.semiBold,
          lineHeight: theme.fontSize.md * 1.2,
        };
      case "subtitle":
        return {
          fontSize: theme.fontSize.sm,
          fontWeight: theme.fontWeight.regular,
          fontFamily: theme.fontFamily.regular,
          color: theme.colors.textSecondary,
          lineHeight: theme.fontSize.sm * 1.6,
        };
      default: // body
        return {
          fontSize: theme.fontSize.md,
          fontWeight: theme.fontWeight.regular,
          fontFamily: theme.fontFamily.regular,
          lineHeight: theme.fontSize.md * 1.5,
        };
    }
  };

  const getFontFamily = () => {
    if (weight) {
      switch (weight) {
        case "light":
          return "Montserrat-Light";
        case "regular":
          return theme.fontFamily.regular;
        case "medium":
          return theme.fontFamily.medium;
        case "semiBold":
          return theme.fontFamily.semiBold;
        case "bold":
          return theme.fontFamily.bold;
        case "extraBold":
          return theme.fontFamily.extraBold;
        default:
          return theme.fontFamily.default;
      }
    }
    return undefined; // Use variant default
  };

  const textStyle = [
    {
      color: color || theme.colors.text,
      fontFamily: getFontFamily(),
    },
    getVariantStyle(),
    style,
  ];

  return (
    <Text style={textStyle} {...props}>
      {children}
    </Text>
  );
};

// Convenience components for common typography
export const Heading1: React.FC<Omit<TypographyProps, "variant">> = (props) => (
  <Typography variant="h1" {...props} />
);

export const Heading2: React.FC<Omit<TypographyProps, "variant">> = (props) => (
  <Typography variant="h2" {...props} />
);

export const Heading3: React.FC<Omit<TypographyProps, "variant">> = (props) => (
  <Typography variant="h3" {...props} />
);

export const BodyText: React.FC<Omit<TypographyProps, "variant">> = (props) => (
  <Typography variant="body" {...props} />
);

export const Caption: React.FC<Omit<TypographyProps, "variant">> = (props) => (
  <Typography variant="caption" {...props} />
);

export const ButtonText: React.FC<Omit<TypographyProps, "variant">> = (props) => (
  <Typography variant="button" {...props} />
);

export const Subtitle: React.FC<Omit<TypographyProps, "variant">> = (props) => (
  <Typography variant="subtitle" {...props} />
);

export type { TypographyProps };
