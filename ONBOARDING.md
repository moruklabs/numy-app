# Onboarding Product Requirements Document (PRD)

> [!IMPORTANT]
> This document defines the **standardized High-Engagement Onboarding** sequence for the Identifier Suite. All applications must adhere to this specification to ensure compliance with Google AdMob (UMP) and Apple (ATT) policies while maximizing user retention.

## 1. Overview

**Goal**: Deliver a premium, high-trust first impression that maximizes user investment (Personalization) and permission grant rates (Ad & Tracking Consent) through a structured narrative.

**Core Strategy**: The "4-Page Sequence" separates user value (Hook/Personalization) from technical contracts (Privacy/Ads), preventing "permission fatigue" and building trust before the "ask".

## 2. User Experience (The 4-Page Sequence)

### Page 1: The Hook (Value Proposition)

- **Objective**: Instantly communicate "Why this app?".
- **Visuals**:
  - **Background**: `expo-linear-gradient` providing a subtle ambient glow (Application Primary Color).
  - **Animation**: `react-native-reanimated` entrance (Springify duration 800ms).
- **Interactions**:
  - **No Permissions**: Absolutely no system dialogs.
  - **Navigation**: "Continue" button only (No "Back" button).

### Page 2: Personalization (Investment)

- **Objective**: Get the user "invested" by capturing a preference.
- **Content**: Simple Question (e.g., "What's your goal?").
- **Mechanism**:
  - Single-select (default) or Multi-select (via Feature Flag).
  - **Validation**: "Continue" button is **Disabled** (Opacity 0.5) until a selection is made.
- **Persistence**: Store selection in `useOnboardingState` (Zustand + AsyncStorage).

### Page 3: Privacy Handshake (Trust)

- **Objective**: Establish specific trust regarding data safety _before_ monetization.
- **Theme**: Cool colors (Blue/Indigo/Green) -> Safety, Encryption, Control.
- **Content**:
  - "Your data stays on your device."
  - "Analytics are anonymous."
  - **No Ads Mention**: Do not conflate privacy with monetization here.
- **Navigation**: Standard flow.

### Page 4: Ad Pact (The Transaction)

- **Objective**: Secure AdMob (UMP) and ATT consent by framing it as a fair "Pact".
- **Theme**: Warm colors (Gold/Amber/Orange) -> Value, Premium, Reward.
- **Content**:
  - "Keep the app free."
  - "Support development."
  - "We promise ads won't interrupt core flow."
- **Action**:
  - **Trigger**: "Continue" button triggers the **Privacy Sequencer**.
  - **Behavior**: Non-blocking. The Onboarding Flow completes _immediately_, and the System Dialogs (UMP -> ATT) appear over the Main App Home Screen.

## 3. Technical Requirements

### 3.1 Architecture (FSD)

- **Directory**: `src/features/onboarding`
- **Public API**: `index.ts` exporting only `OnboardingFlow` and `useOnboardingState`.
- **Layers**:
  - `ui/`: Implementation of the 4 pages + Orchestrator.
  - `model/`: State management (`useOnboardingState.ts`) and Sequencer logic (`useOnboardingSequencer.ts`).

### 3.2 State Management

- **Library**: `zustand` with `persist` middleware (AsyncStorage).
- **Schema**:

```typescript
interface OnboardingState {
  hasSeenOnboarding: boolean;
  userGoal: string | null;
  reset: () => void;
}
```

### 3.3 The "Privacy Sequencer" (Split-Gate)

- **Mandate**: Never show UMP and ATT simultaneously.
- **Sequence**:
  1.  **User Clicks "Continue" (Page 4)**.
  2.  **App Navigates to Home** (Onboarding unmounts).
  3.  **UMP (AdMob)** triggers.
  4.  **Delay (1000ms)**: Crucial for OS stability.
  5.  **ATT (iOS)** triggers (Shadow/Ghost trigger if UMP handles it).
- **Failure Resilience**: If UMP fails/timeouts, silently proceed. Never block the user.

### 3.4 Orchestration & Navigation

- **Centralized Button**: The "Continue" button lives in the Parent (`OnboardingFlow`), NOT in the individual Page components. This prevents UI jumping.
- **Step Indicators**: Visible on all screens.
- **Back Navigation**:
  - Page 1: Hidden.
  - Page 2-4: Visible (Themed Circle Button).

## 4. Integration Guide (For New Apps)

To integrate this feature into a new application:

1.  **Copy Feature Slice**:
    - Copy `src/features/onboarding` to the target app.
    - Ensure `src/shared/ui` dependencies (Buttons, Text) are available.

2.  **Configure Goals**:
    - Update `PagePersonalization.tsx` `GOALS` constant to match the app's domain (e.g., "Sleep Better" vs "Track Expenses").

3.  **Root Layout Integration**:
    - In `app/_layout.tsx` (or root navigator):

      ```tsx
      const { hasSeenOnboarding } = useOnboardingState();

      if (!hasSeenOnboarding) {
        return <OnboardingFlow onComplete={() => router.replace("/(tabs)")} />;
      }
      ```

4.  **Privacy Config**:
    - Ensure `google-mobile-ads` and `expo-tracking-transparency` are installed.
    - Validate `app.json` has the correct `NSUserTrackingUsageDescription`.

## 5. Testing & Validation

### 5.1 Automated Tests (Jest)

- **Navigation**: Verify Forward/Backward movement.
- **Validation**: Verify "Continue" is disabled on Page 2 until selection.
- **State**: Verify `hasSeenOnboarding` persists after completion.

### 5.2 Manual Verification (The "Nuclear" Test)

1.  Go to **Debug Menu** -> **Nuclear Reset**.
2.  Kill App -> Relaunch.
3.  **Verify**:
    - App opens to Page 1.
    - Animations play smoothly.
    - Page 2 blocks progress until selection.
    - Page 4 "Continue" dismisses Onboarding -> Shows Home -> _Then_ shows UMP/ATT.

## 6. Accessibility (WCAG 2.1 AA)

- **Contrast**: Text/Buttons must exceed 4.5:1 contrast.
- **Scaling**: All text must scale with Dynamic Type.
- **Focus**: "Continue" button must be reachable via VoiceOver.
