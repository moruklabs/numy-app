/**
 * Tests for shared useEraseData Hook in @moruk/hooks
 */

import { logger } from "@moruk/logger";
import { storage } from "@moruk/storage";
import { act, renderHook } from "@testing-library/react-native";
import { Alert } from "react-native";
import { useEraseData } from "../useEraseData";

// Mock Alert
jest.spyOn(Alert, "alert");

// Mock @moruk/storage
jest.mock("@moruk/storage", () => ({
  storage: {
    clear: jest.fn().mockResolvedValue(undefined),
  },
}));

// Mock @moruk/logger
jest.mock("@moruk/logger", () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe("useEraseData", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("initial state", () => {
    it("should return isErasing: false initially", () => {
      const { result } = renderHook(() => useEraseData());
      expect(result.current.isErasing).toBe(false);
    });

    it("should provide showConfirmation function", () => {
      const { result } = renderHook(() => useEraseData());
      expect(typeof result.current.showConfirmation).toBe("function");
    });

    it("should provide eraseAllData function", () => {
      const { result } = renderHook(() => useEraseData());
      expect(typeof result.current.eraseAllData).toBe("function");
    });
  });

  describe("showConfirmation function", () => {
    const options = {
      title: "Test Title",
      message: "Test Message",
      confirmText: "Confirm",
      cancelText: "Cancel",
    };

    it("should trigger Alert.alert with correct parameters", () => {
      const { result } = renderHook(() => useEraseData());

      act(() => {
        result.current.showConfirmation(options);
      });

      expect(Alert.alert).toHaveBeenCalledWith("Test Title", "Test Message", expect.any(Array));
    });

    it("should have Cancel and Confirm buttons in the alert", () => {
      const { result } = renderHook(() => useEraseData());

      act(() => {
        result.current.showConfirmation(options);
      });

      const alertCall = (Alert.alert as any).mock.calls[0];
      const buttons = alertCall[2];

      expect(buttons).toHaveLength(2);
      expect(buttons[0]).toMatchObject({ text: "Cancel", style: "cancel" });
      expect(buttons[1]).toMatchObject({ text: "Confirm", style: "destructive" });
    });

    it("should call eraseAllData when confirm is pressed", async () => {
      const { result } = renderHook(() => useEraseData());

      act(() => {
        result.current.showConfirmation(options);
      });

      const alertCall = (Alert.alert as any).mock.calls[0];
      const confirmButton = alertCall[2][1];

      await act(async () => {
        if (confirmButton.onPress) {
          await confirmButton.onPress();
        }
      });

      expect(storage.clear).toHaveBeenCalled();
    });

    it("should call onSuccess after successful erasure", async () => {
      const onSuccess = jest.fn();
      const { result } = renderHook(() => useEraseData());

      act(() => {
        result.current.showConfirmation({ ...options, onSuccess });
      });

      const confirmButton = (Alert.alert as any).mock.calls[0][2][1];

      await act(async () => {
        await confirmButton.onPress();
      });

      expect(onSuccess).toHaveBeenCalled();
    });

    it("should call onError when erasure fails", async () => {
      const onError = jest.fn();
      const testError = new Error("Erasure failed");
      (storage.clear as any).mockRejectedValueOnce(testError);

      const { result } = renderHook(() => useEraseData());

      act(() => {
        result.current.showConfirmation({ ...options, onError });
      });

      const confirmButton = (Alert.alert as jest.Mock).mock.calls[0][2][1];

      await act(async () => {
        await confirmButton.onPress();
      });

      expect(onError).toHaveBeenCalledWith(testError);
    });
  });

  describe("eraseAllData function", () => {
    it("should call storage.clear", async () => {
      const { result } = renderHook(() => useEraseData());

      await act(async () => {
        await result.current.eraseAllData();
      });

      expect(storage.clear).toHaveBeenCalledTimes(1);
    });

    it("should run extra actions", async () => {
      const extraAction = jest.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() => useEraseData());

      await act(async () => {
        await result.current.eraseAllData([extraAction]);
      });

      expect(extraAction).toHaveBeenCalledTimes(1);
    });

    it("should handle failed extra actions gracefully", async () => {
      const badAction = jest.fn().mockRejectedValue(new Error("kaboom"));
      const goodAction = jest.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() => useEraseData());

      await act(async () => {
        const success = await result.current.eraseAllData([badAction, goodAction]);
        expect(success).toBe(true);
      });

      expect(badAction).toHaveBeenCalled();
      expect(goodAction).toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalled();
    });

    it("should return true on success", async () => {
      const { result } = renderHook(() => useEraseData());

      let eraseResult: boolean;
      await act(async () => {
        eraseResult = await result.current.eraseAllData();
      });

      expect(eraseResult!).toBe(true);
    });

    it("should set isErasing correctly during process", async () => {
      let resolveStorage: (v: any) => void;
      (storage.clear as any).mockReturnValueOnce(
        new Promise((resolve) => {
          resolveStorage = resolve;
        })
      );

      const { result } = renderHook(() => useEraseData());

      let promise: Promise<boolean>;
      act(() => {
        promise = result.current.eraseAllData();
      });

      expect(result.current.isErasing).toBe(true);

      await act(async () => {
        resolveStorage!(undefined);
        await promise!;
      });

      expect(result.current.isErasing).toBe(false);
    });

    it("should throw and log on storage error", async () => {
      const testError = new Error("Storage error");
      (storage.clear as jest.Mock).mockRejectedValueOnce(testError);

      const { result } = renderHook(() => useEraseData());

      await expect(
        act(async () => {
          await result.current.eraseAllData();
        })
      ).rejects.toThrow("Storage error");

      expect(logger.error).toHaveBeenCalled();
    });
  });
});
