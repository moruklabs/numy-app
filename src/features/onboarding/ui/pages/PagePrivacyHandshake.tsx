import { colors, spacing, typography } from "@/presentation/theme";
import { StyleSheet, Text, View } from "react-native";

export const PagePrivacyHandshake = () => {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>🔒</Text>
      </View>
      <Text style={styles.title}>Your Data is Safe</Text>
      <Text style={styles.description}>We believe privacy is a fundamental right.</Text>

      <View style={styles.card}>
        <View style={styles.bulletPoint}>
          <Text style={styles.bullet}>✓</Text>
          <Text style={styles.bulletText}>Data stays on your device</Text>
        </View>
        <View style={styles.bulletPoint}>
          <Text style={styles.bullet}>✓</Text>
          <Text style={styles.bulletText}>Analytics are anonymous</Text>
        </View>
        <View style={styles.bulletPoint}>
          <Text style={styles.bullet}>✓</Text>
          <Text style={styles.bulletText}>No personal data collection</Text>
        </View>
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
  iconContainer: {
    marginBottom: spacing.xl,
    padding: spacing.lg,
    backgroundColor: "#E0F2FE", // Light Blue
    borderRadius: 50,
  },
  icon: {
    fontSize: 48,
  },
  title: {
    fontFamily: typography.fonts.mono,
    fontSize: typography.sizes.xxl,
    fontWeight: "bold",
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
    borderLeftWidth: 4,
    borderLeftColor: colors.ui.highlight, // Or a generic blue/green
  },
  bulletPoint: {
    flexDirection: "row",
    marginBottom: spacing.md,
    alignItems: "center",
  },
  bullet: {
    color: colors.categories.variables?.accent || "#10B981",
    marginRight: spacing.md,
    fontWeight: "bold",
    fontSize: typography.sizes.lg,
  },
  bulletText: {
    fontFamily: typography.fonts.mono,
    fontSize: typography.sizes.md,
    color: colors.text.primary,
  },
});
