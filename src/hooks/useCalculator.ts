import { useReducer, useEffect } from 'react';
import type { CalcState, Action, NumBase } from '../types';
import { applyBinaryOp, applyUnaryOp } from '../lib/calculator';
import {
  formatForDisplay,
  formatInBase,
  parseFromBase,
  maskToBitWidth,
} from '../lib/formatter';

const initialState: CalcState = {
  displayValue: '0',
  expression: '',
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
  isError: false,
};

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
  return formatForDisplay(value);
}

function isResultBad(v: number) {
  return isNaN(v) || !isFinite(v);
}

// ─── reducer ────────────────────────────────────────────────────────────────

function reducer(state: CalcState, action: Action): CalcState {
  switch (action.type) {

    case 'PRESS_DIGIT': {
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
      if (state.mode === 'programmer') return state;
      if (state.isError) return state;
      if (state.hasDecimal || state.displayValue.includes('.')) return state;

      if (state.replaceOnInput) {
        return { ...state, displayValue: '0.', replaceOnInput: false, hasDecimal: true };
      }
      return { ...state, displayValue: state.displayValue + '.', hasDecimal: true };
    }

    case 'PRESS_OPERATOR': {
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
      if (state.isError) return state;

      // Complete pending binary operation
      if (state.pendingOp !== null && state.accumulator !== null) {
        const right = state.replaceOnInput ? state.accumulator : getCurrentValue(state);
        const result = applyBinaryOp(state.accumulator, state.pendingOp, right);

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
        };
      }

      // Repeat last operation
      if (state.lastOp !== null && state.lastOperand !== null) {
        const cur = getCurrentValue(state);
        const result = applyBinaryOp(cur, state.lastOp, state.lastOperand);
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
        };
      }

      return { ...state, activeOp: null, expression: '' };
    }

    case 'PRESS_UNARY': {
      if (state.isError && action.op !== '+/-') return state;
      const value = getCurrentValue(state);
      const result = applyUnaryOp(value, action.op, state.angleMode);

      if (isResultBad(result)) {
        return { ...state, displayValue: 'Error', isError: true };
      }
      return {
        ...state,
        displayValue: fmtDisplay(result, state),
        replaceOnInput: true,
        hasDecimal: result !== Math.trunc(result),
        isSecondFn: false,
      };
    }

    case 'PRESS_CLEAR': {
      // If already at 0 / error / just got result → full AC reset
      const fullReset = state.displayValue === '0' || state.replaceOnInput || state.isError;
      if (fullReset) {
        return {
          ...initialState,
          mode: state.mode,
          angleMode: state.angleMode,
          numBase: state.numBase,
          bitWidth: state.bitWidth,
          memory: state.memory,
        };
      }
      // C: clear only current input
      return { ...state, displayValue: '0', hasDecimal: false, isError: false, isSecondFn: false };
    }

    case 'PRESS_BACKSPACE': {
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
      return {
        ...state,
        displayValue: formatForDisplay(action.value),
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
          : formatForDisplay(cur);
      return {
        ...initialState,
        mode: action.mode,
        memory: state.memory,
        angleMode: state.angleMode,
        numBase: state.numBase,
        bitWidth: state.bitWidth,
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

    case 'TOGGLE_ANGLE_MODE':
      return { ...state, angleMode: state.angleMode === 'deg' ? 'rad' : 'deg' };

    case 'TOGGLE_SECOND_FN':
      return { ...state, isSecondFn: !state.isSecondFn };

    default:
      return state;
  }
}

// ─── public hook ────────────────────────────────────────────────────────────

export function useCalculator() {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const k = e.key;

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
  }, [state.mode, state.numBase]);

  return { state, dispatch };
}
