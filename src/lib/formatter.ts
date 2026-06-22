import type { NumBase, BitWidth } from '../types';

export function maskToBitWidth(value: number, bitWidth: BitWidth): number {
  const int = Math.trunc(value);
  if (bitWidth === 64) {
    // JS floats only give exact integers up to 2^53, good enough for typical use
    const max = Math.pow(2, 64);
    return ((int % max) + max) % max;
  }
  const max = Math.pow(2, bitWidth);
  return ((int % max) + max) % max;
}

export function formatForDisplay(value: number): string {
  if (isNaN(value)) return 'Error';
  if (!isFinite(value)) return value > 0 ? '∞' : '-∞';

  const abs = Math.abs(value);

  if (abs === 0) return '0';

  if (abs >= 1e15 || (abs < 1e-9 && abs !== 0)) {
    const exp = value.toExponential(9);
    return exp.replace(/(\.\d*?)0+(e)/, '$1$2').replace(/\.(e)/, '$1');
  }

  if (Number.isInteger(value)) return value.toString();

  // Limit to 10 significant figures
  return parseFloat(value.toPrecision(10)).toString();
}

export function formatInBase(value: number, base: NumBase, bitWidth: BitWidth): string {
  const int = maskToBitWidth(value, bitWidth);
  switch (base) {
    case 'hex': return int.toString(16).toUpperCase();
    case 'oct': return int.toString(8);
    case 'bin': return int.toString(2);
    case 'dec': return int.toString(10);
  }
}

export function formatBin(value: number, bitWidth: BitWidth): string {
  const int = maskToBitWidth(value, bitWidth);
  const bits = int.toString(2).padStart(bitWidth, '0');
  const groups: string[] = [];
  for (let i = 0; i < bits.length; i += 4) {
    groups.push(bits.slice(i, i + 4));
  }
  return groups.join(' ');
}

export function parseFromBase(str: string, base: NumBase): number {
  if (!str || str === '') return 0;
  const clean = str.replace(/\s/g, '');
  switch (base) {
    case 'hex': return parseInt(clean, 16) || 0;
    case 'oct': return parseInt(clean, 8) || 0;
    case 'bin': return parseInt(clean, 2) || 0;
    case 'dec': return parseFloat(clean) || 0;
  }
}

export function getDisplayFontSize(len: number): string {
  if (len <= 6)  return '4.5rem';
  if (len <= 9)  return '3.5rem';
  if (len <= 12) return '2.75rem';
  if (len <= 15) return '2.25rem';
  return '1.75rem';
}
