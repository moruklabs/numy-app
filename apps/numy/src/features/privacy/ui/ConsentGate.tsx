import React from "react";
import { Button, StyleSheet, Text, View } from "react-native";
import { AdsConsent } from "react-native-google-mobile-ads";
// Attempt to import theme, fallback if fails or use standard hook if available.
// using direct colors/styles for now to ensure standard RN compatibility
// assuming colors is available at @/presentation/theme based on examples.tsx

// If theme import fails, we can use hardcoded colors or try to find the right path
// But let's try to match existing style
import { colors } from "@/presentation/theme";

export const ConsentGate = () => {
  const handleManagePrivacy = async () => {
    try {
      const consentInfo = await AdsConsent.requestInfoUpdate();
      if (consentInfo.privacyOptionsRequirementStatus === "REQUIRED") {
        await AdsConsent.showPrivacyOptionsForm();
      } else {
        console.log("Privacy options not required or available.");
      }
    } catch (error) {
      console.error("Failed to present privacy options:", error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Privacy Settings</Text>
      <Text style={styles.description}>Manage your privacy choices and consent preferences.</Text>
      <Button title="Manage Consent" onPress={handleManagePrivacy} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 8,
    backgroundColor: colors?.background?.secondary || "#f0f0f0", // Fallback
    borderRadius: 8,
  },
  header: {
    fontSize: 16,
    fontWeight: "600",
    color: colors?.text?.primary || "#000",
  },
  description: {
    fontSize: 14,
    color: colors?.text?.secondary || "#666",
    marginBottom: 8,
  },
});
