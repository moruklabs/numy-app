import { HistoryList } from "@/presentation/features/history";
import { colors } from "@/presentation/theme";
import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function HistoryScreen() {
  const { t } = useTranslation("history");
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[styles.container, { paddingTop: insets.top }]}
      testID="history.screen"
      accessible={true}
      accessibilityLabel={t("screenTitle")}
    >
      <View style={styles.content}>
        <HistoryList />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    flex: 1,
  },
});
