import { useReducer, useEffect } from 'react';
import type {
  CalcState,
  Action,
  NumBase,
  HistoryEntry,
  CalcMode,
  WorkspaceLine,
  WorkspaceVariable,
} from '../types';
import { applyBinaryOp, applyUnaryOp } from '../lib/calculator';
import { evaluatePythonMathExpression } from '../lib/pythonMath';
import {
  evaluateWorkspaceExpression,
  isWorkspaceVariableName,
  WORKSPACE_TEMPLATES,
} from '../lib/workspace';
import {
  formatForDisplay,
  formatInBase,
  parseFromBase,
  maskToBitWidth,
} from '../lib/formatter';

const initialState: CalcState = {
  displayValue: '0',
  expression: '',
  pythonExpression: '',
  pythonInputEnabled: false,
  accumulator: null,
  pendingOp: null,
  lastOperand: null,
  lastOp: null,
  replaceOnInput: false,
  hasDecimal: false,
  memory: 0,
  activeOp: null,
  mode: 'basic',
  angleMode: 'deg',
  isSecondFn: false,
  numBase: 'dec',
  bitWidth: 32,
  formatSettings: {
    significantDigits: 10,
    notation: 'auto',
  },
  history: [],
  workspace: {
    id: 'default-workspace',
    title: 'Workspace',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isOpen: false,
    lines: [createWorkspaceLine()],
    variables: [],
  },
  isError: false,
};

const MAX_HISTORY_ENTRIES = 150;
const MAX_UNDO_STEPS = 120;

interface UndoHistoryState {
  past: CalcState[];
  present: CalcState;
  future: CalcState[];
}

function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function createWorkspaceLine(partial?: Partial<WorkspaceLine>): WorkspaceLine {
  const ts = nowIso();
  return {
    id: makeId('wline'),
    expression: '',
    resultValue: null,
    resultDisplay: '',
    variableName: '',
    note: '',
    createdAt: ts,
    updatedAt: ts,
    ...partial,
  };
}

function createWorkspaceVariable(name: string, value: number, sourceLineId: string | null): WorkspaceVariable {
  return {
    id: makeId('wvar'),
    name,
    value,
    sourceLineId,
    updatedAt: nowIso(),
  };
}

// ─── helpers ────────────────────────────────────────────────────────────────

function getCurrentValue(state: CalcState): number {
  if (state.isError) return 0;
  if (state.mode === 'programmer') {
    return parseFromBase(state.displayValue, state.numBase);
  }
  return parseFloat(state.displayValue) || 0;
}

function fmtDisplay(value: number, state: CalcState): string {
  if (state.mode === 'programmer') {
    return formatInBase(value, state.numBase, state.bitWidth);
  }
  return formatForDisplay(value, state.formatSettings);
}

function isResultBad(v: number) {
  return isNaN(v) || !isFinite(v);
}

function buildHistoryEntry(state: CalcState, expression: string, result: number): HistoryEntry {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`,
    expression: expression.trim(),
    resultValue: result,
    resultDisplay: fmtDisplay(result, state),
    mode: state.mode,
    createdAt: new Date().toISOString(),
    pinned: false,
    note: '',
  };
}

function appendHistory(state: CalcState, expression: string, result: number): HistoryEntry[] {
  const entry = buildHistoryEntry(state, expression || 'Result', result);
  return [entry, ...state.history].slice(0, MAX_HISTORY_ENTRIES);
}

function fmtWorkspaceValue(value: number, state: CalcState): string {
  return formatForDisplay(value, state.formatSettings);
}

function upsertWorkspaceVariable(
  variables: WorkspaceVariable[],
  name: string,
  value: number,
  sourceLineId: string | null,
): WorkspaceVariable[] {
  const existing = variables.find((item) => item.name === name);
  if (!existing) {
    return [createWorkspaceVariable(name, value, sourceLineId), ...variables];
  }
  return variables.map((item) => (item.id === existing.id
    ? { ...item, value, sourceLineId, updatedAt: nowIso() }
    : item));
}

function workspaceWithUpdatedLine(
  state: CalcState,
  lineId: string,
  updater: (line: WorkspaceLine) => WorkspaceLine,
) {
  return {
    ...state.workspace,
    updatedAt: nowIso(),
    lines: state.workspace.lines.map((line) => (line.id === lineId ? updater(line) : line)),
  };
}

function applyPythonExpression(state: CalcState): CalcState {
  if (state.mode !== 'programmer' || !state.pythonInputEnabled) return state;

  const evaluated = evaluatePythonMathExpression(state.pythonExpression);
  if (!evaluated.ok) {
    return {
      ...state,
      displayValue: 'Error',
      expression: evaluated.error,
      isError: true,
      accumulator: null,
      pendingOp: null,
      lastOperand: null,
      lastOp: null,
      activeOp: null,
      replaceOnInput: true,
    };
  }

  if (isResultBad(evaluated.value)) {
    return {
      ...state,
      displayValue: 'Error',
      expression: 'Expression did not produce a valid number.',
      isError: true,
      accumulator: null,
      pendingOp: null,
      lastOperand: null,
      lastOp: null,
      activeOp: null,
      replaceOnInput: true,
    };
  }

  return {
    ...state,
    displayValue: fmtDisplay(evaluated.value, state),
    expression: `py: ${state.pythonExpression.trim()}`,
    isError: false,
    accumulator: null,
    pendingOp: null,
    lastOperand: null,
    lastOp: null,
    activeOp: null,
    replaceOnInput: true,
    hasDecimal: evaluated.value !== Math.trunc(evaluated.value),
    history: appendHistory(state, state.pythonExpression.trim(), evaluated.value),
  };
}

// ─── reducer ────────────────────────────────────────────────────────────────

function calcReducer(state: CalcState, action: Action): CalcState {
  const isPythonModeActive = state.mode === 'programmer' && state.pythonInputEnabled;

  switch (action.type) {
    case 'UNDO':
    case 'REDO':
      return state;

    case 'PRESS_DIGIT': {
      if (isPythonModeActive) return state;
      if (state.isError) return state;
      const d = action.digit.toUpperCase();

      const validDigits: Record<NumBase, RegExp> = {
        hex: /^[0-9A-F]$/,
        dec: /^[0-9]$/,
        oct: /^[0-7]$/,
        bin: /^[01]$/,
      };
      if (state.mode === 'programmer' && !validDigits[state.numBase].test(d)) return state;

      if (state.replaceOnInput || state.displayValue === '0') {
        return {
          ...state,
          displayValue: d,
          replaceOnInput: false,
          hasDecimal: false,
          isSecondFn: false,
        };
      }

      // Digit cap
      const raw = state.displayValue.replace('.', '').replace('-', '');
      if (raw.length >= 16) return state;

      return {
        ...state,
        displayValue: state.displayValue + d,
        isSecondFn: false,
      };
    }

    case 'PRESS_DECIMAL': {
      if (isPythonModeActive) return state;
      if (state.mode === 'programmer') return state;
      if (state.isError) return state;
      if (state.hasDecimal || state.displayValue.includes('.')) return state;

      if (state.replaceOnInput) {
        return { ...state, displayValue: '0.', replaceOnInput: false, hasDecimal: true };
      }
      return { ...state, displayValue: state.displayValue + '.', hasDecimal: true };
    }

    case 'PRESS_OPERATOR': {
      if (isPythonModeActive) return state;
      if (state.isError) return state;
      const { op } = action;
      const cur = getCurrentValue(state);

      // Chain: already have pending op and new input was entered → evaluate first
      if (state.accumulator !== null && state.pendingOp !== null && !state.replaceOnInput) {
        const result = applyBinaryOp(state.accumulator, state.pendingOp, cur);
        if (isResultBad(result)) {
          return { ...state, displayValue: 'Error', isError: true, accumulator: null, pendingOp: null, activeOp: null };
        }
        return {
          ...state,
          displayValue: fmtDisplay(result, state),
          expression: `${fmtDisplay(result, state)} ${op}`,
          accumulator: result,
          pendingOp: op,
          activeOp: op,
          replaceOnInput: true,
          hasDecimal: false,
          isSecondFn: false,
        };
      }

      // Change pending op without evaluating
      if (state.accumulator !== null && state.replaceOnInput) {
        return {
          ...state,
          pendingOp: op,
          activeOp: op,
          expression: `${fmtDisplay(state.accumulator, state)} ${op}`,
        };
      }

      // Fresh operator press
      return {
        ...state,
        accumulator: cur,
        pendingOp: op,
        activeOp: op,
        replaceOnInput: true,
        hasDecimal: false,
        expression: `${fmtDisplay(cur, state)} ${op}`,
        isSecondFn: false,
      };
    }

    case 'PRESS_EQUALS': {
      if (isPythonModeActive) return applyPythonExpression(state);
      if (state.isError) return state;

      // Complete pending binary operation
      if (state.pendingOp !== null && state.accumulator !== null) {
        const right = state.replaceOnInput ? state.accumulator : getCurrentValue(state);
        const result = applyBinaryOp(state.accumulator, state.pendingOp, right);
        const historyExpression = `${fmtDisplay(state.accumulator, state)} ${state.pendingOp} ${fmtDisplay(right, state)}`;

        if (isResultBad(result)) {
          return { ...state, displayValue: 'Error', isError: true, accumulator: null, pendingOp: null, activeOp: null, expression: '' };
        }
        return {
          ...state,
          displayValue: fmtDisplay(result, state),
          expression: '',
          accumulator: null,
          pendingOp: null,
          lastOp: state.pendingOp,
          lastOperand: right,
          replaceOnInput: true,
          hasDecimal: false,
          activeOp: null,
          isSecondFn: false,
          history: appendHistory(state, historyExpression, result),
        };
      }

      // Repeat last operation
      if (state.lastOp !== null && state.lastOperand !== null) {
        const cur = getCurrentValue(state);
        const result = applyBinaryOp(cur, state.lastOp, state.lastOperand);
        const historyExpression = `${fmtDisplay(cur, state)} ${state.lastOp} ${fmtDisplay(state.lastOperand, state)}`;
        if (isResultBad(result)) {
          return { ...state, displayValue: 'Error', isError: true, activeOp: null, expression: '' };
        }
        return {
          ...state,
          displayValue: fmtDisplay(result, state),
          expression: '',
          replaceOnInput: true,
          hasDecimal: false,
          activeOp: null,
          isSecondFn: false,
          history: appendHistory(state, historyExpression, result),
        };
      }

      return { ...state, activeOp: null, expression: '' };
    }

    case 'PRESS_UNARY': {
      if (isPythonModeActive) return state;
      if (state.isError && action.op !== '+/-') return state;
      const value = getCurrentValue(state);
      const result = applyUnaryOp(value, action.op, state.angleMode);
      const unaryExpression = `${action.op}(${fmtDisplay(value, state)})`;

      if (isResultBad(result)) {
        return { ...state, displayValue: 'Error', isError: true };
      }
      return {
        ...state,
        displayValue: fmtDisplay(result, state),
        replaceOnInput: true,
        hasDecimal: result !== Math.trunc(result),
        isSecondFn: false,
        history: appendHistory(state, unaryExpression, result),
      };
    }

    case 'PRESS_CLEAR': {
      if (isPythonModeActive) {
        if (state.pythonExpression.length === 0 && !state.isError) return state;
        return {
          ...state,
          displayValue: '0',
          expression: '',
          pythonExpression: '',
          accumulator: null,
          pendingOp: null,
          lastOperand: null,
          lastOp: null,
          activeOp: null,
          replaceOnInput: true,
          hasDecimal: false,
          isError: false,
        };
      }

      // If already at 0 / error / just got result → full AC reset
      const fullReset = state.displayValue === '0' || state.replaceOnInput || state.isError;
      if (fullReset) {
        return {
          ...initialState,
          mode: state.mode,
          angleMode: state.angleMode,
          numBase: state.numBase,
          bitWidth: state.bitWidth,
          formatSettings: state.formatSettings,
          history: state.history,
          workspace: state.workspace,
          memory: state.memory,
        };
      }
      // C: clear only current input
      return { ...state, displayValue: '0', hasDecimal: false, isError: false, isSecondFn: false };
    }

    case 'PRESS_BACKSPACE': {
      if (isPythonModeActive) {
        if (state.pythonExpression.length === 0) return state;
        return {
          ...state,
          pythonExpression: state.pythonExpression.slice(0, -1),
          isError: false,
          expression: '',
        };
      }
      if (state.isError) return { ...state, displayValue: '0', isError: false };
      if (state.replaceOnInput) return state;
      if (state.displayValue.length <= 1 || state.displayValue === '-0') {
        return { ...state, displayValue: '0', hasDecimal: false };
      }
      const removed = state.displayValue.slice(-1);
      return {
        ...state,
        displayValue: state.displayValue.slice(0, -1) || '0',
        hasDecimal: removed === '.' ? false : state.hasDecimal,
      };
    }

    case 'PRESS_MEMORY': {
      if (isPythonModeActive) return state;
      const cur = getCurrentValue(state);
      switch (action.op) {
        case 'mc': return { ...state, memory: 0 };
        case 'm+': return { ...state, memory: state.memory + cur, replaceOnInput: true };
        case 'm-': return { ...state, memory: state.memory - cur, replaceOnInput: true };
        case 'mr': return {
          ...state,
          displayValue: fmtDisplay(state.memory, state),
          replaceOnInput: true,
          hasDecimal: state.memory !== Math.trunc(state.memory),
        };
      }
      return state;
    }

    case 'PRESS_CONSTANT': {
      if (isPythonModeActive) return state;
      return {
        ...state,
        displayValue: formatForDisplay(action.value, state.formatSettings),
        replaceOnInput: true,
        hasDecimal: action.value !== Math.trunc(action.value),
        isSecondFn: false,
      };
    }

    case 'TOGGLE_BIT': {
      if (state.mode !== 'programmer') return state;
      const cur = getCurrentValue(state);
      // Use BigInt for precise bit toggling without 32-bit overflow issues
      const curBig  = BigInt(Math.trunc(cur));
      const bitBig  = BigInt(1) << BigInt(action.bitIndex);
      const widthMask = (BigInt(1) << BigInt(state.bitWidth)) - BigInt(1);
      const toggled = Number((curBig ^ bitBig) & widthMask);
      return {
        ...state,
        displayValue: formatInBase(toggled, state.numBase, state.bitWidth),
        replaceOnInput: false,
      };
    }

    case 'SET_MODE': {
      if (action.mode === state.mode) return state;
      const cur = getCurrentValue(state);
      const newDisplay =
        action.mode === 'programmer'
          ? formatInBase(Math.trunc(Math.abs(cur)), 'dec', state.bitWidth)
          : formatForDisplay(cur, state.formatSettings);
      return {
        ...initialState,
        mode: action.mode,
        memory: state.memory,
        angleMode: state.angleMode,
        numBase: state.numBase,
        bitWidth: state.bitWidth,
        formatSettings: state.formatSettings,
        history: state.history,
        workspace: state.workspace,
        displayValue: newDisplay,
      };
    }

    case 'SET_BASE': {
      if (state.mode !== 'programmer') return state;
      const cur = getCurrentValue(state);
      return {
        ...state,
        numBase: action.base,
        displayValue: formatInBase(cur, action.base, state.bitWidth),
        hasDecimal: false,
        replaceOnInput: false,
      };
    }

    case 'SET_BIT_WIDTH': {
      if (state.mode !== 'programmer') return state;
      const cur = getCurrentValue(state);
      const masked = maskToBitWidth(cur, action.width);
      return {
        ...state,
        bitWidth: action.width,
        displayValue: formatInBase(masked, state.numBase, action.width),
      };
    }

    case 'SET_FORMAT_SIGNIFICANT_DIGITS': {
      const digits = Math.min(15, Math.max(3, Math.trunc(action.digits)));
      const formatSettings = { ...state.formatSettings, significantDigits: digits };
      if (state.mode === 'programmer' || state.isError) {
        return { ...state, formatSettings };
      }
      const cur = getCurrentValue(state);
      return {
        ...state,
        formatSettings,
        displayValue: formatForDisplay(cur, formatSettings),
      };
    }

    case 'SET_FORMAT_NOTATION': {
      const formatSettings = { ...state.formatSettings, notation: action.notation };
      if (state.mode === 'programmer' || state.isError) {
        return { ...state, formatSettings };
      }
      const cur = getCurrentValue(state);
      return {
        ...state,
        formatSettings,
        displayValue: formatForDisplay(cur, formatSettings),
      };
    }

    case 'TOGGLE_HISTORY_PIN':
      return {
        ...state,
        history: state.history.map((entry) =>
          entry.id === action.id ? { ...entry, pinned: !entry.pinned } : entry),
      };

    case 'SET_HISTORY_NOTE':
      return {
        ...state,
        history: state.history.map((entry) =>
          entry.id === action.id ? { ...entry, note: action.note } : entry),
      };

    case 'CLEAR_HISTORY':
      return { ...state, history: [] };

    case 'RECALL_HISTORY_ENTRY': {
      const entry = state.history.find((item) => item.id === action.id);
      if (!entry) return state;
      return {
        ...state,
        displayValue: fmtDisplay(entry.resultValue, state),
        expression: `recalled: ${entry.expression}`,
        isError: false,
        replaceOnInput: true,
        hasDecimal: entry.resultValue !== Math.trunc(entry.resultValue),
      };
    }

    case 'TOGGLE_WORKSPACE':
      return {
        ...state,
        workspace: {
          ...state.workspace,
          isOpen: !state.workspace.isOpen,
          updatedAt: nowIso(),
        },
      };

    case 'SET_WORKSPACE_TITLE':
      return {
        ...state,
        workspace: {
          ...state.workspace,
          title: action.title,
          updatedAt: nowIso(),
        },
      };

    case 'ADD_WORKSPACE_LINE':
      return {
        ...state,
        workspace: {
          ...state.workspace,
          updatedAt: nowIso(),
          lines: [...state.workspace.lines, createWorkspaceLine()],
        },
      };

    case 'REMOVE_WORKSPACE_LINE': {
      if (state.workspace.lines.length <= 1) return state;
      const remainingLines = state.workspace.lines.filter((line) => line.id !== action.lineId);
      return {
        ...state,
        workspace: {
          ...state.workspace,
          updatedAt: nowIso(),
          lines: remainingLines,
          variables: state.workspace.variables.filter((variable) => variable.sourceLineId !== action.lineId),
        },
      };
    }

    case 'UPDATE_WORKSPACE_LINE_EXPRESSION':
      return {
        ...state,
        workspace: workspaceWithUpdatedLine(state, action.lineId, (line) => ({
          ...line,
          expression: action.expression,
          updatedAt: nowIso(),
        })),
      };

    case 'UPDATE_WORKSPACE_LINE_NOTE':
      return {
        ...state,
        workspace: workspaceWithUpdatedLine(state, action.lineId, (line) => ({
          ...line,
          note: action.note,
          updatedAt: nowIso(),
        })),
      };

    case 'UPDATE_WORKSPACE_LINE_VARIABLE_NAME':
      return {
        ...state,
        workspace: workspaceWithUpdatedLine(state, action.lineId, (line) => ({
          ...line,
          variableName: action.variableName,
          updatedAt: nowIso(),
        })),
      };

    case 'EVALUATE_WORKSPACE_LINE': {
      const line = state.workspace.lines.find((item) => item.id === action.lineId);
      if (!line) return state;
      const ans = line.resultValue ?? getCurrentValue(state);
      const evaluated = evaluateWorkspaceExpression(line.expression, state.workspace.variables, ans);
      if (!evaluated.ok) {
        return {
          ...state,
          displayValue: 'Error',
          expression: evaluated.error,
          isError: true,
          replaceOnInput: true,
        };
      }

      const evaluatedDisplay = fmtWorkspaceValue(evaluated.value, state);
      let nextVariables = state.workspace.variables;
      const trimmedVariableName = line.variableName.trim();
      if (trimmedVariableName && isWorkspaceVariableName(trimmedVariableName)) {
        nextVariables = upsertWorkspaceVariable(nextVariables, trimmedVariableName, evaluated.value, line.id);
      }

      return {
        ...state,
        displayValue: fmtDisplay(evaluated.value, state),
        expression: `ws: ${line.expression}`,
        isError: false,
        replaceOnInput: true,
        hasDecimal: evaluated.value !== Math.trunc(evaluated.value),
        history: appendHistory(state, line.expression, evaluated.value),
        workspace: {
          ...workspaceWithUpdatedLine(state, line.id, (item) => ({
            ...item,
            resultValue: evaluated.value,
            resultDisplay: evaluatedDisplay,
            updatedAt: nowIso(),
          })),
          variables: nextVariables,
          updatedAt: nowIso(),
        },
      };
    }

    case 'ASSIGN_WORKSPACE_VARIABLE_FROM_LINE': {
      const line = state.workspace.lines.find((item) => item.id === action.lineId);
      if (!line || line.resultValue === null) return state;
      const name = line.variableName.trim();
      if (!isWorkspaceVariableName(name)) return state;
      return {
        ...state,
        workspace: {
          ...state.workspace,
          updatedAt: nowIso(),
          variables: upsertWorkspaceVariable(state.workspace.variables, name, line.resultValue, line.id),
        },
      };
    }

    case 'SET_WORKSPACE_VARIABLE_VALUE':
      return {
        ...state,
        workspace: {
          ...state.workspace,
          updatedAt: nowIso(),
          variables: state.workspace.variables.map((variable) => (
            variable.id === action.variableId
              ? { ...variable, value: action.value, updatedAt: nowIso() }
              : variable
          )),
        },
      };

    case 'REMOVE_WORKSPACE_VARIABLE':
      return {
        ...state,
        workspace: {
          ...state.workspace,
          updatedAt: nowIso(),
          variables: state.workspace.variables.filter((variable) => variable.id !== action.variableId),
        },
      };

    case 'APPLY_WORKSPACE_TEMPLATE': {
      const template = WORKSPACE_TEMPLATES[action.template];
      if (!template) return state;
      const seededVariables = template.variables.map((seed) => createWorkspaceVariable(seed.name, seed.value, null));
      const seededLines = template.lines.map((seed) => createWorkspaceLine({
        expression: seed.expression,
        variableName: seed.variableName ?? '',
        note: seed.note ?? '',
      }));
      return {
        ...state,
        workspace: {
          ...state.workspace,
          title: template.title,
          updatedAt: nowIso(),
          variables: seededVariables,
          lines: seededLines.length > 0 ? seededLines : [createWorkspaceLine()],
          isOpen: true,
        },
      };
    }

    case 'TOGGLE_ANGLE_MODE':
      return { ...state, angleMode: state.angleMode === 'deg' ? 'rad' : 'deg' };

    case 'TOGGLE_SECOND_FN':
      return { ...state, isSecondFn: !state.isSecondFn };

    case 'TOGGLE_PYTHON_INPUT': {
      if (state.mode !== 'programmer') return state;
      const enabled = !state.pythonInputEnabled;
      return {
        ...state,
        pythonInputEnabled: enabled,
        pythonExpression: enabled ? (state.pythonExpression || 'math.') : state.pythonExpression,
        expression: '',
        isError: false,
        accumulator: null,
        pendingOp: null,
        lastOperand: null,
        lastOp: null,
        activeOp: null,
        replaceOnInput: true,
      };
    }

    case 'SET_PYTHON_EXPRESSION':
      if (state.mode !== 'programmer') return state;
      return {
        ...state,
        pythonExpression: action.expression,
        expression: '',
        isError: false,
      };

    case 'EVALUATE_PYTHON_EXPRESSION':
      return applyPythonExpression(state);

    default:
      return state;
  }
}

function historyReducer(history: UndoHistoryState, action: Action): UndoHistoryState {
  if (action.type === 'UNDO') {
    if (history.past.length === 0) return history;
    const [previous, ...remainingPast] = history.past;
    return {
      past: remainingPast,
      present: previous,
      future: [history.present, ...history.future].slice(0, MAX_UNDO_STEPS),
    };
  }

  if (action.type === 'REDO') {
    if (history.future.length === 0) return history;
    const [nextPresent, ...remainingFuture] = history.future;
    return {
      past: [history.present, ...history.past].slice(0, MAX_UNDO_STEPS),
      present: nextPresent,
      future: remainingFuture,
    };
  }

  const nextPresent = calcReducer(history.present, action);
  if (nextPresent === history.present) return history;

  return {
    past: [history.present, ...history.past].slice(0, MAX_UNDO_STEPS),
    present: nextPresent,
    future: [],
  };
}

// ─── public hook ────────────────────────────────────────────────────────────

export function useCalculator() {
  const [historyState, dispatch] = useReducer(historyReducer, {
    past: [],
    present: initialState,
    future: [],
  });
  const state = historyState.present;

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const isEditableTarget = Boolean(
        target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable),
      );
      const key = e.key;
      const normalized = key.toLowerCase();
      const hasPrimaryModifier = (e.ctrlKey || e.metaKey) && !e.altKey;

      if (hasPrimaryModifier && !isEditableTarget) {
        const modeShortcut: Record<string, CalcMode> = {
          '1': 'basic',
          '2': 'scientific',
          '3': 'programmer',
        };

        if (normalized === 'z') {
          e.preventDefault();
          dispatch({ type: e.shiftKey ? 'REDO' : 'UNDO' });
          return;
        }
        if (normalized === 'y') {
          e.preventDefault();
          dispatch({ type: 'REDO' });
          return;
        }
        if (normalized === 'l') {
          e.preventDefault();
          dispatch({ type: 'PRESS_CLEAR' });
          return;
        }
        if (normalized === 'j') {
          e.preventDefault();
          dispatch({ type: 'TOGGLE_WORKSPACE' });
          return;
        }
        const selectedMode = modeShortcut[key];
        if (selectedMode) {
          e.preventDefault();
          dispatch({ type: 'SET_MODE', mode: selectedMode });
          return;
        }
      }

      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (isEditableTarget) {
        return;
      }
      const k = key;

      if (state.mode === 'programmer' && state.pythonInputEnabled) {
        if (k === 'Enter' || k === '=') {
          e.preventDefault();
          dispatch({ type: 'EVALUATE_PYTHON_EXPRESSION' });
        } else if (k === 'Escape') {
          e.preventDefault();
          dispatch({ type: 'PRESS_CLEAR' });
        }
        return;
      }

      if (/^[0-9]$/.test(k)) {
        e.preventDefault();
        dispatch({ type: 'PRESS_DIGIT', digit: k });
      } else if (/^[a-fA-F]$/.test(k) && state.mode === 'programmer' && state.numBase === 'hex') {
        e.preventDefault();
        dispatch({ type: 'PRESS_DIGIT', digit: k });
      } else if (k === '.') {
        e.preventDefault();
        dispatch({ type: 'PRESS_DECIMAL' });
      } else if (k === '+') {
        e.preventDefault();
        dispatch({ type: 'PRESS_OPERATOR', op: '+' });
      } else if (k === '-') {
        e.preventDefault();
        dispatch({ type: 'PRESS_OPERATOR', op: '-' });
      } else if (k === '*') {
        e.preventDefault();
        dispatch({ type: 'PRESS_OPERATOR', op: '×' });
      } else if (k === '/') {
        e.preventDefault();
        dispatch({ type: 'PRESS_OPERATOR', op: '÷' });
      } else if (k === '%') {
        e.preventDefault();
        dispatch({ type: 'PRESS_UNARY', op: '%' });
      } else if (k === 'Enter' || k === '=') {
        e.preventDefault();
        dispatch({ type: 'PRESS_EQUALS' });
      } else if (k === 'Escape') {
        e.preventDefault();
        dispatch({ type: 'PRESS_CLEAR' });
      } else if (k === 'Backspace') {
        e.preventDefault();
        dispatch({ type: 'PRESS_BACKSPACE' });
      }
    }

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [state.mode, state.numBase, state.pythonInputEnabled]);

  return {
    state,
    dispatch,
    canUndo: historyState.past.length > 0,
    canRedo: historyState.future.length > 0,
  };
}
