import { adService } from "@/features/ads";
import { useOnboardingState } from "@/features/onboarding";
import { ResetService } from "@/features/reset";
import { colors, spacing, typography } from "@/presentation/theme";
import {
  getTrackingPermissionsAsync,
  requestTrackingPermissionsAsync,
} from "expo-tracking-transparency";
import { useEffect, useState } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { AdsConsent } from "react-native-google-mobile-ads";
import { SafeAreaView } from "react-native-safe-area-context";

export const DebugScreen = () => {
  const [stats, setStats] = useState(adService.getStats());
  const { reset: resetOnboarding } = useOnboardingState();
  const [attStatus, setAttStatus] = useState<string>("unknown");

  useEffect(() => {
    refreshStats();
    checkAttStatus();
  }, []);

  const refreshStats = () => {
    setStats(adService.getStats());
  };

  const checkAttStatus = async () => {
    const status = await getTrackingPermissionsAsync();
    setAttStatus(status.status);
  };

  const handleNuclearReset = () => {
    Alert.alert("Nuclear Reset", "This will wipe everything and reload the app. Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reset Everything",
        style: "destructive",
        onPress: async () => {
          try {
            await ResetService.performGlobalReset();
          } catch (e) {
            Alert.alert("Error", "Reset failed");
          }
        },
      },
    ]);
  };

  const handleRestartOnboarding = () => {
    Alert.alert(
      "Restart Onboarding",
      "This will reset onboarding state. You will see onboarding on next launch/reload.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: () => {
            resetOnboarding();
            Alert.alert("Success", "Onboarding state reset. Reload app to see it.");
          },
        },
      ]
    );
  };

  const handleRequestATT = async () => {
    try {
      const result = await requestTrackingPermissionsAsync();
      setAttStatus(result.status);
      Alert.alert("ATT Result", JSON.stringify(result));
    } catch (e) {
      Alert.alert("Error", "ATT Request failed");
    }
  };

  const handleResetAdLimits = async () => {
    await adService.resetLimits();
    refreshStats();
    Alert.alert("Success", "Ad limits and counters reset.");
  };

  const handleRequestAdConsent = async () => {
    try {
      const info = await AdsConsent.requestInfoUpdate();
      const form = await AdsConsent.loadAndShowConsentFormIfRequired();
      Alert.alert("Consent Flow", "Completed");
    } catch (e) {
      Alert.alert("Error", "Consent flow failed: " + e);
    }
  };

  const handleCopyIdfa = async () => {
    // Note: IDFA access is restricted in Expo Go / requires native code.
    // We can't easily get the actual IDFA string without a custom dev client or ejected app
    // AND authorized permission.
    // For now we just placeholder or use what we can.
    Alert.alert(
      "Info",
      "IDFA copy requires native module integration not available in standard Expo Go scope or library limitation."
    );
  };

  const AdStatRow = ({ label, current, max }: { label: string; current: number; max: number }) => (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>
        {current} / {max}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refreshStats} />}
      >
        <Text style={styles.header}>Debug Tools</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ad Stats</Text>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Interstitial</Text>
            <AdStatRow
              label="Session"
              current={stats.interstitial.maxSession - stats.interstitial.remainingSession}
              max={stats.interstitial.maxSession}
            />
            <AdStatRow
              label="Daily"
              current={stats.interstitial.maxDaily - stats.interstitial.remainingDaily}
              max={stats.interstitial.maxDaily}
            />
            <Text style={styles.statDetail}>
              Interval: {stats.interstitial.interval / 1000 / 60} min
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>App Open</Text>
            <AdStatRow
              label="Session"
              current={stats.appOpen.maxSession - stats.appOpen.remainingSession}
              max={stats.appOpen.maxSession}
            />
            <AdStatRow
              label="Daily"
              current={stats.appOpen.maxDaily - stats.appOpen.remainingDaily}
              max={stats.appOpen.maxDaily}
            />
            <Text style={styles.statDetail}>
              Interval: {stats.appOpen.interval / 1000 / 60} min
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Totals</Text>
            <Text style={styles.statValue}>Total Shown: {stats.totalShown}</Text>
          </View>

          <TouchableOpacity style={styles.button} onPress={handleResetAdLimits}>
            <Text style={styles.buttonText}>Reset Ad Counters</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy & Ads</Text>
          <Text style={styles.infoText}>ATT Status: {attStatus}</Text>
          <TouchableOpacity style={styles.button} onPress={handleRequestATT}>
            <Text style={styles.buttonText}>Request ATT Status</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={handleRequestAdConsent}>
            <Text style={styles.buttonText}>Request Ad Consent (UMP)</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={handleCopyIdfa}>
            <Text style={styles.buttonText}>Get & Copy IDFA</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>State Management</Text>
          <TouchableOpacity style={styles.button} onPress={handleRestartOnboarding}>
            <Text style={styles.buttonText}>Restart Onboarding</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Danger Zone</Text>
          <TouchableOpacity
            style={[styles.button, styles.dangerButton]}
            onPress={handleNuclearReset}
          >
            <Text style={[styles.buttonText, styles.dangerText]}>Reset Everything (Nuclear)</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Config</Text>
          <Text style={styles.codeBlock}>{JSON.stringify(stats.interstitial, null, 2)}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    padding: spacing.lg,
  },
  header: {
    fontFamily: typography.fonts.mono,
    fontSize: typography.sizes.xl,
    fontWeight: "bold",
    color: colors.text.primary,
    marginBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontFamily: typography.fonts.mono,
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginBottom: spacing.md,
    textTransform: "uppercase",
  },
  card: {
    backgroundColor: colors.background.secondary,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  cardTitle: {
    fontWeight: "bold",
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  statLabel: {
    color: colors.text.secondary,
  },
  statValue: {
    color: colors.text.primary,
    fontWeight: "bold",
  },
  statDetail: {
    color: colors.text.secondary,
    fontSize: typography.sizes.xs,
    marginTop: spacing.xs,
  },
  button: {
    backgroundColor: colors.background.secondary,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.sm,
    alignItems: "center",
  },
  buttonText: {
    fontFamily: typography.fonts.mono,
    fontSize: typography.sizes.md,
    color: colors.text.primary,
  },
  dangerButton: {
    backgroundColor: "#ff3b3020", // Red tint
    borderWidth: 1,
    borderColor: "#ff3b30",
  },
  dangerText: {
    color: "#ff3b30",
    fontWeight: "bold",
  },
  infoText: {
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  codeBlock: {
    fontFamily: typography.fonts.mono,
    fontSize: 10,
    color: colors.text.secondary,
    backgroundColor: colors.background.secondary,
    padding: spacing.sm,
    borderRadius: 8,
  },
});
