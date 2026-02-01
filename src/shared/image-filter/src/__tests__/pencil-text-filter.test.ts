import { PencilTextFilter } from "../pencil-text-filter";
import { ImageFilterError } from "../types";
import { manipulateAsync } from "expo-image-manipulator";

jest.mock("expo-image-manipulator");
jest.mock("@moruk/logger");

const mockManipulateAsync = manipulateAsync as jest.MockedFunction<typeof manipulateAsync>;

describe("PencilTextFilter", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("enhance", () => {
    it("should successfully enhance an image with default options", async () => {
      const mockImageUri = "file:///test-image.jpg";
      const mockBase64 = "base64encodeddata";

      // Mock the image info call
      mockManipulateAsync.mockResolvedValueOnce({
        uri: mockImageUri,
        width: 800,
        height: 600,
      } as any);

      // Mock the pipeline stages (4 stages based on updated implementation)
      // Stage 1: Resize
      mockManipulateAsync.mockResolvedValueOnce({
        uri: "temp1.jpg",
        width: 800,
        height: 600,
      } as any);

      // Stage 2: Initial enhancement
      mockManipulateAsync.mockResolvedValueOnce({
        uri: "temp2.jpg",
        width: 800,
        height: 600,
      } as any);

      // Stage 3: Edge preservation (conditional on sharpness > 0.3)
      mockManipulateAsync.mockResolvedValueOnce({
        uri: "temp3.jpg",
        width: 800,
        height: 600,
      } as any);

      // Stage 4: Final output
      mockManipulateAsync.mockResolvedValueOnce({
        uri: "final.jpg",
        width: 800,
        height: 600,
        base64: mockBase64,
      } as any);

      const result = await PencilTextFilter.enhance(mockImageUri);

      expect(result.base64).toBe(mockBase64);
      expect(result.metadata.originalDimensions).toEqual({ width: 800, height: 600 });
      expect(result.metadata.filteredDimensions).toEqual({ width: 800, height: 600 });
      expect(result.metadata.processingTime).toBeGreaterThanOrEqual(0);
      expect(result.metadata.appliedOptions.strength).toBe(0.7);
    });

    it("should apply custom options", async () => {
      const mockImageUri = "file:///test-image.jpg";
      const mockBase64 = "base64encodeddata";

      mockManipulateAsync.mockResolvedValueOnce({
        uri: mockImageUri,
        width: 800,
        height: 600,
      } as any);

      mockManipulateAsync.mockResolvedValue({
        uri: "temp.jpg",
        width: 800,
        height: 600,
        base64: mockBase64,
      } as any);

      const customOptions = {
        strength: 0.9,
        sharpness: 0.8,
        reduceNotebookLines: false,
        noiseReduction: 0.5,
      };

      const result = await PencilTextFilter.enhance(mockImageUri, customOptions);

      expect(result.metadata.appliedOptions).toEqual(customOptions);
    });

    it("should throw ImageFilterError on failure", async () => {
      const mockImageUri = "file:///test-image.jpg";

      mockManipulateAsync.mockRejectedValueOnce(new Error("Image manipulation failed"));

      await expect(PencilTextFilter.enhance(mockImageUri)).rejects.toThrow(ImageFilterError);
    });

    it("should throw error if base64 is missing", async () => {
      const mockImageUri = "file:///test-image.jpg";

      mockManipulateAsync.mockResolvedValue({
        uri: "temp.jpg",
        width: 800,
        height: 600,
        base64: undefined,
      } as any);

      await expect(PencilTextFilter.enhance(mockImageUri)).rejects.toThrow(ImageFilterError);
    });
  });

  describe("quickPreview", () => {
    it("should generate a quick preview", async () => {
      const mockImageUri = "file:///test-image.jpg";
      const mockBase64 = "previewbase64data";

      // Mock the image info call
      mockManipulateAsync.mockResolvedValueOnce({
        uri: mockImageUri,
        width: 1600,
        height: 1200,
      } as any);

      // Mock the preview generation
      mockManipulateAsync.mockResolvedValueOnce({
        uri: "preview.jpg",
        width: 600,
        height: 450,
        base64: mockBase64,
      } as any);

      const result = await PencilTextFilter.quickPreview(mockImageUri);

      expect(result.base64).toBe(mockBase64);
      expect(result.metadata.originalDimensions).toEqual({ width: 1600, height: 1200 });
      expect(result.metadata.filteredDimensions).toEqual({ width: 600, height: 450 });
      expect(result.metadata.processingTime).toBeLessThan(1000); // Should be fast
    });

    it("should throw error if preview base64 is missing", async () => {
      const mockImageUri = "file:///test-image.jpg";

      mockManipulateAsync.mockResolvedValueOnce({
        uri: mockImageUri,
        width: 800,
        height: 600,
      } as any);

      mockManipulateAsync.mockResolvedValueOnce({
        uri: "preview.jpg",
        width: 600,
        height: 450,
        base64: undefined,
      } as any);

      await expect(PencilTextFilter.quickPreview(mockImageUri)).rejects.toThrow(ImageFilterError);
    });
  });

  describe("batchEnhance", () => {
    it("should process multiple images", async () => {
      const mockUris = ["file:///image1.jpg", "file:///image2.jpg", "file:///image3.jpg"];
      const mockBase64 = "base64data";

      // Mock all calls for batch processing - need to mock for each image
      // Each image needs: getImageInfo + multiple pipeline stages
      for (let i = 0; i < mockUris.length; i++) {
        // getImageInfo call
        mockManipulateAsync.mockResolvedValueOnce({
          uri: `info${i}.jpg`,
          width: 800,
          height: 600,
        } as any);

        // Pipeline stages (4 calls per image in the implementation)
        for (let j = 0; j < 4; j++) {
          mockManipulateAsync.mockResolvedValueOnce({
            uri: `stage${j}.jpg`,
            width: 800,
            height: 600,
            base64: j === 3 ? mockBase64 : undefined, // Only final stage has base64
          } as any);
        }
      }

      const results = await PencilTextFilter.batchEnhance(mockUris);

      expect(results).toHaveLength(3);
      results.forEach((result) => {
        expect(result.base64).toBe(mockBase64);
        expect(result.metadata.processingTime).toBeGreaterThanOrEqual(0);
      });
    });

    it("should throw error if any image fails", async () => {
      const mockUris = ["file:///image1.jpg", "file:///image2.jpg"];

      mockManipulateAsync
        .mockResolvedValueOnce({
          uri: "processed1.jpg",
          width: 800,
          height: 600,
        } as any)
        .mockRejectedValueOnce(new Error("Failed to process image 2"));

      await expect(PencilTextFilter.batchEnhance(mockUris)).rejects.toThrow();
    });
  });

  describe("edge cases", () => {
    it("should handle different image sizes", async () => {
      const smallImageUri = "file:///small.jpg";
      const largeImageUri = "file:///large.jpg";
      const mockBase64 = "base64data";

      // Small image
      mockManipulateAsync.mockResolvedValue({
        uri: "processed.jpg",
        width: 400,
        height: 300,
        base64: mockBase64,
      } as any);

      const smallResult = await PencilTextFilter.enhance(smallImageUri);
      expect(smallResult.base64).toBe(mockBase64);

      // Large image
      mockManipulateAsync.mockResolvedValue({
        uri: "processed.jpg",
        width: 3000,
        height: 2000,
        base64: mockBase64,
      } as any);

      const largeResult = await PencilTextFilter.enhance(largeImageUri);
      expect(largeResult.base64).toBe(mockBase64);
    });

    it("should handle extreme strength values", async () => {
      const mockImageUri = "file:///test.jpg";
      const mockBase64 = "base64data";

      mockManipulateAsync.mockResolvedValue({
        uri: "processed.jpg",
        width: 800,
        height: 600,
        base64: mockBase64,
      } as any);

      // Minimum strength
      const minResult = await PencilTextFilter.enhance(mockImageUri, { strength: 0 });
      expect(minResult.metadata.appliedOptions.strength).toBe(0);

      // Maximum strength
      const maxResult = await PencilTextFilter.enhance(mockImageUri, { strength: 1 });
      expect(maxResult.metadata.appliedOptions.strength).toBe(1);
    });
  });
});
