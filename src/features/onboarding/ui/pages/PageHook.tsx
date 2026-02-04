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
        {/* Placeholder for Lottie/SVG Animation */}
        <View style={styles.animationPlaceholder}>
          <Text style={styles.animationText}>✨</Text>
        </View>
        <Text style={styles.title}>Welcome to Numy</Text>
        <Text style={styles.subtitle}>The Smartest Calculator that adapts to you.</Text>
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
  animationPlaceholder: {
    width: 120,
    height: 120,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.xxl,
  },
  animationText: {
    fontSize: 60,
  },
  title: {
    fontFamily: typography.fonts.mono,
    fontSize: typography.sizes.xxxl,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: typography.fonts.mono,
    fontSize: typography.sizes.lg,
    color: colors.text.secondary,
    textAlign: "center",
    marginTop: spacing.md,
  },
});
