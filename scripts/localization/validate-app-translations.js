#!/usr/bin/env node

/**
 * Validate app translation files for completeness
 *
 * Usage: node scripts/localization/validate-app-translations.js <app-path>
 */

const fs = require("fs");
const path = require("path");

function getAllKeys(obj, prefix = "") {
  let keys = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      keys = keys.concat(getAllKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys.sort();
}

function validateAppTranslations(appPath) {
  const appName = path.basename(appPath);
  console.log(`🔍 Validating app translations for ${appName}...\n`);

  // Find translations directory
  let translationsPath = path.join(appPath, "src/translations");
  if (!fs.existsSync(translationsPath)) {
    translationsPath = path.join(appPath, "translations");
  }

  if (!fs.existsSync(translationsPath)) {
    console.log(`⚠️  No translations directory found for ${appName}`);
    return;
  }

  // Get all translation files
  const files = fs
    .readdirSync(translationsPath)
    .filter((f) => f.endsWith(".ts") && f !== "index.ts")
    .sort();

  if (files.length === 0) {
    console.log(`⚠️  No translation files found`);
    return;
  }

  console.log(`📖 Found ${files.length} translation files\n`);

  // Load the reference file (English)
  const refFile = files.find((f) => f === "en.ts");
  if (!refFile) {
    console.log(`❌ No English (en.ts) reference file found`);
    return;
  }

  // Load reference keys by reading and parsing the file
  const refPath = path.join(translationsPath, refFile);
  const refFileContent = fs.readFileSync(refPath, "utf8");
  // Extract the default export object
  const match = refFileContent.match(/export\s+default\s+({[\s\S]*});?\s*$/m);
  if (!match) {
    console.log(`❌ Could not parse ${refFile}`);
    return;
  }
  // Use Function constructor instead of eval() for better security
  // This creates a sandboxed function with no access to local scope
  const refContent = new Function(`return ${match[1]}`)();
  const refKeys = getAllKeys(refContent);

  console.log(`📋 Reference (en.ts) has ${refKeys.length} keys\n`);

  const issues = [];
  let validCount = 0;

  // Validate each file
  files.forEach((file) => {
    const locale = path.basename(file, ".ts");
    const filePath = path.join(translationsPath, file);

    try {
      const fileContent = fs.readFileSync(filePath, "utf8");
      const match = fileContent.match(/export\s+default\s+({[\s\S]*});?\s*$/m);
      if (!match) {
        throw new Error("Could not parse file");
      }
      // Use Function constructor instead of eval() for better security
      const content = new Function(`return ${match[1]}`)();
      const keys = getAllKeys(content);

      const missing = refKeys.filter((k) => !keys.includes(k));
      const extra = keys.filter((k) => !refKeys.includes(k));

      if (missing.length === 0 && extra.length === 0) {
        console.log(`  ✅ ${locale} (${keys.length} keys)`);
        validCount++;
      } else {
        console.log(`  ❌ ${locale} (${keys.length} keys)`);
        if (missing.length > 0) {
          issues.push({ locale, type: "missing", keys: missing });
          console.log(`     Missing ${missing.length} keys`);
        }
        if (extra.length > 0) {
          issues.push({ locale, type: "extra", keys: extra });
          console.log(`     Extra ${extra.length} keys`);
        }
      }
    } catch (error) {
      console.log(`  ❌ ${locale}: ${error.message}`);
      issues.push({ locale, type: "error", error: error.message });
    }
  });

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`\nValidation Summary:`);
  console.log(`  • Total translation files: ${files.length}`);
  console.log(`  • Valid files: ${validCount}`);
  console.log(`  • Files with issues: ${files.length - validCount}`);
  console.log(`  • Reference key count: ${refKeys.length}`);

  if (issues.length > 0) {
    console.log(`\n❌ Found ${issues.length} issue(s):`);
    issues.forEach((issue) => {
      if (issue.type === "missing") {
        console.log(`\n  ${issue.locale} - Missing keys:`);
        issue.keys.slice(0, 5).forEach((k) => console.log(`    • ${k}`));
        if (issue.keys.length > 5) {
          console.log(`    ... and ${issue.keys.length - 5} more`);
        }
      } else if (issue.type === "extra") {
        console.log(`\n  ${issue.locale} - Extra keys:`);
        issue.keys.slice(0, 5).forEach((k) => console.log(`    • ${k}`));
        if (issue.keys.length > 5) {
          console.log(`    ... and ${issue.keys.length - 5} more`);
        }
      } else if (issue.type === "error") {
        console.log(`\n  ${issue.locale} - Error: ${issue.error}`);
      }
    });
    process.exit(1);
  } else {
    console.log(`\n✅ All translation files are valid!`);
  }
}

// Get app path from command line
const appPath = process.argv[2];

if (!appPath) {
  console.error("Usage: node scripts/localization/validate-app-translations.js <app-path>");
  console.error(
    "Example: node scripts/localization/validate-app-translations.js apps/numy"
  );
  process.exit(1);
}

try {
  validateAppTranslations(appPath);
} catch (error) {
  console.error("\n❌ Error during validation:", error.message);
  process.exit(1);
}
