#!/usr/bin/env node

/**
 * Sync Translation Keys
 *
 * This script ensures all translation files have the same keys as the English source.
 * For missing keys, it adds them with the English text as a placeholder to be translated.
 *
 * Usage: node sync-translation-keys.js [app-name]
 */

const fs = require("fs");
const path = require("path");

const APPS_DIR = path.join(__dirname, "apps");

const ACTIVE_APPS = [
  "numy",
  "interval-timer",
  "minday",
  "numy",
  "plant-doctor",
  "rizzman",
  "stone-identifier",
];

/**
 * Parse TypeScript translation file and extract the exported object
 */
function parseTypeScriptTranslation(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf-8");

    // Find the start of "export default {"
    const startMatch = content.match(/export\s+default\s+\{/);
    if (!startMatch) return null;

    const startIndex = startMatch.index + startMatch[0].length - 1;

    // Find the matching closing brace
    let braceCount = 0;
    let endIndex = -1;
    for (let i = startIndex; i < content.length; i++) {
      if (content[i] === "{") braceCount++;
      else if (content[i] === "}") {
        braceCount--;
        if (braceCount === 0) {
          endIndex = i;
          break;
        }
      }
    }

    if (endIndex === -1) return null;

    let objString = content.substring(startIndex, endIndex + 1);
    objString = objString.replace(/`([^`]*)`/g, '"$1"');
    objString = objString.replace(/,(\s*[}\]])/g, "$1");
    objString = objString.replace(/:\s*\([^)]*\)\s*=>\s*/g, ": ");

    try {
      return eval("(" + objString + ")");
    } catch {
      return null;
    }
  } catch {
    return null;
  }
}

/**
 * Get all keys from an object (nested paths)
 */
function getAllKeys(obj, prefix = "") {
  const keys = [];

  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (typeof obj[key] === "object" && obj[key] !== null && !Array.isArray(obj[key])) {
      keys.push(...getAllKeys(obj[key], fullKey));
    } else {
      keys.push(fullKey);
    }
  }

  return keys;
}

/**
 * Get value from nested object path
 */
function getValueByPath(obj, path) {
  const keys = path.split(".");
  let value = obj;

  for (const key of keys) {
    if (value && typeof value === "object" && key in value) {
      value = value[key];
    } else {
      return undefined;
    }
  }

  return value;
}

/**
 * Set value in nested object path
 */
function setValueByPath(obj, path, value) {
  const keys = path.split(".");
  let current = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!(key in current) || typeof current[key] !== "object") {
      current[key] = {};
    }
    current = current[key];
  }

  current[keys[keys.length - 1]] = value;
}

/**
 * Convert object to TypeScript code
 */
function objectToTypeScript(obj, indent = 2) {
  const spaces = " ".repeat(indent);
  let result = "{\n";

  for (const key in obj) {
    const value = obj[key];
    result += `${spaces}${key}: `;

    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      result += objectToTypeScript(value, indent + 2);
    } else if (typeof value === "string") {
      // Escape special characters
      const escaped = value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
      result += `"${escaped}"`;
    } else {
      result += JSON.stringify(value);
    }

    result += ",\n";
  }

  result += " ".repeat(indent - 2) + "}";
  return result;
}

/**
 * Sync keys for TypeScript-based translations
 */
function syncTsTranslations(appName) {
  const tsPath = path.join(APPS_DIR, appName, "src", "translations");
  if (!fs.existsSync(tsPath)) return 0;

  // Read English source
  const englishPath = path.join(tsPath, "en.ts");
  if (!fs.existsSync(englishPath)) {
    console.log(`  ⚠️  No English source file found`);
    return 0;
  }

  const englishData = parseTypeScriptTranslation(englishPath);
  if (!englishData) {
    console.log(`  ⚠️  Failed to parse English translation file`);
    return 0;
  }

  const englishKeys = getAllKeys(englishData);
  console.log(`  📖 English source has ${englishKeys.length} keys`);

  // Process each other language file
  const files = fs
    .readdirSync(tsPath)
    .filter((f) => f.endsWith(".ts") && f !== "index.ts" && f !== "en.ts");

  let totalAdded = 0;

  for (const file of files) {
    const lang = file.replace(".ts", "");
    const langPath = path.join(tsPath, file);
    const langData = parseTypeScriptTranslation(langPath);

    if (!langData) {
      console.log(`  ⚠️  ${lang}: Failed to parse`);
      continue;
    }

    const langKeys = getAllKeys(langData);
    const missingKeys = englishKeys.filter((key) => !langKeys.includes(key));

    if (missingKeys.length === 0) {
      console.log(`  ✅ ${lang}: All keys present`);
      continue;
    }

    console.log(`  🔧 ${lang}: Adding ${missingKeys.length} missing keys`);

    // Add missing keys with English values
    for (const key of missingKeys) {
      const value = getValueByPath(englishData, key);
      setValueByPath(langData, key, value);
    }

    // Write updated file
    const header = fs.readFileSync(langPath, "utf-8").split("export default")[0];
    const newContent = header + "export default " + objectToTypeScript(langData) + ";\n";

    fs.writeFileSync(langPath, newContent, "utf-8");

    totalAdded += missingKeys.length;
  }

  return totalAdded;
}

/**
 * Sync keys for JSON-based translations (like numy)
 */
function syncJsonTranslations(appName) {
  const localesPath = path.join(APPS_DIR, appName, "src", "locales");
  if (!fs.existsSync(localesPath)) return 0;

  // Read English source files
  const enPath = path.join(localesPath, "en");
  if (!fs.existsSync(enPath)) {
    console.log(`  ⚠️  No English locale directory found`);
    return 0;
  }

  const enFiles = fs.readdirSync(enPath).filter((f) => f.endsWith(".json"));
  console.log(`  📖 English source has ${enFiles.length} JSON files`);

  let totalAdded = 0;

  // Get all language directories (except en)
  const langDirs = fs.readdirSync(localesPath).filter((d) => {
    const stat = fs.statSync(path.join(localesPath, d));
    return stat.isDirectory() && d !== "en";
  });

  for (const lang of langDirs) {
    const langPath = path.join(localesPath, lang);
    let langAdded = 0;

    // Process each JSON file
    for (const jsonFile of enFiles) {
      const enFilePath = path.join(enPath, jsonFile);
      const langFilePath = path.join(langPath, jsonFile);

      const enData = JSON.parse(fs.readFileSync(enFilePath, "utf-8"));

      if (!fs.existsSync(langFilePath)) {
        console.log(`  🔧 ${lang}/${jsonFile}: Creating missing file`);
        fs.writeFileSync(langFilePath, JSON.stringify(enData, null, 2), "utf-8");
        langAdded += Object.keys(enData).length;
        continue;
      }

      const langData = JSON.parse(fs.readFileSync(langFilePath, "utf-8"));
      const enKeys = Object.keys(enData);
      const langKeys = Object.keys(langData);
      const missingKeys = enKeys.filter((key) => !langKeys.includes(key));

      if (missingKeys.length === 0) continue;

      console.log(`  🔧 ${lang}/${jsonFile}: Adding ${missingKeys.length} missing keys`);

      // Add missing keys
      for (const key of missingKeys) {
        langData[key] = enData[key];
      }

      fs.writeFileSync(langFilePath, JSON.stringify(langData, null, 2), "utf-8");
      langAdded += missingKeys.length;
    }

    if (langAdded > 0) {
      console.log(`  ✅ ${lang}: Added ${langAdded} keys total`);
      totalAdded += langAdded;
    }
  }

  return totalAdded;
}

/**
 * Main
 */
function main() {
  const targetApp = process.argv[2];
  let apps = ACTIVE_APPS;

  if (targetApp) {
    if (ACTIVE_APPS.includes(targetApp)) {
      apps = [targetApp];
    } else {
      console.error(`Error: '${targetApp}' is not an active app`);
      console.error(`Active apps: ${ACTIVE_APPS.join(", ")}`);
      process.exit(1);
    }
  }

  console.log("🔄 Syncing Translation Keys\n");

  let totalKeysAdded = 0;

  for (const appName of apps) {
    console.log(`📱 ${appName}`);

    const tsAdded = syncTsTranslations(appName);
    const jsonAdded = syncJsonTranslations(appName);

    const appTotal = tsAdded + jsonAdded;

    if (appTotal > 0) {
      console.log(`  ✨ Added ${appTotal} keys total\n`);
      totalKeysAdded += appTotal;
    } else {
      console.log(`  ✅ All keys synced\n`);
    }
  }

  console.log("===================================");
  console.log(`✅ Total keys added: ${totalKeysAdded}`);

  if (totalKeysAdded > 0) {
    console.log("\n⚠️  Note: Missing keys have been filled with English text.");
    console.log("   Run translate-localization.js to translate them.");
  }
}

main();
