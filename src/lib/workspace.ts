import type { WorkspaceTemplate, WorkspaceVariable } from '../types';

type WorkspaceEvalResult =
  | { ok: true; value: number }
  | { ok: false; error: string };

const IDENTIFIER_REGEX = /\b[A-Za-z_][A-Za-z0-9_]*\b/g;
const FORBIDDEN_CHARS = /[;"'`\\[\]{}:?]/;
const VALID_CHARS = /^[0-9A-Za-z_+\-*/%()&,.\s^]*$/;
const BLOCKED_PATTERNS = [
  /\bconstructor\b/i,
  /\bprototype\b/i,
  /\b__proto__\b/i,
  /\bfunction\b/i,
  /\bnew\b/i,
  /\bthis\b/i,
];

const BASE_SCOPE = {
  pi: Math.PI,
  e: Math.E,
  tau: Math.PI * 2,
  abs: Math.abs,
  sqrt: Math.sqrt,
  cbrt: Math.cbrt,
  pow: Math.pow,
  min: Math.min,
  max: Math.max,
  round: Math.round,
  floor: Math.floor,
  ceil: Math.ceil,
  trunc: Math.trunc,
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  asin: Math.asin,
  acos: Math.acos,
  atan: Math.atan,
  log: Math.log,
  log10: Math.log10,
  log2: Math.log2,
  exp: Math.exp,
};

function normalizeExpression(raw: string): string {
  return raw
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/\^/g, '**')
    .trim();
}

function isSafeExpression(expression: string): boolean {
  if (!VALID_CHARS.test(expression)) return false;
  if (FORBIDDEN_CHARS.test(expression)) return false;
  return !BLOCKED_PATTERNS.some((pattern) => pattern.test(expression));
}

function isValidVariableName(name: string): boolean {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(name);
}

export function evaluateWorkspaceExpression(
  sourceExpression: string,
  variables: WorkspaceVariable[],
  ans: number | null,
): WorkspaceEvalResult {
  const expression = normalizeExpression(sourceExpression);
  if (!expression) return { ok: false, error: 'Expression is empty.' };
  if (!isSafeExpression(expression)) return { ok: false, error: 'Expression contains blocked syntax.' };

  const scope: Record<string, number | ((...args: number[]) => number)> = {
    ...BASE_SCOPE,
  };
  for (const variable of variables) {
    scope[variable.name] = variable.value;
  }
  if (ans !== null) {
    scope.ans = ans;
  }

  const identifiers = expression.match(IDENTIFIER_REGEX) ?? [];
  for (const identifier of identifiers) {
    if (!(identifier in scope)) {
      return { ok: false, error: `Unknown token: ${identifier}` };
    }
  }

  try {
    const jsExpression = expression.replace(IDENTIFIER_REGEX, (id) => `scope.${id}`);
    const evaluator = new Function('scope', `"use strict"; return (${jsExpression});`) as (
      scope: typeof scope,
    ) => unknown;
    const result = evaluator(scope);
    if (typeof result !== 'number' || !Number.isFinite(result) || Number.isNaN(result)) {
      return { ok: false, error: 'Expression did not produce a finite number.' };
    }
    return { ok: true, value: result };
  } catch {
    return { ok: false, error: 'Invalid expression syntax.' };
  }
}

export function isWorkspaceVariableName(name: string): boolean {
  return isValidVariableName(name);
}

export interface WorkspaceTemplateSeed {
  title: string;
  variables: Array<{ name: string; value: number }>;
  lines: Array<{ expression: string; variableName?: string; note?: string }>;
}

export const WORKSPACE_TEMPLATES: Record<WorkspaceTemplate, WorkspaceTemplateSeed> = {
  'tip-total': {
    title: 'Tip + Total',
    variables: [
      { name: 'subtotal', value: 100 },
      { name: 'tip_rate', value: 0.2 },
    ],
    lines: [
      { expression: 'subtotal * tip_rate', variableName: 'tip', note: 'Tip amount' },
      { expression: 'subtotal + tip', variableName: 'total', note: 'Final total' },
    ],
  },
  'percent-change': {
    title: 'Percent Change',
    variables: [
      { name: 'old_value', value: 120 },
      { name: 'new_value', value: 150 },
    ],
    lines: [
      { expression: 'new_value - old_value', variableName: 'delta' },
      { expression: '(delta / old_value) * 100', variableName: 'percent_change', note: '% change' },
    ],
  },
  'compound-interest': {
    title: 'Compound Interest',
    variables: [
      { name: 'principal', value: 1000 },
      { name: 'rate', value: 0.05 },
      { name: 'times', value: 12 },
      { name: 'years', value: 5 },
    ],
    lines: [
      { expression: 'principal * (1 + rate / times) ** (times * years)', variableName: 'future_value' },
      { expression: 'future_value - principal', variableName: 'interest_earned' },
    ],
  },
};
