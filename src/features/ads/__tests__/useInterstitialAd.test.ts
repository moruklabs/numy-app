import { renderHook } from "@testing-library/react-native";
import { useInterstitialAd } from "../hooks/useInterstitialAd";
import { adService } from "../model/AdService";

describe("useInterstitialAd", () => {
  // Mock adService methods
  const loadSpy = jest.spyOn(adService, "loadInterstitial").mockImplementation(async () => {});
  jest.spyOn(adService, "showInterstitial").mockImplementation(() => {});
  jest.spyOn(adService, "isReady").mockReturnValue(true);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should trigger load when processing starts", () => {
    renderHook(() => useInterstitialAd({ feature: "test", isProcessing: true }));
    expect(loadSpy).toHaveBeenCalled();
  });

  it("should NOT trigger load if already processing loaded (ref check)", () => {
    const { rerender } = renderHook(
      (props: { isProcessing: boolean }) =>
        useInterstitialAd({ feature: "test", isProcessing: props.isProcessing }),
      {
        initialProps: { isProcessing: true },
      }
    );

    expect(loadSpy).toHaveBeenCalledTimes(1);

    rerender({ isProcessing: true });
    expect(loadSpy).toHaveBeenCalledTimes(1);
  });
});
