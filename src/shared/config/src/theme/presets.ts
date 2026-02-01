/**
 * Theme Color Presets
 *
 * Pre-defined color palettes for different apps in the moruk ecosystem.
 * Each preset defines the base colors that are used to generate full themes.
 */

import type { ColorPalette } from "./types";

/**
 * Silver/Platinum palette for Numy
 */
export const silverPalette: ColorPalette = {
  primary: "#C0C0C0", // Silver
  primaryDark: "#A8A8A8", // Darker silver
  primaryLight: "#E8E8E8", // Light silver
  secondary: "#B4B4B4", // Soft platinum
  accent: "#71717A", // Zinc accent
  success: "#22C55E",
  warning: "#EAB308",
  error: "#EF4444",
  info: "#3B82F6",
};

/**
 * Orange palette for Pet Doctor
 */
export const orangePalette: ColorPalette = {
  primary: "#F97316", // Vibrant orange
  primaryDark: "#C2410C", // Deep burnt orange
  primaryLight: "rgba(249,115,22,0.10)", // 10% orange
  secondary: "#FDBA74", // Soft amber
  accent: "#FB923C", // Light orange accent
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  info: "#3B82F6",
};

/**
 * Green palette for Plant Doctor
 */
export const greenPalette: ColorPalette = {
  primary: "#2e7a3f", // Forest green
  primaryDark: "#1e5a2f", // Dark green
  primaryLight: "#4ade80", // Light green
  secondary: "#86efac", // Soft green
  accent: "#22c55e", // Bright green
  success: "#22C55E",
  warning: "#EAB308",
  error: "#EF4444",
  info: "#3B82F6",
};

/**
 * Indigo palette for Stone Identifier
 */
export const indigoPalette: ColorPalette = {
  primary: "#6366F1", // Indigo
  primaryDark: "#4338CA", // Dark indigo
  primaryLight: "#A5B4FC", // Light indigo
  secondary: "#818CF8", // Soft indigo
  accent: "#8B5CF6", // Purple accent
  success: "#22C55E",
  warning: "#EAB308",
  error: "#EF4444",
  info: "#3B82F6",
};

/**
 * Cyan palette for Interval Timer
 */
export const cyanPalette: ColorPalette = {
  primary: "#06B6D4", // Cyan
  primaryDark: "#0891B2", // Dark cyan
  primaryLight: "#67E8F9", // Light cyan
  secondary: "#22D3EE", // Soft cyan
  accent: "#14B8A6", // Teal accent
  success: "#22C55E",
  warning: "#EAB308",
  error: "#EF4444",
  info: "#3B82F6",
};

/**
 * Pink palette for Rizzman
 */
export const pinkPalette: ColorPalette = {
  primary: "#E91E63", // Pink
  primaryDark: "#C2185B", // Dark pink
  primaryLight: "#F48FB1", // Light pink
  secondary: "#FF4081", // Soft pink
  accent: "#EC407A", // Pink accent
  success: "#22C55E",
  warning: "#EAB308",
  error: "#EF4444",
  info: "#3B82F6",
};

/**
 * Purple palette for Numy
 */
export const purplePalette: ColorPalette = {
  primary: "#C5B4E3", // Soft purple
  primaryDark: "#9333EA", // Dark purple
  primaryLight: "#E9D5FF", // Light purple
  secondary: "#A78BFA", // Medium purple
  accent: "#8B5CF6", // Purple accent
  success: "#22C55E",
  warning: "#EAB308",
  error: "#EF4444",
  info: "#3B82F6",
};

/**
 * Navy palette for Finance Dictionary
 */
export const navyPalette: ColorPalette = {
  primary: "#1E3A5F", // Navy blue
  primaryDark: "#0F172A", // Dark navy
  primaryLight: "#3B82F6", // Light blue
  secondary: "#1E40AF", // Royal blue
  accent: "#60A5FA", // Sky blue accent
  success: "#22C55E",
  warning: "#EAB308",
  error: "#EF4444",
  info: "#3B82F6",
};

/**
 * Nature green palette for Insect Identifier
 */
export const natureGreenPalette: ColorPalette = {
  primary: "#8BC34A", // Nature green
  primaryDark: "#689F38", // Dark nature green
  primaryLight: "#C5E1A5", // Light nature green
  secondary: "#AED581", // Soft lime
  accent: "#7CB342", // Lime accent
  success: "#22C55E",
  warning: "#EAB308",
  error: "#EF4444",
  info: "#3B82F6",
};

/**
 * Sky blue palette for Numy
 */
export const skyBluePalette: ColorPalette = {
  primary: "#3498DB", // Sky blue
  primaryDark: "#2980B9", // Dark sky blue
  primaryLight: "#85C1E9", // Light sky blue
  secondary: "#5DADE2", // Soft blue
  accent: "#48C9B0", // Teal accent
  success: "#22C55E",
  warning: "#EAB308",
  error: "#EF4444",
  info: "#3B82F6",
};

/**
 * Deep purple palette for Minday
 */
export const deepPurplePalette: ColorPalette = {
  primary: "#4B2C5F", // Deep purple
  primaryDark: "#311B47", // Darker purple
  primaryLight: "#7C4DFF", // Light purple
  secondary: "#6A3093", // Medium purple
  accent: "#9575CD", // Lavender accent
  success: "#22C55E",
  warning: "#EAB308",
  error: "#EF4444",
  info: "#3B82F6",
};

/**
 * All available color presets
 */
export const colorPresets = {
  silver: silverPalette,
  orange: orangePalette,
  green: greenPalette,
  indigo: indigoPalette,
  cyan: cyanPalette,
  pink: pinkPalette,
  purple: purplePalette,
  navy: navyPalette,
  natureGreen: natureGreenPalette,
  skyBlue: skyBluePalette,
  deepPurple: deepPurplePalette,
} as const;

export type ColorPresetName = keyof typeof colorPresets;
