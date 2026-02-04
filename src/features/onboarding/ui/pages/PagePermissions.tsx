import { colors, spacing, typography } from "@/presentation/theme";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { usePrivacySequence } from "../../../privacy/api/PrivacySequence";

interface PagePermissionsProps {
  onReady: () => void;
}

export const PagePermissions = ({ onReady }: PagePermissionsProps) => {
  const { initialized, showPrimer, onPrimerContinue } = usePrivacySequence();

  useEffect(() => {
    if (initialized) {
      onReady();
    }
  }, [initialized, onReady]);

  if (!showPrimer && !initialized) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.ui.highlight} />
        <Text style={styles.loadingText}>Setting up your experience...</Text>
      </View>
    );
  }

  if (showPrimer) {
    return (
      <View style={styles.container}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>🛡️</Text>
        </View>
        <Text style={styles.title}>Personalized Experience</Text>
        <Text style={styles.description}>
          To provide the best calculator experience free of charge, we tailor our content to you.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>This helps us:</Text>
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>Keep the app free for everyone</Text>
          </View>
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>Show relevant features</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.button} onPress={onPrimerContinue}>
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.successContainer}>
        <Text style={styles.icon}>✅</Text>
        <Text style={styles.title}>All Set!</Text>
        <Text style={styles.description}>You are ready to go.</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontFamily: typography.fonts.mono,
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
    marginTop: spacing.lg,
  },
  iconContainer: {
    marginBottom: spacing.xl,
    padding: spacing.lg,
    backgroundColor: colors.background.secondary,
    borderRadius: 50,
  },
  icon: {
    fontSize: 48,
  },
  successContainer: {
    alignItems: "center",
  },
  title: {
    fontFamily: typography.fonts.mono,
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
    textAlign: "center",
  },
  description: {
    fontFamily: typography.fonts.mono,
    fontSize: typography.sizes.lg,
    color: colors.text.secondary,
    textAlign: "center",
    marginBottom: spacing.xl,
    lineHeight: 24,
  },
  card: {
    width: "100%",
    backgroundColor: colors.background.secondary,
    padding: spacing.lg,
    borderRadius: 16,
    marginBottom: spacing.xxl,
  },
  cardTitle: {
    fontFamily: typography.fonts.mono,
    fontSize: typography.sizes.md,
    fontWeight: "bold",
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  bulletPoint: {
    flexDirection: "row",
    marginBottom: spacing.sm,
  },
  bullet: {
    color: colors.ui.highlight,
    marginRight: spacing.sm,
    fontWeight: "bold",
  },
  bulletText: {
    fontFamily: typography.fonts.mono,
    fontSize: typography.sizes.md,
    color: colors.text.primary,
  },
  button: {
    backgroundColor: colors.ui.highlight,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    borderRadius: 30,
    width: "100%",
    alignItems: "center",
  },
  buttonText: {
    fontFamily: typography.fonts.mono,
    fontSize: typography.sizes.md,
    fontWeight: "bold",
    color: colors.text.primary, // Check contrast
  },
});
