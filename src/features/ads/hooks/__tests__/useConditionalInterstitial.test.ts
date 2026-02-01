import { renderHook } from "@testing-library/react-native";
import { adService } from "../../model/AdService";
import { useConditionalInterstitial } from "../useConditionalInterstitial";

jest.mock("../../model/AdService", () => ({
  adService: {
    isReady: jest.fn(),
    showInterstitial: jest.fn(),
  },
}));

describe("useConditionalInterstitial", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (adService.isReady as jest.Mock).mockReturnValue(true);
  });

  it("should show ad when condition is met after triggering events", () => {
    const conditions = [
      {
        screen: "examples",
        condition: "count > 3",
        event: "example_viewed",
      },
    ];

    const { result } = renderHook(() =>
      useConditionalInterstitial({
        screenName: "examples",
        eventName: "example_viewed",
        conditions,
      })
    );

    // Trigger events
    result.current.triggerEvent(); // count = 1
    result.current.triggerEvent(); // count = 2
    result.current.triggerEvent(); // count = 3
    expect(adService.showInterstitial).not.toHaveBeenCalled();

    result.current.triggerEvent(); // count = 4 (count > 3)
    expect(adService.showInterstitial).toHaveBeenCalledTimes(1);
  });

  it("should NOT show ad if condition not met", () => {
    const conditions = [
      {
        screen: "examples",
        condition: "count > 3",
        event: "example_viewed",
      },
    ];

    const { result } = renderHook(() =>
      useConditionalInterstitial({
        screenName: "examples",
        eventName: "example_viewed",
        conditions,
      })
    );

    result.current.triggerEvent();
    result.current.triggerEvent();

    expect(adService.showInterstitial).not.toHaveBeenCalled();
  });

  it("should NOT show ad if adService not ready", () => {
    (adService.isReady as jest.Mock).mockReturnValue(false);

    const conditions = [
      {
        screen: "examples",
        condition: "count > 1",
        event: "example_viewed",
      },
    ];

    const { result } = renderHook(() =>
      useConditionalInterstitial({
        screenName: "examples",
        eventName: "example_viewed",
        conditions,
      })
    );

    result.current.triggerEvent();
    result.current.triggerEvent();
    result.current.triggerEvent();

    expect(adService.showInterstitial).not.toHaveBeenCalled();
  });

  it("should only show ad once even if condition continues to be met", () => {
    const conditions = [
      {
        screen: "examples",
        condition: "count > 2",
        event: "example_viewed",
      },
    ];

    const { result } = renderHook(() =>
      useConditionalInterstitial({
        screenName: "examples",
        eventName: "example_viewed",
        conditions,
      })
    );

    // Trigger many times
    for (let i = 0; i < 10; i++) {
      result.current.triggerEvent();
    }

    // Ad should only show once
    expect(adService.showInterstitial).toHaveBeenCalledTimes(1);
  });

  it("should not show ad for non-matching screen", () => {
    const conditions = [
      {
        screen: "examples",
        condition: "count > 1",
        event: "example_viewed",
      },
    ];

    const { result } = renderHook(() =>
      useConditionalInterstitial({
        screenName: "history", // Different screen
        eventName: "example_viewed",
        conditions,
      })
    );

    for (let i = 0; i < 5; i++) {
      result.current.triggerEvent();
    }

    expect(adService.showInterstitial).not.toHaveBeenCalled();
  });

  it("should reset count when resetCount is called", () => {
    const conditions = [
      {
        screen: "examples",
        condition: "count > 2",
        event: "example_viewed",
      },
    ];

    const { result } = renderHook(() =>
      useConditionalInterstitial({
        screenName: "examples",
        eventName: "example_viewed",
        conditions,
      })
    );

    result.current.triggerEvent();
    result.current.triggerEvent();
    result.current.resetCount();

    expect(result.current.getCount()).toBe(0);

    // After reset, should be able to show ad again
    for (let i = 0; i < 4; i++) {
      result.current.triggerEvent();
    }

    expect(adService.showInterstitial).toHaveBeenCalledTimes(1);
  });
});
