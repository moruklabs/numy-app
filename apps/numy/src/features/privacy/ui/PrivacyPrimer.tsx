import { colors, spacing, typography } from "@/presentation/theme";
import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
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
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>🔒</Text>
          </View>

          <Text style={styles.title}>We Value Your Privacy</Text>

          <Text style={styles.description}>
            Numy uses personalized ads to keep the app free. With your permission, we&apos;ll use
            your device&apos;s advertising identifier to show you relevant ads.
          </Text>

          <View style={styles.benefitsContainer}>
            <View style={styles.benefit}>
              <Text style={styles.benefitIcon}>✓</Text>
              <Text style={styles.benefitText}>Keep Numy completely free</Text>
            </View>
            <View style={styles.benefit}>
              <Text style={styles.benefitIcon}>✓</Text>
              <Text style={styles.benefitText}>Support ongoing development</Text>
            </View>
            <View style={styles.benefit}>
              <Text style={styles.benefitIcon}>✓</Text>
              <Text style={styles.benefitText}>See relevant, useful ads</Text>
            </View>
          </View>

          <Text style={styles.note}>
            You can change your preference anytime in Settings. We respect your privacy and never
            share personal data.
          </Text>

          <Pressable style={styles.button} onPress={onContinue}>
            <Text style={styles.buttonText}>Continue</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: "center",
    alignItems: "center",
  },
  iconContainer: {
    marginBottom: spacing.xl,
  },
  icon: {
    fontSize: 64,
  },
  title: {
    fontSize: 28,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.lg,
    textAlign: "center",
    color: colors.text.primary,
    fontFamily: typography.fonts.mono,
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    color: colors.text.secondary,
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  benefitsContainer: {
    width: "100%",
    marginBottom: spacing.xl,
  },
  benefit: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  benefitIcon: {
    fontSize: 20,
    color: colors.ui.highlight,
    marginRight: spacing.md,
  },
  benefitText: {
    fontSize: 16,
    color: colors.text.primary,
  },
  note: {
    fontSize: 12,
    textAlign: "center",
    color: colors.text.muted,
    lineHeight: 18,
    marginBottom: spacing.xl,
  },
  button: {
    backgroundColor: colors.ui.highlight,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl * 2,
    borderRadius: 12,
    minWidth: 200,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: typography.weights.bold,
    fontFamily: typography.fonts.mono,
  },
});
