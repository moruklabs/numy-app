/**
 * Calculator Store Tests
 *
 * Tests for the Zustand calculator store including AI fallback integration.
 */

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Mock @moruk/ai
const mockProcessWithAI = jest.fn();
jest.mock("@moruk/ai", () => ({
  processWithAI: mockProcessWithAI,
  getAIProvider: jest.fn(() => "gemini"),
  getAIProviderInfo: jest.fn(() => ({
    provider: "gemini",
    isOnDevice: false,
    displayName: "Gemini AI",
  })),
  AI: jest.fn(),
}));

import { useCalculatorStore } from "../stores/calculatorStore";

describe("calculatorStore", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store state
    useCalculatorStore.setState({
      document: {
        id: "test-doc",
        title: "Test",
        lines: [],
        variables: new Map(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      emBase: 16,
      ppiBase: 96,
      savedDocuments: [],
      _hasHydrated: true,
    });
  });

  describe("initial state", () => {
    it("should have default emBase of 16", () => {
      const state = useCalculatorStore.getState();
      expect(state.emBase).toBe(16);
    });

    it("should have default ppiBase of 96", () => {
      const state = useCalculatorStore.getState();
      expect(state.ppiBase).toBe(96);
    });

    it("should have a document", () => {
      const state = useCalculatorStore.getState();
      expect(state.document).toBeDefined();
      expect(state.document.title).toBeDefined();
    });
  });

  describe("setInput", () => {
    it("should update line input", () => {
      // First add a line
      useCalculatorStore.getState().addNewLine();

      const lineId = useCalculatorStore.getState().document.lines[0].id;

      useCalculatorStore.getState().setInput(lineId, "5 + 5");

      const line = useCalculatorStore.getState().document.lines[0];
      expect(line.input).toBe("5 + 5");
    });
  });

  describe("addNewLine", () => {
    it("should add a new empty line", () => {
      const initialCount = useCalculatorStore.getState().document.lines.length;

      useCalculatorStore.getState().addNewLine();

      const newCount = useCalculatorStore.getState().document.lines.length;
      expect(newCount).toBe(initialCount + 1);
    });

    it("should add line with empty input", () => {
      useCalculatorStore.getState().addNewLine();

      const line = useCalculatorStore.getState().document.lines[0];
      expect(line.input).toBe("");
    });
  });

  describe("removeLine", () => {
    it("should remove the specified line", () => {
      // Add two lines
      useCalculatorStore.getState().addNewLine();
      useCalculatorStore.getState().addNewLine();

      const lineId = useCalculatorStore.getState().document.lines[0].id;
      const initialCount = useCalculatorStore.getState().document.lines.length;

      useCalculatorStore.getState().removeLine(lineId);

      const newCount = useCalculatorStore.getState().document.lines.length;
      expect(newCount).toBe(initialCount - 1);
    });
  });

  describe("calculateLine", () => {
    it("should calculate simple expression", async () => {
      useCalculatorStore.getState().addNewLine();

      const lineId = useCalculatorStore.getState().document.lines[0].id;

      useCalculatorStore.getState().setInput(lineId, "5 + 5");

      await useCalculatorStore.getState().calculateLine(lineId);

      const line = useCalculatorStore.getState().document.lines[0];
      expect(line.result).toBeDefined();
      expect(line.result?.type).toBe("number");
    });

    it("should not call AI for valid expressions", async () => {
      useCalculatorStore.getState().addNewLine();

      const lineId = useCalculatorStore.getState().document.lines[0].id;

      useCalculatorStore.getState().setInput(lineId, "10 * 2");

      await useCalculatorStore.getState().calculateLine(lineId);

      expect(mockProcessWithAI).not.toHaveBeenCalled();
    });

    it("should call AI for unrecognized expressions", async () => {
      mockProcessWithAI.mockResolvedValue({
        success: true,
        value: 42,
        formatted: "42",
      });

      useCalculatorStore.getState().addNewLine();

      const lineId = useCalculatorStore.getState().document.lines[0].id;

      useCalculatorStore.getState().setInput(lineId, "what is the answer to life");

      await useCalculatorStore.getState().calculateLine(lineId);

      expect(mockProcessWithAI).toHaveBeenCalled();
    });

    it("should use AI result when successful", async () => {
      mockProcessWithAI.mockResolvedValue({
        success: true,
        value: 30,
        formatted: "30",
      });

      useCalculatorStore.getState().addNewLine();

      const lineId = useCalculatorStore.getState().document.lines[0].id;

      useCalculatorStore.getState().setInput(lineId, "what is 15 percent of 200");

      await useCalculatorStore.getState().calculateLine(lineId);

      const line = useCalculatorStore.getState().document.lines[0];
      expect(line.result?.type).toBe("number");
      expect(line.category).toBe("ai");
    });

    it("should handle AI failure gracefully", async () => {
      mockProcessWithAI.mockRejectedValue(new Error("Network error"));

      useCalculatorStore.getState().addNewLine();

      const lineId = useCalculatorStore.getState().document.lines[0].id;

      useCalculatorStore.getState().setInput(lineId, "calculate something weird");

      await useCalculatorStore.getState().calculateLine(lineId);

      // Should not throw, just use error result
      const line = useCalculatorStore.getState().document.lines[0];
      expect(line.result).toBeDefined();
    });

    it("should not call AI for short inputs", async () => {
      useCalculatorStore.getState().addNewLine();

      const lineId = useCalculatorStore.getState().document.lines[0].id;

      useCalculatorStore.getState().setInput(lineId, "ab");

      await useCalculatorStore.getState().calculateLine(lineId);

      expect(mockProcessWithAI).not.toHaveBeenCalled();
    });

    it("should handle variable assignments", async () => {
      useCalculatorStore.getState().addNewLine();

      const lineId = useCalculatorStore.getState().document.lines[0].id;

      useCalculatorStore.getState().setInput(lineId, "x = 100");

      await useCalculatorStore.getState().calculateLine(lineId);

      const variables = useCalculatorStore.getState().document.variables;
      expect(variables.has("x")).toBe(true);
    });
  });

  describe("calculateAll", () => {
    it("should calculate all lines", () => {
      useCalculatorStore.getState().addNewLine();
      useCalculatorStore.getState().addNewLine();

      const lines = useCalculatorStore.getState().document.lines;
      useCalculatorStore.getState().setInput(lines[0].id, "10 + 5");
      useCalculatorStore.getState().setInput(lines[1].id, "20 * 2");

      useCalculatorStore.getState().calculateAll();

      const updatedLines = useCalculatorStore.getState().document.lines;
      expect(updatedLines[0].result).toBeDefined();
      expect(updatedLines[1].result).toBeDefined();
    });
  });

  describe("clearDocument", () => {
    it("should create a new document", () => {
      const originalId = useCalculatorStore.getState().document.id;

      useCalculatorStore.getState().clearDocument();

      const newId = useCalculatorStore.getState().document.id;
      expect(newId).not.toBe(originalId);
    });
  });

  describe("updateDocumentTitle", () => {
    it("should update the document title", () => {
      useCalculatorStore.getState().updateDocumentTitle("New Title");

      const title = useCalculatorStore.getState().document.title;
      expect(title).toBe("New Title");
    });
  });

  describe("saveDocument and loadDocument", () => {
    it("should save current document", () => {
      const initialCount = useCalculatorStore.getState().savedDocuments.length;

      useCalculatorStore.getState().saveDocument();

      const newCount = useCalculatorStore.getState().savedDocuments.length;
      expect(newCount).toBe(initialCount + 1);
    });

    it("should load a saved document", () => {
      // Save a document with a specific title
      useCalculatorStore.getState().updateDocumentTitle("Saved Doc");
      useCalculatorStore.getState().saveDocument();

      const savedDocId = useCalculatorStore.getState().document.id;

      // Clear and create new document
      useCalculatorStore.getState().clearDocument();

      // Load the saved document
      useCalculatorStore.getState().loadDocument(savedDocId);

      const loadedTitle = useCalculatorStore.getState().document.title;
      expect(loadedTitle).toBe("Saved Doc");
    });
  });

  describe("deleteDocument", () => {
    it("should remove document from saved list", () => {
      useCalculatorStore.getState().saveDocument();

      const docId = useCalculatorStore.getState().document.id;
      const initialCount = useCalculatorStore.getState().savedDocuments.length;

      useCalculatorStore.getState().deleteDocument(docId);

      const newCount = useCalculatorStore.getState().savedDocuments.length;
      expect(newCount).toBe(initialCount - 1);
    });
  });

  describe("setEmBase", () => {
    it("should update emBase", () => {
      useCalculatorStore.getState().setEmBase(14);

      expect(useCalculatorStore.getState().emBase).toBe(14);
    });
  });

  describe("setPpiBase", () => {
    it("should update ppiBase", () => {
      useCalculatorStore.getState().setPpiBase(72);

      expect(useCalculatorStore.getState().ppiBase).toBe(72);
    });
  });

  describe("getTotal", () => {
    it("should calculate total of all numeric results", () => {
      useCalculatorStore.getState().addNewLine();
      useCalculatorStore.getState().addNewLine();

      const lines = useCalculatorStore.getState().document.lines;
      useCalculatorStore.getState().setInput(lines[0].id, "10");
      useCalculatorStore.getState().setInput(lines[1].id, "20");
      useCalculatorStore.getState().calculateAll();

      const total = useCalculatorStore.getState().getTotal();
      expect(total.toNumber()).toBe(30);
    });
  });
});
