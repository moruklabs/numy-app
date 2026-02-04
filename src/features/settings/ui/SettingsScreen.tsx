import { PasswordPrompt, useDeveloperMode, useTapDetector } from "@/features/developer-mode";
import { colors, spacing, typography } from "@/presentation/theme";
import * as Updates from "expo-updates";
import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import config from "../../../config/settings"; // Importing directly as per valid path, or use app-config
import { useSettingsStore } from "../model/settingsStore";

interface SettingsScreenProps {
  onNavigateBack?: () => void;
}

export const SettingsScreen = ({ onNavigateBack }: SettingsScreenProps) => {
  const { themeMode, setThemeMode, reduceMotion, toggleReduceMotion } = useSettingsStore();
  const { isDeveloperMode, enableDeveloperMode } = useDeveloperMode();
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);

  const { handleTap } = useTapDetector({
    threshold: 5,
    timeWindow: 3000,
    onThresholdReached: () => setShowPasswordPrompt(true),
  });

  const handleVersionTap = () => {
    handleTap();
  };

  const handlePasswordSubmit = (password: string) => {
    const success = enableDeveloperMode(password);
    if (success) {
      Alert.alert("Developer Mode", "Enabled successfully!");
      setShowPasswordPrompt(false);
    } else {
      Alert.alert("Error", "Incorrect password");
    }
  };

  const handleReload = async () => {
    try {
      await Updates.reloadAsync();
    } catch (e) {
      Alert.alert("Error", "Could not reload app");
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.headerTitle}>Settings</Text>

        {/* Appearance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Dark Mode</Text>
            {/* Simple Toggle for now, mirroring 'Dark Mode (Toggle)' requirement.
                 If 'system' is needed, we might need a selector.
                 User req said: "Dark/Light/System toggles".
                 Let's implement a simple cycle or selector. For now, a toggle for Dark/Light override?
                 Actually, let's just stick to the specific requirement: "Dark/Light/System toggles"
             */}
            <View style={styles.toggleGroup}>
              {(["light", "dark", "system"] as const).map((mode) => (
                <TouchableOpacity
                  key={mode}
                  style={[styles.modeButton, themeMode === mode && styles.modeButtonActive]}
                  onPress={() => setThemeMode(mode)}
                >
                  <Text style={[styles.modeText, themeMode === mode && styles.modeTextActive]}>
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Accessibility */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Accessibility</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Reduce Motion</Text>
            <Switch
              value={reduceMotion}
              onValueChange={toggleReduceMotion}
              trackColor={{ false: colors.ui.border, true: colors.ui.highlight }}
            />
          </View>
        </View>

        {/* App Info / Advanced */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <TouchableOpacity onPress={handleVersionTap} activeOpacity={1}>
            <View style={styles.row}>
              <Text style={styles.label}>Version</Text>
              <Text style={styles.value}>{config.version}</Text>
            </View>
          </TouchableOpacity>
          {/* Note: Build Number is not easily available in expo-constants manifest in all contexts but can use Constants.expoConfig?.ios?.buildNumber or similar. using generic string for now or '1' */}
        </View>

        {/* Developer Sections */}
        {isDeveloperMode && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Developer</Text>
            <TouchableOpacity style={styles.button} onPress={handleReload}>
              <Text style={styles.buttonText}>Reload App</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.button}
              onPress={() => Alert.alert("Debug", "Navigate to Debug Screen")}
            >
              <Text style={styles.buttonText}>Open Debug Tools</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <PasswordPrompt
        visible={showPasswordPrompt}
        onSuccess={handlePasswordSubmit}
        onDismiss={() => setShowPasswordPrompt(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    padding: spacing.lg,
  },
  headerTitle: {
    fontFamily: typography.fonts.mono,
    fontSize: typography.sizes.xxl,
    fontWeight: "bold",
    color: colors.text.primary,
    marginBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontFamily: typography.fonts.mono,
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    textTransform: "uppercase",
    marginBottom: spacing.sm,
    letterSpacing: 1,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.ui.border,
  },
  label: {
    fontFamily: typography.fonts.mono,
    fontSize: typography.sizes.md,
    color: colors.text.primary,
  },
  value: {
    fontFamily: typography.fonts.mono,
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
  },
  toggleGroup: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  modeButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.ui.border,
  },
  modeButtonActive: {
    backgroundColor: colors.ui.highlight,
    borderColor: colors.ui.highlight,
  },
  modeText: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  modeTextActive: {
    color: colors.text.primary,
    fontWeight: "bold",
  },
  button: {
    backgroundColor: colors.background.secondary,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  buttonText: {
    color: colors.ui.highlight,
    fontWeight: "bold",
  },
});
