import { colors, spacing, typography } from "@/presentation/theme";
import { StyleSheet, Text, View } from "react-native";

export const PagePrivacy = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your privacy matters</Text>

      <View style={styles.card}>
        <Text style={styles.icon}>🔒</Text>
        <Text style={styles.cardTitle}>Data stays on device</Text>
        <Text style={styles.cardText}>
          Implementation details and calculations are processed locally.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.icon}>🕵️‍♀️</Text>
        <Text style={styles.cardTitle}>Anonymous Analytics</Text>
        <Text style={styles.cardText}>
          We only collect anonymous usage data to improve the app.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: "center",
  },
  title: {
    fontFamily: typography.fonts.mono,
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.xl,
    textAlign: "center",
  },
  card: {
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    alignItems: "center",
  },
  icon: {
    fontSize: 40,
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontFamily: typography.fonts.mono,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  cardText: {
    fontFamily: typography.fonts.mono,
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
    textAlign: "center",
  },
});
