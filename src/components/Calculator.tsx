import { useEffect, useRef, useState } from 'react';
import { useCalculator } from '../hooks/useCalculator';
import { Display } from './Display';
import { BasicPad } from './BasicPad';
import { ScientificPad } from './ScientificPad';
import { ProgrammerPad } from './ProgrammerPad';
import { HistoryPanel } from './HistoryPanel';
import { WorkspacePanel } from './WorkspacePanel';
import {
  ACCENT_PRESET_LABELS,
  buildAppearanceCssVariables,
  FONT_PRESET_LABELS,
  THEME_PRESET_LABELS,
} from '../lib/appearance';
import type { AccentPreset, CalcMode, FontPreset, NotationMode, ThemePreset } from '../types';

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
  const appearanceVars = buildAppearanceCssVariables(
    state.appearance.theme,
    state.appearance.accent,
    state.appearance.font,
  ) as Record<`--${string}`, string>;

  return (
    <div
      className="flex items-center justify-center min-h-screen"
      style={{
        ...appearanceVars,
        backgroundColor: 'var(--app-bg)',
        color: 'var(--app-text)',
        fontFamily: 'var(--app-font-display)',
      }}
    >
      <div
        className="w-full rounded-3xl overflow-hidden shadow-2xl"
        style={{
          maxWidth,
          backgroundColor: 'var(--app-card-bg)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.9), 0 0 0 0.5px rgba(255,255,255,0.08)',
        }}
      >
        {/* Unified header with mode settings */}
        <div ref={settingsRef} className="relative px-3 pt-3 pb-1">
          <div
            className="flex items-center justify-between rounded-xl px-3 py-2"
            style={{ backgroundColor: 'var(--app-panel-bg)' }}
          >
            <span
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: 'var(--app-muted)', fontFamily: 'var(--app-font-display)' }}
            >
              Unified Calculator
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => dispatch({ type: 'UNDO' })}
                disabled={!canUndo}
                style={{
                  border: 'none',
                  backgroundColor: canUndo ? 'var(--app-panel-alt-bg)' : 'var(--app-dim-bg)',
                  color: canUndo ? 'var(--app-text)' : 'var(--app-dim-text)',
                  borderRadius: 8,
                  padding: '5px 7px',
                  cursor: canUndo ? 'pointer' : 'not-allowed',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  fontFamily: 'var(--app-font-display)',
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
                  backgroundColor: canRedo ? 'var(--app-panel-alt-bg)' : 'var(--app-dim-bg)',
                  color: canRedo ? 'var(--app-text)' : 'var(--app-dim-text)',
                  borderRadius: 8,
                  padding: '5px 7px',
                  cursor: canRedo ? 'pointer' : 'not-allowed',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  fontFamily: 'var(--app-font-display)',
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
                  backgroundColor: state.workspace.isOpen ? 'var(--app-operator-bg)' : 'var(--app-panel-alt-bg)',
                  color: state.workspace.isOpen ? 'var(--app-operator-text)' : 'var(--app-text)',
                  borderRadius: 8,
                  padding: '5px 8px',
                  cursor: 'pointer',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  fontFamily: 'var(--app-font-display)',
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
                  backgroundColor: isHistoryOpen ? 'var(--app-accent-text)' : 'var(--app-panel-alt-bg)',
                  color: isHistoryOpen ? 'var(--app-accent-bg)' : 'var(--app-text)',
                  borderRadius: 8,
                  padding: '5px 8px',
                  cursor: 'pointer',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  fontFamily: 'var(--app-font-display)',
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
                  backgroundColor: 'var(--app-panel-alt-bg)',
                  color: 'var(--app-text)',
                  borderRadius: 8,
                  padding: '5px 10px',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  fontFamily: 'var(--app-font-display)',
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
              style={{ backgroundColor: 'var(--app-panel-bg)', border: '1px solid var(--app-border)' }}
            >
              <p
                className="text-xs px-2 pb-1"
                style={{ color: 'var(--app-muted)', fontFamily: 'var(--app-font-display)' }}
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
                      backgroundColor: state.mode === mode ? 'var(--app-operator-bg)' : 'var(--app-panel-alt-bg)',
                      color: state.mode === mode ? 'var(--app-operator-text)' : 'var(--app-text)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      fontFamily: 'var(--app-font-display)',
                    }}
                  >
                    {MODE_LABELS[mode]}
                  </button>
                ))}
              </div>

              <div className="mt-2 pt-2" style={{ borderTop: '1px solid var(--app-border)' }}>
                <p
                  className="text-xs px-2 pb-1"
                  style={{ color: 'var(--app-muted)', fontFamily: 'var(--app-font-display)' }}
                >
                  Result Formatting
                </p>
                <div className="flex items-center gap-2 px-1">
                  <label className="text-[11px]" style={{ color: 'var(--app-muted)' }}>
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
                  <span className="text-xs w-5 text-right" style={{ color: 'var(--app-text)' }}>
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
                        backgroundColor: state.formatSettings.notation === notation ? 'var(--app-operator-bg)' : 'var(--app-panel-alt-bg)',
                        color: state.formatSettings.notation === notation ? 'var(--app-operator-text)' : 'var(--app-text)',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        fontFamily: 'var(--app-font-display)',
                      }}
                    >
                      {NOTATION_LABELS[notation]}
                    </button>
                  ))}
                </div>

                <div className="mt-2 pt-2" style={{ borderTop: '1px solid var(--app-border)' }}>
                  <p
                    className="text-xs px-2 pb-1"
                    style={{ color: 'var(--app-muted)', fontFamily: 'var(--app-font-display)' }}
                  >
                    Appearance
                  </p>
                  <div className="flex flex-wrap gap-1 px-1">
                    {(Object.keys(THEME_PRESET_LABELS) as ThemePreset[]).map((theme) => (
                      <button
                        key={theme}
                        onClick={() => dispatch({ type: 'SET_THEME_PRESET', theme })}
                        style={{
                          border: 'none',
                          borderRadius: 8,
                          padding: '4px 8px',
                          cursor: 'pointer',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          fontFamily: 'var(--app-font-display)',
                          backgroundColor: state.appearance.theme === theme ? 'var(--app-operator-bg)' : 'var(--app-panel-alt-bg)',
                          color: state.appearance.theme === theme ? 'var(--app-operator-text)' : 'var(--app-text)',
                        }}
                      >
                        {THEME_PRESET_LABELS[theme]}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1 px-1 mt-1.5">
                    {(Object.keys(ACCENT_PRESET_LABELS) as AccentPreset[]).map((accent) => (
                      <button
                        key={accent}
                        onClick={() => dispatch({ type: 'SET_ACCENT_PRESET', accent })}
                        style={{
                          border: state.appearance.accent === accent ? '2px solid var(--app-text)' : '1px solid var(--app-border)',
                          borderRadius: 999,
                          width: 20,
                          height: 20,
                          cursor: 'pointer',
                          backgroundColor: buildAppearanceCssVariables(state.appearance.theme, accent, state.appearance.font)['--app-operator-bg'],
                        }}
                        aria-label={ACCENT_PRESET_LABELS[accent]}
                        title={ACCENT_PRESET_LABELS[accent]}
                      />
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1 px-1 mt-1.5">
                    {(Object.keys(FONT_PRESET_LABELS) as FontPreset[]).map((font) => (
                      <button
                        key={font}
                        onClick={() => dispatch({ type: 'SET_FONT_PRESET', font })}
                        style={{
                          border: 'none',
                          borderRadius: 8,
                          padding: '4px 8px',
                          cursor: 'pointer',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          fontFamily: 'var(--app-font-display)',
                          backgroundColor: state.appearance.font === font ? 'var(--app-operator-bg)' : 'var(--app-panel-alt-bg)',
                          color: state.appearance.font === font ? 'var(--app-operator-text)' : 'var(--app-text)',
                        }}
                      >
                        {FONT_PRESET_LABELS[font]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-2 pt-2" style={{ borderTop: '1px solid var(--app-border)' }}>
                  <p
                    className="text-xs px-2 pb-1"
                    style={{ color: 'var(--app-muted)', fontFamily: 'var(--app-font-display)' }}
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
                        <span style={{ color: 'var(--app-muted)' }}>{label}</span>
                        <span style={{ color: 'var(--app-text)', fontFamily: 'var(--app-font-mono)' }}>{shortcut}</span>
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
              style={{ color: state.angleMode === 'rad' ? 'var(--app-operator-bg)' : 'var(--app-muted)' }}
            >
              {state.angleMode.toUpperCase()}
            </span>
            {state.memory !== 0 && (
              <span className="text-xs font-medium" style={{ color: 'var(--app-accent-text)' }}>
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
              color: 'var(--app-muted)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '2px 6px',
              fontSize: '1.1rem',
              fontFamily: 'var(--app-font-display)',
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
        <p className="text-center text-xs pb-2 pt-0" style={{ color: 'var(--app-muted)', fontFamily: 'var(--app-font-display)' }}>
          Keyboard supported · Esc = clear · Ctrl/Cmd+Z = undo
        </p>
      </div>
    </div>
  );
}
