import { describe, expect, it } from "vitest";

import { CalculationError, evaluateExpression } from "./calculate";

describe("evaluateExpression", () => {
  it("evaluates basic arithmetic with operator precedence", () => {
    expect(evaluateExpression("2 + 3 * 4").value).toBe(14);
    expect(evaluateExpression("18 / 3 + 2").value).toBe(8);
  });

  it("respects parentheses", () => {
    expect(evaluateExpression("(2 + 3) * 4").value).toBe(20);
  });

  it("supports right-associative powers", () => {
    expect(evaluateExpression("2 ^ 3 ^ 2").value).toBe(512);
    expect(evaluateExpression("2 ^ -2").value).toBe(0.25);
  });

  it("supports unary signs", () => {
    expect(evaluateExpression("-3 + +5").value).toBe(2);
    expect(evaluateExpression("-2 ^ 2").value).toBe(-4);
    expect(evaluateExpression("(-2) ^ 2").value).toBe(4);
  });

  it("supports percentage postfixes", () => {
    expect(evaluateExpression("50%").value).toBe(0.5);
    expect(evaluateExpression("200 * 10%").value).toBe(20);
  });

  it("supports constants and functions", () => {
    expect(evaluateExpression("sqrt(81)").value).toBe(9);
    expect(evaluateExpression("pi").value).toBeCloseTo(Math.PI);
    expect(evaluateExpression("abs(-12)").value).toBe(12);
  });

  it("normalizes calculator operator glyphs", () => {
    expect(evaluateExpression("8 ÷ 2 × 3").value).toBe(12);
  });

  it("formats display values", () => {
    expect(evaluateExpression("1000 / 4").displayValue).toBe("250");
    expect(evaluateExpression("1000 + 234.5").displayValue).toBe("1,234.5");
  });

  it("rejects malformed expressions", () => {
    expect(() => evaluateExpression("2 +")).toThrow(CalculationError);
    expect(() => evaluateExpression("(2 + 3")).toThrow("Missing closing parenthesis");
  });

  it("rejects division by zero", () => {
    expect(() => evaluateExpression("4 / 0")).toThrow("Cannot divide by zero");
  });
});
