# Numy

Expo 54 React Native app for identifying and valuing coins from photos (iOS and Android; web is not actively supported).

## Quick Start

```bash
# Install dependencies
yarn install

# Run an app
yarn workspace @moruk/numy start

# Validate codebase
yarn validate:quick    # Fast (1-2 min) - type-check, lint, format
yarn validate:ci       # CI (3-5 min) - includes tests
yarn validate          # Full (5-10 min) - all checks + expo-doctor
```

## Project Structure

```
numy/
├── apps/
│   └── numy/      # App source (Expo Router, src/, assets, store-metadata)
├── packages/                 # Shared packages (AI client, UI, navigation, etc.)
├── docs/                     # Documentation
├── scripts/                  # Build/deploy scripts
└── workflows/                # EAS workflows
```

## App

| App  | Bundle ID            | Description         |
| ---- | -------------------- | ------------------- |
| numy | ai.moruk.babyglimpse | Coin identification |

## Commands

### Validation

```bash
yarn validate:quick    # Type-check + lint + format (fast)
yarn validate:ci       # Above + tests (for CI)
yarn validate          # Full validation with expo-doctor
```

### Development

```bash
yarn workspace @moruk/numy start    # Start dev server
yarn workspace @moruk/numy ios      # Run on iOS
yarn workspace @moruk/numy android  # Run on Android
```

### Testing

```bash
yarn test              # Run all tests
yarn test:apps         # Run app tests only
yarn test:coverage     # Run with coverage
```

### Code Quality

```bash
yarn lint              # Check linting
yarn lint:fix          # Fix linting issues
yarn format            # Format code
yarn type-check        # TypeScript type checking
```

### Dependencies

```bash
yarn lint:expo         # Check Expo dependencies
yarn fix:expo          # Fix Expo dependencies
yarn check:deps        # Check for dependency issues
```

## Tech Stack

- **Runtime**: Node.js 25.2.1
- **Package Manager**: Yarn 4.12.0
- **Framework**: Expo SDK 54
- **React Native**: 0.81.5
- **Language**: TypeScript 5.9

## Architecture

Apps follow [Feature-Sliced Design](docs/fsd-guides/README.md) methodology:

```
app/           # Expo Router routes & providers
src/
├── screens/   # Page components (FSD pages layer)
├── entities/  # Business domain objects
├── features/  # User interactions
├── widgets/   # Composite UI blocks
└── shared/    # Shared utilities, UI, API
```

## Documentation

- [FSD Architecture Guide](docs/fsd-guides/README.md)
- [Dependency Management](docs/DEPENDENCY_MANAGEMENT.md)
- [Localization Guide](docs/LOCALIZATION_README.md)
- [Validation Troubleshooting](docs/VALIDATION_TROUBLESHOOTING.md)

## API Endpoints

| Service     | URL                                     | Purpose                  |
| ----------- | --------------------------------------- | ------------------------ |
| Gemini API  | `https://gemini-api.moruk.workers.dev`  | AI text/image generation |
| Monitor API | `https://monitor-api.moruk.workers.dev` | Error reporting          |

## Contributing

1. Create a feature branch from `main`
2. Make changes following the architecture guidelines
3. Run `yarn validate:quick` before committing
4. Create a pull request

## License

Private - All rights reserved.
