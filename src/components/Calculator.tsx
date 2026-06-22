import { useCalculator } from '../hooks/useCalculator';
import { ModeBar } from './ModeBar';
import { Display } from './Display';
import { BasicPad } from './BasicPad';
import { ScientificPad } from './ScientificPad';
import { ProgrammerPad } from './ProgrammerPad';
import type { CalcMode } from '../types';

export function Calculator() {
  const { state, dispatch } = useCalculator();

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
        {/* Mode switcher */}
        <ModeBar
          mode={state.mode}
          onSelect={(m: CalcMode) => dispatch({ type: 'SET_MODE', mode: m })}
        />

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
