import { colors, spacing, typography } from "@/presentation/theme";
import { StyleSheet, Text, View } from "react-native";

export const PageAdPact = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Keep Numy Free</Text>

      <Text style={styles.description}>
        We use ads to support development and keep the app free for everyone.
      </Text>

      <View style={styles.promiseContainer}>
        <Text style={styles.promiseText}>
          🤝 We promise ads will not interrupt your core workflow.
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
    alignItems: "center",
  },
  title: {
    fontFamily: typography.fonts.mono,
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.lg,
    textAlign: "center",
  },
  description: {
    fontFamily: typography.fonts.mono,
    fontSize: typography.sizes.lg,
    color: colors.text.secondary,
    textAlign: "center",
    marginBottom: spacing.xl,
  },
  promiseContainer: {
    backgroundColor: colors.categories.cssCalculations.text + "20", // Orange tint
    padding: spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.categories.cssCalculations.text,
  },
  promiseText: {
    fontFamily: typography.fonts.mono,
    fontSize: typography.sizes.md,
    color: colors.text.primary,
    fontWeight: "bold",
    textAlign: "center",
  },
});
