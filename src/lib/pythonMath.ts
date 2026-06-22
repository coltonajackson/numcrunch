type PythonMathEvalResult =
  | { ok: true; value: number }
  | { ok: false; error: string };

const MAX_EXPRESSION_LENGTH = 220;

const BLOCKED_PATTERNS = [
  /\bconstructor\b/i,
  /\bprototype\b/i,
  /\b__proto__\b/i,
  /\bfunction\b/i,
  /\bnew\b/i,
  /\bthis\b/i,
  /\bglobalThis\b/i,
  /\bwindow\b/i,
  /\bdocument\b/i,
];

const FORBIDDEN_CHARS = /[;"'`\\[\]{}:?]/;
const VALID_CHARS = /^[0-9A-Za-z_+\-*/%()&|^~<>=!.,\s]*$/;
const IDENTIFIER_REGEX = /[A-Za-z_][A-Za-z0-9_]*/g;

const JS_SAFE_MATH = {
  pi: Math.PI,
  e: Math.E,
  tau: Math.PI * 2,
  inf: Infinity,
  nan: Number.NaN,
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  asin: Math.asin,
  acos: Math.acos,
  atan: Math.atan,
  atan2: Math.atan2,
  sinh: Math.sinh,
  cosh: Math.cosh,
  tanh: Math.tanh,
  asinh: Math.asinh,
  acosh: Math.acosh,
  atanh: Math.atanh,
  sqrt: Math.sqrt,
  cbrt: Math.cbrt,
  exp: Math.exp,
  pow: Math.pow,
  floor: Math.floor,
  ceil: Math.ceil,
  trunc: Math.trunc,
  fabs: Math.abs,
  abs: Math.abs,
  fmod: (x: number, y: number) => x % y,
  log10: Math.log10,
  log2: Math.log2,
  radians: (deg: number) => (deg * Math.PI) / 180,
  degrees: (rad: number) => (rad * 180) / Math.PI,
  factorial: (n: number) => {
    if (!Number.isInteger(n) || n < 0 || n > 170) return Number.NaN;
    let out = 1;
    for (let i = 2; i <= n; i += 1) out *= i;
    return out;
  },
  log: (x: number, base?: number) => {
    if (base === undefined) return Math.log(x);
    return Math.log(x) / Math.log(base);
  },
};

const ALLOWED_IDENTIFIERS = new Set<string>([
  'math',
  'm',
  ...Object.keys(JS_SAFE_MATH),
]);

function normalizeExpression(raw: string): string {
  return raw
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .trim();
}

function hasBlockedContent(expression: string): boolean {
  if (!VALID_CHARS.test(expression)) return true;
  if (FORBIDDEN_CHARS.test(expression)) return true;
  return BLOCKED_PATTERNS.some((p) => p.test(expression));
}

function hasOnlyAllowedIdentifiers(expression: string): boolean {
  const identifiers = expression.match(IDENTIFIER_REGEX) ?? [];
  return identifiers.every((name) => ALLOWED_IDENTIFIERS.has(name));
}

export function evaluatePythonMathExpression(sourceExpression: string): PythonMathEvalResult {
  const normalized = normalizeExpression(sourceExpression);
  if (!normalized) return { ok: false, error: 'Enter a Python expression.' };
  if (normalized.length > MAX_EXPRESSION_LENGTH) {
    return { ok: false, error: 'Expression is too long.' };
  }
  if (normalized.includes('//')) {
    return { ok: false, error: 'Floor division (//) is not supported yet.' };
  }
  if (hasBlockedContent(normalized)) {
    return { ok: false, error: 'Only safe Python math expressions are allowed.' };
  }

  const jsExpression = normalized.replace(/\bmath\./g, 'm.');
  if (!hasOnlyAllowedIdentifiers(jsExpression)) {
    return { ok: false, error: 'Unknown identifier in expression.' };
  }

  try {
    const evaluator = new Function(
      'm',
      `"use strict"; return (${jsExpression});`,
    ) as (m: typeof JS_SAFE_MATH) => unknown;
    const result = evaluator(JS_SAFE_MATH);

    if (typeof result !== 'number' || Number.isNaN(result) || !Number.isFinite(result)) {
      return { ok: false, error: 'Expression did not produce a finite number.' };
    }

    return { ok: true, value: result };
  } catch {
    return { ok: false, error: 'Invalid Python expression.' };
  }
}
