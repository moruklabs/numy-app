import { useEraseData } from "@moruk/hooks";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useCalculatorStore } from "../../src/application/stores/calculatorStore";
import { colors, spacing, typography } from "../../src/presentation/theme";

// Validation constants for settings inputs
const SETTINGS_BOUNDS = {
  emBase: { min: 1, max: 100 },
  ppiBase: { min: 1, max: 600 },
  decimalPlaces: { min: 0, max: 10 },
} as const;

const LINKS = {
  privacy: "https://numy.moruk.ai/privacy",
  terms: "https://numy.moruk.ai/terms",
  support: "https://numy.moruk.ai/support",
};

export default function SettingsScreen() {
  const { t } = useTranslation("settings");
  const router = useRouter();
  const { showConfirmation } = useEraseData();

  const emBase = useCalculatorStore((state) => state.emBase);
  const ppiBase = useCalculatorStore((state) => state.ppiBase);
  const decimalPlaces = useCalculatorStore((state) => state.decimalPlaces);
  const setEmBase = useCalculatorStore((state) => state.setEmBase);
  const setPpiBase = useCalculatorStore((state) => state.setPpiBase);
  const setDecimalPlaces = useCalculatorStore((state) => state.setDecimalPlaces);
  const showTotal = useCalculatorStore((state) => state.showTotal);
  const toggleShowTotal = useCalculatorStore((state) => state.toggleShowTotal);
  const resetAll = useCalculatorStore((state) => state.resetAll);

  const [emInput, setEmInput] = useState(emBase.toString());
  const [ppiInput, setPpiInput] = useState(ppiBase.toString());
  const [decimalInput, setDecimalInput] = useState(decimalPlaces.toString());

  const handleEmChange = (value: string) => {
    // Filter to only digits
    const filtered = value.replace(/[^0-9]/g, "");
    setEmInput(filtered);
    const num = parseInt(filtered, 10);
    const { min, max } = SETTINGS_BOUNDS.emBase;
    if (!isNaN(num) && num >= min && num <= max) {
      setEmBase(num);
    }
  };

  const handleEmBlur = () => {
    // Restore to valid range if empty or out of bounds
    const num = parseInt(emInput, 10);
    const { min, max } = SETTINGS_BOUNDS.emBase;
    if (!emInput || isNaN(num) || num < min || num > max) {
      setEmInput(emBase.toString());
    }
  };

  const handlePpiChange = (value: string) => {
    // Filter to only digits
    const filtered = value.replace(/[^0-9]/g, "");
    setPpiInput(filtered);
    const num = parseInt(filtered, 10);
    const { min, max } = SETTINGS_BOUNDS.ppiBase;
    if (!isNaN(num) && num >= min && num <= max) {
      setPpiBase(num);
    }
  };

  const handlePpiBlur = () => {
    // Restore to valid range if empty or out of bounds
    const num = parseInt(ppiInput, 10);
    const { min, max } = SETTINGS_BOUNDS.ppiBase;
    if (!ppiInput || isNaN(num) || num < min || num > max) {
      setPpiInput(ppiBase.toString());
    }
  };

  const handleDecimalChange = (value: string) => {
    // Filter to only digits
    const filtered = value.replace(/[^0-9]/g, "");
    setDecimalInput(filtered);
    const num = parseInt(filtered, 10);
    if (!isNaN(num) && num >= 0 && num <= 10) {
      setDecimalPlaces(num);
    }
  };

  const handleDecimalBlur = () => {
    // Restore default if empty or invalid
    const num = parseInt(decimalInput, 10);
    if (!decimalInput || isNaN(num) || num < 0 || num > 10) {
      setDecimalInput(decimalPlaces.toString());
    }
  };

  const handleOpenLink = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(`Don't know how to open this URL: ${url}`);
      }
    } catch (error) {
      Alert.alert("An error occurred", "Could not open the link.");
    }
  };

  const handleResetAll = () => {
    showConfirmation({
      title: t("resetAll.title"),
      message: t("resetAll.message"),
      confirmText: t("resetAll.confirm"),
      cancelText: t("resetAll.cancel"),
      extraActions: [
        async () => {
          await resetAll();
          setEmInput("16");
          setPpiInput("96");
          setDecimalInput("2");
        },
      ],
      onSuccess: () => {
        router.replace("/(tabs)");
      },
    });
  };

  return (
    <ScrollView
      style={styles.container}
      testID="settings.screen"
      accessible={true}
      accessibilityLabel={t("screenTitle")}
    >
      {/* Preferences Section */}
      <View
        style={styles.section}
        testID="settings.preferences-section"
        accessible={true}
        accessibilityRole="none"
      >
        <Text style={styles.sectionTitle} accessibilityRole="header">
          {t("preferences.title")}
        </Text>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel} nativeID="show-total-label">
            {t("preferences.showTotal")}
          </Text>
          <Switch
            value={showTotal}
            onValueChange={toggleShowTotal}
            thumbColor={showTotal ? colors.categories.myCalculations.accent : colors.text.secondary}
            trackColor={{ true: colors.ui.highlight, false: colors.ui.border }}
            testID="settings.show-total-switch"
            accessibilityLabel={t("preferences.showTotal")}
            accessibilityHint={t("preferences.showTotalHint")}
            accessibilityLabelledBy="show-total-label"
          />
        </View>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel} nativeID="decimal-places-label">
            {t("preferences.decimalPlaces")}
          </Text>
          <TextInput
            style={styles.settingInput}
            value={decimalInput}
            onChangeText={handleDecimalChange}
            onBlur={handleDecimalBlur}
            keyboardType="number-pad"
            placeholder="2"
            placeholderTextColor={colors.text.muted}
            testID="settings.decimal-input"
            accessibilityLabel={t("preferences.decimalPlaces")}
            accessibilityHint={t("preferences.decimalPlacesHint")}
            accessibilityLabelledBy="decimal-places-label"
          />
        </View>

        {/* CSS Units Subsection */}
        <Text style={styles.subsectionTitle} accessibilityRole="header">
          {t("cssUnits.title")}
        </Text>
        <Text style={styles.sectionDescription} accessibilityRole="text">
          {t("cssUnits.description")}
        </Text>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel} nativeID="em-base-label">
            {t("cssUnits.emBase")}
          </Text>
          <TextInput
            style={styles.settingInput}
            value={emInput}
            onChangeText={handleEmChange}
            onBlur={handleEmBlur}
            keyboardType="number-pad"
            placeholder="16"
            placeholderTextColor={colors.text.muted}
            testID="settings.em-input"
            accessibilityLabel={t("cssUnits.emBase")}
            accessibilityHint={t("cssUnits.emBaseHint")}
            accessibilityLabelledBy="em-base-label"
          />
        </View>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel} nativeID="ppi-base-label">
            {t("cssUnits.ppiBase")}
          </Text>
          <TextInput
            style={styles.settingInput}
            value={ppiInput}
            onChangeText={handlePpiChange}
            onBlur={handlePpiBlur}
            keyboardType="number-pad"
            placeholder="96"
            placeholderTextColor={colors.text.muted}
            testID="settings.ppi-input"
            accessibilityLabel={t("cssUnits.ppiBase")}
            accessibilityHint={t("cssUnits.ppiBaseHint")}
            accessibilityLabelledBy="ppi-base-label"
          />
        </View>
      </View>

      {/* About Section */}
      <View
        style={styles.section}
        testID="settings.about-section"
        accessible={true}
        accessibilityRole="none"
      >
        <Text style={styles.sectionTitle} accessibilityRole="header">
          {t("about.title")}
        </Text>
        <Text style={styles.aboutText} testID="settings.app-name" accessibilityRole="text">
          {t("about.appName")}
        </Text>
        <Text style={styles.aiHighlight} testID="settings.ai-highlight" accessibilityRole="text">
          {t("about.aiHighlight")}
        </Text>

        <View style={styles.linksContainer}>
          <Pressable
            style={({ pressed }) => [styles.linkButton, pressed && styles.linkButtonPressed]}
            onPress={() => handleOpenLink(LINKS.privacy)}
            testID="settings.privacy-button"
            accessibilityLabel={t("links.privacyPolicy")}
            accessibilityHint={t("links.opensInBrowser")}
            accessibilityRole="link"
          >
            <Text style={styles.linkButtonText}>{t("links.privacyPolicy")}</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.linkButton, pressed && styles.linkButtonPressed]}
            onPress={() => handleOpenLink(LINKS.terms)}
            testID="settings.terms-button"
            accessibilityLabel={t("links.termsOfUse")}
            accessibilityHint={t("links.opensInBrowser")}
            accessibilityRole="link"
          >
            <Text style={styles.linkButtonText}>{t("links.termsOfUse")}</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.linkButton, pressed && styles.linkButtonPressed]}
            onPress={() => handleOpenLink(LINKS.support)}
            testID="settings.support-button"
            accessibilityLabel={t("links.support")}
            accessibilityHint={t("links.opensInBrowser")}
            accessibilityRole="link"
          >
            <Text style={styles.linkButtonText}>{t("links.support")}</Text>
          </Pressable>
        </View>

        <Pressable
          style={({ pressed }) => [styles.resetButton, pressed && styles.resetButtonPressed]}
          onPress={handleResetAll}
          testID="settings.reset-button"
          accessibilityLabel={t("resetAll.buttonLabel")}
          accessibilityHint={t("resetAll.buttonHint")}
          accessibilityRole="button"
        >
          <Text style={styles.resetButtonText}>{t("resetAll.buttonLabel")}</Text>
        </Pressable>
      </View>

      {/* Footer */}
      <View style={styles.footer} testID="settings.footer">
        <Text style={styles.versionText} testID="settings.version" accessibilityRole="text">
          {t("about.version")}
        </Text>
        <Text style={styles.madeByText} testID="settings.made-by" accessibilityRole="text">
          {t("about.madeBy")}
        </Text>
      </View>
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
  subsectionTitle: {
    fontFamily: typography.fonts.mono,
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    fontWeight: typography.weights.semibold,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  sectionDescription: {
    fontFamily: typography.fonts.mono,
    fontSize: typography.sizes.sm,
    color: colors.text.muted,
    marginBottom: spacing.lg,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
  },
  settingLabel: {
    fontFamily: typography.fonts.mono,
    fontSize: typography.sizes.md,
    color: colors.text.primary,
  },
  settingInput: {
    fontFamily: typography.fonts.mono,
    fontSize: typography.sizes.md,
    color: colors.result.primary,
    backgroundColor: colors.background.secondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 4,
    minWidth: 80,
    textAlign: "right",
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
  aboutText: {
    fontFamily: typography.fonts.mono,
    fontSize: typography.sizes.md,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  versionText: {
    fontFamily: typography.fonts.mono,
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  aiHighlight: {
    fontFamily: typography.fonts.mono,
    fontSize: typography.sizes.sm,
    color: colors.categories.myCalculations.text,
    marginBottom: spacing.lg,
  },
  linksContainer: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  resetButton: {
    backgroundColor: colors.result.error,
    padding: spacing.lg,
    borderRadius: 8,
    alignItems: "center",
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
  madeByText: {
    fontFamily: typography.fonts.mono,
    fontSize: typography.sizes.sm,
    color: colors.text.muted,
    marginTop: spacing.xs,
  },
});
