import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "@/presentation/theme";
import settings from "@/config/settings";
import { useDeveloperMode, PasswordPrompt, useTapDetector } from "@/features/developer-mode";
import { useGlobalReset, ResetConfirmation } from "@/features/reset";

export default function SettingsScreen() {
  const router = useRouter();
  const { isDeveloperMode, enableDeveloperMode } = useDeveloperMode();
  const { isResetting, performReset } = useGlobalReset();

  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);

  // 5-tap detector for version text
  const { handleTap } = useTapDetector({
    threshold: 5,
    timeWindow: 3000,
    onThresholdReached: () => setShowPasswordPrompt(true),
  });

  const handleOpenLink = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Error", `Cannot open URL: ${url}`);
      }
    } catch (error) {
      Alert.alert("Error", "Could not open the link.");
    }
  };

  const handlePasswordSuccess = () => {
    setShowPasswordPrompt(false);
    enableDeveloperMode("3146");
  };

  const handleResetConfirm = () => {
    setShowResetConfirmation(false);
    performReset();
  };

  const handleOpenPermissions = () => {
    Linking.openSettings();
  };

  const handleShareApp = () => {
    Alert.alert("Share App", "Share functionality coming soon!");
  };

  return (
    <ScrollView style={styles.container} testID="settings.screen">
      {/* App-Specific Settings Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Settings</Text>
        <Text style={styles.sectionDescription}>
          These settings are specific to Numy calculator functionality.
        </Text>

        <Pressable
          style={({ pressed }) => [styles.linkButton, pressed && styles.linkButtonPressed]}
          onPress={() => router.push("/settings/calculator-settings" as any)}
          testID="settings.calculator-settings-button"
        >
          <Text style={styles.linkButtonText}>Calculator Preferences</Text>
        </Pressable>
      </View>

      {/* Privacy & Security Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Privacy & Security</Text>

        <Pressable
          style={({ pressed }) => [styles.linkButton, pressed && styles.linkButtonPressed]}
          onPress={handleOpenPermissions}
          testID="settings.permissions-button"
        >
          <Text style={styles.linkButtonText}>App Permissions</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.linkButton, pressed && styles.linkButtonPressed]}
          onPress={() => handleOpenLink(settings.links.privacyPolicy)}
          testID="settings.privacy-button"
        >
          <Text style={styles.linkButtonText}>Privacy Policy</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.linkButton, pressed && styles.linkButtonPressed]}
          onPress={() => handleOpenLink(settings.links.termsOfService)}
          testID="settings.terms-button"
        >
          <Text style={styles.linkButtonText}>Terms and Conditions</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.resetButton, pressed && styles.resetButtonPressed]}
          onPress={() => setShowResetConfirmation(true)}
          testID="settings.clear-data-button"
        >
          <Text style={styles.resetButtonText}>Clear All Data</Text>
        </Pressable>
      </View>

      {/* Support & Feedback Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support & Feedback</Text>

        <Pressable
          style={({ pressed }) => [styles.linkButton, pressed && styles.linkButtonPressed]}
          onPress={() => handleOpenLink(settings.links.support)}
          testID="settings.support-button"
        >
          <Text style={styles.linkButtonText}>Contact Support</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.linkButton, pressed && styles.linkButtonPressed]}
          onPress={() => handleOpenLink(settings.links.review)}
          testID="settings.rate-button"
        >
          <Text style={styles.linkButtonText}>Rate Us</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.linkButton, pressed && styles.linkButtonPressed]}
          onPress={handleShareApp}
          testID="settings.share-button"
        >
          <Text style={styles.linkButtonText}>Share App</Text>
        </Pressable>
      </View>

      {/* Advanced Section (Hidden unless Developer Mode) */}
      {isDeveloperMode && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Advanced</Text>

          <Pressable
            style={({ pressed }) => [styles.linkButton, pressed && styles.linkButtonPressed]}
            onPress={() => router.push("/settings/debug" as any)}
            testID="settings.debug-button"
          >
            <Text style={styles.linkButtonText}>Debug Tools</Text>
          </Pressable>
        </View>
      )}

      {/* App Version Footer */}
      <View style={styles.footer} testID="settings.footer">
        <Pressable onPress={handleTap} testID="settings.version-container">
          <Text style={styles.versionText} testID="settings.version">
            Version {settings.version}
          </Text>
        </Pressable>
        <Text style={styles.madeByText} testID="settings.made-by">
          Made with ❤️ by Moruk
        </Text>
      </View>

      {/* Modals */}
      <PasswordPrompt
        visible={showPasswordPrompt}
        onSuccess={handlePasswordSuccess}
        onDismiss={() => setShowPasswordPrompt(false)}
      />

      <ResetConfirmation
        visible={showResetConfirmation}
        isResetting={isResetting}
        onConfirm={handleResetConfirm}
        onCancel={() => setShowResetConfirmation(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  section: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.ui.border,
  },
  sectionTitle: {
    fontFamily: typography.fonts.mono,
    fontSize: typography.sizes.md,
    color: colors.categories.cssCalculations.text,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.sm,
  },
  sectionDescription: {
    fontFamily: typography.fonts.mono,
    fontSize: typography.sizes.sm,
    color: colors.text.muted,
    marginBottom: spacing.lg,
  },
  linkButton: {
    backgroundColor: colors.background.secondary,
    padding: spacing.lg,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: spacing.md,
  },
  linkButtonPressed: {
    opacity: 0.7,
  },
  linkButtonText: {
    fontFamily: typography.fonts.mono,
    fontSize: typography.sizes.md,
    color: colors.text.primary,
  },
  resetButton: {
    backgroundColor: colors.result.error,
    padding: spacing.lg,
    borderRadius: 8,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  resetButtonPressed: {
    opacity: 0.7,
  },
  resetButtonText: {
    fontFamily: typography.fonts.mono,
    fontSize: typography.sizes.md,
    color: "#FFFFFF",
    fontWeight: typography.weights.semibold,
  },
  footer: {
    padding: spacing.xxl,
    alignItems: "center",
  },
  versionText: {
    fontFamily: typography.fonts.mono,
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  madeByText: {
    fontFamily: typography.fonts.mono,
    fontSize: typography.sizes.sm,
    color: colors.text.muted,
    marginTop: spacing.xs,
  },
});
