#!/usr/bin/env node

/**
 * Backfill missing translation keys in numy
 */

const fs = require("fs");
const path = require("path");

const translationsPath = path.join(__dirname, "../../apps/numy/src/translations");

// Missing keys that need to be added (from validation)
const missingKeys = {
  "settings.dataPrivacy": "Data & Privacy",
  "settings.eraseAllData": "Erase All Data",
  "settings.eraseAllDataTitle": "Erase All Data",
  "settings.eraseAllDataMessage":
    "This will permanently delete all app data including your coin identification history. This action cannot be undone.",
  "settings.eraseAllDataConfirm": "Erase",
  "settings.eraseAllDataSuccess": "All data has been erased",
  "settings.eraseAllDataError": "Failed to erase data. Please try again.",
};

// Files to update (all except en.ts which already has the keys)
const filesToUpdate = [
  "ar",
  "ca",
  "cs",
  "da",
  "de",
  "el",
  "es",
  "fi",
  "fr",
  "he",
  "hi",
  "hr",
  "hu",
  "id",
  "it",
  "ja",
  "ko",
  "ms",
  "nl",
  "no",
  "pl",
  "pt",
  "ro",
  "ru",
  "sk",
  "sv",
  "th",
  "tr",
  "uk",
  "vi",
  "zh",
];

console.log("🔄 Backfilling missing translation keys...\n");

let updatedCount = 0;
let errorCount = 0;

filesToUpdate.forEach((locale) => {
  const filePath = path.join(translationsPath, `${locale}.ts`);

  try {
    let content = fs.readFileSync(filePath, "utf8");

    // Find the settings section - it ends with },\n  value: or },\n};
    const settingsMatch = content.match(/(settings:\s*\{[\s\S]*?)(},\s*\n\s*value:)/);

    if (settingsMatch) {
      const beforeClosing = settingsMatch[1];
      const afterClosing = settingsMatch[2];

      // Find the last key in settings (should be invalidAppStoreUrl)
      // Add the new keys before the closing brace
      const newKeys = `
    dataPrivacy: "Data & Privacy", // TODO: Translate
    eraseAllData: "Erase All Data", // TODO: Translate
    eraseAllDataTitle: "Erase All Data", // TODO: Translate
    eraseAllDataMessage:
      "This will permanently delete all app data including your coin identification history. This action cannot be undone.", // TODO: Translate
    eraseAllDataConfirm: "Erase", // TODO: Translate
    eraseAllDataSuccess: "All data has been erased", // TODO: Translate
    eraseAllDataError: "Failed to erase data. Please try again.", // TODO: Translate`;

      const updatedContent = content.replace(
        /(settings:\s*\{[\s\S]*?)(},\s*\n\s*value:)/,
        beforeClosing + newKeys + "\n  " + afterClosing
      );

      fs.writeFileSync(filePath, updatedContent, "utf8");
      console.log(`  ✅ Updated ${locale}.ts`);
      updatedCount++;
    } else {
      console.log(`  ⚠️  Could not find settings section in ${locale}.ts`);
      errorCount++;
    }
  } catch (error) {
    console.log(`  ❌ Error updating ${locale}.ts: ${error.message}`);
    errorCount++;
  }
});

console.log(`\n✨ Backfill complete!`);
console.log(`   • Updated: ${updatedCount} files`);
console.log(`   • Errors: ${errorCount} files`);

if (updatedCount > 0) {
  console.log(`\n⚠️  Note: Added keys have English placeholders with // TODO: Translate comments`);
  console.log(`   Please run a translation service to properly translate these keys.`);
}
