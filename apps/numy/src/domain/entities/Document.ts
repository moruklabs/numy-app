import { Line, createLine } from "./Line";
import { CalculationResult } from "../value-objects/CalculationResult";
import Decimal from "decimal.js";

export interface Document {
  id: string;
  title: string;
  lines: Line[];
  variables: Map<string, CalculationResult>;
  createdAt: Date;
  updatedAt: Date;
}

export function createDocument(title: string = "Untitled"): Document {
  const now = new Date();
  return {
    id: generateDocumentId(),
    title,
    lines: [createLine("", 0)],
    variables: new Map(),
    createdAt: now,
    updatedAt: now,
  };
}

export function addLine(doc: Document, input: string = ""): Document {
  const newLine = createLine(input, doc.lines.length);
  return {
    ...doc,
    lines: [...doc.lines, newLine],
    updatedAt: new Date(),
  };
}

export function updateLine(doc: Document, lineId: string, input: string): Document {
  return {
    ...doc,
    lines: doc.lines.map((line) => (line.id === lineId ? { ...line, input, result: null } : line)),
    updatedAt: new Date(),
  };
}

export function updateLineResult(
  doc: Document,
  lineId: string,
  result: CalculationResult,
  category?: string
): Document {
  return {
    ...doc,
    lines: doc.lines.map((line) =>
      line.id === lineId ? { ...line, result, category: category ?? line.category } : line
    ),
    updatedAt: new Date(),
  };
}

export function deleteLine(doc: Document, lineId: string): Document {
  const filteredLines = doc.lines.filter((line) => line.id !== lineId);
  // Ensure at least one line exists
  if (filteredLines.length === 0) {
    return {
      ...doc,
      lines: [createLine("", 0)],
      updatedAt: new Date(),
    };
  }
  return {
    ...doc,
    lines: filteredLines.map((line, index) => ({ ...line, order: index })),
    updatedAt: new Date(),
  };
}

export function setVariable(doc: Document, name: string, value: CalculationResult): Document {
  const newVariables = new Map(doc.variables);
  newVariables.set(name.toLowerCase(), value);
  return {
    ...doc,
    variables: newVariables,
    updatedAt: new Date(),
  };
}

export function getVariable(doc: Document, name: string): CalculationResult | undefined {
  return doc.variables.get(name.toLowerCase());
}

export function calculateTotal(doc: Document): Decimal {
  let total = new Decimal(0);
  for (const line of doc.lines) {
    if (line.result && line.result.type !== "error") {
      total = total.plus(line.result.value);
    }
  }
  return total;
}

function generateDocumentId(): string {
  return `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
