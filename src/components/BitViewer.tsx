import type { Action, CalcState } from '../types';
import { parseFromBase, maskToBitWidth } from '../lib/formatter';

interface BitViewerProps {
  state: CalcState;
  dispatch: React.Dispatch<Action>;
}

export function BitViewer({ state, dispatch }: BitViewerProps) {
  const rawValue = parseFromBase(state.displayValue, state.numBase);
  const masked = maskToBitWidth(rawValue, state.bitWidth);
  const bits = masked.toString(2).padStart(state.bitWidth, '0');

  const groups: string[][] = [];
  for (let i = 0; i < state.bitWidth; i += 8) {
    const byte = bits.slice(i, i + 8).split('');
    groups.push(byte);
  }

  const byteOffset = state.bitWidth === 64 ? 56 : state.bitWidth - 8;

  return (
    <div
      className="mx-3 mb-2 rounded-xl p-3"
      style={{ backgroundColor: '#1C1C1E' }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold" style={{ color: '#888' }}>
          BIT VIEWER — {state.bitWidth}-bit
        </span>
        <span className="text-xs" style={{ color: '#555', fontFamily: 'monospace' }}>
          0x{maskToBitWidth(rawValue, state.bitWidth).toString(16).toUpperCase().padStart(state.bitWidth / 4, '0')}
        </span>
      </div>

      <div className="flex flex-wrap gap-y-1.5 gap-x-2 justify-end">
        {groups.map((byte, gi) => {
          const byteIndex = state.bitWidth / 8 - 1 - gi;
          const highBit = byteOffset - gi * 8;

          return (
            <div key={gi} className="flex flex-col items-center gap-1">
              {/* bit index labels */}
              <div className="flex gap-0.5">
                {[7, 6, 5, 4, 3, 2, 1, 0].map((offset) => (
                  <span
                    key={offset}
                    className="text-center"
                    style={{
                      width: 18,
                      fontSize: '0.5rem',
                      color: '#444',
                      fontFamily: 'monospace',
                    }}
                  >
                    {highBit + offset}
                  </span>
                ))}
              </div>
              {/* bit boxes */}
              <div className="flex gap-0.5">
                {byte.map((bit, bi) => {
                  const bitIndex = byteIndex * 8 + (7 - bi);
                  const isOne = bit === '1';
                  return (
                    <button
                      key={bi}
                      onClick={() => dispatch({ type: 'TOGGLE_BIT', bitIndex })}
                      style={{
                        width: 18,
                        height: 22,
                        backgroundColor: isOne ? '#FF9F0A' : '#2C2C2E',
                        color: isOne ? '#000' : '#555',
                        borderRadius: 4,
                        fontSize: '0.7rem',
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'background-color 120ms ease',
                      }}
                    >
                      {bit}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
