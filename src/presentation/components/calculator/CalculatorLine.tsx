import React, { useCallback } from "react";
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  Pressable,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Line } from "../../../domain/entities/Line";
import { colors, typography, spacing, TIMING } from "../../theme";
import { useDebounce } from "../../../application/hooks";
import { shareWithHaptic } from "../../../application/utils";
import { useCalculatorStore } from "../../../application/stores/calculatorStore";

interface CalculatorLineProps {
  line: Line;
  onInputChange: (lineId: string, input: string) => void;
  onCalculate: (lineId: string) => void;
  onSubmit: () => void;
  onDeleteEmpty?: (lineId: string) => void;
  autoFocus?: boolean;
  categoryColor?: string;
  testID?: string;
  readOnly?: boolean;
  suppressErrors?: boolean;
}

export function CalculatorLine({
  line,
  onInputChange,
  onCalculate,
  onSubmit,
  onDeleteEmpty,
  autoFocus = false,
  categoryColor = colors.categories.myCalculations.text,
  testID,
  readOnly = false,
  suppressErrors = false,
}: CalculatorLineProps) {
  const { t } = useTranslation("calculator");

  // Debounced calculation trigger
  const debouncedCalculate = useDebounce((lineId: string) => {
    onCalculate(lineId);
  }, TIMING.DEBOUNCE_CALCULATION_MS);

  const handleChange = useCallback(
    (text: string) => {
      if (readOnly) return;
      onInputChange(line.id, text);
      debouncedCalculate(line.id);
    },
    [line.id, onInputChange, debouncedCalculate, readOnly]
  );

  const handleKeyPress = useCallback(
    (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
      if (readOnly) return;
      // Delete empty line on backspace
      if (e.nativeEvent.key === "Backspace" && line.input === "" && onDeleteEmpty) {
        onDeleteEmpty(line.id);
      }
    },
    [line.id, line.input, onDeleteEmpty, readOnly]
  );

  const handleShareResult = useCallback(async () => {
    if (line.result && line.result.type !== "error") {
      await shareWithHaptic({
        message: `${line.input} = ${line.result.formatted} - Shared from Numy`,
      });
    }
  }, [line.input, line.result]);

  const handleSubmit = useCallback(() => {
    if (readOnly) return;
    onSubmit();
  }, [onSubmit, readOnly]);

  const isError = line.result?.type === "error";
  const resultColor = isError ? colors.result.error : colors.result.primary;

  // Don't show errors if suppressErrors is true
  const showResult = line.result && line.result.formatted && !(suppressErrors && isError);

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, { color: categoryColor }]}
          value={line.input}
          onChangeText={handleChange}
          onKeyPress={handleKeyPress}
          onSubmitEditing={handleSubmit}
          placeholder={readOnly ? "" : t("placeholder")}
          placeholderTextColor={colors.text.muted}
          autoFocus={autoFocus && !readOnly}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="next"
          blurOnSubmit={false}
          editable={!readOnly}
          testID={testID ? `${testID}.input` : undefined}
          accessibilityLabel={t("inputAccessibility")}
          accessibilityHint={readOnly ? undefined : t("inputHint")}
        />
      </View>

      {showResult && (
        <Pressable
          style={({ pressed }) => [
            styles.resultContainer,
            pressed && styles.resultContainerPressed,
          ]}
          onPress={handleShareResult}
          accessibilityLabel={t("resultAccessibility", { value: line.result?.formatted })}
          accessibilityHint={t("resultHint")}
          accessibilityRole="button"
          testID={testID ? `${testID}.result` : undefined}
        >
          <Text style={[styles.result, { color: resultColor }]}>{line.result?.formatted}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    minHeight: 44,
  },
  inputContainer: {
    flex: 1,
    marginRight: spacing.md,
    // backgroundColor: colors.background.tertiary,
    // borderRadius: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  input: {
    fontFamily: typography.fonts.mono,
    fontSize: typography.sizes.md,
    color: colors.text.primary,
    padding: 0,
  },
  resultContainer: {
    minWidth: 64,
    alignItems: "flex-end",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    // borderRadius: 999,
    // backgroundColor: colors.ui.highlight,
  },
  resultContainerPressed: {
    opacity: 0.7,
  },
  result: {
    fontFamily: typography.fonts.mono,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
  },
});
