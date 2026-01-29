#!/usr/bin/env node

/**
 * Generate permission localizations in app.json from translation files
 *
 * Usage: node scripts/localization/generate-permissions.js apps/numy
 */

const fs = require("fs");
const path = require("path");

function generatePermissions(appPath) {
  const appName = path.basename(appPath);
  console.log(`🔄 Generating permission localizations for ${appName}...\n`);

  const appJsonPath = path.join(appPath, "app.json");

  if (!fs.existsSync(appJsonPath)) {
    console.error(`❌ Error: app.json not found at ${appJsonPath}`);
    process.exit(1);
  }

  // Find translations directory
  let translationsPath = path.join(appPath, "src/translations");
  if (!fs.existsSync(translationsPath)) {
    translationsPath = path.join(appPath, "translations");
  }

  if (!fs.existsSync(translationsPath)) {
    console.log(`⚠️  No translations directory found for ${appName}`);
    return;
  }

  // Read app.json
  const appJson = JSON.parse(fs.readFileSync(appJsonPath, "utf8"));

  // Find expo-image-picker plugin
  const plugins = appJson.expo?.plugins || [];
  let imagePickerIndex = -1;

  for (let i = 0; i < plugins.length; i++) {
    if (Array.isArray(plugins[i]) && plugins[i][0] === "expo-image-picker") {
      imagePickerIndex = i;
      break;
    }
  }

  if (imagePickerIndex === -1) {
    console.log(`⚠️  expo-image-picker plugin not found in app.json`);
    return;
  }

  // Get available translation files
  const translationFiles = fs
    .readdirSync(translationsPath)
    .filter((file) => file.endsWith(".ts") && file !== "index.ts")
    .map((file) => path.basename(file, ".ts"));

  if (translationFiles.length === 0) {
    console.log(`⚠️  No translation files found`);
    return;
  }

  console.log(`📖 Found ${translationFiles.length} translation files`);

  // Get current permissions
  const pluginConfig = plugins[imagePickerIndex][1] || {};
  const basePhotosPermission =
    pluginConfig.photosPermission ||
    appJson.expo?.ios?.infoPlist?.NSPhotoLibraryUsageDescription ||
    "This app needs access to your photos.";
  const baseCameraPermission =
    pluginConfig.cameraPermission ||
    appJson.expo?.ios?.infoPlist?.NSCameraUsageDescription ||
    "This app needs access to your camera.";

  console.log(`   Base photos permission: "${basePhotosPermission}"`);
  console.log(`   Base camera permission: "${baseCameraPermission}"`);

  // For now, just ensure the base permissions are set
  // Full translation would require reading each translation file
  if (!plugins[imagePickerIndex][1]) {
    plugins[imagePickerIndex][1] = {};
  }

  plugins[imagePickerIndex][1].photosPermission = basePhotosPermission;
  plugins[imagePickerIndex][1].cameraPermission = baseCameraPermission;

  // Initialize localized permissions objects if not exists
  if (!plugins[imagePickerIndex][1].photosPermissionLocalized) {
    plugins[imagePickerIndex][1].photosPermissionLocalized = {};
  }
  if (!plugins[imagePickerIndex][1].cameraPermissionLocalized) {
    plugins[imagePickerIndex][1].cameraPermissionLocalized = {};
  }

  console.log(`\n✅ Permission base configuration updated`);
  console.log(
    `   Note: Manual translation of permissions to ${translationFiles.length} locales recommended`
  );

  // Write back to app.json
  fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + "\n");

  console.log(`\n✨ Generation complete!`);
}

// Get app path from command line arguments
const appPath = process.argv[2];

if (!appPath) {
  console.error("Usage: node scripts/localization/generate-permissions.js <app-path>");
  console.error("Example: node scripts/localization/generate-permissions.js apps/numy");
  process.exit(1);
}

try {
  generatePermissions(appPath);
} catch (error) {
  console.error("\n❌ Error generating permissions:", error.message);
  process.exit(1);
}
