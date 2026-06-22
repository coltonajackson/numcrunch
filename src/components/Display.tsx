import { useRef, useEffect, useState } from 'react';
import type { CalcState } from '../types';
import { formatInBase, parseFromBase } from '../lib/formatter';
import { getDisplayFontSize } from '../lib/formatter';

interface DisplayProps {
  state: CalcState;
}

function useAutoScale(displayValue: string) {
  const spanRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const span = spanRef.current;
    const container = containerRef.current;
    if (!span || !container) return;
    const ratio = container.clientWidth / span.scrollWidth;
    setScale(Math.min(1, ratio));
  }, [displayValue]);

  return { spanRef, containerRef, scale };
}

export function Display({ state }: DisplayProps) {
  const { spanRef, containerRef, scale } = useAutoScale(state.displayValue);
  const isProgrammer = state.mode === 'programmer';
  const expressionLine =
    isProgrammer && state.pythonInputEnabled
      ? (state.isError && state.expression ? state.expression : `py> ${state.pythonExpression}`)
      : state.expression;

  const rawValue = isProgrammer
    ? parseFromBase(state.displayValue, state.numBase)
    : parseFloat(state.displayValue) || 0;

  return (
    <div className="px-4 pt-3 pb-2 select-none" style={{ backgroundColor: '#000' }}>
      {/* Expression / history line */}
      <div
        className="text-right text-sm mb-1 min-h-[18px] overflow-hidden text-ellipsis whitespace-nowrap"
        style={{ color: '#888', fontFamily: "'SF Pro Display', -apple-system, sans-serif" }}
      >
        {expressionLine}
      </div>

      {isProgrammer ? (
        <ProgrammerDisplay state={state} rawValue={rawValue} />
      ) : (
        /* Standard large number display */
        <div
          ref={containerRef}
          className="flex justify-end items-end overflow-hidden"
          style={{ height: '5.5rem' }}
        >
          <span
            ref={spanRef}
            style={{
              fontSize: getDisplayFontSize(state.displayValue.length),
              color: state.isError ? '#FF453A' : '#FFFFFF',
              fontFamily: "'SF Pro Display', -apple-system, sans-serif",
              fontWeight: 300,
              lineHeight: 1,
              transformOrigin: 'right center',
              transform: `scaleX(${scale})`,
              display: 'inline-block',
              whiteSpace: 'nowrap',
            }}
          >
            {state.displayValue}
          </span>
        </div>
      )}
    </div>
  );
}

function ProgrammerDisplay({ state, rawValue }: { state: CalcState; rawValue: number }) {
  const bases: Array<{ id: 'hex' | 'dec' | 'oct' | 'bin'; label: string }> = [
    { id: 'hex', label: 'HEX' },
    { id: 'dec', label: 'DEC' },
    { id: 'oct', label: 'OCT' },
    { id: 'bin', label: 'BIN' },
  ];

  return (
    <div className="space-y-1.5 py-1">
      {bases.map(({ id, label }) => {
        const isActive = state.numBase === id;
        const val = formatInBase(rawValue, id, state.bitWidth);
        const displayVal = id === 'bin'
          ? val.replace(/(.{4})/g, '$1 ').trim()
          : val;

        return (
          <div key={id} className="flex items-center gap-3">
            <span
              className="text-xs font-bold w-8 shrink-0"
              style={{ color: isActive ? '#FF9F0A' : '#555' }}
            >
              {label}
            </span>
            <span
              className="flex-1 text-right overflow-hidden text-ellipsis whitespace-nowrap"
              style={{
                color: isActive ? '#FFFFFF' : '#555',
                fontFamily: "'SF Mono', 'Fira Code', monospace",
                fontSize: isActive ? '1.6rem' : '0.9rem',
                fontWeight: isActive ? 300 : 400,
                letterSpacing: '0.04em',
              }}
            >
              {displayVal || '0'}
            </span>
          </div>
        );
      })}
    </div>
  );
}
