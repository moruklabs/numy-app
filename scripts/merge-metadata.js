#!/usr/bin/env node

/**
 * Script to merge base-config.json with locale files into store.config.json
 * Includes validation to ensure proper JSON structure
 */

const fs = require("fs");
const path = require("path");

const BASE_CONFIG_PATH = path.join(__dirname, "../store-metadata/base-config.json");
const LOCALES_DIR = path.join(__dirname, "../store-metadata/locales");
const OUTPUT_PATH = path.join(__dirname, "../store.config.json");

// ASO validation rules
const VALIDATION_RULES = {
  title: { maxLength: 30, required: true },
  subtitle: { maxLength: 30, required: true },
  description: { maxLength: 4000, required: true },
  keywords: { minItems: 1, maxItems: 100, required: true },
  marketingUrl: { required: false },
  supportUrl: { required: false },
  privacyPolicyUrl: { required: false },
};

class ValidationError extends Error {
  constructor(locale, field, message) {
    super(`[${locale}] ${field}: ${message}`);
    this.locale = locale;
    this.field = field;
  }
}

function validateLocale(locale, data) {
  const errors = [];

  // Validate required fields
  for (const [field, rules] of Object.entries(VALIDATION_RULES)) {
    if (rules.required && !data[field]) {
      errors.push(new ValidationError(locale, field, "Field is required"));
      continue;
    }

    if (!data[field]) continue;

    // Validate string length
    if (rules.maxLength && typeof data[field] === "string") {
      if (data[field].length > rules.maxLength) {
        errors.push(
          new ValidationError(
            locale,
            field,
            `Exceeds maximum length of ${rules.maxLength} (current: ${data[field].length})`
          )
        );
      }
    }

    // Validate array
    if (field === "keywords") {
      if (!Array.isArray(data[field])) {
        errors.push(new ValidationError(locale, field, "Must be an array"));
      } else {
        if (rules.minItems && data[field].length < rules.minItems) {
          errors.push(
            new ValidationError(locale, field, `Must have at least ${rules.minItems} items`)
          );
        }
        if (rules.maxItems && data[field].length > rules.maxItems) {
          errors.push(
            new ValidationError(locale, field, `Must have at most ${rules.maxItems} items`)
          );
        }

        // Apple Store Connect specific validation:
        // Keywords are comma-separated with 100 character total limit
        const keywordsString = data[field].join(",");
        if (keywordsString.length > 100) {
          errors.push(
            new ValidationError(
              locale,
              field,
              `Comma-separated keywords exceed 100 characters (current: ${keywordsString.length})`
            )
          );
        }
      }
    }
  }

  return errors;
}

function mergeMetadata() {
  console.log("🔄 Merging metadata files...\n");

  // Read base config
  console.log("📖 Reading base-config.json...");
  const baseConfig = JSON.parse(fs.readFileSync(BASE_CONFIG_PATH, "utf8"));

  // Read all locale files
  console.log("📖 Reading locale files...\n");
  const localeFiles = fs
    .readdirSync(LOCALES_DIR)
    .filter((file) => file.endsWith(".json"))
    .sort();

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

      // Validate locale data
      const errors = validateLocale(localeName, localeData);
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

  // Merge into final config
  const finalConfig = {
    ...baseConfig,
    apple: {
      ...baseConfig.apple,
      info: locales,
    },
  };

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
  mergeMetadata();
} catch (error) {
  console.error("\n❌ Error merging metadata:", error.message);
  process.exit(1);
}
