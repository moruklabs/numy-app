import React, { createContext, useContext, ReactNode } from "react";

/**
 * Shared Theme Type Definitions
 *
 * These interfaces define the theme structure used by all apps in the monorepo.
 * Each app provides its own theme values (colors, etc.) while sharing these type definitions.
 */

export interface ThemeColors {
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

export interface ThemeSpacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
}

export interface ThemeBorderRadius {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  pill: number;
}

export interface ThemeFontSizes {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
  xxxl: number;
}

export interface ThemeFontWeights {
  light: "300";
  regular: "400";
  medium: "500";
  semiBold: "600";
  bold: "700";
  extraBold: "800";
}

export interface ThemeFontFamilies {
  default: string;
  regular: string;
  medium: string;
  semiBold: string;
  bold: string;
  extraBold: string;
}

export interface ThemeAnimations {
  duration: {
    fast: number;
    normal: number;
    slow: number;
  };
  easing: {
    easeIn: string;
    easeOut: string;
    easeInOut: string;
  };
}

export interface ThemeShadow {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}

export interface ThemeShadows {
  small: ThemeShadow;
  medium: ThemeShadow;
  large: ThemeShadow;
}

export interface Theme {
  colors: ThemeColors;
  spacing: ThemeSpacing;
  borderRadius: ThemeBorderRadius;
  fontSize: ThemeFontSizes;
  fontWeight: ThemeFontWeights;
  fontFamily: ThemeFontFamilies;
  animations: ThemeAnimations;
  shadows: ThemeShadows;
}

/**
 * Theme context value type
 */
export interface ThemeContextType {
  theme: Theme;
}

/**
 * ThemeContext - React context for theme access
 */
export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  theme: Theme;
  children: ReactNode;
}

/**
 * ThemeProvider - Provides theme context to all child components
 *
 * Apps provide their own theme configuration while components
 * access theme values through the useTheme hook.
 *
 * @example
 * ```tsx
 * import { ThemeProvider } from '@moruk/context';
 * import { lightTheme } from './config/theme';
 *
 * function App() {
 *   return (
 *     <ThemeProvider theme={lightTheme}>
 *       <YourApp />
 *     </ThemeProvider>
 *   );
 * }
 * ```
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ theme, children }) => {
  return <ThemeContext.Provider value={{ theme }}>{children}</ThemeContext.Provider>;
};

/**
 * useTheme - Hook to access the current theme
 *
 * Must be used within a ThemeProvider.
 *
 * @throws Error if used outside of ThemeProvider
 * @returns ThemeContextType containing the current theme
 *
 * @example
 * ```tsx
 * import { useTheme } from '@moruk/context';
 *
 * function MyComponent() {
 *   const { theme } = useTheme();
 *   return <View style={{ backgroundColor: theme.colors.background }} />;
 * }
 * ```
 */
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
