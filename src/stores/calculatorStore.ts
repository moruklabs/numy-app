import { processWithAI } from "@moruk/ai";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Decimal from "decimal.js";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  Document,
  addLine,
  calculateTotal,
  createDocument,
  deleteLine,
  setVariable,
  updateLine,
  updateLineResult,
} from "@/domain/entities/Document";
import type { Line } from "@/domain/entities/Line";
import { detectCategory, evaluate, extractVariableName } from "@/domain/services/CalculationEngine";
import { createNumericResult, createUnitResult } from "@/domain/value-objects/CalculationResult";
import { CALCULATION_PROMPT } from "../services/ai/prompts";

// Default examples moved to src/domain/fixtures/defaultExamples.ts

// Word lists for generating random titles
const ADJECTIVES = [
  "Amber",
  "Azure",
  "Bright",
  "Calm",
  "Cosmic",
  "Crystal",
  "Dawn",
  "Deep",
  "Ember",
  "Fern",
  "Gentle",
  "Golden",
  "Hazy",
  "Ivory",
  "Jade",
  "Lunar",
  "Maple",
  "Misty",
  "Noble",
  "Ocean",
  "Pearl",
  "Quiet",
  "Rustic",
  "Sage",
  "Silver",
  "Soft",
  "Solar",
  "Swift",
  "Teal",
  "Velvet",
  "Warm",
  "Wild",
];

const NOUNS = [
  "Bloom",
  "Breeze",
  "Brook",
  "Canyon",
  "Cloud",
  "Cove",
  "Dune",
  "Echo",
  "Falls",
  "Field",
  "Flame",
  "Forest",
  "Garden",
  "Glen",
  "Grove",
  "Harbor",
  "Haven",
  "Hill",
  "Lake",
  "Leaf",
  "Meadow",
  "Moon",
  "Peak",
  "Pine",
  "Ridge",
  "River",
  "Shore",
  "Sky",
  "Spring",
  "Stone",
  "Stream",
  "Valley",
];

// Generate a random two-word title
function generateRandomTitle(): string {
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  return `${adjective} ${noun}`;
}

// Deep copy a document (for loading examples without modifying originals)
function cloneDocument(doc: Document): Document {
  return {
    ...doc,
    lines: doc.lines.map((line: Line) => ({
      ...line,
      result: line.result ? { ...line.result } : null,
    })),
    variables: new Map(doc.variables),
    createdAt: new Date(doc.createdAt),
    updatedAt: new Date(doc.updatedAt),
  };
}

export interface CalculatorState {
  // Current document
  document: Document;

  // Settings
  emBase: number;
  ppiBase: number;
  decimalPlaces: number;

  // History
  savedDocuments: Document[];

  // UI preferences
  showTotal: boolean;

  // Viewing example mode (can play but not save)
  isViewingExample: boolean;

  // Hydration state
  _hasHydrated: boolean;

  // Actions
  setInput: (lineId: string, input: string) => void;
  addNewLine: () => void;
  removeLine: (lineId: string) => void;
  calculateLine: (lineId: string) => Promise<void>;
  calculateAll: () => void;
  getTotal: () => Decimal;
  clearDocument: () => void;
  saveDocument: () => void;
  newDocument: () => void;
  newDocumentWithAutoSave: () => void;
  loadDocument: (docId: string) => void;
  loadExample: (doc: Document) => void;
  toggleShowTotal: () => void;
  deleteDocument: (docId: string) => void;
  updateDocumentTitle: (title: string) => void;
  setEmBase: (value: number) => void;
  setPpiBase: (value: number) => void;
  setDecimalPlaces: (value: number) => void;
  setHasHydrated: (state: boolean) => void;
  exitExampleMode: () => void;
  resetAll: () => Promise<void>;
}

// Serialize/deserialize Document for persistence
const serializeDocument = (doc: Document) => ({
  ...doc,
  variables: Array.from(doc.variables.entries()),
  createdAt: doc.createdAt.toISOString(),
  updatedAt: doc.updatedAt.toISOString(),
});

const deserializeDocument = (data: any): Document => ({
  ...data,
  variables: new Map(data.variables || []),
  createdAt: new Date(data.createdAt),
  updatedAt: new Date(data.updatedAt),
});

export const useCalculatorStore = create<CalculatorState>()(
  persist(
    (set, get) => ({
      document: createDocument(generateRandomTitle()),
      emBase: 16,
      ppiBase: 96,
      decimalPlaces: 2,
      savedDocuments: [], // Start empty, examples are separate now
      showTotal: true,
      isViewingExample: false,
      _hasHydrated: false,

      setInput: (lineId: string, input: string) => {
        set((state) => ({
          document: updateLine(state.document, lineId, input),
        }));
      },

      addNewLine: () => {
        set((state) => ({
          document: addLine(state.document, ""),
        }));
      },

      removeLine: (lineId: string) => {
        set((state) => ({
          document: deleteLine(state.document, lineId),
        }));
      },

      calculateLine: async (lineId: string) => {
        const state = get();
        const line = state.document.lines.find((l: Line) => l.id === lineId);
        if (!line) return;

        const context = {
          variables: state.document.variables,
          emBase: state.emBase,
          ppiBase: state.ppiBase,
          decimalPlaces: state.decimalPlaces,
        };

        const result = evaluate(line.input, context);
        const category = detectCategory(line.input);

        // Check if this is a variable assignment
        const varName = extractVariableName(line.input);

        // If evaluation failed and input looks meaningful, try AI fallback
        if (result.type === "error" && line.input.trim().length > 2) {
          try {
            const aiResult = await processWithAI({
              input: line.input,
              systemPrompt: CALCULATION_PROMPT,
            });
            if (aiResult.success && aiResult.value !== undefined) {
              // Convert AI result to CalculationResult (use current precision setting)
              const formatOpts = { decimalPlaces: state.decimalPlaces };
              const aiCalcResult = aiResult.unit
                ? createUnitResult(new Decimal(aiResult.value), aiResult.unit, formatOpts)
                : createNumericResult(new Decimal(aiResult.value), formatOpts);

              set((prevState) => {
                const newDoc = updateLineResult(prevState.document, lineId, aiCalcResult, "ai");
                return { document: newDoc };
              });
              return;
            }
          } catch {
            // AI failed, fall through to use original error result
          }
        }

        set((prevState) => {
          let newDoc = updateLineResult(prevState.document, lineId, result, category);

          // Store variable if assignment
          if (varName && result.type !== "error") {
            newDoc = setVariable(newDoc, varName, result);
          }

          return { document: newDoc };
        });
      },

      calculateAll: () => {
        const state = get();
        const context = {
          variables: new Map(state.document.variables),
          emBase: state.emBase,
          ppiBase: state.ppiBase,
          decimalPlaces: state.decimalPlaces,
        };

        let newDoc = { ...state.document };

        for (const line of state.document.lines) {
          const result = evaluate(line.input, {
            ...context,
            variables: newDoc.variables,
          });
          const category = detectCategory(line.input);
          newDoc = updateLineResult(newDoc, line.id, result, category);

          // Store variable if assignment
          const varName = extractVariableName(line.input);
          if (varName && result.type !== "error") {
            newDoc = setVariable(newDoc, varName, result);
          }
        }

        set({ document: newDoc });
      },

      getTotal: () => {
        return calculateTotal(get().document);
      },

      clearDocument: () => {
        set({ document: createDocument(generateRandomTitle()) });
      },

      newDocument: () => {
        set({ document: createDocument(generateRandomTitle()), isViewingExample: false });
      },

      newDocumentWithAutoSave: () => {
        const state = get();
        // Only auto-save if there's content and not viewing an example
        if (!state.isViewingExample && state.document.lines.some((l: Line) => l.input.trim())) {
          const existingIndex = state.savedDocuments.findIndex((d) => d.id === state.document.id);
          if (existingIndex >= 0) {
            const newSaved = [...state.savedDocuments];
            newSaved[existingIndex] = state.document;
            set({ savedDocuments: newSaved });
          } else {
            set({ savedDocuments: [...state.savedDocuments, state.document] });
          }
        }
        set({ document: createDocument(generateRandomTitle()), isViewingExample: false });
      },

      saveDocument: () => {
        const state = get();
        const existingIndex = state.savedDocuments.findIndex((d) => d.id === state.document.id);

        if (existingIndex >= 0) {
          const newSaved = [...state.savedDocuments];
          newSaved[existingIndex] = state.document;
          set({ savedDocuments: newSaved });
        } else {
          set({ savedDocuments: [...state.savedDocuments, state.document] });
        }
      },

      loadDocument: (docId: string) => {
        const state = get();
        const doc = state.savedDocuments.find((d) => d.id === docId);
        if (doc) {
          // Check if this is an example document (legacy check)
          const isExample = doc.id.startsWith("example_");
          // Clone the document so modifications don't affect the original
          const clonedDoc = cloneDocument(doc);
          set({ document: clonedDoc, isViewingExample: isExample });
          // Auto-calculate all lines after loading
          get().calculateAll();
        }
      },

      loadExample: (doc: Document) => {
        // Clone the document so modifications don't affect the original
        const clonedDoc = cloneDocument(doc);
        set({ document: clonedDoc, isViewingExample: true });
        // Auto-calculate all lines after loading
        get().calculateAll();
      },

      exitExampleMode: () => {
        set({ isViewingExample: false, document: createDocument(generateRandomTitle()) });
      },

      deleteDocument: (docId: string) => {
        set((state) => ({
          savedDocuments: state.savedDocuments.filter((d) => d.id !== docId),
        }));
      },

      updateDocumentTitle: (title: string) => {
        set((state) => ({
          document: {
            ...state.document,
            title,
            updatedAt: new Date(),
          },
        }));
      },

      setEmBase: (value: number) => {
        set({ emBase: value });
        get().calculateAll();
      },

      setPpiBase: (value: number) => {
        set({ ppiBase: value });
        get().calculateAll();
      },

      setDecimalPlaces: (value: number) => {
        set({ decimalPlaces: value });
        get().calculateAll();
      },

      toggleShowTotal: () => {
        set((state) => ({ showTotal: !state.showTotal }));
      },

      setHasHydrated: (state: boolean) => {
        set({ _hasHydrated: state });
      },

      resetAll: async () => {
        // Clear only this store's persisted data (not expo-router or other storage)
        await useCalculatorStore.persist.clearStorage();

        // Set fresh state with NO examples in history
        set({
          document: createDocument(generateRandomTitle()),
          savedDocuments: [],
          emBase: 16,
          ppiBase: 96,
          decimalPlaces: 2,
          showTotal: true,
          isViewingExample: false,
          _hasHydrated: true,
        });
      },
    }),
    {
      name: "numy-calculator-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        document: serializeDocument(state.document),
        emBase: state.emBase,
        ppiBase: state.ppiBase,
        decimalPlaces: state.decimalPlaces,
        savedDocuments: state.savedDocuments.map(serializeDocument),
        showTotal: state.showTotal,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Deserialize documents
          state.document = deserializeDocument(state.document);

          // Deserialize saved documents
          const userDocs = (state.savedDocuments || []).map(deserializeDocument);

          // Migration: Remove legacy examples from savedDocuments if they exist
          const cleanedDocs = userDocs.filter((doc) => !doc.id.startsWith("example_"));

          state.savedDocuments = cleanedDocs;
          state._hasHydrated = true;
        }
      },
    }
  )
);
