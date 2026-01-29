/**
 * Theme Type Definitions
 *
 * Extensible theme interfaces for the moruk app ecosystem.
 * Apps can extend these base types with app-specific properties.
 */

/**
 * Base color palette - required colors for all themes
 */
export interface BaseThemeColors {
  // Primary brand colors
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

/**
 * Extended colors type - allows apps to add custom colors
 */
export type ThemeColors<TExtended extends Record<string, string> = Record<string, string>> =
  BaseThemeColors & TExtended;

/**
 * Spacing scale
 */
export interface ThemeSpacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
  xxxl?: number;
}

/**
 * Border radius scale
 */
export interface ThemeBorderRadius {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  pill: number;
}

/**
 * Font size scale
 */
export interface ThemeFontSizes {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
  xxxl: number;
}

/**
 * Line height scale
 */
export interface ThemeLineHeights {
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
  xxxl: number;
}

/**
 * Font weight tokens
 */
export interface ThemeFontWeights {
  light: "300";
  regular: "400";
  medium: "500";
  semiBold: "600";
  bold: "700";
  extraBold: "800";
}

/**
 * Font family configuration
 */
export interface ThemeFontFamilies {
  default: string;
  regular: string;
  medium: string;
  semiBold: string;
  bold: string;
  extraBold: string;
}

/**
 * Animation tokens
 */
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

/**
 * Shadow configuration for React Native
 */
export interface ThemeShadow {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}

/**
 * Shadow scale
 */
export interface ThemeShadows {
  small: ThemeShadow;
  medium: ThemeShadow;
  large: ThemeShadow;
}

/**
 * Base theme structure - core theme without extensions
 */
export interface BaseTheme {
  colors: BaseThemeColors;
  spacing: ThemeSpacing;
  borderRadius: ThemeBorderRadius;
  fontSize: ThemeFontSizes;
  lineHeight?: ThemeLineHeights;
  fontWeight: ThemeFontWeights;
  fontFamily: ThemeFontFamilies;
  animations: ThemeAnimations;
  shadows: ThemeShadows;
}

/**
 * Theme type - extensible with custom colors and additional properties
 *
 * @example
 * // Basic usage
 * const theme: Theme = createTheme({ ... });
 *
 * // With extended colors
 * interface CatDoctorColors {
 *   darkOrange: string;
 *   white: string;
 * }
 * const theme: Theme<CatDoctorColors> = createTheme({ ... });
 */
export interface Theme<TExtendedColors extends Record<string, string> = Record<string, string>> {
  colors: ThemeColors<TExtendedColors>;
  spacing: ThemeSpacing;
  borderRadius: ThemeBorderRadius;
  fontSize: ThemeFontSizes;
  lineHeight?: ThemeLineHeights;
  fontWeight: ThemeFontWeights;
  fontFamily: ThemeFontFamilies;
  animations: ThemeAnimations;
  shadows: ThemeShadows & { card?: Omit<ThemeShadow, "elevation"> };
}

/**
 * Theme mode
 */
export type ThemeMode = "light" | "dark";

/**
 * Color palette definition for theme creation
 */
export interface ColorPalette {
  /** Primary brand color (e.g., "#F97316" for orange) */
  primary: string;
  /** Darker shade of primary */
  primaryDark?: string;
  /** Lighter shade of primary */
  primaryLight?: string;

  /** Secondary brand color */
  secondary?: string;

  /** Accent color for highlights */
  accent?: string;

  /** Success state color */
  success?: string;
  /** Warning state color */
  warning?: string;
  /** Error state color */
  error?: string;
  /** Info state color */
  info?: string;
}

/**
 * Theme creation options
 */
export interface CreateThemeOptions<
  TExtendedColors extends Record<string, string> = Record<string, string>,
> {
  /** Theme mode (light or dark) */
  mode: ThemeMode;
  /** Color palette for the theme */
  colors: ColorPalette;
  /** Additional app-specific colors */
  extendedColors?: TExtendedColors;
  /** Custom font family (default: system font) */
  fontFamily?: Partial<ThemeFontFamilies>;
  /** Custom spacing scale */
  spacing?: Partial<ThemeSpacing>;
  /** Custom border radius scale */
  borderRadius?: Partial<ThemeBorderRadius>;
  /** Custom font sizes */
  fontSize?: Partial<ThemeFontSizes>;
}
