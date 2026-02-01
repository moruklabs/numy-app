import {
  createDocument,
  addLine,
  updateLine,
  updateLineResult,
  deleteLine,
  setVariable,
  getVariable,
  calculateTotal,
} from "../entities/Document";
import {
  createNumericResult,
  createCurrencyResult,
  createErrorResult,
} from "../value-objects/CalculationResult";

describe("Document Entity", () => {
  describe("createDocument", () => {
    it("creates a document with default title", () => {
      const doc = createDocument();
      expect(doc.title).toBe("Untitled");
      expect(doc.lines.length).toBe(1);
      expect(doc.lines[0].input).toBe("");
      expect(doc.variables.size).toBe(0);
      expect(doc.id).toMatch(/^doc_/);
    });

    it("creates a document with custom title", () => {
      const doc = createDocument("My Calculator");
      expect(doc.title).toBe("My Calculator");
    });

    it("sets creation and update timestamps", () => {
      const beforeCreate = new Date();
      const doc = createDocument();
      const afterCreate = new Date();

      expect(doc.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(doc.createdAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
      expect(doc.updatedAt.getTime()).toBe(doc.createdAt.getTime());
    });
  });

  describe("addLine", () => {
    it("adds a new line to the document", () => {
      const doc = createDocument();
      const updated = addLine(doc, "5 + 3");

      expect(updated.lines.length).toBe(2);
      expect(updated.lines[1].input).toBe("5 + 3");
      expect(updated.lines[1].order).toBe(1);
    });

    it("adds empty line when no input provided", () => {
      const doc = createDocument();
      const updated = addLine(doc);

      expect(updated.lines.length).toBe(2);
      expect(updated.lines[1].input).toBe("");
    });

    it("updates the updatedAt timestamp", () => {
      const doc = createDocument();
      const originalUpdatedAt = doc.updatedAt;

      // Small delay to ensure different timestamp
      const updated = addLine(doc, "test");
      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime());
    });
  });

  describe("updateLine", () => {
    it("updates input of existing line", () => {
      const doc = createDocument();
      const lineId = doc.lines[0].id;
      const updated = updateLine(doc, lineId, "10 * 5");

      expect(updated.lines[0].input).toBe("10 * 5");
      expect(updated.lines[0].result).toBeNull();
    });

    it("clears result when input changes", () => {
      let doc = createDocument();
      const lineId = doc.lines[0].id;
      doc = updateLine(doc, lineId, "5 + 3");
      doc = updateLineResult(doc, lineId, createNumericResult(8));

      expect(doc.lines[0].result).not.toBeNull();

      const updated = updateLine(doc, lineId, "10 + 20");
      expect(updated.lines[0].result).toBeNull();
    });

    it("does not modify other lines", () => {
      let doc = createDocument();
      doc = addLine(doc, "line 2");
      const lineId = doc.lines[0].id;
      const updated = updateLine(doc, lineId, "updated line 1");

      expect(updated.lines[0].input).toBe("updated line 1");
      expect(updated.lines[1].input).toBe("line 2");
    });
  });

  describe("updateLineResult", () => {
    it("updates result of existing line", () => {
      const doc = createDocument();
      const lineId = doc.lines[0].id;
      const result = createNumericResult(42);
      const updated = updateLineResult(doc, lineId, result);

      expect(updated.lines[0].result).toEqual(result);
    });

    it("updates category when provided", () => {
      const doc = createDocument();
      const lineId = doc.lines[0].id;
      const result = createNumericResult(42);
      const updated = updateLineResult(doc, lineId, result, "functions");

      expect(updated.lines[0].category).toBe("functions");
    });
  });

  describe("deleteLine", () => {
    it("removes line from document", () => {
      let doc = createDocument();
      doc = addLine(doc, "line 2");
      const lineId = doc.lines[0].id;
      const updated = deleteLine(doc, lineId);

      expect(updated.lines.length).toBe(1);
      expect(updated.lines[0].input).toBe("line 2");
    });

    it("reorders remaining lines", () => {
      let doc = createDocument();
      doc = addLine(doc, "line 2");
      doc = addLine(doc, "line 3");
      const lineId = doc.lines[1].id;
      const updated = deleteLine(doc, lineId);

      expect(updated.lines.length).toBe(2);
      expect(updated.lines[0].order).toBe(0);
      expect(updated.lines[1].order).toBe(1);
    });

    it("creates new empty line if all lines deleted", () => {
      const doc = createDocument();
      const lineId = doc.lines[0].id;
      const updated = deleteLine(doc, lineId);

      expect(updated.lines.length).toBe(1);
      expect(updated.lines[0].input).toBe("");
      expect(updated.lines[0].order).toBe(0);
    });
  });

  describe("Variables", () => {
    it("sets a variable", () => {
      const doc = createDocument();
      const result = createNumericResult(100);
      const updated = setVariable(doc, "price", result);

      expect(updated.variables.size).toBe(1);
      expect(updated.variables.get("price")).toEqual(result);
    });

    it("stores variables case-insensitively", () => {
      const doc = createDocument();
      const result = createNumericResult(100);
      const updated = setVariable(doc, "Price", result);

      expect(updated.variables.get("price")).toEqual(result);
    });

    it("overwrites existing variable", () => {
      let doc = createDocument();
      doc = setVariable(doc, "x", createNumericResult(5));
      doc = setVariable(doc, "x", createNumericResult(10));

      expect(doc.variables.get("x")?.value.toNumber()).toBe(10);
    });

    it("retrieves variable by name", () => {
      let doc = createDocument();
      const result = createNumericResult(42);
      doc = setVariable(doc, "answer", result);

      expect(getVariable(doc, "answer")).toEqual(result);
    });

    it("returns undefined for non-existent variable", () => {
      const doc = createDocument();
      expect(getVariable(doc, "nonexistent")).toBeUndefined();
    });
  });

  describe("calculateTotal", () => {
    it("sums all numeric results", () => {
      let doc = createDocument();
      doc = updateLineResult(doc, doc.lines[0].id, createNumericResult(10));
      doc = addLine(doc, "");
      doc = updateLineResult(doc, doc.lines[1].id, createNumericResult(20));
      doc = addLine(doc, "");
      doc = updateLineResult(doc, doc.lines[2].id, createNumericResult(30));

      const total = calculateTotal(doc);
      expect(total.toNumber()).toBe(60);
    });

    it("includes currency values in total", () => {
      let doc = createDocument();
      doc = updateLineResult(doc, doc.lines[0].id, createCurrencyResult(100, "USD"));
      doc = addLine(doc, "");
      doc = updateLineResult(doc, doc.lines[1].id, createCurrencyResult(50, "USD"));

      const total = calculateTotal(doc);
      expect(total.toNumber()).toBe(150);
    });

    it("excludes error results from total", () => {
      let doc = createDocument();
      doc = updateLineResult(doc, doc.lines[0].id, createNumericResult(10));
      doc = addLine(doc, "");
      doc = updateLineResult(doc, doc.lines[1].id, createErrorResult("Invalid"));
      doc = addLine(doc, "");
      doc = updateLineResult(doc, doc.lines[2].id, createNumericResult(20));

      const total = calculateTotal(doc);
      expect(total.toNumber()).toBe(30);
    });

    it("returns zero for document with no results", () => {
      const doc = createDocument();
      const total = calculateTotal(doc);
      expect(total.toNumber()).toBe(0);
    });
  });
});
