#!/usr/bin/env node

/**
 * Validates all app.json files in the monorepo.
 *
 * Checks:
 * - Valid JSON structure
 * - ios.supportsTablet must be false (except for TABLET_SUPPORTED_APPS)
 * - Required Expo fields: name, slug, version
 * - Bundle identifiers are properly formatted
 */

const fs = require("fs");
const path = require("path");

const APPS_DIR = path.join(__dirname, "apps");

// Apps that support tablet (exceptions to the default rule)
const TABLET_SUPPORTED_APPS = ["pet-doctor", "plant-doctor", "rizzman"];

function getAppDirectories() {
  return fs.readdirSync(APPS_DIR).filter((name) => {
    const appPath = path.join(APPS_DIR, name);
    return fs.statSync(appPath).isDirectory() && fs.existsSync(path.join(appPath, "app.json"));
  });
}

function validateSupportsTablet(appJson, appName) {
  const supportsTablet = appJson?.expo?.ios?.supportsTablet;
  const shouldSupportTablet = TABLET_SUPPORTED_APPS.includes(appName);

  if (shouldSupportTablet) {
    if (supportsTablet !== true) {
      return `ios.supportsTablet must be true for ${appName}, got: ${JSON.stringify(supportsTablet)}`;
    }
  } else {
    if (supportsTablet !== false) {
      return `ios.supportsTablet must be false, got: ${JSON.stringify(supportsTablet)}`;
    }
  }

  return null;
}

function validateRequiredFields(appJson) {
  const errors = [];
  const expo = appJson?.expo;

  if (!expo) {
    return ["Missing expo configuration"];
  }

  if (!expo.name) {
    errors.push("Missing expo.name");
  }

  if (!expo.slug) {
    errors.push("Missing expo.slug");
  }

  if (!expo.version) {
    errors.push("Missing expo.version");
  }

  return errors;
}

function validateBundleIdentifier(appJson) {
  const errors = [];
  const bundleId = appJson?.expo?.ios?.bundleIdentifier;
  const packageName = appJson?.expo?.android?.package;

  if (bundleId && !/^[a-zA-Z][a-zA-Z0-9]*(\.[a-zA-Z][a-zA-Z0-9]*)+$/.test(bundleId)) {
    errors.push(`Invalid iOS bundle identifier format: ${bundleId}`);
  }

  if (packageName && !/^[a-zA-Z][a-zA-Z0-9]*(\.[a-zA-Z][a-zA-Z0-9]*)+$/.test(packageName)) {
    errors.push(`Invalid Android package name format: ${packageName}`);
  }

  return errors;
}

function validateApp(appName) {
  const appJsonPath = path.join(APPS_DIR, appName, "app.json");
  const errors = [];

  try {
    const content = fs.readFileSync(appJsonPath, "utf-8");
    const appJson = JSON.parse(content);

    // Validate required fields
    errors.push(...validateRequiredFields(appJson));

    // Validate supportsTablet
    const tabletError = validateSupportsTablet(appJson, appName);
    if (tabletError) {
      errors.push(tabletError);
    }

    // Validate bundle identifiers
    errors.push(...validateBundleIdentifier(appJson));
  } catch (err) {
    if (err instanceof SyntaxError) {
      errors.push(`Invalid JSON: ${err.message}`);
    } else {
      errors.push(`Failed to read app.json: ${err.message}`);
    }
  }

  return errors;
}

function main() {
  const apps = getAppDirectories();
  let hasErrors = false;
  let totalTests = 0;
  let passedTests = 0;

  console.log("App Config Tests");
  console.log("================\n");

  for (const appName of apps) {
    totalTests++;
    const errors = validateApp(appName);

    if (errors.length > 0) {
      hasErrors = true;
      console.log(`FAIL ${appName}/app.json`);
      errors.forEach((err) => console.log(`  - ${err}`));
      console.log("");
    } else {
      passedTests++;
      console.log(`PASS ${appName}/app.json`);
    }
  }

  console.log("");
  console.log(`Tests: ${passedTests}/${totalTests} passed`);

  if (hasErrors) {
    process.exit(1);
  } else {
    console.log("\nAll app config tests passed!");
    process.exit(0);
  }
}

main();
