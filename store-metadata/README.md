# App Store Metadata Management

This directory contains modular App Store metadata files that are merged into `store.config.json` for EAS metadata submission.

## 📁 Structure

```
store-metadata/
├── README.md              # This file
├── base-config.json       # Base configuration (version, categories, review info)
└── locales/               # Individual locale files
    ├── en-US.json
    ├── es-ES.json
    ├── fr-FR.json
    └── ... (39 locales total)
```

## 🎯 Why Modular?

**Benefits:**

- ✅ **Easier maintenance** - Each language in its own file
- ✅ **Better git diffs** - Changes to one language don't affect others
- ✅ **Validation** - Automatic ASO compliance checking
- ✅ **Testing** - Unit tests ensure metadata integrity
- ✅ **Collaboration** - Multiple translators can work in parallel

## 🚀 Usage

### Editing Metadata

1. **Edit base configuration** (version, categories, etc.):

   ```bash
   vim store-metadata/base-config.json
   ```

2. **Edit a specific locale**:

   ```bash
   vim store-metadata/locales/en-US.json
   ```

3. **Add a new locale**:
   ```bash
   # Create new file following the pattern
   cp store-metadata/locales/en-US.json store-metadata/locales/de-DE.json
   # Edit with German content
   vim store-metadata/locales/de-DE.json
   ```

### Merging & Validation

Before pushing to App Store Connect, merge all files and validate:

```bash
# Merge all files into store.config.json with validation
bun run metadata:merge

# Run tests to ensure everything is valid
bun run test:metadata
```

### Pushing to App Store Connect

```bash
# This automatically merges before pushing
bun run metadata:push
```

### Splitting After Pull

If you pull metadata from App Store Connect:

```bash
# Pull from App Store Connect
bun run metadata:pull

# Split the monolithic file back into modular structure
bun run metadata:split
```

## ✅ ASO Validation Rules

The merge script automatically validates:

| Field                | Rule           | Limit                |
| -------------------- | -------------- | -------------------- |
| **title**            | Required       | 30 characters max    |
| **subtitle**         | Required       | 30 characters max    |
| **description**      | Required       | 4,000 characters max |
| **keywords**         | Required array | 1-100 items          |
| **marketingUrl**     | Optional       | Valid URL            |
| **supportUrl**       | Optional       | Valid URL            |
| **privacyPolicyUrl** | Optional       | Valid URL            |

## 📝 Locale File Format

Each locale file must contain:

```json
{
  "title": "App Name: Short Tag",
  "subtitle": "Brief Description",
  "description": "Full app description...",
  "keywords": ["keyword1", "keyword2", "..."],
  "marketingUrl": "https://example.com",
  "supportUrl": "https://example.com/support",
  "privacyPolicyUrl": "https://example.com/privacy"
}
```

### ASO Best Practices

1. **Title (30 chars)**
   - Front-load primary keyword
   - Include brand name
   - Example: `Plant Doctor: AI Disease ID`

2. **Subtitle (30 chars)**
   - Expand on title with secondary keywords
   - Example: `Diagnose Sick Leaves & Pests`

3. **Description (4000 chars)**
   - First 170 characters are critical (shown in search)
   - Use bullet points for readability
   - Include social proof and clear value prop

4. **Keywords (array)**
   - 10-15 keywords recommended
   - Culturally adapted (not just translated!)
   - No duplicates from title/subtitle
   - Separate by relevance and search volume

## 🧪 Testing

Run the test suite to validate all metadata:

```bash
bun run test:metadata
```

Tests verify:

- ✅ All JSON files are valid
- ✅ Required fields present
- ✅ Character limits respected
- ✅ Keywords are proper arrays
- ✅ Merge process works correctly
- ✅ Base config preserved after merge

## 🔄 Workflow

### Regular Updates

```bash
# 1. Edit locale files
vim store-metadata/locales/en-US.json

# 2. Validate & merge
bun run metadata:merge

# 3. Run tests
bun run test:metadata

# 4. Push to App Store Connect
bun run metadata:push
```

### After Pulling from App Store Connect

```bash
# 1. Pull latest
bun run metadata:pull

# 2. Split into modular files
bun run metadata:split

# 3. Commit modular files
git add store-metadata/
git commit -m "Update metadata from App Store Connect"
```

## 🌍 Supported Locales (39)

**English Variants:**
`en-US`, `en-GB`, `en-CA`, `en-AU`

**European:**
`ca`, `cs`, `da`, `de-DE`, `el`, `es-ES`, `es-MX`, `fi`, `fr-FR`, `fr-CA`, `hr`, `hu`, `it`, `nl-NL`, `no`, `pl`, `pt-BR`, `pt-PT`, `ro`, `ru`, `sk`, `sv`, `uk`

**Asian:**
`zh-Hans`, `zh-Hant`, `hi`, `id`, `ja`, `ko`, `ms`, `th`, `vi`

**Middle Eastern:**
`ar`, `he`, `tr`

## 🛠 Scripts Reference

| Command                   | Description                                |
| ------------------------- | ------------------------------------------ |
| `bun run metadata:merge` | Merge modular files into store.config.json |
| `bun run metadata:split` | Split store.config.json into modular files |
| `bun run metadata:push`  | Merge & push to App Store Connect          |
| `bun run test:metadata`  | Run validation tests                       |

## 📚 Additional Resources

- [App Store Connect](https://appstoreconnect.apple.com)
- [EAS Metadata Documentation](https://docs.expo.dev/eas-metadata/introduction/)
- [App Store Optimization Guide](https://developer.apple.com/app-store/product-page/)
