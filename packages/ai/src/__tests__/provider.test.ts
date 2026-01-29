// We need to mock before importing
import { getAIProvider, getAIProviderInfo } from "../provider";

const mockIsAvailable = jest.fn();

jest.mock("../apple.service", () => ({
  AppleService: jest.fn().mockImplementation(() => ({
    isAvailable: mockIsAvailable,
  })),
}));

describe("provider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAIProvider", () => {
    it('should return "apple" when Apple Intelligence is available', () => {
      mockIsAvailable.mockReturnValue(true);

      const provider = getAIProvider();

      expect(provider).toBe("apple");
    });

    it('should return "gemini" when Apple Intelligence is not available', () => {
      mockIsAvailable.mockReturnValue(false);

      const provider = getAIProvider();

      expect(provider).toBe("gemini");
    });

    it('should return "gemini" when isAvailable throws', () => {
      mockIsAvailable.mockImplementation(() => {
        throw new Error("Check failed");
      });

      const provider = getAIProvider();

      expect(provider).toBe("gemini");
    });
  });

  describe("getAIProviderInfo", () => {
    it("should return Apple Intelligence info when available", () => {
      mockIsAvailable.mockReturnValue(true);

      const info = getAIProviderInfo();

      expect(info).toEqual({
        provider: "apple",
        isOnDevice: true,
        displayName: "Apple Intelligence",
      });
    });

    it("should return Gemini AI info when Apple not available", () => {
      mockIsAvailable.mockReturnValue(false);

      const info = getAIProviderInfo();

      expect(info).toEqual({
        provider: "gemini",
        isOnDevice: false,
        displayName: "Gemini AI",
      });
    });
  });
});
