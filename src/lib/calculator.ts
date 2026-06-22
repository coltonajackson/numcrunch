import type { AngleMode } from '../types';

export function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function toDegrees(rad: number): number {
  return (rad * 180) / Math.PI;
}

export function factorial(n: number): number {
  if (!Number.isInteger(n) || n < 0 || n > 170) return NaN;
  if (n === 0 || n === 1) return 1;
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

export function applyBinaryOp(left: number, op: string, right: number): number {
  switch (op) {
    case '+':    return left + right;
    case '-':    return left - right;
    case '×':    return left * right;
    case '÷':    return right === 0 ? (left === 0 ? NaN : (left > 0 ? Infinity : -Infinity)) : left / right;
    case 'xʸ':   return Math.pow(left, right);
    case 'ʸ√x':  return Math.pow(left, 1 / right);
    case 'EE':   return left * Math.pow(10, right);
    case 'mod':  return left % right;
    case 'AND':  return (left | 0) & (right | 0);
    case 'OR':   return (left | 0) | (right | 0);
    case 'XOR':  return (left | 0) ^ (right | 0);
    case 'NAND': return ~((left | 0) & (right | 0));
    case 'NOR':  return ~((left | 0) | (right | 0));
    case 'LSH':  return (left | 0) << (right | 0);
    case 'RSH':  return (left | 0) >> (right | 0);
    default:     return right;
  }
}

export function applyUnaryOp(value: number, op: string, angleMode: AngleMode): number {
  const angle = angleMode === 'deg' ? toRadians(value) : value;

  switch (op) {
    case 'sin':    return cleanTrig(Math.sin(angle));
    case 'cos':    return cleanTrig(Math.cos(angle));
    case 'tan':    return cleanTrig(Math.tan(angle));
    case 'sin⁻¹': return angleMode === 'deg' ? toDegrees(Math.asin(value)) : Math.asin(value);
    case 'cos⁻¹': return angleMode === 'deg' ? toDegrees(Math.acos(value)) : Math.acos(value);
    case 'tan⁻¹': return angleMode === 'deg' ? toDegrees(Math.atan(value)) : Math.atan(value);
    case 'sinh':   return Math.sinh(value);
    case 'cosh':   return Math.cosh(value);
    case 'tanh':   return Math.tanh(value);
    case 'sinh⁻¹': return Math.asinh(value);
    case 'cosh⁻¹': return Math.acosh(value);
    case 'tanh⁻¹': return Math.atanh(value);
    case 'x²':     return value * value;
    case 'x³':     return value * value * value;
    case 'eˣ':     return Math.exp(value);
    case '10ˣ':    return Math.pow(10, value);
    case '2ˣ':     return Math.pow(2, value);
    case '√x':     return Math.sqrt(value);
    case '∛x':     return Math.cbrt(value);
    case '1/x':    return value === 0 ? Infinity : 1 / value;
    case 'x!':     return factorial(value);
    case 'ln':     return Math.log(value);
    case 'log₁₀': return Math.log10(value);
    case 'log₂':  return Math.log2(value);
    case 'NOT':    return ~(value | 0);
    case '+/-':    return -value;
    case '%':      return value / 100;
    default:       return value;
  }
}

/** Round values extremely close to 0/1/-1 to avoid floating-point artifacts like sin(180°)≈1.2e-16 */
function cleanTrig(v: number): number {
  if (Math.abs(v) < 1e-14) return 0;
  if (Math.abs(v - 1) < 1e-14) return 1;
  if (Math.abs(v + 1) < 1e-14) return -1;
  return v;
}
