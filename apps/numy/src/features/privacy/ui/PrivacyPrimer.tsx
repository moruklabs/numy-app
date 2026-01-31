import { colors } from "@/presentation/theme"; // Adjust import
import React from "react";
import { Button, Modal, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface PrivacyPrimerProps {
  visible: boolean;
  onContinue: () => void;
}

export const PrivacyPrimer = ({ visible, onContinue }: PrivacyPrimerProps) => {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>We Value Your Privacy</Text>
          <Text style={styles.description}>
            We use identifiers to personalize content and ads, to provide social media features and
            to analyze our traffic. We also share such identifiers and other information from your
            device with our social media, advertising and analytics partners.
          </Text>
          <View style={styles.spacer} />
          <Button title="Continue" onPress={onContinue} />
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors?.background?.primary || "#fff",
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
    color: colors?.text?.primary || "#000",
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    color: colors?.text?.secondary || "#666",
    lineHeight: 24,
  },
  spacer: {
    height: 32,
  },
});
