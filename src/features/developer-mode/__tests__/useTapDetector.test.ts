import { renderHook, act } from "@testing-library/react-native";
import { useTapDetector } from "../hooks/useTapDetector";

describe("useTapDetector", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should detect 5 taps within 3 seconds", () => {
    const onThresholdReached = jest.fn();
    const { result } = renderHook(() =>
      useTapDetector({ threshold: 5, timeWindow: 3000, onThresholdReached })
    );

    // Tap 5 times quickly
    act(() => {
      for (let i = 0; i < 5; i++) {
        result.current.handleTap();
      }
    });

    expect(onThresholdReached).toHaveBeenCalledTimes(1);
  });

  it("should reset tap count after successful detection", () => {
    const onThresholdReached = jest.fn();
    const { result } = renderHook(() =>
      useTapDetector({ threshold: 5, timeWindow: 3000, onThresholdReached })
    );

    // First sequence
    act(() => {
      for (let i = 0; i < 5; i++) {
        result.current.handleTap();
      }
    });

    expect(onThresholdReached).toHaveBeenCalledTimes(1);

    // Second sequence should also work
    act(() => {
      for (let i = 0; i < 5; i++) {
        result.current.handleTap();
      }
    });

    expect(onThresholdReached).toHaveBeenCalledTimes(2);
  });

  it("should ignore taps outside time window", () => {
    const onThresholdReached = jest.fn();
    const { result } = renderHook(() =>
      useTapDetector({ threshold: 5, timeWindow: 3000, onThresholdReached })
    );

    // Tap 3 times
    act(() => {
      result.current.handleTap();
      result.current.handleTap();
      result.current.handleTap();
    });

    // Wait past the time window
    act(() => {
      jest.advanceTimersByTime(3100);
    });

    // Tap 2 more times (should not trigger as first 3 are expired)
    act(() => {
      result.current.handleTap();
      result.current.handleTap();
    });

    expect(onThresholdReached).not.toHaveBeenCalled();
  });

  it("should clear expired taps during counting", () => {
    const onThresholdReached = jest.fn();
    const { result } = renderHook(() =>
      useTapDetector({ threshold: 5, timeWindow: 3000, onThresholdReached })
    );

    // Tap 2 times
    act(() => {
      result.current.handleTap();
      result.current.handleTap();
    });

    // Advance time by 2 seconds
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    // Tap 3 more times (first 2 are still valid)
    act(() => {
      result.current.handleTap();
      result.current.handleTap();
      result.current.handleTap();
    });

    // Should trigger (2 + 3 = 5 taps within window)
    expect(onThresholdReached).toHaveBeenCalledTimes(1);
  });
});
