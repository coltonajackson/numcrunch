type Token =
  | { type: "number"; value: number }
  | { type: "operator"; value: "+" | "-" | "*" | "/" | "^" | "%" }
  | { type: "identifier"; value: string }
  | { type: "leftParen" }
  | { type: "rightParen" };

export type Calculation = {
  expression: string;
  value: number;
  displayValue: string;
};

export class CalculationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CalculationError";
  }
}

const constants: Record<string, number> = {
  e: Math.E,
  pi: Math.PI,
  "π": Math.PI,
};

const functions: Record<string, (value: number) => number> = {
  abs: Math.abs,
  sqrt(value: number) {
    if (value < 0) {
      throw new CalculationError("Square root needs a non-negative value");
    }

    return Math.sqrt(value);
  },
};

export function evaluateExpression(input: string): Calculation {
  const expression = input.trim();

  if (!expression) {
    throw new CalculationError("Enter an expression first");
  }

  if (expression.length > 160) {
    throw new CalculationError("Expression is too long");
  }

  const parser = new Parser(tokenize(expression));
  const value = parser.parse();

  if (!Number.isFinite(value)) {
    throw new CalculationError("Result is outside the supported range");
  }

  return {
    expression,
    value,
    displayValue: formatNumber(value),
  };
}

export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) {
    return "Error";
  }

  if (Object.is(value, -0)) {
    return "0";
  }

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 10,
  }).format(value);
}

function tokenize(input: string): Token[] {
  const normalized = input.replaceAll("×", "*").replaceAll("÷", "/");
  const tokens: Token[] = [];
  let index = 0;

  while (index < normalized.length) {
    const char = normalized[index];

    if (!char) {
      break;
    }

    if (/\s/.test(char)) {
      index += 1;
      continue;
    }

    if (/[0-9.]/.test(char)) {
      const start = index;
      let hasDecimal = false;

      while (index < normalized.length) {
        const next = normalized[index];

        if (next === ".") {
          if (hasDecimal) {
            throw new CalculationError("Invalid number");
          }

          hasDecimal = true;
          index += 1;
          continue;
        }

        if (!next || !/[0-9]/.test(next)) {
          break;
        }

        index += 1;
      }

      const raw = normalized.slice(start, index);

      if (raw === ".") {
        throw new CalculationError("Invalid number");
      }

      tokens.push({ type: "number", value: Number(raw) });
      continue;
    }

    if (/[a-zA-Zπ]/.test(char)) {
      const start = index;

      while (index < normalized.length && /[a-zA-Zπ]/.test(normalized[index] ?? "")) {
        index += 1;
      }

      tokens.push({
        type: "identifier",
        value: normalized.slice(start, index).toLowerCase(),
      });
      continue;
    }

    if (char === "(") {
      tokens.push({ type: "leftParen" });
      index += 1;
      continue;
    }

    if (char === ")") {
      tokens.push({ type: "rightParen" });
      index += 1;
      continue;
    }

    if (isOperator(char)) {
      tokens.push({ type: "operator", value: char });
      index += 1;
      continue;
    }

    throw new CalculationError(`Unsupported character "${char}"`);
  }

  return tokens;
}

function isOperator(value: string): value is Extract<Token, { type: "operator" }>["value"] {
  return value === "+" || value === "-" || value === "*" || value === "/" || value === "^" || value === "%";
}

class Parser {
  private index = 0;

  constructor(private readonly tokens: Token[]) {}

  parse(): number {
    const value = this.parseExpression();

    if (!this.isAtEnd()) {
      throw new CalculationError("Unexpected input");
    }

    return value;
  }

  private parseExpression(): number {
    let value = this.parseTerm();

    while (this.matchOperator("+") || this.matchOperator("-")) {
      const operator = this.previous();
      const right = this.parseTerm();

      if (operator.type !== "operator") {
        throw new CalculationError("Unexpected parser state");
      }

      value = operator.value === "+" ? value + right : value - right;
    }

    return value;
  }

  private parseTerm(): number {
    let value = this.parseUnary();

    while (this.matchOperator("*") || this.matchOperator("/")) {
      const operator = this.previous();
      const right = this.parseUnary();

      if (operator.type !== "operator") {
        throw new CalculationError("Unexpected parser state");
      }

      if (operator.value === "/" && right === 0) {
        throw new CalculationError("Cannot divide by zero");
      }

      value = operator.value === "*" ? value * right : value / right;
    }

    return value;
  }

  private parseUnary(): number {
    if (this.matchOperator("+")) {
      return this.parseUnary();
    }

    if (this.matchOperator("-")) {
      return -this.parseUnary();
    }

    return this.parsePower();
  }

  private parsePower(): number {
    const left = this.parsePostfix();

    if (this.matchOperator("^")) {
      const right = this.parseUnary();
      const value = left ** right;

      if (!Number.isFinite(value)) {
        throw new CalculationError("Result is outside the supported range");
      }

      return value;
    }

    return left;
  }

  private parsePostfix(): number {
    let value = this.parsePrimary();

    while (this.matchOperator("%")) {
      value /= 100;
    }

    return value;
  }

  private parsePrimary(): number {
    if (this.match("number")) {
      const token = this.previous();

      if (token.type !== "number") {
        throw new CalculationError("Unexpected parser state");
      }

      return token.value;
    }

    if (this.match("identifier")) {
      const token = this.previous();

      if (token.type !== "identifier") {
        throw new CalculationError("Unexpected parser state");
      }

      const identifier = token.value;

      if (this.match("leftParen")) {
        const value = this.parseExpression();
        this.consume("rightParen", "Missing closing parenthesis");

        const fn = functions[identifier];

        if (!fn) {
          throw new CalculationError(`Unknown function "${identifier}"`);
        }

        return fn(value);
      }

      const constant = constants[identifier];

      if (constant === undefined) {
        throw new CalculationError(`Unknown value "${identifier}"`);
      }

      return constant;
    }

    if (this.match("leftParen")) {
      const value = this.parseExpression();
      this.consume("rightParen", "Missing closing parenthesis");
      return value;
    }

    throw new CalculationError("Expected a number or expression");
  }

  private consume(type: Token["type"], message: string): Token {
    if (this.check(type)) {
      return this.advance();
    }

    throw new CalculationError(message);
  }

  private match(type: Token["type"]): boolean {
    if (!this.check(type)) {
      return false;
    }

    this.advance();
    return true;
  }

  private matchOperator(operator: Extract<Token, { type: "operator" }>["value"]): boolean {
    const token = this.peek();

    if (token?.type !== "operator" || token.value !== operator) {
      return false;
    }

    this.advance();
    return true;
  }

  private check(type: Token["type"]): boolean {
    return this.peek()?.type === type;
  }

  private advance(): Token {
    if (!this.isAtEnd()) {
      this.index += 1;
    }

    return this.previous();
  }

  private previous(): Token {
    const token = this.tokens[this.index - 1];

    if (!token) {
      throw new CalculationError("Unexpected parser state");
    }

    return token;
  }

  private peek(): Token | undefined {
    return this.tokens[this.index];
  }

  private isAtEnd(): boolean {
    return this.index >= this.tokens.length;
  }
}
