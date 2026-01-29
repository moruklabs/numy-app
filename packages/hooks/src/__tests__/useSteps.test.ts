import { act, renderHook } from "@testing-library/react-native";
import { useSteps } from "../useSteps";

describe("useSteps", () => {
  it("should initialize with the first step by default", () => {
    const { result } = renderHook(() => useSteps({ totalSteps: 3 }));
    expect(result.current.currentStep).toBe(0);
    expect(result.current.isFirstStep).toBe(true);
    expect(result.current.isLastStep).toBe(false);
  });

  it("should initialize with a specific initial step", () => {
    const { result } = renderHook(() => useSteps({ totalSteps: 3, initialStep: 1 }));
    expect(result.current.currentStep).toBe(1);
    expect(result.current.isFirstStep).toBe(false);
    expect(result.current.isLastStep).toBe(false);
  });

  it("should go to the next step", () => {
    const { result } = renderHook(() => useSteps({ totalSteps: 3 }));
    act(() => {
      result.current.goToNextStep();
    });
    expect(result.current.currentStep).toBe(1);
  });

  it("should not go past the last step", () => {
    const { result } = renderHook(() => useSteps({ totalSteps: 2 }));
    act(() => {
      result.current.goToNextStep();
    });
    expect(result.current.currentStep).toBe(1);
    act(() => {
      result.current.goToNextStep();
    });
    expect(result.current.currentStep).toBe(1);
  });

  it("should go to the previous step", () => {
    const { result } = renderHook(() => useSteps({ totalSteps: 3, initialStep: 2 }));
    act(() => {
      result.current.goToPreviousStep();
    });
    expect(result.current.currentStep).toBe(1);
  });

  it("should not go before the first step", () => {
    const { result } = renderHook(() => useSteps({ totalSteps: 3 }));
    act(() => {
      result.current.goToPreviousStep();
    });
    expect(result.current.currentStep).toBe(0);
  });

  it("should go to a specific step", () => {
    const { result } = renderHook(() => useSteps({ totalSteps: 5 }));
    act(() => {
      result.current.goToStep(3);
    });
    expect(result.current.currentStep).toBe(3);
  });

  it("should reset to the initial step", () => {
    const { result } = renderHook(() => useSteps({ totalSteps: 3, initialStep: 1 }));
    act(() => {
      result.current.goToNextStep();
    });
    expect(result.current.currentStep).toBe(2);
    act(() => {
      result.current.reset();
    });
    expect(result.current.currentStep).toBe(1);
  });
});
