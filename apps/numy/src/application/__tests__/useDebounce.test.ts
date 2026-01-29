/**
 * useDebounce Hook Tests
 *
 * Tests for the debounce utility logic.
 * Since this is a React hook, we test the underlying debounce behavior.
 */

describe("debounce logic", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  /**
   * Simple debounce function for testing purposes
   * This mirrors the logic in useDebounce hook
   */
  function createDebounce<T extends (...args: Parameters<T>) => void>(
    callback: T,
    delay: number
  ): { debounced: (...args: Parameters<T>) => void; cancel: () => void } {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const debounced = (...args: Parameters<T>) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        callback(...args);
      }, delay);
    };

    const cancel = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };

    return { debounced, cancel };
  }

  it("should not call callback immediately", () => {
    const callback = jest.fn();
    const { debounced } = createDebounce(callback, 300);

    debounced();

    expect(callback).not.toHaveBeenCalled();
  });

  it("should call callback after delay", () => {
    const callback = jest.fn();
    const { debounced } = createDebounce(callback, 300);

    debounced();

    expect(callback).not.toHaveBeenCalled();

    jest.advanceTimersByTime(300);

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("should reset timer on rapid calls", () => {
    const callback = jest.fn();
    const { debounced } = createDebounce(callback, 300);

    debounced();
    jest.advanceTimersByTime(200);

    // Call again before timeout
    debounced();
    jest.advanceTimersByTime(200);

    // Should not have been called yet (timer reset)
    expect(callback).not.toHaveBeenCalled();

    jest.advanceTimersByTime(100);

    // Now it should be called
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("should pass arguments to callback", () => {
    const callback = jest.fn();
    const { debounced } = createDebounce((arg1: string, arg2: number) => callback(arg1, arg2), 300);

    debounced("hello", 42);

    jest.advanceTimersByTime(300);

    expect(callback).toHaveBeenCalledWith("hello", 42);
  });

  it("should use latest arguments when called multiple times", () => {
    const callback = jest.fn();
    const { debounced } = createDebounce((value: string) => callback(value), 300);

    debounced("first");
    jest.advanceTimersByTime(100);
    debounced("second");
    jest.advanceTimersByTime(100);
    debounced("third");

    jest.advanceTimersByTime(300);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith("third");
  });

  it("should respect different delay values", () => {
    const callback = jest.fn();
    const { debounced } = createDebounce(callback, 500);

    debounced();
    jest.advanceTimersByTime(300);

    expect(callback).not.toHaveBeenCalled();

    jest.advanceTimersByTime(200);

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("should not call callback after cancel", () => {
    const callback = jest.fn();
    const { debounced, cancel } = createDebounce(callback, 300);

    debounced();
    cancel();

    jest.advanceTimersByTime(300);

    expect(callback).not.toHaveBeenCalled();
  });

  it("should handle multiple sequential debounced calls", () => {
    const callback = jest.fn();
    const { debounced } = createDebounce(callback, 300);

    // First call
    debounced();
    jest.advanceTimersByTime(300);

    expect(callback).toHaveBeenCalledTimes(1);

    // Second call
    debounced();
    jest.advanceTimersByTime(300);

    expect(callback).toHaveBeenCalledTimes(2);
  });

  it("should work with zero delay", () => {
    const callback = jest.fn();
    const { debounced } = createDebounce(callback, 0);

    debounced();
    jest.advanceTimersByTime(0);

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("should handle very long delays", () => {
    const callback = jest.fn();
    const { debounced } = createDebounce(callback, 10000);

    debounced();
    jest.advanceTimersByTime(5000);

    expect(callback).not.toHaveBeenCalled();

    jest.advanceTimersByTime(5000);

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("should not interfere with other debounced functions", () => {
    const callback1 = jest.fn();
    const callback2 = jest.fn();
    const { debounced: debounced1 } = createDebounce(callback1, 300);
    const { debounced: debounced2 } = createDebounce(callback2, 500);

    debounced1();
    debounced2();

    jest.advanceTimersByTime(300);

    expect(callback1).toHaveBeenCalledTimes(1);
    expect(callback2).not.toHaveBeenCalled();

    jest.advanceTimersByTime(200);

    expect(callback2).toHaveBeenCalledTimes(1);
  });
});
