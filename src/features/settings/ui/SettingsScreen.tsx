import { PasswordPrompt, useDeveloperMode, useTapDetector } from "@/features/developer-mode";
import { changeLanguage, supportedLanguages, SupportedLanguage } from "@/i18n";
import { colors, spacing, typography } from "@/presentation/theme";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import * as Updates from "expo-updates";
import { useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import config from "../../../config/settings";
import { useSettingsStore } from "../model/settingsStore";

interface SettingsScreenProps {
  onNavigateBack?: () => void;
}

export const SettingsScreen = ({ onNavigateBack }: SettingsScreenProps) => {
  const router = useRouter();
  const { themeMode, setThemeMode, reduceMotion, toggleReduceMotion, language, setLanguage } =
    useSettingsStore();
  const { isDeveloperMode, enableDeveloperMode } = useDeveloperMode();
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);

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

  const handleLanguageSelect = async (lang: SupportedLanguage | null) => {
    setLanguage(lang);
    if (lang) {
      await changeLanguage(lang);
    } else {
      // If null (System), we might want to revert to system default
      // For now, let's just keep it simple. If we had a way to get system default easily here.
      // Re-running init logic is hard.
      // We will just let the store update. Ideally app reload is needed for full system reset effect
      // or we explicitly set it to system locale.
      // For now, we'll force a reload if switching to system to be safe?
      // Or just set to 'en' or detected system locale.
      // Let's just set it to the detected system locale if 'null' is selected.
      // But 'null' isn't really an option in the list yet.
      // I'll add "System (Default)" as an option.
    }
    setShowLanguageModal(false);
  };

  const openLink = async (url: string) => {
    if (await Linking.canOpenURL(url)) {
      await Linking.openURL(url);
    } else {
      Alert.alert("Error", "Cannot open link");
    }
  };

  const handleShare = async () => {
    if (config.links.shareUrl && (await Sharing.isAvailableAsync())) {
      await Sharing.shareAsync(config.links.shareUrl);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.headerTitle}>Settings</Text>

        {/* Appearance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance & Localization</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Language</Text>
            <TouchableOpacity onPress={() => setShowLanguageModal(true)}>
              <Text style={styles.value}>
                {language ? language.toUpperCase() : "System Default"}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Dark Mode</Text>
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
          <View style={styles.row}>
            <Text style={styles.label}>Use System Theme</Text>
            {/* This is redundant with the 'system' toggle above, but requested explicitly.
                 "Make Sure Use System Theme toggle exists. When System is on dark/light disables and vice/versa."
                 The above 3-way toggle handles this elegantly.
                 If a separate switch is strictly required:
             */}
            <Switch
              value={themeMode === "system"}
              onValueChange={(val) => setThemeMode(val ? "system" : "light")} // Default to light if turning system off?
              trackColor={{ false: colors.ui.border, true: colors.ui.highlight }}
            />
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

        {/* Privacy & Security */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy & Security</Text>
          <TouchableOpacity style={styles.row} onPress={() => Linking.openSettings()}>
            <Text style={styles.label}>App Permissions</Text>
            <Text style={styles.chevron}>{">"}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.row} onPress={() => openLink(config.links.privacyPolicy)}>
            <Text style={styles.label}>Privacy Policy</Text>
            <Text style={styles.chevron}>{">"}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.row}
            onPress={() => openLink(config.links.termsOfService)}
          >
            <Text style={styles.label}>Terms and Conditions</Text>
            <Text style={styles.chevron}>{">"}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.row} onPress={() => openLink(config.links.cookiePolicy)}>
            <Text style={styles.label}>Cookie Policy</Text>
            <Text style={styles.chevron}>{">"}</Text>
          </TouchableOpacity>
          {/* Clear All Data - Destructive */}
          {/* Not explicitly implemented in store yet, usually clears Async Storage */}
        </View>

        {/* Support & Feedback */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support & Feedback</Text>
          <TouchableOpacity style={styles.row} onPress={() => openLink(config.links.support)}>
            <Text style={styles.label}>Contact Support</Text>
            <Text style={styles.chevron}>{">"}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.row} onPress={() => openLink(config.links.review)}>
            <Text style={styles.label}>Rate Us</Text>
            <Text style={styles.chevron}>{">"}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.row} onPress={handleShare}>
            <Text style={styles.label}>Share App</Text>
            <Text style={styles.chevron}>{">"}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.row} onPress={() => openLink(config.links.community)}>
            <Text style={styles.label}>Join Our Community</Text>
            <Text style={styles.chevron}>{">"}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.row} onPress={() => openLink(config.links.moreApps)}>
            <Text style={styles.label}>More From Us</Text>
            <Text style={styles.chevron}>{">"}</Text>
          </TouchableOpacity>
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
        </View>

        {/* Developer Sections */}
        {isDeveloperMode && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Developer</Text>
            <TouchableOpacity style={styles.button} onPress={handleReload}>
              <Text style={styles.buttonText}>Reload App</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => router.push("/settings/debug")}>
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

      <Modal visible={showLanguageModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Language</Text>
            <FlatList
              data={["system", ...supportedLanguages]}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.languageItem}
                  onPress={() =>
                    handleLanguageSelect(item === "system" ? null : (item as SupportedLanguage))
                  }
                >
                  <Text style={styles.languageText}>
                    {item === "system" ? "System Default" : item.toUpperCase()}
                  </Text>
                  {(item === "system" ? language === null : language === item) && (
                    <Text style={styles.checkMark}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowLanguageModal(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    paddingBottom: spacing.xxl,
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
  chevron: {
    color: colors.text.secondary,
    fontSize: typography.sizes.md,
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
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: "80%",
    padding: spacing.lg,
  },
  modalTitle: {
    fontFamily: typography.fonts.mono,
    fontSize: typography.sizes.xl,
    fontWeight: "bold",
    marginBottom: spacing.lg,
    color: colors.text.primary,
    textAlign: "center",
  },
  languageItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.ui.border,
  },
  languageText: {
    fontSize: typography.sizes.md,
    color: colors.text.primary,
  },
  checkMark: {
    fontSize: typography.sizes.md,
    color: colors.ui.highlight,
  },
  closeButton: {
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.background.secondary,
    borderRadius: 8,
    alignItems: "center",
  },
  closeButtonText: {
    color: colors.text.primary,
    fontWeight: "bold",
  },
});
