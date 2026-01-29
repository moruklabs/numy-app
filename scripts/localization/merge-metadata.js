#!/usr/bin/env node

/**
 * Script to merge base-config.json with locale files into store.config.json
 * Includes validation to ensure proper JSON structure
 *
 * Usage: Run from app directory
 *   cd apps/numy
 *   node ../../scripts/localization/merge-metadata.js
 */

const fs = require("fs");
const path = require("path");
const { parseArgs } = require("util");
const { validateLocaleMetadata } = require("./lib/validators");
const { mergeMetadata } = require("./lib/mergers");

const BASE_CONFIG_PATH = path.join(process.cwd(), "store-metadata/base-config.json");
const LOCALES_DIR = path.join(process.cwd(), "store-metadata/locales");
const OUTPUT_PATH = path.join(process.cwd(), "store.config.json");

function mergeMetadataFiles() {
  console.log("🔄 Merging metadata files...\n");

  // Check if we're in an app directory
  if (!fs.existsSync(BASE_CONFIG_PATH)) {
    console.error("❌ Error: base-config.json not found.");
    console.error("   Make sure you run this script from an app directory.");
    console.error(
      "   Example: cd apps/numy && node ../../scripts/localization/merge-metadata.js"
    );
    process.exit(1);
  }

  // Read base config
  console.log("📖 Reading base-config.json...");
  const baseConfig = JSON.parse(fs.readFileSync(BASE_CONFIG_PATH, "utf8"));

  // Read all locale files
  console.log("📖 Reading locale files...\n");
  if (!fs.existsSync(LOCALES_DIR)) {
    console.error("❌ Error: locales directory not found at store-metadata/locales/");
    process.exit(1);
  }

  // Parse arguments
  const options = {
    "only-include": { type: "string" },
  };
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options,
    allowPositionals: true,
  });

  let localeFiles = fs
    .readdirSync(LOCALES_DIR)
    .filter((file) => file.endsWith(".json"))
    .sort();

  if (typeof values["only-include"] === "string") {
    const includedLocales = values["only-include"].split(",").map((s) => s.trim());
    console.log(`ℹ️  Filtering locales: ${includedLocales.join(", ")}`);
    localeFiles = localeFiles.filter((file) => {
      return includedLocales.includes(path.basename(file, ".json"));
    });
  }

  if (localeFiles.length === 0) {
    throw new Error("No locale files found in store-metadata/locales/");
  }

  const locales = {};
  const allErrors = [];

  localeFiles.forEach((file) => {
    const localeName = path.basename(file, ".json");
    const localePath = path.join(LOCALES_DIR, file);

    try {
      const localeData = JSON.parse(fs.readFileSync(localePath, "utf8"));

      // Validate locale data using shared validator
      const errors = validateLocaleMetadata(localeName, localeData);
      if (errors.length > 0) {
        allErrors.push(...errors);
      }

      locales[localeName] = localeData;
      console.log(`  ✅ ${localeName}`);
    } catch (error) {
      console.error(`  ❌ ${localeName}: ${error.message}`);
      allErrors.push(new Error(`Failed to parse ${file}: ${error.message}`));
    }
  });

  // Report validation errors
  if (allErrors.length > 0) {
    console.error("\n❌ Validation errors found:\n");
    allErrors.forEach((error) => console.error(`  • ${error.message}`));
    console.error(`\n❌ Found ${allErrors.length} validation error(s)`);
    process.exit(1);
  }

  // Merge into final config using shared merger
  const finalConfig = mergeMetadata(baseConfig, locales);

  // Write merged config
  console.log(`\n✍️  Writing merged config to store.config.json...`);
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(finalConfig, null, 2) + "\n");

  console.log(`\n✨ Merge complete!`);
  console.log(`   • Base config: 1 file`);
  console.log(`   • Locales: ${Object.keys(locales).length} files`);
  console.log(`   • Output: store.config.json (${fs.statSync(OUTPUT_PATH).size} bytes)`);
  console.log(`\n✅ All validations passed`);
}

try {
  mergeMetadataFiles();
} catch (error) {
  console.error("\n❌ Error merging metadata:", error.message);
  process.exit(1);
}
