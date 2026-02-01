import React, { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { AdsConsent } from "react-native-google-mobile-ads";
import {
  getTrackingPermissionsAsync,
  requestTrackingPermissionsAsync,
} from "expo-tracking-transparency";
import * as Application from "expo-application";
import { useRouter } from "expo-router";
import { adService } from "@/features/ads/model/AdService";
import { colors, spacing, typography } from "@/presentation/theme";

export default function DebugScreen() {
  const router = useRouter();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [attStatus, setAttStatus] = useState<string>("unknown");
  const [advertisingId, setAdvertisingId] = useState<string>("Loading...");

  const loadInfo = async () => {
    setDebugInfo(adService.getDebugInfo());

    // Load ATT status
    try {
      const status = await getTrackingPermissionsAsync();
      setAttStatus(status.status);
    } catch (e) {
      setAttStatus("error");
    }

    // Load Advertising ID
    try {
      const id = await Application.getIosIdForVendorAsync();
      setAdvertisingId(id || "Not available");
    } catch (e) {
      setAdvertisingId("Error loading ID");
    }
  };

  useEffect(() => {
    loadInfo();
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

  const handleRequestATT = async () => {
    try {
      const result = await requestTrackingPermissionsAsync();
      setAttStatus(result.status);
      Alert.alert("ATT Status", `Status: ${result.status}`);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  const handleCheckATTStatus = async () => {
    try {
      const result = await getTrackingPermissionsAsync();
      setAttStatus(result.status);
      Alert.alert("ATT Status", `Current status: ${result.status}`);
    } catch (e: any) {
      Alert.alert("Error", e.message);
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
        Alert.alert("Loaded", "Interstitial ad loaded");
        loadInfo();
      },
      onError: (e) => Alert.alert("Error", e.message),
    });
  };

  const handleShowAppOpen = () => {
    if (adService.isReady("appOpen")) {
      adService.showAppOpenAd();
    } else {
      Alert.alert("Not Ready", "App Open Ad not loaded");
    }
  };

  const handleLoadAppOpen = () => {
    adService.loadAppOpenAd({
      onLoaded: () => {
        Alert.alert("Loaded", "App Open Ad loaded");
        loadInfo();
      },
      onError: (e) => Alert.alert("Error", e.message),
    });
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Debug Tools</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Monetization (AdMob)</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Interstitial Ad</Text>
          <Text style={styles.value}>
            Enabled: {debugInfo?.config?.interstitial?.enabled ? "Yes" : "No"}
          </Text>
          <Text style={styles.value}>Loaded: {debugInfo?.isInterstitialLoaded ? "Yes" : "No"}</Text>
          <Text style={styles.value}>
            Session Impressions: {debugInfo?.sessionImpressions?.interstitial || 0}
          </Text>
        </View>

        <View style={styles.buttonRow}>
          <Pressable style={[styles.button, styles.buttonHalf]} onPress={handleLoadInterstitial}>
            <Text style={styles.buttonText}>Load Interstitial</Text>
          </Pressable>
          <Pressable style={[styles.button, styles.buttonHalf]} onPress={handleShowInterstitial}>
            <Text style={styles.buttonText}>Show Interstitial</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>App Open Ad</Text>
          <Text style={styles.value}>
            Enabled: {debugInfo?.config?.appOpen?.enabled ? "Yes" : "No"}
          </Text>
          <Text style={styles.value}>
            Session Impressions: {debugInfo?.sessionImpressions?.appOpen || 0}
          </Text>
        </View>

        <View style={styles.buttonRow}>
          <Pressable style={[styles.button, styles.buttonHalf]} onPress={handleLoadAppOpen}>
            <Text style={styles.buttonText}>Load App Open</Text>
          </Pressable>
          <Pressable style={[styles.button, styles.buttonHalf]} onPress={handleShowAppOpen}>
            <Text style={styles.buttonText}>Show App Open</Text>
          </Pressable>
        </View>

        <Pressable style={[styles.button, styles.destructiveButton]} onPress={handleResetConsent}>
          <Text style={styles.buttonText}>Reset Consent (UMP)</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tracking & Analytics</Text>

        <View style={styles.card}>
          <Text style={styles.label}>ATT Status</Text>
          <Text style={[styles.value, styles.statusBadge]}>{attStatus.toUpperCase()}</Text>
        </View>

        <View style={styles.buttonRow}>
          <Pressable style={[styles.button, styles.buttonHalf]} onPress={handleCheckATTStatus}>
            <Text style={styles.buttonText}>Check ATT</Text>
          </Pressable>
          <Pressable style={[styles.button, styles.buttonHalf]} onPress={handleRequestATT}>
            <Text style={styles.buttonText}>Request ATT</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Advertising ID (IDFA)</Text>
          <Text style={[styles.value, styles.mono]} numberOfLines={1}>
            {advertisingId}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Global Configuration</Text>

        <Pressable
          style={styles.button}
          onPress={() => router.push("/settings/config-values" as any)}
        >
          <Text style={styles.buttonText}>View Config Values</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Debug Info</Text>
        <ScrollView horizontal style={styles.jsonContainer}>
          <Text style={styles.mono}>{JSON.stringify(debugInfo, null, 2)}</Text>
        </ScrollView>
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
  statusBadge: {
    fontWeight: typography.weights.bold,
    color: colors.ui.highlight,
  },
  button: {
    backgroundColor: colors.ui.highlight,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  destructiveButton: {
    backgroundColor: "#DC2626",
  },
  buttonRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  buttonHalf: {
    flex: 1,
  },
  buttonText: {
    color: "#FFFFFF",
    fontFamily: typography.fonts.mono,
    fontWeight: "bold",
    fontSize: typography.sizes.sm,
  },
  mono: {
    fontFamily: typography.fonts.mono,
    fontSize: 10,
    marginTop: spacing.md,
    color: colors.text.muted,
  },
  jsonContainer: {
    maxHeight: 300,
  },
});
