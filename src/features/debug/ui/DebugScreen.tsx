import { colors, spacing, typography } from "@/presentation/theme";
import { requestTrackingPermissionsAsync } from "expo-tracking-transparency";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AdsConsent } from "react-native-google-mobile-ads";
import { SafeAreaView } from "react-native-safe-area-context";
import { ResetService } from "../../../features/reset";

export const DebugScreen = () => {
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

  const handleRequestATT = async () => {
    try {
      const result = await requestTrackingPermissionsAsync();
      Alert.alert("ATT Result", JSON.stringify(result));
    } catch (e) {
      Alert.alert("Error", "ATT Request failed");
    }
  };

  const handleResetAdFrequency = async () => {
    // Mocking functionality as Frequency capping is usually local or server side.
    // If stored in MMKV/AsyncStorage, we clear that specific key.
    // Assuming 'ads_frequency' or similar.
    // For now, simple alert or clear specific dummy key.
    // In a real app, logic would be in AdsService.
    Alert.alert("Info", "Ad Frequency Reset (Mock)");
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.header}>Debug Tools</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy & Ads</Text>
          <TouchableOpacity style={styles.button} onPress={handleRequestATT}>
            <Text style={styles.buttonText}>Request ATT Status</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={handleRequestAdConsent}>
            <Text style={styles.buttonText}>Request Ad Consent (UMP)</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={handleResetAdFrequency}>
            <Text style={styles.buttonText}>Reset Ad Frequency</Text>
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
});
