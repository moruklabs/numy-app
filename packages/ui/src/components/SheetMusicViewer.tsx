/**
 * SheetMusicViewer Component
 *
 * Displays sheet music images with color inversion, contrast adjustment,
 * and other optimizations for iPad/tablet viewing.
 *
 * Features:
 * - Color mode switching (Normal, Inverted, Sepia)
 * - Real-time contrast adjustment
 * - High-quality rendering for Retina displays
 * - SVG-based color filters for optimal performance
 */

import React from "react";
import { Image, StyleSheet, View } from "react-native";
import Svg, { Defs, FeColorMatrix, Filter, Image as SvgImage } from "react-native-svg";

export type ColorMode = "normal" | "inverted" | "sepia";

interface SheetMusicViewerProps {
  /**
   * URI of the sheet music image to display
   */
  uri: string;

  /**
   * Color mode for the display
   * @default "normal"
   */
  colorMode?: ColorMode;

  /**
   * Contrast adjustment value
   * Range: 0.5 to 2.0
   * @default 1.0
   */
  contrast?: number;

  /**
   * Brightness adjustment value
   * Range: 0.5 to 2.0
   * @default 1.0
   */
  brightness?: number;

  /**
   * Width of the viewer
   */
  width: number;

  /**
   * Height of the viewer
   */
  height: number;

  /**
   * Callback when image is loaded
   */
  onLoad?: () => void;

  /**
   * Callback when image fails to load
   */
  onError?: (error: any) => void;
}

/**
 * Color matrices for different color modes
 * These are 5x4 matrices used by SVG feColorMatrix filter
 */
const COLOR_MATRICES = {
  normal: "1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0",
  inverted: "-1 0 0 0 1  0 -1 0 0 1  0 0 -1 0 1  0 0 0 1 0",
  sepia: "0.393 0.769 0.189 0 0  0.349 0.686 0.168 0 0  0.272 0.534 0.131 0 0  0 0 0 1 0",
};

/**
 * Brightness scaling factor for color matrix offset calculation
 */
const BRIGHTNESS_OFFSET_SCALE = 0.5;

/**
 * Calculate the complete color matrix with contrast and brightness adjustments
 */
function calculateColorMatrix(
  colorMode: ColorMode,
  contrast: number = 1.0,
  brightness: number = 1.0
): string {
  // Start with the base color mode matrix
  const baseMatrix = COLOR_MATRICES[colorMode];

  // If no adjustments needed, return base matrix
  if (contrast === 1.0 && brightness === 1.0) {
    return baseMatrix;
  }

  // For simplicity, we'll apply contrast and brightness via the matrix
  // This is a simplified approach - in production, you might want to
  // compose multiple matrices for more precise control
  const brightnessOffset = (brightness - 1.0) * BRIGHTNESS_OFFSET_SCALE;

  // Parse the base matrix
  const values = baseMatrix.split(" ").map(Number);

  // Apply contrast to RGB channels (indices 0, 6, 12)
  values[0] *= contrast;
  values[6] *= contrast;
  values[12] *= contrast;

  // Apply brightness offset (indices 4, 9, 14)
  values[4] += brightnessOffset;
  values[9] += brightnessOffset;
  values[14] += brightnessOffset;

  return values.join(" ");
}

/**
 * SheetMusicViewer component
 * Uses SVG filters for hardware-accelerated color transformations
 */
export const SheetMusicViewer: React.FC<SheetMusicViewerProps> = ({
  uri,
  colorMode = "normal",
  contrast = 1.0,
  brightness = 1.0,
  width,
  height,
  onLoad,
  onError,
}) => {
  const colorMatrix = calculateColorMatrix(colorMode, contrast, brightness);

  // Handle image errors via a hidden Image component
  React.useEffect(() => {
    if (onError && uri) {
      Image.prefetch(uri).catch((error) => {
        onError(error);
      });
    }
  }, [uri, onError]);

  return (
    <View style={[styles.container, { width, height }]}>
      <Svg width={width} height={height}>
        <Defs>
          <Filter id="sheetMusicFilter">
            <FeColorMatrix type="matrix" values={colorMatrix} />
          </Filter>
        </Defs>
        <SvgImage
          width={width}
          height={height}
          href={uri}
          filter="url(#sheetMusicFilter)"
          preserveAspectRatio="xMidYMid meet"
          onLoad={onLoad}
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#000",
    overflow: "hidden",
  },
});

/**
 * Simple wrapper that uses Image component instead of SVG
 * Useful when filters are not needed
 */
export const SimpleSheetMusicViewer: React.FC<
  Omit<SheetMusicViewerProps, "colorMode" | "contrast" | "brightness">
> = ({ uri, width, height, onLoad, onError }) => {
  return (
    <View style={[styles.container, { width, height }]}>
      <Image
        source={{ uri }}
        style={{ width, height }}
        resizeMode="contain"
        onLoad={onLoad}
        onError={onError}
      />
    </View>
  );
};
