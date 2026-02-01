# Developer Mode Quick Reference

## Activation

### How to Enable Developer Mode

1. Open the app
2. Navigate to **Settings** (bottom tab bar)
3. Scroll to the bottom footer
4. Tap the version text **"Version 1.0.0"** rapidly **5 times** (within 3 seconds)
5. Password prompt will appear
6. Enter password: **`3146`**
7. Developer mode is now enabled! ✅

### What Happens When Enabled

- ✅ "Advanced" section appears in Settings
- ✅ "Debug Tools" button becomes visible
- ✅ State persisted to AsyncStorage (stays enabled across app restarts)

---

## Features Unlocked

### 1. Debug Tools Screen

**Access:** Settings → Advanced → Debug Tools

**Sections Available:**

#### Monetization (AdMob)

- Load/Show Interstitial Ads
- Load/Show App Open Ads
- Reset Consent (UMP)
- View ad session statistics

#### Tracking & Analytics

- Check ATT (App Tracking Transparency) status
- Request ATT permission
- View Advertising ID (IDFA)
- Copy Advertising ID to clipboard

#### Global Configuration

- View all app configuration values from `settings.ts`
- See feature flags, AdMob IDs, URLs, etc.

#### Debug Info

- Raw JSON dump of ad service state
- Session statistics
- Configuration details

### 2. Configuration Viewer

**Access:** Settings → Advanced → Debug Tools → View Config Values

**Displays:**

- App metadata (name, version, bundle ID)
- Feature flags (ads, analytics, crashlytics, sentry)
- AdMob configuration (app IDs, unit IDs, frequency)
- Support URLs (privacy, terms, support, review)
- Sentry DSN

---

## Developer Mode Persistence

### Storage Key

```
numy-developer-mode-storage
```

### Stored in

- AsyncStorage (persisted across app restarts)

### Manual Reset

To manually disable developer mode:

**Option 1: Use Global Reset**

- Settings → Privacy & Security → Clear All Data

**Option 2: Clear AsyncStorage Manually**

```javascript
import AsyncStorage from "@react-native-async-storage/async-storage";
await AsyncStorage.removeItem("numy-developer-mode-storage");
```

**Option 3: Programmatic Toggle**

```typescript
import { developerModeStore } from "@/features/developer-mode";
developerModeStore.getState().setDeveloperMode(false);
```

---

## Security Notes

### Password

- Current password: **3146**
- Stored in: `src/features/developer-mode/model/DeveloperModeStore.ts`
- Change location: Line 6 of `DeveloperModeStore.ts`

```typescript
const DEVELOPER_MODE_PASSWORD = "3146"; // Change here
```

### Production Considerations

- This is NOT production-grade security
- Password is hardcoded in client-side code
- Intended for development/QA access only
- Consider removing or strengthening for production release

---

## Testing Developer Mode

### Automated Tests

```bash
yarn test developer-mode
```

**Test Coverage:**

- ✅ 5-tap detection within time window
- ✅ Password validation (correct/incorrect)
- ✅ AsyncStorage persistence
- ✅ State management
- ✅ Toggle functionality

### Manual Testing Checklist

1. **Tap Detection**
   - [ ] Tap version text 5 times quickly → Password prompt appears
   - [ ] Tap version text 4 times → Nothing happens
   - [ ] Tap version text 5 times slowly (>3 seconds) → Nothing happens

2. **Password Validation**
   - [ ] Enter "3146" → Developer mode enabled
   - [ ] Enter wrong password → Error message shown
   - [ ] Cancel password prompt → Nothing changes

3. **Persistence**
   - [ ] Enable developer mode → Close app → Reopen app → Still enabled
   - [ ] "Advanced" section still visible after restart

4. **UI Integration**
   - [ ] "Advanced" section appears after activation
   - [ ] "Debug Tools" button navigates correctly
   - [ ] Section hidden when developer mode disabled

---

## Troubleshooting

### Tap Detection Not Working

**Symptom:** Tapping version text doesn't show password prompt

**Solutions:**

1. Check tap speed (must be within 3 seconds)
2. Ensure you're tapping the version text, not surrounding area
3. Try tapping faster
4. Check console for errors

### Password Not Accepting

**Symptom:** Entering "3146" doesn't enable developer mode

**Solutions:**

1. Verify password is exactly "3146" (no spaces)
2. Check for keyboard autocorrect changing the input
3. Try restarting the app
4. Check AsyncStorage permissions

### Developer Mode Not Persisting

**Symptom:** Developer mode disabled after app restart

**Solutions:**

1. Check AsyncStorage permissions
2. Verify no errors in console during persistence
3. Manually check AsyncStorage:
   ```javascript
   const value = await AsyncStorage.getItem("numy-developer-mode-storage");
   console.log(value); // Should be JSON with isDeveloperMode: true
   ```

---

## Code Integration Examples

### Using Developer Mode in Your Code

```typescript
import { useDeveloperMode } from '@/features/developer-mode';

function MyComponent() {
  const { isDeveloperMode } = useDeveloperMode();

  return (
    <View>
      {isDeveloperMode && (
        <Text>Developer-only content</Text>
      )}
    </View>
  );
}
```

### Programmatic Control

```typescript
import { developerModeStore } from "@/features/developer-mode";

// Enable
developerModeStore.getState().setDeveloperMode(true);

// Disable
developerModeStore.getState().setDeveloperMode(false);

// Toggle
developerModeStore.getState().toggle();

// Enable with password check
const success = developerModeStore.getState().enableWithPassword("3146");
if (success) {
  console.log("Developer mode enabled!");
}

// Get current state
const isDev = developerModeStore.getState().isDeveloperMode;
```

---

## API Reference

### Hooks

#### `useDeveloperMode()`

Returns developer mode state and control functions.

**Returns:**

```typescript
{
  isDeveloperMode: boolean;
  enableDeveloperMode: (password: string) => boolean;
  disableDeveloperMode: () => void;
  toggleDeveloperMode: () => void;
}
```

#### `useTapDetector(options)`

Detects rapid tap sequences.

**Parameters:**

```typescript
{
  threshold: number;        // Number of taps required
  timeWindow: number;       // Time window in milliseconds
  onThresholdReached: () => void;  // Callback when threshold reached
}
```

**Returns:**

```typescript
{
  handleTap: () => void;    // Call this on each tap
}
```

### Components

#### `<PasswordPrompt />`

Modal for password entry.

**Props:**

```typescript
{
  visible: boolean;
  onSuccess: () => void;
  onDismiss: () => void;
}
```

#### `<DeveloperBadge />`

Visual indicator for developer mode.

**Usage:**

```typescript
import { DeveloperBadge } from '@/features/developer-mode';

<DeveloperBadge /> // Shows red "DEV" badge
```

---

## Related Features

### Global Reset

**Access:** Settings → Privacy & Security → Clear All Data

**What it does:**

- Clears ALL AsyncStorage (including developer mode state)
- Resets UMP/AdMob consent
- Reloads the app
- Resets all preferences to defaults

**Note:** This will also disable developer mode if it was enabled!

---

## Future Enhancements

Potential improvements for developer mode:

1. **Remote Configuration**
   - Enable/disable via Firebase Remote Config
   - Dynamic password changes

2. **Access Levels**
   - Different passwords for different access levels
   - QA vs Developer vs Admin tiers

3. **Usage Analytics**
   - Track developer tool usage
   - Log debug actions for troubleshooting

4. **Additional Tools**
   - Network inspector
   - Performance profiler
   - State inspector
   - Log viewer

5. **Gesture-Based Activation**
   - Shake to enable
   - Multi-finger tap patterns
   - Secret swipe gestures

---

## Support

### Questions?

- Check implementation in `src/features/developer-mode/`
- Review tests in `src/features/developer-mode/__tests__/`
- Read main implementation summary: `IMPLEMENTATION_SUMMARY.md`

### Issues?

- Run tests: `yarn test developer-mode`
- Check TypeScript: `yarn type-check`
- Verify linting: `yarn lint`
