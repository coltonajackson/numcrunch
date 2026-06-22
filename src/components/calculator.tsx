"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { CalculationError, evaluateExpression } from "@/lib/calculate";

type CalculatorButton = {
  label: string;
  value?: string;
  action?: "clear" | "delete" | "equals";
  variant?: "primary" | "secondary" | "accent" | "danger";
};

type HistoryItem = {
  id: string;
  expression: string;
  result: string;
};

const historyStorageKey = "numcrunch-history";
const resultContinuationValues = ["+", "-", "×", "÷", "^", "%"];

const buttons: CalculatorButton[][] = [
  [
    { label: "C", action: "clear", variant: "danger" },
    { label: "(", value: "(", variant: "secondary" },
    { label: ")", value: ")", variant: "secondary" },
    { label: "⌫", action: "delete", variant: "secondary" },
  ],
  [
    { label: "√", value: "sqrt(", variant: "secondary" },
    { label: "^", value: "^", variant: "secondary" },
    { label: "%", value: "%", variant: "secondary" },
    { label: "÷", value: "÷", variant: "accent" },
  ],
  [
    { label: "7", value: "7" },
    { label: "8", value: "8" },
    { label: "9", value: "9" },
    { label: "×", value: "×", variant: "accent" },
  ],
  [
    { label: "4", value: "4" },
    { label: "5", value: "5" },
    { label: "6", value: "6" },
    { label: "−", value: "-", variant: "accent" },
  ],
  [
    { label: "1", value: "1" },
    { label: "2", value: "2" },
    { label: "3", value: "3" },
    { label: "+", value: "+", variant: "accent" },
  ],
  [
    { label: "π", value: "π", variant: "secondary" },
    { label: "0", value: "0" },
    { label: ".", value: "." },
    { label: "=", action: "equals", variant: "primary" },
  ],
];

export function Calculator() {
  const [expression, setExpression] = useState("");
  const [result, setResult] = useState("0");
  const [error, setError] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);

  useEffect(() => {
    const storedHistory = window.localStorage.getItem(historyStorageKey);

    if (storedHistory) {
      try {
        const parsed: unknown = JSON.parse(storedHistory);

        if (Array.isArray(parsed)) {
          setHistory(parsed.filter(isHistoryItem).slice(0, 8));
        }
      } catch {
        window.localStorage.removeItem(historyStorageKey);
      }
    }

    setIsHistoryLoaded(true);
  }, []);

  useEffect(() => {
    if (!isHistoryLoaded) {
      return;
    }

    window.localStorage.setItem(historyStorageKey, JSON.stringify(history));
  }, [history, isHistoryLoaded]);

  const preview = useMemo(() => {
    if (!expression) {
      return "";
    }

    try {
      return evaluateExpression(expression).displayValue;
    } catch {
      return "";
    }
  }, [expression]);

  const display = expression || result;

  const appendValue = useCallback((value: string) => {
    setError("");
    setExpression((current) => {
      if (current) {
        return `${current}${value}`;
      }

      return isContinuingFromResult(value) ? `${unformatResult(result)}${value}` : value;
    });
  }, [result]);

  const clearCalculator = useCallback(() => {
    setExpression("");
    setResult("0");
    setError("");
  }, []);

  const deleteLast = useCallback(() => {
    setExpression((current) => current.slice(0, -1));
    setError("");
  }, []);

  const evaluateCurrentExpression = useCallback(() => {
    try {
      const calculation = evaluateExpression(expression || unformatResult(result));
      const historyItem = {
        id: createId(),
        expression: calculation.expression,
        result: calculation.displayValue,
      };

      setResult(calculation.displayValue);
      setExpression("");
      setError("");
      setHistory((current) => [historyItem, ...current].slice(0, 8));
    } catch (caughtError) {
      setError(caughtError instanceof CalculationError ? caughtError.message : "Something went wrong");
    }
  }, [expression, result]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Enter" || event.key === "=") {
        event.preventDefault();
        evaluateCurrentExpression();
        return;
      }

      if (event.key === "Backspace") {
        event.preventDefault();
        deleteLast();
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        clearCalculator();
        return;
      }

      const value = getKeyboardValue(event.key);

      if (value) {
        event.preventDefault();
        appendValue(value);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [appendValue, clearCalculator, deleteLast, evaluateCurrentExpression]);

  function reuseHistoryItem(item: HistoryItem) {
    setExpression(item.expression);
    setResult(item.result);
    setError("");
  }

  return (
    <section className="calculator-shell" aria-label="Numcrunch calculator">
      <div className="calculator-card">
        <div className="display-panel">
          <p className="eyebrow">Expression</p>
          <div className="display-value" aria-live="polite">
            {display}
          </div>
          <div className="display-meta">
            {error ? <span className="error-message">{error}</span> : <span>{preview && `= ${preview}`}</span>}
          </div>
        </div>

        <div className="button-grid" aria-label="Calculator controls">
          {buttons.flat().map((button) => (
            <button
              className={`calculator-button ${button.variant ?? ""}`}
              key={button.label}
              onClick={() => {
                if (button.action === "clear") {
                  clearCalculator();
                  return;
                }

                if (button.action === "delete") {
                  deleteLast();
                  return;
                }

                if (button.action === "equals") {
                  evaluateCurrentExpression();
                  return;
                }

                if (button.value) {
                  appendValue(button.value);
                }
              }}
              type="button"
            >
              {button.label}
            </button>
          ))}
        </div>
      </div>

      <aside className="history-card" aria-label="Calculation history">
        <div className="history-heading">
          <p className="eyebrow">History</p>
          <button
            className="clear-history"
            disabled={history.length === 0}
            onClick={() => setHistory([])}
            type="button"
          >
            Clear
          </button>
        </div>

        {history.length > 0 ? (
          <ol className="history-list">
            {history.map((item) => (
              <li key={item.id}>
                <button className="history-item" onClick={() => reuseHistoryItem(item)} type="button">
                  <span>{item.expression}</span>
                  <strong>{item.result}</strong>
                </button>
              </li>
            ))}
          </ol>
        ) : (
          <p className="empty-history">Solved expressions will appear here for quick reuse.</p>
        )}
      </aside>
    </section>
  );
}

function getKeyboardValue(key: string): string {
  if (/^[0-9.]$/.test(key)) {
    return key;
  }

  const keyboardMap: Record<string, string> = {
    "*": "×",
    "/": "÷",
    "+": "+",
    "-": "-",
    "^": "^",
    "%": "%",
    "(": "(",
    ")": ")",
  };

  return keyboardMap[key] ?? "";
}

function isContinuingFromResult(value: string): boolean {
  return resultContinuationValues.includes(value);
}

function unformatResult(value: string): string {
  return value.replaceAll(",", "");
}

function createId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

function isHistoryItem(item: unknown): item is HistoryItem {
  if (!item || typeof item !== "object") {
    return false;
  }

  const candidate = item as Record<string, unknown>;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.expression === "string" &&
    typeof candidate.result === "string"
  );
}
