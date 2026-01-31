import React, { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { AdsConsent } from "react-native-google-mobile-ads";
import { adService } from "../../src/features/ads/model/AdService";
import { colors, spacing, typography } from "../../src/presentation/theme";

export default function DebugScreen() {
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const loadInfo = () => {
    setDebugInfo(adService.getDebugInfo());
  };

  useEffect(() => {
    loadInfo();
    // Refresh every 5 seconds
    const interval = setInterval(loadInfo, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleResetConsent = async () => {
    try {
      await AdsConsent.reset();
      Alert.alert("Success", "Consent reset. Restart app to trigger flow.");
    } catch (e) {
      Alert.alert("Error", "Failed to reset consent");
    }
  };

  const handleShowInterstitial = () => {
    if (adService.isReady("interstitial")) {
      adService.showInterstitial();
    } else {
      Alert.alert("Not Ready", "Interstitial not loaded");
    }
  };

  const handleLoadInterstitial = () => {
    adService.loadInterstitial({
      onLoaded: () => {
        Alert.alert("Loaded", "Ad loaded");
        loadInfo();
      },
      onError: (e) => Alert.alert("Error", e.message),
    });
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Debug Tools</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ads & Privacy</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Ad Config:</Text>
          <Text style={styles.value}>
            Interstitial Enabled: {debugInfo?.config?.interstitial?.enabled ? "Yes" : "No"}
          </Text>
          <Text style={styles.value}>Loaded: {debugInfo?.isInterstitialLoaded ? "Yes" : "No"}</Text>
        </View>

        <Pressable style={styles.button} onPress={handleResetConsent}>
          <Text style={styles.buttonText}>Reset Consent (UMP)</Text>
        </Pressable>

        <Pressable style={styles.button} onPress={handleLoadInterstitial}>
          <Text style={styles.buttonText}>Load Interstitial</Text>
        </Pressable>

        <Pressable style={styles.button} onPress={handleShowInterstitial}>
          <Text style={styles.buttonText}>Show Interstitial</Text>
        </Pressable>

        <Text style={styles.mono}>{JSON.stringify(debugInfo?.sessionImpressions, null, 2)}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    padding: spacing.lg,
  },
  title: {
    fontFamily: typography.fonts.mono,
    fontSize: typography.sizes.xl,
    color: colors.text.primary,
    marginBottom: spacing.xl,
    fontWeight: typography.weights.bold,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontFamily: typography.fonts.mono,
    fontSize: typography.sizes.lg,
    color: colors.categories.cssCalculations.text,
    marginBottom: spacing.md,
    fontWeight: typography.weights.semibold,
  },
  card: {
    backgroundColor: colors.background.secondary,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  label: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    marginBottom: spacing.xs,
  },
  value: {
    color: colors.text.primary,
    fontSize: typography.sizes.md,
    fontFamily: typography.fonts.mono,
  },
  button: {
    backgroundColor: colors.ui.highlight,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  buttonText: {
    color: "#FFFFFF",
    fontFamily: typography.fonts.mono,
    fontWeight: "bold",
  },
  mono: {
    fontFamily: typography.fonts.mono,
    fontSize: 10,
    marginTop: spacing.md,
    color: colors.text.muted,
  },
});
