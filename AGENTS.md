## Gemini Added Memories

- we are on macos
- we use fsd and tdd
- we always gitignore ios and android folders and rely on CNG.
- Our tech stack is Expo Go 54, TypeScript

## Life Cycle

Read the followings:

CLAUDE.md,
BEST_PRACTICES.md
TROUBLESHOOTING.md
README.md
CHANGELOG.md

do your thing using TDD, and make sure `just validate` passes. Then update the docs. Keep the, up to date.

## Configuration Infrastructure Overview

The project uses a tiered configuration system where a single TypeScript file drives both native settings and application logic.

### 🏆 The Source of Truth: `src/config/settings.ts`

The `src/config/settings.ts` file is the **definitive source of truth** for the application. It consolidates:

- **App Metadata**: Name, bundle identifiers, and version.
- **Feature Toggles**: Encodings for features like `darkMode`, `enhancedAnalysis`, etc.
- **Service Credentials**: AdMob app IDs, Sentry DSN, Firebase enablement.
- **App Constants**: Support URLs, log levels, and notification timings.
- **Remote Config Defaults**: Default values for Firebase Remote Config.

> [!NOTE]
> The file uses `export default { ... } as const;` to ensure strict type safety and immutability.

---

### 🔌 Consumers (How Config is Used)

#### 1. Native Configuration (`app.config.ts`)

The `app.config.ts` file imports `settings` directly. It uses these values to configure the Expo environment and native project properties (like Bundle IDs and Google Service file paths) during the prebuild process.

#### 2. Application Code (`src/lib/config/app-config/index.ts`)

Inside the app, settings are accessed through a type-safe `appConfig` object. This object is initialized using the `createAppConfig` factory which maps the typed object from `settings.ts` into a structured, read-only configuration used throughout the FSD layers.

#### 3. Versioning (`package.json`)

The `package.json` file remains the source of truth for **technical metadata** (dependencies, scripts) and is kept in sync with the `version` field in `settings.ts` via CI/CD checks (verified by `__tests__/version-consistency.test.ts`).

---

### 🛠 Secondary Configuration Files

| File              | Purpose                                                            |
| :---------------- | :----------------------------------------------------------------- |
| `.env`            | Environment-specific overrides and secrets (not committed to git). |
| `eas.json`        | EAS Build profiles and environment mapping.                        |
| `justfile`        | Command orchestration and automation recipes.                      |
| `tsconfig.json`   | TypeScript compiler settings.                                      |
| `babel.config.js` | JavaScript transformation rules.                                   |
| `metro.config.js` | Bundler configuration (asset handling, aliases).                   |

## **Core Architecture: Feature-Sliced Design (FSD)**

You must strictly follow the FSD layer hierarchy. Modules can only import from layers **below** them, never from layers above or horizontally (except via public API).

- **Layers (Top to Bottom):**

1. **App:** Application setup (Providers, Global Styles, Navigation entry).
2. **Processes:** Complex inter-feature workflows (e.g., Checkout). _Optional._
3. **Pages:** Full-screen compositions of features/widgets.
4. **Widgets:** Self-contained blocks (e.g., `ProductCardList`).
5. **Features:** User interactions/actions (e.g., `AddToWishlist`, `SearchOrder`).
6. **Entities:** Business domain logic (e.g., `User`, `Product`, `Booking`).
7. **Shared:** Reusable UI (UIKit), API clients, and utils.

### **Development Workflow: TDD First**

Before writing any implementation code, follow the **Red-Green-Refactor** cycle:

1. **Red:** Create a `__tests__` folder inside the slice and write a failing test using `Jest` and `React Native Testing Library`.
2. **Green:** Write the minimum code required in the slice to pass the test.
3. **Refactor:** Clean up the code, ensure TypeScript types are strict, and maintain FSD boundaries.

### **File Structure & Public API**

Every slice must have an `index.ts` (the Public API).

- **Rule:** Components outside the slice can **only** import from this `index.ts`.
- **Rule:** Deep imports (e.g., `import { X } from '@/features/auth/ui/Form'`) are strictly forbidden.

---

### **Code Style Guidelines**

| Element        | Specification                                                     |
| -------------- | ----------------------------------------------------------------- |
| **Language**   | TypeScript (Strict mode)                                          |
| **Components** | Functional components with `const` and Arrow Functions            |
| **Styles**     | `StyleSheet.create` or `Tailwind/NativeWind` (Consistency is key) |
| **Tests**      | `jest` + `@testing-library/react-native`                          |
| **Exports**    | Named exports only (No `export default` except for Pages)         |

### **Example Implementation Pattern**

When I ask for a new "Feature" (e.g., `ToggleTheme`), follow this structure:

```text
src/
 └── features/
     └── toggle-theme/
         ├── ui/           # React components
         ├── model/        # State logic (Zustand/Redux/Hooks)
         ├── api/          # Specific API calls
         ├── __tests__/    # TDD files
         └── index.ts      # Public API: export { ToggleTheme } from './ui'

```

### **The "No-Go" List**

- **No** circular dependencies.
- **No** business logic inside the `Shared` layer.
- **No** cross-importing between slices in the same layer (e.g., `features/A` cannot import from `features/B`). If they need to talk, move logic to a `Process` or `Page`.
- **No** skipping tests for logic-heavy `Entities` or `Features`.

---

### Must Have Pages

## ! Every App Must have the Settings and Debug Screen by using TDD

## ⚙️ Settings Screen

_The goal here is a clean, "Consumer-Ready" experience._

### **Appearance & Localization**

- **Language** (Shows current selection)
- **Dark Mode** (Toggle)
- **Use System Theme**

## **Accessibility**

- **Reduce Motion** (Toggle)

### **Privacy & Security**

- **App Permissions** (Links to System Settings)
- **Privacy Policy** (External Link)
- **Terms and Conditions** (External Link)
- **Cookie Policy** (External Link)
- **Privacy Policy** (External Link)
- **Clear All Data** (⚠️ _Style: Red text/Destructive button_)

### **Support & Feedback**

- **Contact Support**
- **Rate Us**
- **Share App**

### **Advanced** (Hidden on Production)

- **Debug Tools** (Access point for developers)

## App Version

## 🛠️ Debug Screen

_Grouped by developer workflow to avoid endless scrolling._

### **Data & State Management**

- **View AsyncStorage**
- **View Telemetry Data**
- **Inject Mock Data**
- **Restart Onboarding**

### **Monetization (AdMob)**

- **Request Consent** | **Check Status** | **Reset Consent**
- **Show Interstitial Ad**
- **Reset Ad Frequency**

### **Tracking & Analytics**

- **ATT:** Request Permission | Check Status
- **Advertising ID:** [ID String] (**Copy**)
- **Events:** Track Test Event | Set Debug User Property

### **Diagnostics & Logging**

- **Sentry:** Capture Test Error
- **Crashlytics:** Trigger Test Crash | Add Log Entry
- **UI Tests:** Show Success Notification | Show Error Notification
- **System:** Trigger Store Review

### **Global Configuration**

- **View Config Values** (Button to sub-screen)

---

## 📄 Config Values Screen

_Organized into read-only metadata and feature flags._

### **App Metadata**

- **Environment:** `App Env` | **Name:** `App Name`
- **Version:** `Version`
- **Identifier:** `Bundle Id` / `Package Id`
- **Language**
- **Language Decision Method** `From OS` | `Default` | `User Selection`

### **Feature Flags & Toggles**

| Feature            | Status           |
| ------------------ | ---------------- |
| **Ads**            | Enabled/Disabled |
| **Analytics**      | Enabled/Disabled |
| **Crashlytics**    | Enabled/Disabled |
| **Sentry**         | Enabled/Disabled |
| **Remote Logging** | Enabled/Disabled |

### **Ad Configuration Details**

- **iOS App ID / Unit ID:** `...`
- **Android App ID / Unit ID:** `...`
- **Ad Frequency:** `(Number)`
- **Ad Interval:** `(Time Unit)`

### **System Logic & URLs**

- **Review Reminder:** Triggered at `(Usage Count)`
- **Notification Duration:** `(Seconds)`
- **Sentry DSN:** `[String]`
- **Endpoints:** Support URL | Privacy Policy URL

---

### **UX Recommendations for Implementation:**

1. **The "Hidden" Entry:** In production, hide the **Debug Tools** entry. Tapping the "Version Number" 5 times in the Settings screen to reveal it.
2. **Visual Hierarchy:** Use **Red** for destructive actions (Erase Data, Trigger Crash) and **Blue** or standard system colors for primary actions.
3. **Search/Filter:** If the Debug screen grows any further, consider adding a simple search bar at the top to filter the list of tools.

## Url Patterns:

Privacy Policy: https://moruk.link/$app-id/privacy

Conctact Support: https://moruk.link/$app-id/support

Rate Us: https://moruk.link/$app-id/review

Terms of Use: https://moruk.link/$app-id/terms

Cookie Policy: https://moruk.link/$app-id/cookie
