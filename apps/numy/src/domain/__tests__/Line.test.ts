import { createLine, updateLineInput, updateLineResult } from "../entities/Line";
import { createNumericResult } from "../value-objects/CalculationResult";

describe("Line Entity", () => {
  describe("createLine", () => {
    it("creates a line with input and order", () => {
      const line = createLine("5 + 3", 0);
      expect(line.input).toBe("5 + 3");
      expect(line.order).toBe(0);
      expect(line.result).toBeNull();
      expect(line.id).toMatch(/^line_/);
    });

    it("creates line with unique id", () => {
      const line1 = createLine("", 0);
      const line2 = createLine("", 1);
      expect(line1.id).not.toBe(line2.id);
    });
  });

  describe("updateLineInput", () => {
    it("updates line input and clears result", () => {
      const line = createLine("5 + 3", 0);
      const result = createNumericResult(8);
      const lineWithResult = { ...line, result };

      const updated = updateLineInput(lineWithResult, "10 + 20");

      expect(updated.input).toBe("10 + 20");
      expect(updated.result).toBeNull();
    });

    it("preserves other line properties", () => {
      const line = createLine("test", 5);
      const updated = updateLineInput(line, "new input");

      expect(updated.id).toBe(line.id);
      expect(updated.order).toBe(5);
    });
  });

  describe("updateLineResult", () => {
    it("updates line result", () => {
      const line = createLine("5 + 3", 0);
      const result = createNumericResult(8);

      const updated = updateLineResult(line, result);

      expect(updated.result).toEqual(result);
      expect(updated.input).toBe("5 + 3");
    });
  });
});
