import { colors, spacing, typography } from "@/presentation/theme";
import * as Haptics from "expo-haptics";
import { useState } from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useOnboardingState } from "../model/useOnboardingState";
import { PageHook } from "./pages/PageHook";
import { PagePermissions } from "./pages/PagePermissions";
import { PagePersonalization } from "./pages/PagePersonalization";

interface OnboardingFlowProps {
  onComplete: () => void;
}

const TOTAL_STEPS = 3;

export const OnboardingFlow = ({ onComplete }: OnboardingFlowProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const { userGoal, completeOnboarding } = useOnboardingState();
  const [permissionsReady, setPermissionsReady] = useState(false);

  const handleNext = async () => {
    if (currentStep < TOTAL_STEPS - 1) {
      if (Platform.OS !== "web") {
        Haptics.selectionAsync();
      }
      setCurrentStep(currentStep + 1);
    } else {
      // Complete
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      completeOnboarding();
      onComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      if (Platform.OS !== "web") {
        Haptics.selectionAsync();
      }
      setCurrentStep(currentStep - 1);
    }
  };

  const isNextDisabled = () => {
    // Page 2 (Index 1): Personalization - disabled if no goal selected
    if (currentStep === 1 && !userGoal) return true;
    // Page 3 (Index 2): Permissions - disabled if not ready
    if (currentStep === 2 && !permissionsReady) return true;
    return false;
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <PageHook />;
      case 1:
        return <PagePersonalization />;
      case 2:
        return <PagePermissions onReady={() => setPermissionsReady(true)} />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>{renderStep()}</View>

      <SafeAreaView edges={["bottom"]} style={styles.footer}>
        {/* Step Indicators */}
        <View style={styles.indicators}>
          {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
            <View
              key={index}
              style={[styles.indicator, index === currentStep && styles.indicatorActive]}
            />
          ))}
        </View>

        {/* Navigation */}
        <View style={styles.navigation}>
          {currentStep > 0 ? (
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.backButtonPlaceholder} />
          )}

          <TouchableOpacity
            onPress={handleNext}
            disabled={isNextDisabled()}
            style={[styles.nextButton, isNextDisabled() && styles.nextButtonDisabled]}
          >
            <Text style={styles.nextButtonText}>
              {currentStep === TOTAL_STEPS - 1 ? "Get Started" : "Continue"}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  contentContainer: {
    flex: 1,
  },
  footer: {
    padding: spacing.xl,
    backgroundColor: colors.background.primary, // Or transparent if overlaying
  },
  indicators: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.ui.border,
  },
  indicatorActive: {
    backgroundColor: colors.ui.highlight,
    width: 24, // Expanded pill
  },
  navigation: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backButton: {
    padding: spacing.md,
  },
  backButtonPlaceholder: {
    width: 50, // Approximation
  },
  backButtonText: {
    fontFamily: typography.fonts.mono,
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
  },
  nextButton: {
    backgroundColor: colors.ui.highlight,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 30,
    minWidth: 140,
    alignItems: "center",
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonText: {
    fontFamily: typography.fonts.mono,
    fontSize: typography.sizes.md,
    color: colors.text.primary,
    fontWeight: "bold",
  },
});
