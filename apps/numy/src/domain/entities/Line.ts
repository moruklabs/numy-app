import { CalculationResult } from "../value-objects/CalculationResult";

export interface Line {
  id: string;
  input: string;
  result: CalculationResult | null;
  order: number;
  category?: string;
}

export function createLine(input: string, order: number): Line {
  return {
    id: generateId(),
    input,
    result: null,
    order,
  };
}

export function updateLineInput(line: Line, input: string): Line {
  return {
    ...line,
    input,
    result: null, // Clear result when input changes
  };
}

export function updateLineResult(line: Line, result: CalculationResult): Line {
  return {
    ...line,
    result,
  };
}

function generateId(): string {
  return `line_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
