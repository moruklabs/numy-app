import { colors, spacing, typography } from "@/presentation/theme";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, View } from "react-native";

export const PageHook = () => {
  return (
    <LinearGradient
      colors={[colors.background.primary, colors.ui.highlight]}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to Numy</Text>
        <Text style={styles.subtitle}>The Smartest Calculator</Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  title: {
    fontFamily: typography.fonts.mono,
    fontSize: typography.sizes.xxxl, // 32
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: typography.fonts.mono,
    fontSize: typography.sizes.lg, // 18
    color: colors.text.secondary,
    textAlign: "center",
    marginTop: spacing.md,
  },
});
