import { Tabs } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text } from "react-native";
import { useCalculatorStore } from "../../src/application/stores/calculatorStore";
import { colors, spacing, typography } from "../../src/presentation/theme";

interface TabIconProps {
  color: string;
  symbol: string;
  testID: string;
}

const TabIcon = ({ color, symbol, testID }: TabIconProps) => (
  <Text
    style={[styles.tabIcon, { color }]}
    testID={testID}
    accessibilityElementsHidden={true}
    importantForAccessibility="no-hide-descendants"
  >
    {symbol}
  </Text>
);

interface HeaderAddButtonProps {
  onPress: () => void;
  accessibilityLabel: string;
}

const HeaderAddButton = ({ onPress, accessibilityLabel }: HeaderAddButtonProps) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [styles.headerButton, pressed && styles.headerButtonPressed]}
    accessibilityLabel={accessibilityLabel}
    accessibilityRole="button"
    testID="header.new-button"
  >
    <Text style={styles.headerButtonText}>+</Text>
  </Pressable>
);

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

        headerLeft: () => null,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("calculator"),
          headerTitle: "Numy",

          headerLeft: () => null,
          headerRight: () => (
            <HeaderAddButton
              onPress={newDocumentWithAutoSave}
              accessibilityLabel={t("newDocument")}
            />
          ),
          tabBarIcon: ({ color }) => (
            <TabIcon color={color} symbol="=" testID="tabs.calculator.icon" />
          ),
          tabBarButtonTestID: "tabs.calculator",
          tabBarAccessibilityLabel: t("calculatorTab"),
        }}
      />
      <Tabs.Screen
        name="examples"
        options={{
          title: t("examples"),
          tabBarIcon: ({ color }) => (
            <TabIcon color={color} symbol="?" testID="tabs.examples.icon" />
          ),
          tabBarButtonTestID: "tabs.examples",
          tabBarAccessibilityLabel: t("examplesTab"),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: t("history"),
          tabBarIcon: ({ color }) => (
            <TabIcon color={color} symbol="#" testID="tabs.history.icon" />
          ),
          tabBarButtonTestID: "tabs.history",
          tabBarAccessibilityLabel: t("historyTab"),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t("settings"),
          tabBarIcon: ({ color }) => (
            <TabIcon color={color} symbol="*" testID="tabs.settings.icon" />
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
