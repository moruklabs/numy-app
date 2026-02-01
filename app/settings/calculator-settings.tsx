import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ScrollView, StyleSheet, Switch, Text, TextInput, View, Pressable } from "react-native";
import { useCalculatorStore, type CalculatorState } from "@/stores/calculatorStore";
import { colors, spacing, typography } from "@/presentation/theme";
import { useEraseData } from "@moruk/hooks";

// Validation constants for settings inputs
const SETTINGS_BOUNDS = {
  emBase: { min: 1, max: 100 },
  ppiBase: { min: 1, max: 600 },
  decimalPlaces: { min: 0, max: 10 },
} as const;

export default function CalculatorSettingsScreen() {
  const router = useRouter();
  const { showConfirmation } = useEraseData();

  const emBase = useCalculatorStore((state: CalculatorState) => state.emBase);
  const ppiBase = useCalculatorStore((state: CalculatorState) => state.ppiBase);
  const decimalPlaces = useCalculatorStore((state: CalculatorState) => state.decimalPlaces);
  const setEmBase = useCalculatorStore((state: CalculatorState) => state.setEmBase);
  const setPpiBase = useCalculatorStore((state: CalculatorState) => state.setPpiBase);
  const setDecimalPlaces = useCalculatorStore((state: CalculatorState) => state.setDecimalPlaces);
  const showTotal = useCalculatorStore((state: CalculatorState) => state.showTotal);
  const toggleShowTotal = useCalculatorStore((state: CalculatorState) => state.toggleShowTotal);
  const resetAll = useCalculatorStore((state: CalculatorState) => state.resetAll);

  const [emInput, setEmInput] = useState(emBase.toString());
  const [ppiInput, setPpiInput] = useState(ppiBase.toString());
  const [decimalInput, setDecimalInput] = useState(decimalPlaces.toString());

  const handleEmChange = (value: string) => {
    const filtered = value.replace(/[^0-9]/g, "");
    setEmInput(filtered);
    const num = parseInt(filtered, 10);
    const { min, max } = SETTINGS_BOUNDS.emBase;
    if (!isNaN(num) && num >= min && num <= max) {
      setEmBase(num);
    }
  };

  const handleEmBlur = () => {
    const num = parseInt(emInput, 10);
    const { min, max } = SETTINGS_BOUNDS.emBase;
    if (!emInput || isNaN(num) || num < min || num > max) {
      setEmInput(emBase.toString());
    }
  };

  const handlePpiChange = (value: string) => {
    const filtered = value.replace(/[^0-9]/g, "");
    setPpiInput(filtered);
    const num = parseInt(filtered, 10);
    const { min, max } = SETTINGS_BOUNDS.ppiBase;
    if (!isNaN(num) && num >= min && num <= max) {
      setPpiBase(num);
    }
  };

  const handlePpiBlur = () => {
    const num = parseInt(ppiInput, 10);
    const { min, max } = SETTINGS_BOUNDS.ppiBase;
    if (!ppiInput || isNaN(num) || num < min || num > max) {
      setPpiInput(ppiBase.toString());
    }
  };

  const handleDecimalChange = (value: string) => {
    const filtered = value.replace(/[^0-9]/g, "");
    setDecimalInput(filtered);
    const num = parseInt(filtered, 10);
    if (!isNaN(num) && num >= 0 && num <= 10) {
      setDecimalPlaces(num);
    }
  };

  const handleDecimalBlur = () => {
    const num = parseInt(decimalInput, 10);
    if (!decimalInput || isNaN(num) || num < 0 || num > 10) {
      setDecimalInput(decimalPlaces.toString());
    }
  };

  const handleResetAll = () => {
    showConfirmation({
      title: "Reset Calculator Settings",
      message: "This will reset all calculator preferences to their default values.",
      confirmText: "Reset",
      cancelText: "Cancel",
      extraActions: [
        async () => {
          await resetAll();
          setEmInput("16");
          setPpiInput("96");
          setDecimalInput("2");
        },
      ],
      onSuccess: () => {
        router.back();
      },
    });
  };

  return (
    <ScrollView style={styles.container} testID="calculator-settings.screen">
      {/* Preferences Section */}
      <View style={styles.section} testID="calculator-settings.preferences-section">
        <Text style={styles.sectionTitle}>Display Preferences</Text>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Show Running Total</Text>
          <Switch
            value={showTotal}
            onValueChange={toggleShowTotal}
            thumbColor={showTotal ? colors.categories.myCalculations.accent : colors.text.secondary}
            trackColor={{ true: colors.ui.highlight, false: colors.ui.border }}
            testID="calculator-settings.show-total-switch"
          />
        </View>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Decimal Places</Text>
          <TextInput
            style={styles.settingInput}
            value={decimalInput}
            onChangeText={handleDecimalChange}
            onBlur={handleDecimalBlur}
            keyboardType="number-pad"
            placeholder="2"
            placeholderTextColor={colors.text.muted}
            testID="calculator-settings.decimal-input"
          />
        </View>
      </View>

      {/* CSS Units Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>CSS Units</Text>
        <Text style={styles.sectionDescription}>
          Configure base values for CSS unit conversions (em, rem, px, etc.)
        </Text>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>EM Base (px)</Text>
          <TextInput
            style={styles.settingInput}
            value={emInput}
            onChangeText={handleEmChange}
            onBlur={handleEmBlur}
            keyboardType="number-pad"
            placeholder="16"
            placeholderTextColor={colors.text.muted}
            testID="calculator-settings.em-input"
          />
        </View>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>PPI Base</Text>
          <TextInput
            style={styles.settingInput}
            value={ppiInput}
            onChangeText={handlePpiChange}
            onBlur={handlePpiBlur}
            keyboardType="number-pad"
            placeholder="96"
            placeholderTextColor={colors.text.muted}
            testID="calculator-settings.ppi-input"
          />
        </View>
      </View>

      {/* Reset Section */}
      <View style={styles.section}>
        <Pressable
          style={({ pressed }) => [styles.resetButton, pressed && styles.resetButtonPressed]}
          onPress={handleResetAll}
          testID="calculator-settings.reset-button"
        >
          <Text style={styles.resetButtonText}>Reset to Defaults</Text>
        </Pressable>
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
});
