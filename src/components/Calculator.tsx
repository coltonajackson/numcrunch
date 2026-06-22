import { useEffect, useRef, useState } from 'react';
import { useCalculator } from '../hooks/useCalculator';
import { Display } from './Display';
import { BasicPad } from './BasicPad';
import { ScientificPad } from './ScientificPad';
import { ProgrammerPad } from './ProgrammerPad';
import type { CalcMode } from '../types';

const MODE_LABELS: Record<CalcMode, string> = {
  basic: 'Basic',
  scientific: 'Scientific',
  programmer: 'Programmer',
};

export function Calculator() {
  const { state, dispatch } = useCalculator();
  const [isModeMenuOpen, setIsModeMenuOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      if (!settingsRef.current?.contains(e.target as Node)) {
        setIsModeMenuOpen(false);
      }
    }
    window.addEventListener('pointerdown', handlePointerDown);
    return () => window.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  const maxWidth =
    state.mode === 'scientific' ? 760
    : state.mode === 'programmer' ? 520
    : 340;

  return (
    <div
      className="flex items-center justify-center min-h-screen"
      style={{ backgroundColor: '#000' }}
    >
      <div
        className="w-full rounded-3xl overflow-hidden shadow-2xl"
        style={{
          maxWidth,
          backgroundColor: '#000',
          boxShadow: '0 32px 80px rgba(0,0,0,0.9), 0 0 0 0.5px rgba(255,255,255,0.08)',
        }}
      >
        {/* Unified header with mode settings */}
        <div ref={settingsRef} className="relative px-3 pt-3 pb-1">
          <div
            className="flex items-center justify-between rounded-xl px-3 py-2"
            style={{ backgroundColor: '#1C1C1E' }}
          >
            <span
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: '#8E8E93', fontFamily: "'SF Pro Display', -apple-system, sans-serif" }}
            >
              Unified Calculator
            </span>
            <button
              onClick={() => setIsModeMenuOpen((v) => !v)}
              style={{
                border: 'none',
                backgroundColor: '#2C2C2E',
                color: '#F2F2F7',
                borderRadius: 8,
                padding: '5px 10px',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: 600,
                fontFamily: "'SF Pro Display', -apple-system, sans-serif",
              }}
              aria-expanded={isModeMenuOpen}
              aria-haspopup="menu"
              aria-label="Mode settings"
            >
              Mode: {MODE_LABELS[state.mode]} ▾
            </button>
          </div>

          {isModeMenuOpen && (
            <div
              className="absolute right-3 left-3 mt-2 rounded-xl p-2 shadow-xl z-20"
              style={{ backgroundColor: '#1C1C1E', border: '1px solid #2C2C2E' }}
            >
              <p
                className="text-xs px-2 pb-1"
                style={{ color: '#8E8E93', fontFamily: "'SF Pro Display', -apple-system, sans-serif" }}
              >
                Mode Settings
              </p>
              <div className="flex gap-1">
                {(Object.keys(MODE_LABELS) as CalcMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => {
                      dispatch({ type: 'SET_MODE', mode });
                      setIsModeMenuOpen(false);
                    }}
                    style={{
                      flex: 1,
                      border: 'none',
                      cursor: 'pointer',
                      borderRadius: 8,
                      padding: '7px 0',
                      backgroundColor: state.mode === mode ? '#FF9F0A' : '#2C2C2E',
                      color: state.mode === mode ? '#000' : '#D1D1D6',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      fontFamily: "'SF Pro Display', -apple-system, sans-serif",
                    }}
                  >
                    {MODE_LABELS[mode]}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Angle mode / memory indicator strip */}
        {state.mode === 'scientific' && (
          <div className="flex justify-between px-4 pt-1 pb-0">
            <span
              className="text-xs font-medium"
              style={{ color: state.angleMode === 'rad' ? '#FF9F0A' : '#555' }}
            >
              {state.angleMode.toUpperCase()}
            </span>
            {state.memory !== 0 && (
              <span className="text-xs font-medium" style={{ color: '#30D158' }}>
                M
              </span>
            )}
          </div>
        )}

        {/* Display */}
        <Display state={state} />

        {/* Backspace button row (above pad) */}
        <div className="flex justify-end px-3 pb-1">
          <button
            onClick={() => dispatch({ type: 'PRESS_BACKSPACE' })}
            style={{
              color: '#888',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '2px 6px',
              fontSize: '1.1rem',
            }}
            title="Backspace (⌫)"
          >
            ⌫
          </button>
        </div>

        {/* Pad */}
        {state.mode === 'basic' && <BasicPad state={state} dispatch={dispatch} />}
        {state.mode === 'scientific' && <ScientificPad state={state} dispatch={dispatch} />}
        {state.mode === 'programmer' && <ProgrammerPad state={state} dispatch={dispatch} />}

        {/* Keyboard hint */}
        <p className="text-center text-xs pb-2 pt-0" style={{ color: '#2C2C2E' }}>
          Keyboard supported · esc = clear
        </p>
      </div>
    </div>
  );
}
