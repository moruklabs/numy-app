import { adService } from "@/features/ads/model/AdService";
import { fireEvent, render } from "@testing-library/react-native";
import React from "react";
import { AdsConsent } from "react-native-google-mobile-ads";
import DebugScreen from "../debug";

// Mocks
jest.mock("@/features/ads/model/AdService", () => ({
  adService: {
    getDebugInfo: jest.fn().mockReturnValue({
      config: {},
      isInterstitialLoaded: false,
      lastShownTimestamps: {},
      sessionImpressions: {},
    }),
    showInterstitial: jest.fn(),
    loadInterstitial: jest.fn(),
  },
}));

jest.mock("react-native-google-mobile-ads", () => ({
  AdsConsent: {
    reset: jest.fn(),
  },
}));

jest.mock("expo-router", () => ({
  useRouter: jest.fn(),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe("DebugScreen", () => {
  it("renders ad debug controls", () => {
    const { getByText } = render(<DebugScreen />);
    expect(getByText("Debug Tools")).toBeTruthy();
    expect(getByText("Ads & Privacy")).toBeTruthy();
    expect(getByText("Reset Consent")).toBeTruthy();
    expect(getByText("Show Interstitial")).toBeTruthy();
  });

  it("calls adService.showInterstitial when button pressed", () => {
    const { getByText } = render(<DebugScreen />);
    fireEvent.press(getByText("Show Interstitial"));
    expect(adService.showInterstitial).toHaveBeenCalled();
  });

  it("calls AdsConsent.reset when button pressed", async () => {
    const { getByText } = render(<DebugScreen />);
    fireEvent.press(getByText("Reset Consent"));
    expect(AdsConsent.reset).toHaveBeenCalled();
  });
});
