// Numy Typography System

import { TextStyle, Platform } from "react-native";

const fontFamily = Platform.select({
  ios: "Menlo",
  android: "monospace",
  default: "monospace",
});

export const typography = {
  // Font families
  fonts: {
    mono: fontFamily,
  },

  // Font sizes
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },

  // Line heights
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },

  // Font weights
  weights: {
    regular: "400" as TextStyle["fontWeight"],
    medium: "500" as TextStyle["fontWeight"],
    semibold: "600" as TextStyle["fontWeight"],
    bold: "700" as TextStyle["fontWeight"],
  },

  // Pre-defined text styles
  styles: {
    header: {
      fontFamily,
      fontSize: 18,
      fontWeight: "600" as TextStyle["fontWeight"],
    },
    sectionHeader: {
      fontFamily,
      fontSize: 16,
      fontWeight: "600" as TextStyle["fontWeight"],
    },
    input: {
      fontFamily,
      fontSize: 16,
      fontWeight: "400" as TextStyle["fontWeight"],
    },
    result: {
      fontFamily,
      fontSize: 16,
      fontWeight: "500" as TextStyle["fontWeight"],
    },
    total: {
      fontFamily,
      fontSize: 14,
      fontWeight: "500" as TextStyle["fontWeight"],
    },
    label: {
      fontFamily,
      fontSize: 12,
      fontWeight: "400" as TextStyle["fontWeight"],
    },
  },
} as const;
