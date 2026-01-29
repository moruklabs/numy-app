#!/usr/bin/env bun

/**
 * Asset Generator
 *
 * Generates all required app assets (icons, splash screens) from template logo.
 * - Automatically detects source image in asset-template/ directory
 * - Supports .png, .jpg, and .jpeg formats
 * - Keeps logo centered without stretching
 * - Generates multiple sizes for iOS, Android, and Web
 * - Generates environment-specific icons (dev, preview, production)
 * - Preserves transparency
 */

import { existsSync, mkdirSync, readdirSync } from "fs";
import { join } from "path";

/**
 * Find the source image in asset-template directory
 */
function findSourceImage(): string {
  const templateDir = "asset-template";

  if (!existsSync(templateDir)) {
    throw new Error(`Template directory not found: ${templateDir}`);
  }

  const files = readdirSync(templateDir);
  const imageFiles = files.filter((file) => /\.(png|jpg|jpeg|avif)$/i.test(file));

  if (imageFiles.length === 0) {
    throw new Error(`No image files found in ${templateDir}/. Expected .png, .jpg, or .jpeg`);
  }

  if (imageFiles.length > 1) {
    console.warn(`⚠️  Multiple images found in ${templateDir}/: ${imageFiles.join(", ")}`);
    console.warn(`   Using: ${imageFiles[0]}`);
  }

  const sourcePath = join(templateDir, imageFiles[0]);
  console.log(`📸 Source image: ${sourcePath}`);
  return sourcePath;
}

// Get source image dynamically
let sourceImage: string;

// Asset configurations - will be initialized after finding source image
function getAssetsConfig(input: string) {
  return {
    icon: {
      input,
      output: "assets/images/icon.png",
      size: 1024,
      background: { r: 0, g: 0, b: 0, alpha: 0 }, // Transparent
    },
    iconDev: {
      input,
      output: "assets/images/icon-dev.png",
      size: 1024,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      badge: {
        text: "DEV",
        color: "#3B82F6", // Blue
        textColor: "#FFFFFF",
      },
    },
    iconPreview: {
      input,
      output: "assets/images/icon-preview.png",
      size: 1024,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      badge: {
        text: "PREV",
        color: "#F59E0B", // Orange
        textColor: "#FFFFFF",
      },
    },
    splash: {
      input,
      output: "assets/images/splash.png",
      width: 1284,
      height: 2778,
      logoScale: 0.4, // Logo takes 40% of splash screen
      background: { r: 0, g: 0, b: 0, alpha: 0 }, // Transparent background
    },
    favicon: {
      input,
      output: "assets/images/favicon.png",
      size: 48,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
    adaptiveIcon: {
      input,
      foreground: "assets/images/adaptive-icon.png",
      size: 1024,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  };
}

async function ensureDirectories() {
  const dirs = ["assets/images"];

  for (const dir of dirs) {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
      console.log(`✓ Created directory: ${dir}`);
    }
  }
}

/**
 * Generate SVG badge for environment labels
 */
function generateBadgeSVG(text: string, color: string, textColor: string, size: number): string {
  const badgeSize = Math.floor(size * 0.25); // Badge is 25% of icon size
  const fontSize = Math.floor(badgeSize * 0.35);
  const padding = Math.floor(badgeSize * 0.15);

  return `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <!-- Badge background -->
      <rect
        x="${size - badgeSize - padding}"
        y="${padding}"
        width="${badgeSize}"
        height="${badgeSize * 0.5}"
        rx="${badgeSize * 0.1}"
        fill="${color}"
      />
      <!-- Badge text -->
      <text
        x="${size - badgeSize / 2 - padding}"
        y="${padding + badgeSize * 0.38}"
        font-family="Arial, Helvetica, sans-serif"
        font-size="${fontSize}px"
        font-weight="bold"
        fill="${textColor}"
        text-anchor="middle"
      >${text}</text>
    </svg>
  `;
}

async function generateIcon(ASSETS_CONFIG: ReturnType<typeof getAssetsConfig>) {
  console.log("\n📱 Generating production app icon...");

  try {
    const sharp = (await import("sharp")).default;
    const { input, output, size, background } = ASSETS_CONFIG.icon;

    if (!existsSync(input)) {
      throw new Error(`Logo file not found: ${input}`);
    }

    await sharp(input)
      .resize(size, size, {
        fit: "contain",
        background,
      })
      .png()
      .toFile(output);

    console.log(`✓ Generated: ${output} (${size}x${size})`);
  } catch (error) {
    console.error("✗ Failed to generate icon:", error);
    throw error;
  }
}

async function generateEnvironmentIcon(
  config: {
    input: string;
    output: string;
    size: number;
    background: { r: number; g: number; b: number; alpha: number };
    badge: { text: string; color: string; textColor: string };
  },
  envName: string
) {
  console.log(`\n📱 Generating ${envName} app icon...`);

  try {
    const sharp = (await import("sharp")).default;
    const { input, output, size, background, badge } = config;

    if (!existsSync(input)) {
      throw new Error(`Logo file not found: ${input}`);
    }

    // Generate base icon
    const baseIcon = await sharp(input)
      .resize(size, size, {
        fit: "contain",
        background,
      })
      .png()
      .toBuffer();

    // Generate badge SVG
    const badgeSvg = generateBadgeSVG(badge.text, badge.color, badge.textColor, size);

    // Composite badge on top of icon
    await sharp(baseIcon)
      .composite([
        {
          input: Buffer.from(badgeSvg),
          top: 0,
          left: 0,
        },
      ])
      .png()
      .toFile(output);

    console.log(`✓ Generated: ${output} (${size}x${size} with ${badge.text} badge)`);
  } catch (error) {
    console.error(`✗ Failed to generate ${envName} icon:`, error);
    throw error;
  }
}

async function generateDevIcon(ASSETS_CONFIG: ReturnType<typeof getAssetsConfig>) {
  await generateEnvironmentIcon(ASSETS_CONFIG.iconDev, "development");
}

async function generatePreviewIcon(ASSETS_CONFIG: ReturnType<typeof getAssetsConfig>) {
  await generateEnvironmentIcon(ASSETS_CONFIG.iconPreview, "preview");
}

async function generateSplashScreen(ASSETS_CONFIG: ReturnType<typeof getAssetsConfig>) {
  console.log("\n🎨 Generating splash screen...");

  try {
    const sharp = (await import("sharp")).default;
    const { input, output, width, height, logoScale, background } = ASSETS_CONFIG.splash;

    if (!existsSync(input)) {
      throw new Error(`Logo file not found: ${input}`);
    }

    // Calculate logo size based on splash dimensions
    const logoSize = Math.min(width, height) * logoScale;

    // Resize logo to fit within splash screen
    const resizedLogo = await sharp(input)
      .resize(Math.floor(logoSize), Math.floor(logoSize), {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer();

    // Create transparent background and composite logo on center
    await sharp({
      create: {
        width,
        height,
        channels: 4,
        background,
      },
    })
      .composite([
        {
          input: resizedLogo,
          gravity: "center",
        },
      ])
      .png()
      .toFile(output);

    console.log(`✓ Generated: ${output} (${width}x${height} with transparent background)`);
  } catch (error) {
    console.error("✗ Failed to generate splash screen:", error);
    throw error;
  }
}

async function generateFavicon(ASSETS_CONFIG: ReturnType<typeof getAssetsConfig>) {
  console.log("\n🌐 Generating favicon...");

  try {
    const sharp = (await import("sharp")).default;
    const { input, output, size, background } = ASSETS_CONFIG.favicon;

    if (!existsSync(input)) {
      throw new Error(`Logo file not found: ${input}`);
    }

    await sharp(input)
      .resize(size, size, {
        fit: "contain",
        background,
      })
      .png()
      .toFile(output);

    console.log(`✓ Generated: ${output} (${size}x${size})`);
  } catch (error) {
    console.error("✗ Failed to generate favicon:", error);
    throw error;
  }
}

async function generateAdaptiveIcon(ASSETS_CONFIG: ReturnType<typeof getAssetsConfig>) {
  console.log("\n🤖 Generating Android adaptive icon...");

  try {
    const sharp = (await import("sharp")).default;
    const { input, foreground, size, background } = ASSETS_CONFIG.adaptiveIcon;

    if (!existsSync(input)) {
      throw new Error(`Logo file not found: ${input}`);
    }

    // Android adaptive icon should have safe zone (66% of canvas)
    const safeZoneScale = 0.66;
    const logoSize = Math.floor(size * safeZoneScale);

    await sharp(input)
      .resize(logoSize, logoSize, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .extend({
        top: Math.floor((size - logoSize) / 2),
        bottom: Math.floor((size - logoSize) / 2),
        left: Math.floor((size - logoSize) / 2),
        right: Math.floor((size - logoSize) / 2),
        background,
      })
      .png()
      .toFile(foreground);

    console.log(`✓ Generated: ${foreground} (${size}x${size})`);
  } catch (error) {
    console.error("✗ Failed to generate adaptive icon:", error);
    throw error;
  }
}

async function checkDependencies() {
  console.log("🔍 Checking dependencies...");

  try {
    await import("sharp");
    console.log("✓ sharp is installed");
  } catch (error) {
    console.error("\n✗ Missing dependency: sharp");
    console.error("\nPlease install sharp:");
    console.error("  yarnadd -d sharp");
    process.exit(1);
  }
}

async function main() {
  console.log("🚀 Asset Generator\n");
  console.log("Generating app assets from template logo...\n");

  try {
    await checkDependencies();

    // Find source image dynamically
    sourceImage = findSourceImage();
    const ASSETS_CONFIG = getAssetsConfig(sourceImage);

    await ensureDirectories();

    // Generate production icon
    await generateIcon(ASSETS_CONFIG);

    // Generate environment-specific icons
    await generateDevIcon(ASSETS_CONFIG);
    await generatePreviewIcon(ASSETS_CONFIG);

    // Generate other assets
    await generateSplashScreen(ASSETS_CONFIG);
    await generateFavicon(ASSETS_CONFIG);
    await generateAdaptiveIcon(ASSETS_CONFIG);

    console.log("\n✨ All assets generated successfully!\n");
    console.log("Generated files:");
    console.log("  📱 Production:");
    console.log("     - assets/images/icon.png (1024x1024)");
    console.log("  🔧 Development:");
    console.log("     - assets/images/icon-dev.png (1024x1024 with DEV badge)");
    console.log("  👁️  Preview:");
    console.log("     - assets/images/icon-preview.png (1024x1024 with PREV badge)");
    console.log("  🎨 Other:");
    console.log("     - assets/images/splash.png (1284x2778)");
    console.log("     - assets/images/favicon.png (48x48)");
    console.log("     - assets/images/adaptive-icon.png (1024x1024)");
    console.log("\n💡 Icons are ready for different environments!");
  } catch (error) {
    console.error("\n❌ Asset generation failed:", error);
    process.exit(1);
  }
}

main();
