import type { Action, CalcState, NumBase, BitWidth } from '../types';
import { CalcButton } from './CalcButton';
import { BitViewer } from './BitViewer';

interface ProgrammerPadProps {
  state: CalcState;
  dispatch: React.Dispatch<Action>;
}

export function ProgrammerPad({ state, dispatch }: ProgrammerPadProps) {
  const { numBase, bitWidth, activeOp, pythonInputEnabled, pythonExpression } = state;
  const isAC = state.displayValue === '0' || state.replaceOnInput || state.isError;

  const digit = (d: string) => dispatch({ type: 'PRESS_DIGIT', digit: d });
  const op    = (o: string) => dispatch({ type: 'PRESS_OPERATOR', op: o });

  // Per-digit availability
  const hexOk = numBase === 'hex';
  const midOk = numBase === 'hex' || numBase === 'dec';           // 8, 9
  const lowOk = numBase === 'hex' || numBase === 'dec' || numBase === 'oct'; // 2–7

  const bases: Array<{ id: NumBase; label: string }> = [
    { id: 'hex', label: 'HEX' },
    { id: 'dec', label: 'DEC' },
    { id: 'oct', label: 'OCT' },
    { id: 'bin', label: 'BIN' },
  ];
  const widths: BitWidth[] = [8, 16, 32, 64];
  const evaluatePython = () => dispatch({ type: 'EVALUATE_PYTHON_EXPRESSION' });

  return (
    <div>
      <BitViewer state={state} dispatch={dispatch} />

      {/* ── Base & bit-width selectors ─────────────────────────────── */}
      <div className="flex gap-2 px-3 mb-2">
        <div className="flex gap-1 flex-1 rounded-xl p-1" style={{ backgroundColor: '#1C1C1E' }}>
          {bases.map((b) => (
            <button
              key={b.id}
              onClick={() => dispatch({ type: 'SET_BASE', base: b.id })}
              style={{
                flex: 1, padding: '5px 0', borderRadius: 8,
                backgroundColor: numBase === b.id ? '#FF9F0A' : 'transparent',
                color: numBase === b.id ? '#000' : '#888',
                fontFamily: "'SF Pro Display', -apple-system, sans-serif",
                fontSize: '0.7rem', fontWeight: 700, border: 'none', cursor: 'pointer',
                transition: 'all 150ms ease',
              }}
            >
              {b.label}
            </button>
          ))}
        </div>

        <div className="flex gap-1 rounded-xl p-1" style={{ backgroundColor: '#1C1C1E' }}>
          {widths.map((w) => (
            <button
              key={w}
              onClick={() => dispatch({ type: 'SET_BIT_WIDTH', width: w })}
              style={{
                width: 38, padding: '5px 0', borderRadius: 8,
                backgroundColor: bitWidth === w ? '#30D158' : 'transparent',
                color: bitWidth === w ? '#000' : '#888',
                fontFamily: "'SF Pro Display', -apple-system, sans-serif",
                fontSize: '0.7rem', fontWeight: 700, border: 'none', cursor: 'pointer',
                transition: 'all 150ms ease',
              }}
            >
              {w}
            </button>
          ))}
        </div>
      </div>

      {/* Python expression input (programmer helper) */}
      <div className="flex gap-2 px-3 mb-2">
        <button
          onClick={() => dispatch({ type: 'TOGGLE_PYTHON_INPUT' })}
          style={{
            borderRadius: 10,
            border: 'none',
            padding: '0 10px',
            minHeight: 34,
            fontSize: '0.75rem',
            fontWeight: 700,
            letterSpacing: '0.04em',
            cursor: 'pointer',
            color: pythonInputEnabled ? '#000' : '#999',
            backgroundColor: pythonInputEnabled ? '#64D2FF' : '#1C1C1E',
          }}
        >
          PY
        </button>

        {pythonInputEnabled && (
          <>
            <input
              value={pythonExpression}
              onChange={(e) => dispatch({ type: 'SET_PYTHON_EXPRESSION', expression: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  evaluatePython();
                }
              }}
              placeholder="math.sin(math.pi / 2) + math.sqrt(9)"
              spellCheck={false}
              autoCorrect="off"
              autoCapitalize="off"
              style={{
                flex: 1,
                borderRadius: 10,
                border: '1px solid #2C2C2E',
                minHeight: 34,
                padding: '0 10px',
                fontSize: '0.78rem',
                fontFamily: "'SF Mono', 'Fira Code', monospace",
                color: '#EEE',
                backgroundColor: '#111',
                outline: 'none',
              }}
            />
            <button
              onClick={evaluatePython}
              style={{
                borderRadius: 10,
                border: 'none',
                minHeight: 34,
                padding: '0 10px',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer',
                color: '#000',
                backgroundColor: '#30D158',
              }}
            >
              RUN
            </button>
          </>
        )}
      </div>

      {/* ── 4-column button grid ───────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-2 px-3 pb-3">

        {/* Row 1 – Bitwise */}
        <CalcButton label="AND"  variant="function" onClick={() => op('AND')}  fontSize="0.78rem" />
        <CalcButton label="OR"   variant="function" onClick={() => op('OR')}   fontSize="0.78rem" />
        <CalcButton label="XOR"  variant="function" onClick={() => op('XOR')}  fontSize="0.78rem" />
        <CalcButton label="NOT"  variant="function"
          onClick={() => dispatch({ type: 'PRESS_UNARY', op: 'NOT' })}
          fontSize="0.78rem"
        />

        {/* Row 2 – Shift / misc */}
        <CalcButton label="NAND" variant="function" onClick={() => op('NAND')} fontSize="0.72rem" />
        <CalcButton label="NOR"  variant="function" onClick={() => op('NOR')}  fontSize="0.72rem" />
        <CalcButton label="LSH"  subLabel="<<" variant="function" onClick={() => op('LSH')} fontSize="0.72rem" />
        <CalcButton label="RSH"  subLabel=">>" variant="function" onClick={() => op('RSH')} fontSize="0.72rem" />

        {/* Row 3 – Utility */}
        <CalcButton label="2's" subLabel="neg" variant="function"
          onClick={() => dispatch({ type: 'PRESS_UNARY', op: '+/-' })}
          fontSize="0.72rem"
        />
        <CalcButton label="00"  variant="function" onClick={() => { digit('0'); digit('0'); }} />
        <CalcButton label="mod" variant="function" onClick={() => op('mod')} fontSize="0.82rem" />
        <CalcButton label="⌫"   variant="function"
          onClick={() => dispatch({ type: 'PRESS_BACKSPACE' })}
          fontSize="1.1rem"
        />

        {/* Row 4 – Hex A B C | AC */}
        <CalcButton label="A" variant={hexOk ? 'function' : 'dim'} disabled={!hexOk} onClick={() => digit('A')} />
        <CalcButton label="B" variant={hexOk ? 'function' : 'dim'} disabled={!hexOk} onClick={() => digit('B')} />
        <CalcButton label="C" variant={hexOk ? 'function' : 'dim'} disabled={!hexOk} onClick={() => digit('C')} />
        <CalcButton label={isAC ? 'AC' : 'C'} variant="special"
          onClick={() => dispatch({ type: 'PRESS_CLEAR' })}
        />

        {/* Row 5 – Hex D E F | ÷ */}
        <CalcButton label="D" variant={hexOk ? 'function' : 'dim'} disabled={!hexOk} onClick={() => digit('D')} />
        <CalcButton label="E" variant={hexOk ? 'function' : 'dim'} disabled={!hexOk} onClick={() => digit('E')} />
        <CalcButton label="F" variant={hexOk ? 'function' : 'dim'} disabled={!hexOk} onClick={() => digit('F')} />
        <CalcButton label="÷" variant={activeOp === '÷' ? 'operator-active' : 'operator'} onClick={() => op('÷')} />

        {/* Row 6 – 7 8 9 × */}
        <CalcButton label="7" variant={lowOk ? 'number' : 'dim'} disabled={!lowOk} onClick={() => digit('7')} />
        <CalcButton label="8" variant={midOk ? 'number' : 'dim'} disabled={!midOk} onClick={() => digit('8')} />
        <CalcButton label="9" variant={midOk ? 'number' : 'dim'} disabled={!midOk} onClick={() => digit('9')} />
        <CalcButton label="×" variant={activeOp === '×' ? 'operator-active' : 'operator'} onClick={() => op('×')} />

        {/* Row 7 – 4 5 6 − */}
        <CalcButton label="4" variant={lowOk ? 'number' : 'dim'} disabled={!lowOk} onClick={() => digit('4')} />
        <CalcButton label="5" variant={lowOk ? 'number' : 'dim'} disabled={!lowOk} onClick={() => digit('5')} />
        <CalcButton label="6" variant={lowOk ? 'number' : 'dim'} disabled={!lowOk} onClick={() => digit('6')} />
        <CalcButton label="−" variant={activeOp === '-' ? 'operator-active' : 'operator'} onClick={() => op('-')} />

        {/* Row 8 – 1 2 3 + */}
        <CalcButton label="1" onClick={() => digit('1')} />
        <CalcButton label="2" variant={lowOk ? 'number' : 'dim'} disabled={!lowOk} onClick={() => digit('2')} />
        <CalcButton label="3" variant={lowOk ? 'number' : 'dim'} disabled={!lowOk} onClick={() => digit('3')} />
        <CalcButton label="+" variant={activeOp === '+' ? 'operator-active' : 'operator'} onClick={() => op('+')} />

        {/* Row 9 – 0(wide) ± = */}
        <CalcButton label="0" wide onClick={() => digit('0')} />
        <CalcButton label="±" variant="special"
          onClick={() => dispatch({ type: 'PRESS_UNARY', op: '+/-' })}
        />
        <CalcButton
          label="="
          variant="operator"
          onClick={() => dispatch({ type: pythonInputEnabled ? 'EVALUATE_PYTHON_EXPRESSION' : 'PRESS_EQUALS' })}
        />

      </div>
    </div>
  );
}
