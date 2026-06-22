import type { WorkspaceLine, WorkspaceTemplate, WorkspaceVariable } from '../types';

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
const RESERVED_IDENTIFIERS = new Set<string>([
  ...Object.keys(BASE_SCOPE),
  'ans',
]);

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
      scope: Record<string, unknown>,
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

export function extractWorkspaceDependencies(sourceExpression: string): string[] {
  const expression = normalizeExpression(sourceExpression);
  if (!expression) return [];
  const identifiers = expression.match(IDENTIFIER_REGEX) ?? [];
  const unique = new Set<string>();
  for (const identifier of identifiers) {
    if (!RESERVED_IDENTIFIERS.has(identifier)) {
      unique.add(identifier);
    }
  }
  return [...unique];
}

export interface WorkspaceDependencyGraphNode {
  lineId: string;
  lineIndex: number;
  expression: string;
  outputVariable: string | null;
  dependsOnVariables: string[];
  externalVariables: string[];
  unresolvedVariables: string[];
  upstreamLineIds: string[];
  downstreamLineIds: string[];
  hasCycle: boolean;
}

export interface WorkspaceDependencyGraph {
  nodes: WorkspaceDependencyGraphNode[];
  evaluationOrderLineIds: string[];
  cycleLineIds: string[];
  edgeCount: number;
}

export function buildWorkspaceDependencyGraph(
  lines: WorkspaceLine[],
  variables: WorkspaceVariable[],
): WorkspaceDependencyGraph {
  const variableNames = new Set(variables.map((variable) => variable.name));
  const producerByVariable = new Map<string, string>();
  for (const line of lines) {
    const name = line.variableName.trim();
    if (isValidVariableName(name)) {
      producerByVariable.set(name, line.id);
    }
  }

  const dependencyMap = new Map<string, string[]>();
  const upstreamMap = new Map<string, Set<string>>();
  const downstreamMap = new Map<string, Set<string>>();
  for (const line of lines) {
    dependencyMap.set(line.id, extractWorkspaceDependencies(line.expression));
    upstreamMap.set(line.id, new Set<string>());
    downstreamMap.set(line.id, new Set<string>());
  }

  for (const line of lines) {
    const dependencies = dependencyMap.get(line.id) ?? [];
    for (const dependency of dependencies) {
      const producerLineId = producerByVariable.get(dependency);
      if (!producerLineId) continue;
      upstreamMap.get(line.id)?.add(producerLineId);
      downstreamMap.get(producerLineId)?.add(line.id);
    }
  }

  const cycleLineIds = new Set<string>();
  const visited = new Set<string>();
  const inStack = new Set<string>();
  const stack: string[] = [];

  function dfs(lineId: string) {
    visited.add(lineId);
    inStack.add(lineId);
    stack.push(lineId);

    for (const next of downstreamMap.get(lineId) ?? []) {
      if (!visited.has(next)) {
        dfs(next);
      } else if (inStack.has(next)) {
        const startIndex = stack.lastIndexOf(next);
        if (startIndex >= 0) {
          for (let i = startIndex; i < stack.length; i += 1) {
            cycleLineIds.add(stack[i]);
          }
        }
        cycleLineIds.add(next);
      }
    }

    stack.pop();
    inStack.delete(lineId);
  }

  for (const line of lines) {
    if (!visited.has(line.id)) dfs(line.id);
  }

  const indegree = new Map<string, number>();
  for (const line of lines) {
    indegree.set(line.id, upstreamMap.get(line.id)?.size ?? 0);
  }
  const queue: string[] = lines
    .filter((line) => (indegree.get(line.id) ?? 0) === 0)
    .map((line) => line.id);
  const evaluationOrderLineIds: string[] = [];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) break;
    evaluationOrderLineIds.push(current);
    for (const downstreamId of downstreamMap.get(current) ?? []) {
      const nextInDegree = (indegree.get(downstreamId) ?? 0) - 1;
      indegree.set(downstreamId, nextInDegree);
      if (nextInDegree === 0) queue.push(downstreamId);
    }
  }

  const nodes: WorkspaceDependencyGraphNode[] = lines.map((line, index) => {
    const dependencies = dependencyMap.get(line.id) ?? [];
    const externalVariables = dependencies.filter((dependency) => !producerByVariable.has(dependency) && variableNames.has(dependency));
    const unresolvedVariables = dependencies.filter((dependency) => !producerByVariable.has(dependency) && !variableNames.has(dependency));

    return {
      lineId: line.id,
      lineIndex: index,
      expression: line.expression,
      outputVariable: isValidVariableName(line.variableName.trim()) ? line.variableName.trim() : null,
      dependsOnVariables: dependencies,
      externalVariables,
      unresolvedVariables,
      upstreamLineIds: [...(upstreamMap.get(line.id) ?? [])],
      downstreamLineIds: [...(downstreamMap.get(line.id) ?? [])],
      hasCycle: cycleLineIds.has(line.id),
    };
  });

  const edgeCount = nodes.reduce((count, node) => count + node.upstreamLineIds.length, 0);

  return {
    nodes,
    evaluationOrderLineIds,
    cycleLineIds: [...cycleLineIds],
    edgeCount,
  };
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
