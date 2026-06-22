import { useEffect, useRef, useState } from 'react';
import { useCalculator } from '../hooks/useCalculator';
import { Display } from './Display';
import { BasicPad } from './BasicPad';
import { ScientificPad } from './ScientificPad';
import { ProgrammerPad } from './ProgrammerPad';
import { HistoryPanel } from './HistoryPanel';
import { WorkspacePanel } from './WorkspacePanel';
import type { CalcMode, NotationMode } from '../types';

const MODE_LABELS: Record<CalcMode, string> = {
  basic: 'Basic',
  scientific: 'Scientific',
  programmer: 'Programmer',
};

const NOTATION_LABELS: Record<NotationMode, string> = {
  auto: 'Auto',
  fixed: 'Fixed',
  scientific: 'Scientific',
  engineering: 'Engineering',
};

export function Calculator() {
  const { state, dispatch, canUndo, canRedo } = useCalculator();
  const [isModeMenuOpen, setIsModeMenuOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
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

  useEffect(() => {
    function handleShortcut(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      const hasPrimaryModifier = (e.ctrlKey || e.metaKey) && !e.altKey;
      if (!hasPrimaryModifier) return;
      if (e.key.toLowerCase() === 'h') {
        e.preventDefault();
        setIsHistoryOpen((open) => !open);
      }
    }

    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
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
            <div className="flex items-center gap-2">
              <button
                onClick={() => dispatch({ type: 'UNDO' })}
                disabled={!canUndo}
                style={{
                  border: 'none',
                  backgroundColor: canUndo ? '#2C2C2E' : '#1A1A1A',
                  color: canUndo ? '#F2F2F7' : '#6A6A6A',
                  borderRadius: 8,
                  padding: '5px 7px',
                  cursor: canUndo ? 'pointer' : 'not-allowed',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  fontFamily: "'SF Pro Display', -apple-system, sans-serif",
                }}
                aria-label="Undo"
                title="Undo (Ctrl/Cmd+Z)"
              >
                ↶
              </button>
              <button
                onClick={() => dispatch({ type: 'REDO' })}
                disabled={!canRedo}
                style={{
                  border: 'none',
                  backgroundColor: canRedo ? '#2C2C2E' : '#1A1A1A',
                  color: canRedo ? '#F2F2F7' : '#6A6A6A',
                  borderRadius: 8,
                  padding: '5px 7px',
                  cursor: canRedo ? 'pointer' : 'not-allowed',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  fontFamily: "'SF Pro Display', -apple-system, sans-serif",
                }}
                aria-label="Redo"
                title="Redo (Ctrl/Cmd+Shift+Z or Ctrl/Cmd+Y)"
              >
                ↷
              </button>
              <button
                onClick={() => dispatch({ type: 'TOGGLE_WORKSPACE' })}
                style={{
                  border: 'none',
                  backgroundColor: state.workspace.isOpen ? '#64D2FF' : '#2C2C2E',
                  color: state.workspace.isOpen ? '#000' : '#F2F2F7',
                  borderRadius: 8,
                  padding: '5px 8px',
                  cursor: 'pointer',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  fontFamily: "'SF Pro Display', -apple-system, sans-serif",
                }}
                aria-expanded={state.workspace.isOpen}
                aria-label="Toggle workspace panel"
              >
                Workspace
              </button>
              <button
                onClick={() => setIsHistoryOpen((v) => !v)}
                style={{
                  border: 'none',
                  backgroundColor: isHistoryOpen ? '#30D158' : '#2C2C2E',
                  color: isHistoryOpen ? '#000' : '#F2F2F7',
                  borderRadius: 8,
                  padding: '5px 8px',
                  cursor: 'pointer',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  fontFamily: "'SF Pro Display', -apple-system, sans-serif",
                }}
                aria-expanded={isHistoryOpen}
                aria-label="Toggle history panel"
              >
                History ({state.history.length})
              </button>
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
                aria-label="Mode and formatting settings"
              >
                Settings ▾
              </button>
            </div>
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

              <div className="mt-2 pt-2" style={{ borderTop: '1px solid #2C2C2E' }}>
                <p
                  className="text-xs px-2 pb-1"
                  style={{ color: '#8E8E93', fontFamily: "'SF Pro Display', -apple-system, sans-serif" }}
                >
                  Result Formatting
                </p>
                <div className="flex items-center gap-2 px-1">
                  <label className="text-[11px]" style={{ color: '#A1A1A6' }}>
                    Digits
                  </label>
                  <input
                    type="range"
                    min={3}
                    max={15}
                    step={1}
                    value={state.formatSettings.significantDigits}
                    onChange={(e) => dispatch({ type: 'SET_FORMAT_SIGNIFICANT_DIGITS', digits: Number(e.target.value) })}
                    style={{ flex: 1 }}
                  />
                  <span className="text-xs w-5 text-right" style={{ color: '#E5E5EA' }}>
                    {state.formatSettings.significantDigits}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1 mt-2">
                  {(Object.keys(NOTATION_LABELS) as NotationMode[]).map((notation) => (
                    <button
                      key={notation}
                      onClick={() => dispatch({ type: 'SET_FORMAT_NOTATION', notation })}
                      style={{
                        border: 'none',
                        borderRadius: 8,
                        padding: '6px 0',
                        cursor: 'pointer',
                        backgroundColor: state.formatSettings.notation === notation ? '#64D2FF' : '#2C2C2E',
                        color: state.formatSettings.notation === notation ? '#000' : '#D1D1D6',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        fontFamily: "'SF Pro Display', -apple-system, sans-serif",
                      }}
                    >
                      {NOTATION_LABELS[notation]}
                    </button>
                  ))}
                </div>

                <div className="mt-2 pt-2" style={{ borderTop: '1px solid #2C2C2E' }}>
                  <p
                    className="text-xs px-2 pb-1"
                    style={{ color: '#8E8E93', fontFamily: "'SF Pro Display', -apple-system, sans-serif" }}
                  >
                    Keyboard Shortcuts
                  </p>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 px-2">
                    {[
                      ['Undo', 'Ctrl/Cmd + Z'],
                      ['Redo', 'Ctrl/Cmd + Shift + Z'],
                      ['Redo (alt)', 'Ctrl/Cmd + Y'],
                      ['Clear', 'Ctrl/Cmd + L'],
                      ['History', 'Ctrl/Cmd + H'],
                      ['Workspace', 'Ctrl/Cmd + J'],
                      ['Mode', 'Ctrl/Cmd + 1/2/3'],
                    ].map(([label, shortcut]) => (
                      <div key={label} className="flex justify-between gap-2 text-[11px]">
                        <span style={{ color: '#A1A1A6' }}>{label}</span>
                        <span style={{ color: '#D1D1D6', fontFamily: "'SF Mono', 'Fira Code', monospace" }}>{shortcut}</span>
                      </div>
                    ))}
                  </div>
                </div>
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

        {state.workspace.isOpen && <WorkspacePanel state={state} dispatch={dispatch} />}
        {isHistoryOpen && <HistoryPanel state={state} dispatch={dispatch} />}

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
          Keyboard supported · Esc = clear · Ctrl/Cmd+Z = undo
        </p>
      </div>
    </div>
  );
}
