import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import Decimal from "decimal.js";
import { useTranslation } from "react-i18next";
import { colors, typography, spacing } from "../../theme";
import { shareWithHaptic } from "../../../application/utils";

interface RunningTotalProps {
  readonly total: Decimal;
  readonly unit?: string;
  readonly testID?: string;
}

export function RunningTotal({ total, unit, testID }: RunningTotalProps) {
  const { t } = useTranslation("calculator");

  const formatTotal = (value: Decimal): string => {
    const num = value.toNumber();
    if (Math.abs(num) >= 1000) {
      return num.toLocaleString("en-US", { maximumFractionDigits: 2 });
    }
    return value.toDecimalPlaces(2).toString();
  };

  const handleShare = async () => {
    const text = unit ? `${formatTotal(total)} ${unit}` : formatTotal(total);
    await shareWithHaptic({
      message: `Total: ${text} - Shared from Numy`,
    });
  };

  const displayText = unit
    ? `${t("total")}${formatTotal(total)} ${unit}`
    : `${t("total")}${formatTotal(total)}`;

  return (
    <View
      style={styles.container}
      testID={testID}
      accessibilityLiveRegion="polite"
      accessible={true}
      accessibilityRole="summary"
    >
      <View style={styles.content}>
        <Text style={styles.total} testID={testID ? `${testID}.display` : undefined}>
          {displayText}
        </Text>
        <Pressable
          style={({ pressed }) => [styles.shareButton, pressed && styles.shareButtonPressed]}
          onPress={handleShare}
          accessibilityLabel={t("shareAccessibility")}
          accessibilityHint={t("totalHint")}
          accessibilityRole="button"
          testID={testID ? `${testID}.share-button` : undefined}
        >
          <Text style={styles.shareText}>{t("tapToShare")}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.secondary,
    borderTopWidth: 1,
    borderTopColor: colors.ui.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  total: {
    fontFamily: typography.fonts.mono,
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
    flex: 1,
  },
  shareButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  shareButtonPressed: {
    opacity: 0.7,
  },
  shareText: {
    fontFamily: typography.fonts.mono,
    fontSize: typography.sizes.sm,
    color: colors.text.muted,
  },
});
