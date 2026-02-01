import { useCallback, useMemo, useState } from "react";

export interface UseStepsOptions {
  totalSteps: number;
  initialStep?: number;
}

export interface UseStepsReturn {
  currentStep: number;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  goToStep: (step: number) => void;
  reset: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
  canGoNext: boolean;
  canGoBack: boolean;
}

/**
 * Generic hook for managing step-based flows.
 */
export function useSteps({ totalSteps, initialStep = 0 }: UseStepsOptions): UseStepsReturn {
  const [currentStep, setCurrentStep] = useState(initialStep);

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;
  const canGoNext = currentStep < totalSteps - 1;
  const canGoBack = currentStep > 0;

  const goToNextStep = useCallback(() => {
    if (canGoNext) {
      setCurrentStep((prev) => prev + 1);
    }
  }, [canGoNext]);

  const goToPreviousStep = useCallback(() => {
    if (canGoBack) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [canGoBack]);

  const goToStep = useCallback(
    (step: number) => {
      if (step >= 0 && step < totalSteps) {
        setCurrentStep(step);
      }
    },
    [totalSteps]
  );

  const reset = useCallback(() => {
    setCurrentStep(initialStep);
  }, [initialStep]);

  return useMemo(
    () => ({
      currentStep,
      goToNextStep,
      goToPreviousStep,
      goToStep,
      reset,
      isFirstStep,
      isLastStep,
      canGoNext,
      canGoBack,
    }),
    [
      currentStep,
      goToNextStep,
      goToPreviousStep,
      goToStep,
      reset,
      isFirstStep,
      isLastStep,
      canGoNext,
      canGoBack,
    ]
  );
}
