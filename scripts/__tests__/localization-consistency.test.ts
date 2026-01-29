/**
 * Localization Consistency Tests
 *
 * These tests ensure all apps in the monorepo have consistent localization:
 * - 32 in-app translation files (32 languages)
 * - 39 store metadata locale files (39 locales)
 * - Consistent translation paths (src/translations/)
 * - Consistent store metadata paths (store-metadata/locales/)
 *
 * Standard languages (32 in-app):
 * ar, ca, cs, da, de, el, en, es, fi, fr, he, hi, hr, hu, id, it,
 * ja, ko, ms, nl, no, pl, pt, ro, ru, sk, sv, th, tr, uk, vi, zh
 *
 * Standard store metadata locales (39):
 * ar-SA, ca, cs, da, de-DE, el, en-AU, en-CA, en-GB, en-US, es-ES, es-MX,
 * fi, fr-CA, fr-FR, he, hi, hr, hu, id, it, ja, ko, ms, nl-NL, no, pl,
 * pt-BR, pt-PT, ro, ru, sk, sv, th, tr, uk, vi, zh-Hans, zh-Hant
 */

import * as fs from "fs";
import * as path from "path";

// All active apps in the monorepo
const ACTIVE_APPS = [
  "numy",
  "interval-timer",
  "minday",
  "numy",
  "plant-doctor",
  "rizzman",
  "stone-identifier",
] as const;

// Standard 32 in-app translation languages
const STANDARD_LANGUAGES = [
  "ar",
  "ca",
  "cs",
  "da",
  "de",
  "el",
  "en",
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
] as const;

// Standard 39 store metadata locales
const STANDARD_STORE_LOCALES = [
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
] as const;

const EXPECTED_TRANSLATION_COUNT = STANDARD_LANGUAGES.length; // 32
const EXPECTED_STORE_METADATA_COUNT = STANDARD_STORE_LOCALES.length; // 39

// Standard paths
const STANDARD_TRANSLATION_PATH = "src/translations";
const STANDARD_STORE_METADATA_PATH = "store-metadata/locales";

// Get the monorepo root
const getMonorepoRoot = (): string => {
  // Start from this test file and find the mobile directory
  let currentDir = __dirname;
  while (currentDir !== "/") {
    if (fs.existsSync(path.join(currentDir, "apps"))) {
      return currentDir;
    }
    currentDir = path.dirname(currentDir);
  }
  throw new Error("Could not find monorepo root");
};

const MONOREPO_ROOT = getMonorepoRoot();

// Helper to get app directory
const getAppDir = (app: string): string => path.join(MONOREPO_ROOT, "apps", app);

// Helper to check if path exists
const pathExists = (p: string): boolean => fs.existsSync(p);

// Helper to get files in directory
const getFilesInDir = (dir: string, extension: string): string[] => {
  if (!pathExists(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(extension) && file !== "index.ts")
    .map((file) => file.replace(extension, ""));
};

// Helper to get translation files (excluding index.ts)
const getTranslationFiles = (appDir: string): string[] => {
  const translationsDir = path.join(appDir, STANDARD_TRANSLATION_PATH);
  return getFilesInDir(translationsDir, ".ts");
};

// Helper to get store metadata files
const getStoreMetadataFiles = (appDir: string): string[] => {
  const metadataDir = path.join(appDir, STANDARD_STORE_METADATA_PATH);
  return getFilesInDir(metadataDir, ".json");
};

// Check if app uses standard translation path
const usesStandardTranslationPath = (appDir: string): boolean => {
  const standardPath = path.join(appDir, STANDARD_TRANSLATION_PATH);
  return pathExists(standardPath) && fs.readdirSync(standardPath).length > 0;
};

// Check if app uses standard store metadata path
const usesStandardStoreMetadataPath = (appDir: string): boolean => {
  const standardPath = path.join(appDir, STANDARD_STORE_METADATA_PATH);
  return pathExists(standardPath) && fs.readdirSync(standardPath).length > 0;
};

// Find what translation path the app actually uses
const findActualTranslationPath = (appDir: string): string | null => {
  const possiblePaths = ["src/translations", "src/shared/i18n", "src/locales", "src/i18n"];

  for (const p of possiblePaths) {
    const fullPath = path.join(appDir, p);
    if (pathExists(fullPath)) {
      const files = fs.readdirSync(fullPath);
      // Check if it contains translation files (.ts or directories for i18next)
      if (
        files.some((f) => f.endsWith(".ts") || fs.statSync(path.join(fullPath, f)).isDirectory())
      ) {
        return p;
      }
    }
  }
  return null;
};

// Get translation count from any path
const getTranslationCount = (appDir: string): { count: number; path: string | null } => {
  const actualPath = findActualTranslationPath(appDir);
  if (!actualPath) {
    return { count: 0, path: null };
  }

  const fullPath = path.join(appDir, actualPath);
  const files = fs.readdirSync(fullPath);

  // Handle standard .ts files pattern
  const tsFiles = files.filter((f) => f.endsWith(".ts") && f !== "index.ts");
  if (tsFiles.length > 0) {
    return { count: tsFiles.length, path: actualPath };
  }

  // Handle i18next directory pattern (like numy)
  const dirs = files.filter((f) => fs.statSync(path.join(fullPath, f)).isDirectory());
  if (dirs.length > 0) {
    return { count: dirs.length, path: actualPath };
  }

  return { count: 0, path: actualPath };
};

describe("Localization Consistency", () => {
  describe.each(ACTIVE_APPS)("%s", (app) => {
    const appDir = getAppDir(app);

    describe("In-App Translations", () => {
      it(`should have exactly ${EXPECTED_TRANSLATION_COUNT} translation files`, () => {
        const { count, path: actualPath } = getTranslationCount(appDir);
        expect(count).toBe(EXPECTED_TRANSLATION_COUNT);
      });

      it("should use standard translation path (src/translations/)", () => {
        const usesStandard = usesStandardTranslationPath(appDir);
        const actualPath = findActualTranslationPath(appDir);
        expect(usesStandard).toBe(true);
        if (!usesStandard && actualPath) {
          // Provide helpful message about current path
          console.warn(
            `${app}: Using non-standard path "${actualPath}" instead of "${STANDARD_TRANSLATION_PATH}"`
          );
        }
      });

      it("should have all standard languages", () => {
        const translations = getTranslationFiles(appDir);
        const missing = STANDARD_LANGUAGES.filter((lang) => !translations.includes(lang));
        const extra = translations.filter((lang) => !STANDARD_LANGUAGES.includes(lang as any));

        if (missing.length > 0) {
          console.warn(`${app}: Missing languages: ${missing.join(", ")}`);
        }
        if (extra.length > 0) {
          console.warn(`${app}: Extra languages: ${extra.join(", ")}`);
        }

        expect(missing).toEqual([]);
        expect(extra).toEqual([]);
      });

      it("should have index.ts that exports all translations", () => {
        const indexPath = path.join(appDir, STANDARD_TRANSLATION_PATH, "index.ts");
        expect(pathExists(indexPath)).toBe(true);
      });
    });

    describe("Store Metadata", () => {
      it(`should have exactly ${EXPECTED_STORE_METADATA_COUNT} store metadata files`, () => {
        const metadataFiles = getStoreMetadataFiles(appDir);
        expect(metadataFiles.length).toBe(EXPECTED_STORE_METADATA_COUNT);
      });

      it("should use standard store metadata path (store-metadata/locales/)", () => {
        expect(usesStandardStoreMetadataPath(appDir)).toBe(true);
      });

      it("should have all standard store locales", () => {
        const metadataFiles = getStoreMetadataFiles(appDir);
        const missing = STANDARD_STORE_LOCALES.filter((locale) => !metadataFiles.includes(locale));
        const extra = metadataFiles.filter(
          (locale) => !STANDARD_STORE_LOCALES.includes(locale as any)
        );

        if (missing.length > 0) {
          console.warn(`${app}: Missing store locales: ${missing.join(", ")}`);
        }
        if (extra.length > 0) {
          console.warn(`${app}: Extra store locales: ${extra.join(", ")}`);
        }

        expect(missing).toEqual([]);
        expect(extra).toEqual([]);
      });
    });
  });

  describe("Cross-App Consistency", () => {
    it("all apps should have the same number of in-app translations", () => {
      const counts = ACTIVE_APPS.map((app) => {
        const { count } = getTranslationCount(getAppDir(app));
        return { app, count };
      });

      const allSame = counts.every((c) => c.count === EXPECTED_TRANSLATION_COUNT);
      if (!allSame) {
        console.warn("Translation count inconsistencies:");
        counts.forEach(({ app, count }) => {
          if (count !== EXPECTED_TRANSLATION_COUNT) {
            console.warn(`  ${app}: ${count} (expected ${EXPECTED_TRANSLATION_COUNT})`);
          }
        });
      }
      expect(allSame).toBe(true);
    });

    it("all apps should have the same number of store metadata locales", () => {
      const counts = ACTIVE_APPS.map((app) => {
        const files = getStoreMetadataFiles(getAppDir(app));
        return { app, count: files.length };
      });

      const allSame = counts.every((c) => c.count === EXPECTED_STORE_METADATA_COUNT);
      if (!allSame) {
        console.warn("Store metadata count inconsistencies:");
        counts.forEach(({ app, count }) => {
          if (count !== EXPECTED_STORE_METADATA_COUNT) {
            console.warn(`  ${app}: ${count} (expected ${EXPECTED_STORE_METADATA_COUNT})`);
          }
        });
      }
      expect(allSame).toBe(true);
    });

    it("all apps should use the same translation path", () => {
      const paths = ACTIVE_APPS.map((app) => {
        const actualPath = findActualTranslationPath(getAppDir(app));
        return { app, path: actualPath };
      });

      const nonStandardPaths = paths.filter((p) => p.path !== STANDARD_TRANSLATION_PATH);
      if (nonStandardPaths.length > 0) {
        console.warn("Non-standard translation paths:");
        nonStandardPaths.forEach(({ app, path: p }) => {
          console.warn(`  ${app}: ${p || "none"} (expected ${STANDARD_TRANSLATION_PATH})`);
        });
      }
      expect(nonStandardPaths.length).toBe(0);
    });
  });
});

// Export constants for use in fix scripts
export {
  ACTIVE_APPS,
  STANDARD_LANGUAGES,
  STANDARD_STORE_LOCALES,
  EXPECTED_TRANSLATION_COUNT,
  EXPECTED_STORE_METADATA_COUNT,
  STANDARD_TRANSLATION_PATH,
  STANDARD_STORE_METADATA_PATH,
};
