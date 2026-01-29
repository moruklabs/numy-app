# Localization Scripts

Centralized localization tools for managing store metadata, translations, and app configurations across all apps in the monorepo.

## Directory Structure

```
scripts/localization/
├── lib/                        # Shared utilities
│   ├── constants.js           # Locale lists, validation rules
│   ├── validators.js          # Validation functions
│   ├── mergers.js             # Metadata merging
│   └── generators.js          # CFBundle & permission generators
│
├── merge-metadata.js          # Merge base + locales → store.config.json
├── validate-metadata.js       # Validate all apps
├── sync-cfbundle.js           # Sync CFBundleLocalizations
├── generate-permissions.js    # Generate permission localizations
└── update-metadata.sh         # Push to App Store Connect
```

## Scripts

### merge-metadata.js

Merges `base-config.json` with locale files to generate `store.config.json`.

**Usage:**

```bash
cd apps/numy
node ../../scripts/localization/merge-metadata.js
```

**What it does:**

- Reads `store-metadata/base-config.json`
- Reads all files in `store-metadata/locales/*.json`
- Validates character limits and required fields
- Generates `store.config.json`

### validate-metadata.js

Validates all store metadata across all apps.

**Usage:**

```bash
node scripts/localization/validate-metadata.js
```

**What it does:**

- Scans all apps in `apps/` directory
- Validates each locale file
- Reports errors and statistics
- Exits with code 1 if any validation fails

### sync-cfbundle.js

Synchronizes `CFBundleLocalizations` in `app.json` with available translation files.

**Usage:**

```bash
node scripts/localization/sync-cfbundle.js apps/numy
```

**What it does:**

- Scans `src/translations/*.ts` files
- Extracts locale codes (e.g., `en.ts` → `en`)
- Updates `expo.ios.infoPlist.CFBundleLocalizations` in `app.json`

### generate-permissions.js

Generates permission localizations for `expo-image-picker` plugin.

**Usage:**

```bash
node scripts/localization/generate-permissions.js apps/numy
```

**What it does:**

- Finds `expo-image-picker` plugin in `app.json`
- Sets up base permission configuration
- Prepares structure for manual permission translations

### update-metadata.sh

Pushes store metadata to App Store Connect.

**Usage:**

```bash
cd apps/numy
../../scripts/localization/update-metadata.sh production
```

**What it does:**

- Checks EAS CLI authentication
- Pushes `store.config.json` to App Store Connect
- Provides helpful error messages

## Shared Library (lib/)

### constants.js

**Exports:**

- `SUPPORTED_STORE_LOCALES` - 39 store metadata locales
- `APP_TRANSLATION_LOCALES` - 33 in-app translation locales
- `VALIDATION_RULES` - Character limits and requirements

### validators.js

**Exports:**

- `validateLocaleMetadata(locale, data)` - Validate a locale metadata object
- `validateCharacterLimit(text, limit)` - Check string length
- `validateUrl(url)` - Validate URL format
- `ValidationError` - Custom error class

### mergers.js

**Exports:**

- `mergeMetadata(baseConfig, locales)` - Merge base config with locales

### generators.js

**Exports:**

- `generateCFBundleLocalizations(translationsPath)` - Generate locale codes from translation files
- `generatePermissionLocalizations(translations)` - Generate permission strings

## Usage Examples

### Validate all apps

```bash
node scripts/localization/validate-metadata.js
```

### Update metadata for a single app

```bash
cd apps/numy
node ../../scripts/localization/merge-metadata.js
node ../../scripts/localization/sync-cfbundle.js .
node ../../scripts/localization/generate-permissions.js .
```

### Update multiple apps

```bash
for app in apps/*/; do
  echo "Processing $(basename $app)..."
  node scripts/localization/sync-cfbundle.js "$app"
done
```

## Character Limits

| Field            | Max Length                  | Platform      |
| ---------------- | --------------------------- | ------------- |
| Title            | 30 chars                    | iOS & Android |
| Subtitle         | 30 chars                    | iOS           |
| Description      | 4000 chars                  | iOS & Android |
| Keywords         | 100 chars (comma-separated) | iOS           |
| Promotional Text | 170 chars                   | iOS           |

## Locale Codes

### Store Metadata (39 locales)

```
en-US, ar-SA, ca, cs, da, de-DE, el, en-AU, en-CA, en-GB, es-ES, es-MX,
fi, fr-CA, fr-FR, he, hi, hr, hu, id, it, ja, ko, ms, nl-NL, no, pl,
pt-BR, pt-PT, ro, ru, sk, sv, th, tr, uk, vi, zh-Hans, zh-Hant
```

### App Translations (33 locales)

```
en, es, de, fr, it, pt, ru, ja, ko, zh, ar, hi, nl, sv, no, da, fi, pl,
cs, sk, hu, ro, el, tr, he, th, vi, id, ms, ca, hr, uk
```

## Common Tasks

### Add a new app

1. Create `store-metadata/` directory
2. Add `base-config.json`
3. Create `locales/` directory with locale files
4. Run `merge-metadata.js`
5. Run `sync-cfbundle.js`

### Add a new locale

1. Create locale file in `store-metadata/locales/`
2. Add translations in `src/translations/`
3. Run `merge-metadata.js`
4. Run `sync-cfbundle.js`

### Fix validation errors

1. Run `validate-metadata.js` to see errors
2. Edit locale files to fix character limits
3. Re-run `validate-metadata.js`

## Troubleshooting

**Error: "base-config.json not found"**

- Make sure you're running `merge-metadata.js` from an app directory
- Or provide the app path as a working directory

**Error: "Validation errors found"**

- Check the error messages for which locale and field
- Common issues: title/subtitle too long, keywords exceed 100 chars
- Edit the locale file and re-run

**Error: "No editable app version"**

- You need to create a new version in App Store Connect first
- Or wait for a recently submitted build to finish processing

## Related Documentation

- [LOCALIZATION_ANALYSIS_REVISED.md](../../docs/LOCALIZATION_ANALYSIS_REVISED.md) - Full analysis and plan
- [LOCALIZATION_COMPARISON.md](../../docs/LOCALIZATION_COMPARISON.md) - Package vs. lib approach comparison
- [LOCALIZATION_ARCHITECTURE.md](../../docs/LOCALIZATION_ARCHITECTURE.md) - Visual diagrams

## Migration from Old Scripts

Old duplicate scripts in individual apps should be deleted:

- `apps/numy/scripts/merge-metadata.js` ❌
- `apps/interval-timer/scripts/merge-metadata.js` ❌
- `apps/minday/scripts/merge-metadata.js` ❌
- `apps/rizzman/merge-metadata.js` ❌

Use centralized scripts instead:

- `scripts/localization/merge-metadata.js` ✅
- `scripts/localization/validate-metadata.js` ✅
- `scripts/localization/sync-cfbundle.js` ✅
