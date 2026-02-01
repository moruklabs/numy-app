import { useCalculatorStore, type CalculatorState } from "@/stores/calculatorStore";
import { getDefaultExamples } from "@/domain/fixtures/defaultExamples";
import { useInterstitialAd } from "@/features/ads/hooks/useInterstitialAd"; // Import Ad hook
import { colors, spacing } from "@/presentation/theme";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ExamplesScreen() {
  const { t } = useTranslation("history"); // Reuse history translations for shared keys if needed
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const examples = getDefaultExamples();
  const loadExample = useCalculatorStore((state: CalculatorState) => state.loadExample);
  const [isNavigating, setIsNavigating] = React.useState(false);

  // Ad-as-Loader: Preload/Show ad when processing (navigating)
  useInterstitialAd({
    feature: "examples",
    isProcessing: isNavigating,
    autoShow: true,
  });

  const handleExamplePress = (example: any) => {
    setIsNavigating(true);
    // Short delay to allow state update to trigger hook, but mostly we just fire navigation
    // The ad will show over the next screen if it loads, acting as a transition interstitial
    loadExample(example);
    router.push("/");
    // Reset after transition (though component might unmount/remount)
    setTimeout(() => setIsNavigating(false), 2000);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]} testID="examples.screen">
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.header}>Examples</Text>
        {examples.map((example) => (
          <Pressable
            key={example.id}
            style={({ pressed }) => [styles.exampleItem, pressed && styles.exampleItemPressed]}
            onPress={() => handleExamplePress(example)}
          >
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons
                name="lightning-bolt-outline"
                size={24}
                color={colors.categories.myCalculations.accent}
              />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.title}>{example.title}</Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                {example.lines.length} lines • {example.lines[0]?.input || "..."}
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.text.muted} />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.text.primary,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  content: {
    paddingBottom: spacing.xxl,
  },
  exampleItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.ui.border,
  },
  exampleItemPressed: {
    opacity: 0.7,
    backgroundColor: colors.background.tertiary,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.tertiary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text.primary,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: colors.text.secondary,
  },
});
