import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "../../../../presentation/theme";

export function ExamplesList() {
  const { t } = useTranslation("history");

  return (
    <View style={styles.container} testID="examples-list">
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          {t("emptyState.subtitle")}
          {/* Using subtitle as placeholder text for now */}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xxl,
  },
  emptyText: {
    fontFamily: typography.fonts.mono,
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
    textAlign: "center",
  },
});
