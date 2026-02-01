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
  });

  it("should execute UMP then ATT strictly sequentially with Primer", async () => {
    const { result } = renderHook(() => usePrivacySequence());

    // 1. Wait for UMP to finish and Primer to appear
    await waitFor(() => expect(result.current.showPrimer).toBe(true));

    // Verify UMP was called
    expect(AdsConsent.requestInfoUpdate).toHaveBeenCalled();
    expect(AdsConsent.loadAndShowConsentFormIfRequired).toHaveBeenCalled();

    // Verify ATT NOT called yet
    expect(requestTrackingPermissionsAsync).not.toHaveBeenCalled();

    // 2. User accepts Primer
    await act(async () => {
      result.current.onPrimerContinue();
    });

    // 3. Wait for initialization
    await waitFor(() => expect(result.current.initialized).toBe(true));

    // Verify ATT called NOW
    expect(requestTrackingPermissionsAsync).toHaveBeenCalled();
  });

  it("should NOT request ATT if already determined", async () => {
    (getTrackingPermissionsAsync as jest.Mock).mockResolvedValue({ status: "granted" });

    const { result } = renderHook(() => usePrivacySequence());

    await waitFor(() => expect(result.current.initialized).toBe(true));

    expect(requestTrackingPermissionsAsync).not.toHaveBeenCalled();
  });

  it("should handle UMP errors gracefully and still finish initialization", async () => {
    (AdsConsent.requestInfoUpdate as jest.Mock).mockRejectedValue(new Error("Network fail"));

    const { result } = renderHook(() => usePrivacySequence());

    await waitFor(() => expect(result.current.initialized).toBe(true));

    expect(console.error).toHaveBeenCalledWith("Privacy sequence failed", expect.any(Error));
  });
});
