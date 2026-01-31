import { usePrivacySequence } from "@/features/privacy";
import { PrivacyPrimer } from "@/features/privacy/ui/PrivacyPrimer";
import { colors, spacing, typography } from "@/presentation/theme";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export const OnboardingScreen = () => {
  const router = useRouter();
  const { initialized, showPrimer, onPrimerContinue } = usePrivacySequence();

  useEffect(() => {
    if (initialized) {
      // Navigate to main app after privacy setup is complete
      router.replace("/(tabs)");
    }
  }, [initialized, router]);

  if (showPrimer) {
    return <PrivacyPrimer visible={showPrimer} onContinue={onPrimerContinue} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>🔢</Text>
        </View>

        <Text style={styles.title}>Welcome to Numy</Text>

        <Text style={styles.subtitle}>Your Smart Calculator Companion</Text>

        <View style={styles.featuresContainer}>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>💬</Text>
            <Text style={styles.featureText}>Natural language math</Text>
          </View>

          <View style={styles.feature}>
            <Text style={styles.featureIcon}>🔄</Text>
            <Text style={styles.featureText}>Unit conversions</Text>
          </View>

          <View style={styles.feature}>
            <Text style={styles.featureIcon}>📊</Text>
            <Text style={styles.featureText}>Instant results</Text>
          </View>

          <View style={styles.feature}>
            <Text style={styles.featureIcon}>🌍</Text>
            <Text style={styles.featureText}>39 languages</Text>
          </View>
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.ui.highlight} />
          <Text style={styles.loadingText}>Setting up your privacy preferences...</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
  },
  iconContainer: {
    marginBottom: spacing.xl,
  },
  icon: {
    fontSize: 80,
  },
  title: {
    fontSize: 32,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.md,
    color: colors.text.primary,
    fontFamily: typography.fonts.mono,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    color: colors.text.secondary,
    marginBottom: spacing.xl * 2,
    textAlign: "center",
  },
  featuresContainer: {
    width: "100%",
    marginBottom: spacing.xl * 2,
  },
  feature: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  featureText: {
    fontSize: 16,
    color: colors.text.primary,
    fontFamily: typography.fonts.mono,
  },
  loadingContainer: {
    alignItems: "center",
    marginTop: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: "center",
  },
});
