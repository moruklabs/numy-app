#!/usr/bin/env node

/**
 * Validate all localization metadata across all apps
 *
 * Usage: node scripts/localization/validate-metadata.js
 */

const fs = require("fs");
const path = require("path");
const { validateLocaleMetadata } = require("./lib/validators");

function validateApp(appPath) {
  const appName = path.basename(appPath);
  const errors = [];

  // Check for store-metadata
  const metadataPath = path.join(appPath, "store-metadata");
  if (!fs.existsSync(metadataPath)) {
    return { appName, errors: ["No store-metadata directory found"], hasMetadata: false };
  }

  const localesPath = path.join(metadataPath, "locales");
  if (!fs.existsSync(localesPath)) {
    return { appName, errors: ["No locales directory found"], hasMetadata: false };
  }

  // Validate each locale file
  const localeFiles = fs
    .readdirSync(localesPath)
    .filter((file) => file.endsWith(".json"))
    .sort();

  localeFiles.forEach((file) => {
    const localeName = path.basename(file, ".json");
    const localePath = path.join(localesPath, file);

    try {
      const localeData = JSON.parse(fs.readFileSync(localePath, "utf8"));
      const validationErrors = validateLocaleMetadata(localeName, localeData);

      if (validationErrors.length > 0) {
        errors.push(...validationErrors.map((e) => e.message));
      }
    } catch (error) {
      errors.push(`${localeName}: Failed to parse - ${error.message}`);
    }
  });

  return {
    appName,
    errors,
    localeCount: localeFiles.length,
    hasMetadata: true,
  };
}

function validateAllApps() {
  console.log("🔍 Validating localization metadata for all apps...\n");

  const appsDir = path.join(process.cwd(), "apps");
  const isMonorepo = fs.existsSync(appsDir);

  let totalErrors = 0;
  let validApps = 0;
  const results = [];

  if (isMonorepo) {
    const apps = fs.readdirSync(appsDir).filter((name) => {
      const appPath = path.join(appsDir, name);
      return fs.statSync(appPath).isDirectory();
    });

    apps.forEach((appName) => {
      const appPath = path.join(appsDir, appName);
      const result = validateApp(appPath);
      results.push(result);
    });
  } else {
    // Single-app mode: validate current directory as the app
    const result = validateApp(process.cwd());
    results.push(result);
  }

  results.forEach((result) => {
    if (result.hasMetadata) {
      if (result.errors.length === 0) {
        console.log(`✅ ${result.appName} (${result.localeCount} locales)`);
        validApps++;
      } else {
        console.log(
          `❌ ${result.appName} (${result.localeCount} locales) - ${result.errors.length} errors`
        );
        result.errors.forEach((error) => {
          console.log(`   • ${error}`);
        });
        totalErrors += result.errors.length;
      }
    } else {
      console.log(`⚠️  ${result.appName} - ${result.errors[0]}`);
    }
  });

  const totalApps = results.length;
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`\nValidation Summary:`);
  console.log(`  • Total apps: ${totalApps}`);
  console.log(`  • Valid apps: ${validApps}`);
  console.log(
    `  • Apps with errors: ${results.filter((r) => r.hasMetadata && r.errors.length > 0).length}`
  );
  console.log(`  • Apps without metadata: ${results.filter((r) => !r.hasMetadata).length}`);
  console.log(`  • Total errors: ${totalErrors}`);

  if (totalErrors > 0) {
    console.log(`\n❌ Validation failed with ${totalErrors} error(s)`);
    process.exit(1);
  } else {
    console.log(`\n✅ All validations passed!`);
  }
}

try {
  validateAllApps();
} catch (error) {
  console.error("\n❌ Error during validation:", error.message);
  process.exit(1);
}
