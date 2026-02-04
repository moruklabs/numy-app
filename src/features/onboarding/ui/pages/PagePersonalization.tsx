import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, spacing, typography } from "../../../../presentation/theme";
import { useOnboardingState } from "../../model/useOnboardingState";

const GOALS = [
  { id: "student", label: "🎓 Student" },
  { id: "professional", label: "💼 Professional" },
  { id: "daily", label: "🏠 Daily Use" },
  { id: "shopping", label: "🛒 Shopping" },
];

export const PagePersonalization = () => {
  const { userGoal, setUserGoal } = useOnboardingState();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>What is your goal?</Text>
      <View style={styles.options}>
        {GOALS.map((goal) => (
          <TouchableOpacity
            key={goal.id}
            style={[styles.option, userGoal === goal.id && styles.optionSelected]}
            onPress={() => setUserGoal(goal.id)}
          >
            <Text style={[styles.optionText, userGoal === goal.id && styles.optionTextSelected]}>
              {goal.label}
            </Text>
          </TouchableOpacity>
        ))}
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
    fontSize: typography.sizes.xxl, // 24
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.xl,
    textAlign: "center",
  },
  options: {
    gap: spacing.md,
  },
  option: {
    padding: spacing.lg,
    borderRadius: 12, // Standardize later
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.ui.border,
  },
  optionSelected: {
    borderColor: colors.ui.highlight,
    backgroundColor: colors.ui.highlight + "20", // Opacity
  },
  optionText: {
    fontFamily: typography.fonts.mono,
    fontSize: typography.sizes.lg,
    color: colors.text.primary,
    textAlign: "center",
  },
  optionTextSelected: {
    color: colors.ui.highlight,
    fontWeight: "bold",
  },
});
