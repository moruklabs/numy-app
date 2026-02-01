import { renderHook, act, waitFor } from "@testing-library/react-native";
import { useDeveloperMode } from "../hooks/useDeveloperMode";
import { developerModeStore } from "../model/DeveloperModeStore";

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));

describe("useDeveloperMode", () => {
  beforeEach(() => {
    // Reset store state
    act(() => {
      developerModeStore.getState().setDeveloperMode(false);
    });
  });

  it("should start with isDeveloperMode false", () => {
    const { result } = renderHook(() => useDeveloperMode());
    expect(result.current.isDeveloperMode).toBe(false);
  });

  it("should enable developer mode after correct password", async () => {
    const { result } = renderHook(() => useDeveloperMode());

    act(() => {
      result.current.enableDeveloperMode("3146");
    });

    await waitFor(() => {
      expect(result.current.isDeveloperMode).toBe(true);
    });
  });

  it("should not enable developer mode with wrong password", async () => {
    const { result } = renderHook(() => useDeveloperMode());

    act(() => {
      result.current.enableDeveloperMode("wrong");
    });

    await waitFor(() => {
      expect(result.current.isDeveloperMode).toBe(false);
    });
  });

  it("should persist developer mode state", async () => {
    const { result: result1 } = renderHook(() => useDeveloperMode());

    act(() => {
      result1.current.enableDeveloperMode("3146");
    });

    await waitFor(() => {
      expect(result1.current.isDeveloperMode).toBe(true);
    });

    // Simulate app restart by creating new hook instance
    const { result: result2 } = renderHook(() => useDeveloperMode());

    await waitFor(() => {
      expect(result2.current.isDeveloperMode).toBe(true);
    });
  });

  it("should expose toggleDeveloperMode function", async () => {
    const { result } = renderHook(() => useDeveloperMode());

    // Enable first
    act(() => {
      result.current.enableDeveloperMode("3146");
    });

    await waitFor(() => {
      expect(result.current.isDeveloperMode).toBe(true);
    });

    // Toggle off
    act(() => {
      result.current.toggleDeveloperMode();
    });

    await waitFor(() => {
      expect(result.current.isDeveloperMode).toBe(false);
    });

    // Toggle on
    act(() => {
      result.current.toggleDeveloperMode();
    });

    await waitFor(() => {
      expect(result.current.isDeveloperMode).toBe(true);
    });
  });

  it("should disable developer mode", async () => {
    const { result } = renderHook(() => useDeveloperMode());

    // Enable first
    act(() => {
      result.current.enableDeveloperMode("3146");
    });

    await waitFor(() => {
      expect(result.current.isDeveloperMode).toBe(true);
    });

    // Disable
    act(() => {
      result.current.disableDeveloperMode();
    });

    await waitFor(() => {
      expect(result.current.isDeveloperMode).toBe(false);
    });
  });
});
