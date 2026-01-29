import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Document,
  createDocument,
  addLine,
  updateLine,
  updateLineResult,
  deleteLine,
  setVariable,
  calculateTotal,
} from "../../domain/entities/Document";
import { createLine } from "../../domain/entities/Line";
import {
  evaluate,
  extractVariableName,
  detectCategory,
} from "../../domain/services/CalculationEngine";
import {
  createNumericResult,
  createUnitResult,
} from "../../domain/value-objects/CalculationResult";
import { processWithAI } from "@moruk/ai";
import { CALCULATION_PROMPT } from "../services/ai/prompts";
import Decimal from "decimal.js";

// Default example documents from design screenshots
function createExampleDocument(title: string, expressions: string[], id?: string): Document {
  const now = new Date();
  const lines = expressions.map((expr, idx) => createLine(expr, idx));
  return {
    id: id || `example_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title,
    lines,
    variables: new Map(),
    createdAt: now,
    updatedAt: now,
  };
}

function getDefaultExamples(): Document[] {
  return [
    // ASO Showcase Examples with comments explaining features
    createExampleDocument(
      "What is Numy",
      [
        "// Type naturally, get answers",
        "5 times 3",
        "20% of 150",
        "// Convert anything",
        "100 usd in eur",
        "5 km in miles",
      ],
      "example_welcome"
    ),
    createExampleDocument(
      "Shopping Made Easy",
      [
        "// Calculate discounts instantly",
        "20% off $89.99",
        "// Split bills with friends",
        "$156.80 / 4",
        "// Add tax to your total",
        "$45 + 8% of $45",
      ],
      "example_shopping"
    ),
    createExampleDocument(
      "Tip Calculator",
      [
        "// Dinner bill",
        "$67.50",
        "// 18% tip",
        "18% of $67.50",
        "// Total with tip",
        "$67.50 + 18% of $67.50",
      ],
      "example_tipping"
    ),
    createExampleDocument(
      "Recipe Converter",
      [
        "// Convert recipe measurements",
        "2 cups in ml",
        "500 g in lb",
        "// Scale ingredients",
        "1.5 * 250 ml",
        "350 f in c",
      ],
      "example_cooking"
    ),
    createExampleDocument(
      "Travel Helper",
      [
        "// Convert currencies",
        "500 usd in eur",
        "1000 jpy in usd",
        "// Distance conversions",
        "100 km in miles",
        "5280 ft in km",
      ],
      "example_travel"
    ),
    createExampleDocument(
      "Date Countdown",
      [
        "// Days until events",
        "days until december 25",
        "days until january 1",
        "// Plan ahead",
        "today + 30",
        "today + 90",
      ],
      "example_dates"
    ),
    createExampleDocument(
      "Budget Planner",
      [
        "// Set your values",
        "income = 5000",
        "rent = 1500",
        "// Calculate savings",
        "income - rent",
        "30% of income",
      ],
      "example_budget"
    ),
    createExampleDocument(
      "Quick Math",
      [
        "// Natural language works",
        "12 squared",
        "square root of 144",
        "// Scientific functions",
        "sin(30°)",
        "log(100)",
      ],
      "example_math"
    ),
    createExampleDocument(
      "Unit Conversions",
      ["// Length", "6 ft in cm", "// Weight", "150 lb in kg", "// Data", "2 GB in MB"],
      "example_units"
    ),
    createExampleDocument(
      "For Developers",
      [
        "// CSS unit conversions",
        "16 px in em",
        "2 em in px",
        "// Responsive calculations",
        "1920 / 16",
        "100 / 3",
      ],
      "example_css"
    ),
  ];
}

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
    lines: doc.lines.map((line) => ({ ...line, result: line.result ? { ...line.result } : null })),
    variables: new Map(doc.variables),
    createdAt: new Date(doc.createdAt),
    updatedAt: new Date(doc.updatedAt),
  };
}

interface CalculatorState {
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
      savedDocuments: getDefaultExamples(),
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
        const line = state.document.lines.find((l) => l.id === lineId);
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
        if (!state.isViewingExample && state.document.lines.some((l) => l.input.trim())) {
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
          // Check if this is an example document
          const isExample = doc.id.startsWith("example_");
          // Clone the document so modifications don't affect the original
          const clonedDoc = cloneDocument(doc);
          set({ document: clonedDoc, isViewingExample: isExample });
          // Auto-calculate all lines after loading
          get().calculateAll();
        }
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

        // Set fresh state with default examples
        set({
          document: createDocument(generateRandomTitle()),
          savedDocuments: getDefaultExamples(),
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

          // Get default examples
          const defaults = getDefaultExamples();

          // Merge: add defaults that don't exist yet (by id)
          const existingIds = new Set(userDocs.map((d) => d.id));
          const missingDefaults = defaults.filter((d) => !existingIds.has(d.id));

          // Put defaults first, then user documents
          state.savedDocuments = [...missingDefaults, ...userDocs];

          state._hasHydrated = true;
        }
      },
    }
  )
);
