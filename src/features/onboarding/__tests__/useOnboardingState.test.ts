import AsyncStorage from "@react-native-async-storage/async-storage";
import { act, renderHook } from "@testing-library/react-native";
import { useOnboardingState } from "../model/useOnboardingState";

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));

describe("useOnboardingState", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    const { result } = renderHook(() => useOnboardingState());
    act(() => {
      result.current.reset();
    });
  });

  it("should initialize with default values", () => {
    const { result } = renderHook(() => useOnboardingState());
    expect(result.current.hasSeenOnboarding).toBe(false);
    expect(result.current.userGoal).toBeNull();
  });

  it("should update user goal", () => {
    const { result } = renderHook(() => useOnboardingState());
    act(() => {
      result.current.setUserGoal("Test Goal");
    });
    expect(result.current.userGoal).toBe("Test Goal");
  });

  it("should mark onboarding as seen", () => {
    const { result } = renderHook(() => useOnboardingState());
    act(() => {
      result.current.completeOnboarding();
    });
    expect(result.current.hasSeenOnboarding).toBe(true);
  });
});
