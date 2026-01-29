#!/usr/bin/env node

/**
 * Sync CFBundleLocalizations in app.json with available translation files
 *
 * Usage: node scripts/localization/sync-cfbundle.js apps/numy
 */

const fs = require("fs");
const path = require("path");
const { generateCFBundleLocalizations } = require("./lib/generators");

function syncCFBundleLocalizations(appPath) {
  const appName = path.basename(appPath);
  console.log(`🔄 Syncing CFBundleLocalizations for ${appName}...\n`);

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
    console.log(`   Checked: src/translations/ and translations/`);
    return;
  }

  // Generate locale codes from translation files
  const locales = generateCFBundleLocalizations(translationsPath);

  if (locales.length === 0) {
    console.log(`⚠️  No translation files found in ${translationsPath}`);
    return;
  }

  console.log(`📖 Found ${locales.length} translation locales:`);
  console.log(`   ${locales.join(", ")}\n`);

  // Read app.json
  const appJson = JSON.parse(fs.readFileSync(appJsonPath, "utf8"));

  // Update CFBundleLocalizations
  if (!appJson.expo) appJson.expo = {};
  if (!appJson.expo.ios) appJson.expo.ios = {};
  if (!appJson.expo.ios.infoPlist) appJson.expo.ios.infoPlist = {};

  const oldLocales = appJson.expo.ios.infoPlist.CFBundleLocalizations || [];
  appJson.expo.ios.infoPlist.CFBundleLocalizations = locales;

  // Write back to app.json
  fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + "\n");

  console.log(`✅ Updated CFBundleLocalizations in app.json`);
  console.log(`   Before: ${oldLocales.length > 0 ? oldLocales.join(", ") : "Not set"}`);
  console.log(`   After:  ${locales.join(", ")}`);
  console.log(`\n✨ Sync complete!`);
}

// Get app path from command line arguments
const appPath = process.argv[2];

if (!appPath) {
  console.error("Usage: node scripts/localization/sync-cfbundle.js <app-path>");
  console.error("Example: node scripts/localization/sync-cfbundle.js apps/numy");
  process.exit(1);
}

try {
  syncCFBundleLocalizations(appPath);
} catch (error) {
  console.error("\n❌ Error syncing CFBundleLocalizations:", error.message);
  process.exit(1);
}
