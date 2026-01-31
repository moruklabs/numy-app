import { usePrivacySequence } from "@/features/privacy";
import { PrivacyPrimer } from "@/features/privacy/ui/PrivacyPrimer";
import { colors } from "@/presentation/theme";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export const OnboardingScreen = () => {
  const router = useRouter();
  const { initialized, showPrimer, onPrimerContinue } = usePrivacySequence();

  // If initialization is complete, navigating away (or handled by parent)
  // For this standalone screen, we might want to navigate to Home/Tabs when done.
  useEffect(() => {
    if (initialized) {
      // Example navigation, adjust based on app router structure
      router.replace("/(tabs)");
    }
  }, [initialized, router]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to Numy</Text>
        <Text style={styles.description}>Your smart calculator companion.</Text>
        {/* Ad hoc loading or welcome content */}
      </View>

      <PrivacyPrimer visible={showPrimer} onContinue={onPrimerContinue} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors?.background?.primary || "#fff",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 16,
    color: colors?.text?.primary || "#000",
  },
  description: {
    fontSize: 18,
    color: colors?.text?.secondary || "#666",
  },
});
