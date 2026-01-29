#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const MINDAY_METADATA_DIR = path.join(
  __dirname,
  "..",
  "..",
  "apps",
  "minday",
  "store-metadata",
  "locales"
);
const TEMPLATE_FILE = path.join(MINDAY_METADATA_DIR, "en-US.json");

// All 39 store metadata locales
const ALL_STORE_LOCALES = [
  "ar-SA",
  "ca",
  "cs",
  "da",
  "de-DE",
  "el",
  "en-AU",
  "en-CA",
  "en-GB",
  "en-US",
  "es-ES",
  "es-MX",
  "fi",
  "fr-CA",
  "fr-FR",
  "he",
  "hi",
  "hr",
  "hu",
  "id",
  "it",
  "ja",
  "ko",
  "ms",
  "nl-NL",
  "no",
  "pl",
  "pt-BR",
  "pt-PT",
  "ro",
  "ru",
  "sk",
  "sv",
  "th",
  "tr",
  "uk",
  "vi",
  "zh-Hans",
  "zh-Hant",
];

console.log("🚀 Backfilling missing store metadata locales for minday...\n");

// Get existing locales
const existingFiles = fs
  .readdirSync(MINDAY_METADATA_DIR)
  .filter((f) => f.endsWith(".json"))
  .map((f) => f.replace(".json", ""));

console.log(`📊 Status: ${existingFiles.length}/39 locales exist`);

// Find missing locales
const missingLocales = ALL_STORE_LOCALES.filter((l) => !existingFiles.includes(l));

if (missingLocales.length === 0) {
  console.log("✅ All 39 store metadata locales already exist!");
  process.exit(0);
}

console.log(`\n📝 Missing ${missingLocales.length} locales:\n   ${missingLocales.join(", ")}\n`);

// Read template
const template = JSON.parse(fs.readFileSync(TEMPLATE_FILE, "utf-8"));

// Create missing locale files
missingLocales.forEach((locale) => {
  const outputPath = path.join(MINDAY_METADATA_DIR, `${locale}.json`);

  // Create a copy with TODO comment in description
  const localeData = {
    ...template,
    description: `TODO: Translate to ${locale}\n\n${template.description}`,
  };

  fs.writeFileSync(outputPath, JSON.stringify(localeData, null, 2) + "\n", "utf-8");
  console.log(`✅ Created ${locale}.json`);
});

console.log(`\n✨ Successfully created ${missingLocales.length} store metadata files!`);
console.log(`📁 Location: ${MINDAY_METADATA_DIR}`);
console.log(`\n💡 Next steps:`);
console.log(`   1. Translate the description, title, subtitle, and keywords in each file`);
console.log(`   2. Remove the TODO comment after translation`);
console.log(`   3. Run: node scripts/localization/validate-metadata.js`);
