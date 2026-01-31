/* eslint-env node */
/* global __dirname */
// @ts-check

const fs = require("node:fs");
const path = require("node:path");
const yaml = require("js-yaml");
const { z } = require("zod");

// @ts-ignore - __dirname is available in Node CJS but TS might complain if types are missing
const ADS_YAML_PATH = path.join(__dirname, "../ads.yaml");
// @ts-ignore
const FIREBASE_JSON_PATH = path.join(__dirname, "../firebase.json");

const AdUnitSchema = z.object({
  ad_unit_id: z.string(),
});

const AdConfigSchema = z.object({
  frequency: z.number(),
  interval: z.string(), // e.g., "1 day", "1 hour"
  ios: AdUnitSchema,
  android: AdUnitSchema,
  when: z.array(z.record(z.string())).optional(),
});

const AdsSchema = z.object({
  ads: z.object({
    app_name: z.string(),
    app_id: z.string(),
    enabled: z.object({
      ios: z.boolean(),
      android: z.boolean(),
    }),
    app_open: AdConfigSchema,
    interstitial: AdConfigSchema,
  }),
});

const FirebaseSchema = z.object({
  "react-native": z.object({
    analytics_auto_collection_enabled: z.literal(true),
    crashlytics_auto_collection_enabled: z.literal(true),
    crashlytics_debug_enabled: z.literal(true),
    crashlytics_ndk_enabled: z.literal(true),
    crashlytics_is_error_generation_on_js_crash_enabled: z.literal(true),
    perf_auto_collection_enabled: z.literal(true),
  }),
});

function validateAds() {
  try {
    // Validate ads.yaml
    if (!fs.existsSync(ADS_YAML_PATH)) {
      console.error("❌ ads.yaml not found at:", ADS_YAML_PATH);
      process.exit(1);
    }

    const adsFileContents = fs.readFileSync(ADS_YAML_PATH, "utf8");
    /** @type {any} */
    const adsData = yaml.load(adsFileContents);

    const adsResult = AdsSchema.safeParse(adsData);

    if (!adsResult.success) {
      console.error("❌ ads.yaml Schema Validation Failed:");
      console.error(JSON.stringify(adsResult.error.format(), null, 2));
      process.exit(1);
    }

    console.log("✅ ads.yaml schema is valid.");

    // Validate firebase.json
    if (!fs.existsSync(FIREBASE_JSON_PATH)) {
      console.error("❌ firebase.json not found at:", FIREBASE_JSON_PATH);
      process.exit(1);
    }

    const firebaseFileContents = fs.readFileSync(FIREBASE_JSON_PATH, "utf8");
    const firebaseData = JSON.parse(firebaseFileContents);

    const firebaseResult = FirebaseSchema.safeParse(firebaseData);

    if (!firebaseResult.success) {
      console.error("❌ firebase.json Schema Validation Failed:");
      console.error(JSON.stringify(firebaseResult.error.format(), null, 2));
      process.exit(1);
    }

    console.log("✅ firebase.json schema is valid.");

    // Validate apps/numy/GoogleService-Info.plist
    // @ts-ignore
    const PLIST_PATH = path.join(__dirname, "../apps/numy/GoogleService-Info.plist");
    if (!fs.existsSync(PLIST_PATH)) {
      console.error("❌ GoogleService-Info.plist not found at:", PLIST_PATH);
      process.exit(1);
    }
    const plistContent = fs.readFileSync(PLIST_PATH, "utf8");

    // Helper to extract boolean value from plist key
    /** @param {string} key */
    const getPlistBool = (key) => {
      // Matches <key>KEY</key> followed by <true/> or <true></true>
      const match = plistContent.match(
        new RegExp(String.raw`<key>${key}</key>\s*<([a-z]+)(?:/>|></[a-z]+>)`)
      );
      return match ? match[1] === "true" : null;
    };

    // Helper to extract string value from plist key
    /** @param {string} key */
    const getPlistString = (key) => {
      const match = plistContent.match(new RegExp(String.raw`<key>${key}</key>\s*<string>(.*?)</string>`));
      return match ? match[1] : null;
    };

    if (getPlistBool("IS_ADS_ENABLED") !== true) {
      console.error("❌ GoogleService-Info.plist: IS_ADS_ENABLED must be true");
      process.exit(1);
    }
    if (getPlistBool("IS_ANALYTICS_ENABLED") !== true) {
      console.error("❌ GoogleService-Info.plist: IS_ANALYTICS_ENABLED must be true");
      process.exit(1);
    }

    const plistAdMobId = getPlistString("ADMOB_APP_ID");
    // @ts-ignore
    if (plistAdMobId !== adsData.ads.app_id) {
      console.error(
        // @ts-ignore
        `❌ GoogleService-Info.plist ADMOB_APP_ID mismatch.\nExpected: ${adsData.ads.app_id}\nFound: ${plistAdMobId}`
      );
      process.exit(1);
    }
    console.log("✅ GoogleService-Info.plist is valid and consistent.");

    // Validate apps/numy/src/config/settings.ts
    // @ts-ignore
    const SETTINGS_PATH = path.join(__dirname, "../apps/numy/src/config/settings.ts");
    if (!fs.existsSync(SETTINGS_PATH)) {
      console.error("❌ src/config/settings.ts not found at:", SETTINGS_PATH);
      process.exit(1);
    }
    const settingsContent = fs.readFileSync(SETTINGS_PATH, "utf8");

    // Regex to capture iosAppId value
    const settingsMatch = settingsContent.match(/iosAppId:\s*"([^"]+)"/);
    const settingsAdMobId = settingsMatch ? settingsMatch[1] : null;

    // @ts-ignore
    if (settingsAdMobId !== adsData.ads.app_id) {
      console.error(
        // @ts-ignore
        `❌ src/config/settings.ts iosAppId mismatch.\nExpected: ${adsData.ads.app_id}\nFound: ${settingsAdMobId}`
      );
      process.exit(1);
    }
    console.log("✅ src/config/settings.ts is consistent.");

    process.exit(0);
  } catch (/** @type {any} */ error) {
    console.error("❌ Unexpected error:", error.message);
    process.exit(1);
  }
}

validateAds();
