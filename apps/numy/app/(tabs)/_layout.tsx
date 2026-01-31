import { Tabs } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text } from "react-native";
import { useCalculatorStore } from "../../src/application/stores/calculatorStore";
import { colors, spacing, typography } from "../../src/presentation/theme";

export default function TabLayout() {
  const { t } = useTranslation("tabs");
  const newDocumentWithAutoSave = useCalculatorStore((state) => state.newDocumentWithAutoSave);

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: colors.background.secondary,
          borderTopColor: colors.ui.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.categories.myCalculations.accent,
        tabBarInactiveTintColor: colors.text.muted,
        tabBarLabelStyle: {
          fontFamily: typography.fonts.mono,
          fontSize: 10,
        },
        headerStyle: {
          backgroundColor: colors.background.primary,
        },
        headerTintColor: colors.text.primary,
        headerTitleStyle: {
          fontFamily: typography.fonts.mono,
          fontWeight: "600",
        },
        headerBackVisible: false,
        headerLeft: () => null,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("calculator"),
          headerTitle: "Numy",
          headerBackVisible: false,
          headerLeft: () => null,
          headerRight: () => (
            <Pressable
              onPress={newDocumentWithAutoSave}
              style={({ pressed }) => [styles.headerButton, pressed && styles.headerButtonPressed]}
              accessibilityLabel={t("newDocument")}
              accessibilityRole="button"
              testID="header.new-button"
            >
              <Text style={styles.headerButtonText}>+</Text>
            </Pressable>
          ),
          tabBarIcon: ({ color }: { color: string }) => (
            <Text
              style={[styles.tabIcon, { color }]}
              testID="tabs.calculator.icon"
              accessibilityElementsHidden={true}
              importantForAccessibility="no-hide-descendants"
            >
              =
            </Text>
          ),
          tabBarButtonTestID: "tabs.calculator",
          tabBarAccessibilityLabel: t("calculatorTab"),
        }}
      />
      <Tabs.Screen
        name="examples"
        options={{
          title: t("examples"),
          tabBarIcon: ({ color }: { color: string }) => (
            <Text
              style={[styles.tabIcon, { color }]}
              testID="tabs.examples.icon"
              accessibilityElementsHidden={true}
              importantForAccessibility="no-hide-descendants"
            >
              ?
            </Text>
          ),
          tabBarButtonTestID: "tabs.examples",
          tabBarAccessibilityLabel: t("examplesTab"),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: t("history"),
          tabBarIcon: ({ color }: { color: string }) => (
            <Text
              style={[styles.tabIcon, { color }]}
              testID="tabs.history.icon"
              accessibilityElementsHidden={true}
              importantForAccessibility="no-hide-descendants"
            >
              #
            </Text>
          ),
          tabBarButtonTestID: "tabs.history",
          tabBarAccessibilityLabel: t("historyTab"),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t("settings"),
          tabBarIcon: ({ color }: { color: string }) => (
            <Text
              style={[styles.tabIcon, { color }]}
              testID="tabs.settings.icon"
              accessibilityElementsHidden={true}
              importantForAccessibility="no-hide-descendants"
            >
              *
            </Text>
          ),
          tabBarButtonTestID: "tabs.settings",
          tabBarAccessibilityLabel: t("settingsTab"),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIcon: {
    fontFamily: typography.fonts.mono,
    fontSize: 20,
    fontWeight: "700",
  },
  headerButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginRight: spacing.sm,
  },
  headerButtonPressed: {
    opacity: 0.7,
  },
  headerButtonText: {
    fontFamily: typography.fonts.mono,
    fontSize: 24,
    fontWeight: "600",
    color: colors.categories.myCalculations.accent,
  },
});
