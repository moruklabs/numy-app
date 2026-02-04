import { colors, spacing, typography } from "@/presentation/theme";
import { StyleSheet, Text, View } from "react-native";

export const PageAdPact = () => {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>🤝</Text>
      </View>
      <Text style={styles.title}>The Pact</Text>
      <Text style={styles.description}>Help us keep this tool free for everyone.</Text>

      <View style={styles.card}>
        <View style={styles.bulletPoint}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>Support development</Text>
        </View>
        <View style={styles.bulletPoint}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>Keep core features free</Text>
        </View>
        <View style={styles.bulletPoint}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>Ads won&apos;t interrupt your flow</Text>
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
    backgroundColor: "#FEF3C7", // Amber 100
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
    backgroundColor: colors.background.secondary, // Consider a warm tint?
    padding: spacing.lg,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#F59E0B", // Amber 500
  },
  bulletPoint: {
    flexDirection: "row",
    marginBottom: spacing.md,
    alignItems: "center",
  },
  bullet: {
    color: "#F59E0B",
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
