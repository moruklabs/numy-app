import { act, renderHook, waitFor } from "@testing-library/react-native";
import {
  getTrackingPermissionsAsync,
  requestTrackingPermissionsAsync,
} from "expo-tracking-transparency";
import { AdsConsent } from "react-native-google-mobile-ads";
import { usePrivacySequence } from "../api/PrivacySequence";

// Properly mock dependencies
jest.mock("expo-tracking-transparency", () => ({
  getTrackingPermissionsAsync: jest.fn(),
  requestTrackingPermissionsAsync: jest.fn(),
}));

jest.mock("react-native-google-mobile-ads", () => ({
  AdsConsent: {
    requestInfoUpdate: jest.fn(),
    loadAndShowConsentFormIfRequired: jest.fn(),
  },
}));

describe("usePrivacySequence", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
    (AdsConsent.requestInfoUpdate as jest.Mock).mockResolvedValue(undefined);
    (AdsConsent.loadAndShowConsentFormIfRequired as jest.Mock).mockResolvedValue({
      canRequestAds: true,
      status: "OBTAINED",
    });
    (getTrackingPermissionsAsync as jest.Mock).mockResolvedValue({ status: "undetermined" });
    (requestTrackingPermissionsAsync as jest.Mock).mockResolvedValue({ status: "granted" });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it("should execute UMP then ATT strictly sequentially", async () => {
    (AdsConsent.requestInfoUpdate as jest.Mock).mockResolvedValue({
      isConsentFormAvailable: true,
      status: "REQUIRED",
    });
    const { result } = renderHook(() => usePrivacySequence());

    // 1. Wait for UMP to finish
    await waitFor(() => expect(AdsConsent.requestInfoUpdate).toHaveBeenCalled());
    await waitFor(() => expect(AdsConsent.loadAndShowConsentFormIfRequired).toHaveBeenCalled());

    // Advance time for the stability delay
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // 2. Wait for initialization
    await waitFor(() => expect(result.current.initialized).toBe(true));

    // Verify ATT called
    expect(requestTrackingPermissionsAsync).toHaveBeenCalled();
  });

  it("should NOT request ATT if already determined", async () => {
    (getTrackingPermissionsAsync as jest.Mock).mockResolvedValue({ status: "granted" });

    const { result } = renderHook(() => usePrivacySequence());

    await waitFor(() => expect(AdsConsent.requestInfoUpdate).toHaveBeenCalled());

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => expect(result.current.initialized).toBe(true));

    expect(requestTrackingPermissionsAsync).not.toHaveBeenCalled();
  });

  it("should handle UMP errors gracefully and still finish initialization", async () => {
    (AdsConsent.requestInfoUpdate as jest.Mock).mockRejectedValue(new Error("Network fail"));

    const { result } = renderHook(() => usePrivacySequence());

    await waitFor(() => expect(AdsConsent.requestInfoUpdate).toHaveBeenCalled());

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => expect(result.current.initialized).toBe(true));

    expect(console.error).toHaveBeenCalledWith("Privacy sequence failed", expect.any(Error));
  });
});
