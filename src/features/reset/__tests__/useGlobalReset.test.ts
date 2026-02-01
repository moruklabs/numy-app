import { renderHook, act, waitFor } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AdsConsent } from "react-native-google-mobile-ads";
import * as Updates from "expo-updates";
import { useGlobalReset } from "../hooks/useGlobalReset";

// Mock dependencies
jest.mock("@react-native-async-storage/async-storage", () => ({
  clear: jest.fn(() => Promise.resolve()),
}));

jest.mock("react-native-google-mobile-ads", () => ({
  AdsConsent: {
    reset: jest.fn(() => Promise.resolve()),
  },
}));

jest.mock("expo-updates", () => ({
  reloadAsync: jest.fn(() => Promise.resolve()),
}));

describe("useGlobalReset", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should clear all AsyncStorage", async () => {
    const { result } = renderHook(() => useGlobalReset());

    await act(async () => {
      await result.current.performReset();
    });

    expect(AsyncStorage.clear).toHaveBeenCalled();
  });

  it("should reset UMP consent", async () => {
    const { result } = renderHook(() => useGlobalReset());

    await act(async () => {
      await result.current.performReset();
    });

    expect(AdsConsent.reset).toHaveBeenCalled();
  });

  it("should trigger app reload after reset", async () => {
    const { result } = renderHook(() => useGlobalReset());

    await act(async () => {
      await result.current.performReset();
    });

    await waitFor(() => {
      expect(Updates.reloadAsync).toHaveBeenCalled();
    });
  });

  it("should execute operations in correct order", async () => {
    const callOrder: string[] = [];

    (AsyncStorage.clear as jest.Mock).mockImplementation(() => {
      callOrder.push("storage");
      return Promise.resolve();
    });

    (AdsConsent.reset as jest.Mock).mockImplementation(() => {
      callOrder.push("consent");
      return Promise.resolve();
    });

    (Updates.reloadAsync as jest.Mock).mockImplementation(() => {
      callOrder.push("reload");
      return Promise.resolve();
    });

    const { result } = renderHook(() => useGlobalReset());

    await act(async () => {
      await result.current.performReset();
    });

    expect(callOrder).toEqual(["storage", "consent", "reload"]);
  });

  it("should track isResetting state", async () => {
    const { result } = renderHook(() => useGlobalReset());

    expect(result.current.isResetting).toBe(false);

    // Start reset without awaiting
    act(() => {
      result.current.performReset();
    });

    // Wait for state to update to true
    await waitFor(() => {
      expect(result.current.isResetting).toBe(true);
    });
  });

  it("should handle errors gracefully", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation();
    (AsyncStorage.clear as jest.Mock).mockRejectedValue(new Error("Storage error"));

    const { result } = renderHook(() => useGlobalReset());

    await act(async () => {
      await result.current.performReset();
    });

    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
