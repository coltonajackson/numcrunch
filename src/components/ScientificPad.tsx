import type { Action, CalcState } from '../types';
import { CalcButton } from './CalcButton';

interface ScientificPadProps {
  state: CalcState;
  dispatch: React.Dispatch<Action>;
}

export function ScientificPad({ state, dispatch }: ScientificPadProps) {
  const { isSecondFn, activeOp, angleMode } = state;
  const isAC = state.displayValue === '0' || state.replaceOnInput || state.isError;

  const op = (o: string) => dispatch({ type: 'PRESS_OPERATOR', op: o });
  const unary = (o: string) => dispatch({ type: 'PRESS_UNARY', op: o });
  const digit = (d: string) => dispatch({ type: 'PRESS_DIGIT', digit: d });

  // 2nd-fn button pairs: [normal, second]
  const trig = isSecondFn
    ? ['sin⁻¹', 'cos⁻¹', 'tan⁻¹']
    : ['sin', 'cos', 'tan'];
  const hyp = isSecondFn
    ? ['sinh⁻¹', 'cosh⁻¹', 'tanh⁻¹']
    : ['sinh', 'cosh', 'tanh'];

  return (
    <div
      className="grid gap-2 p-3"
      style={{ gridTemplateColumns: 'repeat(10, 1fr)' }}
    >
      {/* ── Row 1: 2nd, powers, clear row ─────────────────────────── */}
      <CalcButton
        label="2nd"
        variant={isSecondFn ? 'operator' : 'function'}
        onClick={() => dispatch({ type: 'TOGGLE_SECOND_FN' })}
        fontSize="0.85rem"
      />
      <CalcButton
        label={isSecondFn ? 'x³' : 'x²'}
        variant="function"
        onClick={() => unary(isSecondFn ? 'x³' : 'x²')}
        fontSize="0.85rem"
      />
      <CalcButton
        label={isSecondFn ? 'ʸ√x' : '√x'}
        variant="function"
        onClick={() => unary(isSecondFn ? '√x' : '√x')}
        fontSize="0.85rem"
      />
      <CalcButton
        label={isSecondFn ? 'yˣ' : 'xʸ'}
        variant="function"
        onClick={() => op('xʸ')}
        fontSize="0.85rem"
      />
      <CalcButton
        label={isSecondFn ? 'ln' : 'eˣ'}
        variant="function"
        onClick={() => unary(isSecondFn ? 'ln' : 'eˣ')}
        fontSize="0.85rem"
      />
      <CalcButton
        label={isSecondFn ? 'log₁₀' : '10ˣ'}
        variant="function"
        onClick={() => unary(isSecondFn ? 'log₁₀' : '10ˣ')}
        fontSize="0.85rem"
      />
      {/* standard row 1 */}
      <CalcButton label={isAC ? 'AC' : 'C'} variant="special" onClick={() => dispatch({ type: 'PRESS_CLEAR' })} />
      <CalcButton label="±" variant="special" onClick={() => unary('+/-')} />
      <CalcButton label="%" variant="special" onClick={() => unary('%')} />
      <CalcButton label="÷" variant={activeOp === '÷' ? 'operator-active' : 'operator'} onClick={() => op('÷')} />

      {/* ── Row 2: ( ) memory, 7 8 9 × ────────────────────────────── */}
      <CalcButton label="(" variant="function" onClick={() => {}} fontSize="1rem" />
      <CalcButton label=")" variant="function" onClick={() => {}} fontSize="1rem" />
      <CalcButton label="mc" variant="function" onClick={() => dispatch({ type: 'PRESS_MEMORY', op: 'mc' })} fontSize="0.8rem" />
      <CalcButton label="m+" variant="function" onClick={() => dispatch({ type: 'PRESS_MEMORY', op: 'm+' })} fontSize="0.8rem" />
      <CalcButton label="m−" variant="function" onClick={() => dispatch({ type: 'PRESS_MEMORY', op: 'm-' })} fontSize="0.8rem" />
      <CalcButton
        label="mr"
        variant={state.memory !== 0 ? 'accent' : 'function'}
        onClick={() => dispatch({ type: 'PRESS_MEMORY', op: 'mr' })}
        fontSize="0.8rem"
      />
      <CalcButton label="7" onClick={() => digit('7')} />
      <CalcButton label="8" onClick={() => digit('8')} />
      <CalcButton label="9" onClick={() => digit('9')} />
      <CalcButton label="×" variant={activeOp === '×' ? 'operator-active' : 'operator'} onClick={() => op('×')} />

      {/* ── Row 3: trig, e, EE, Rand, 4 5 6 − ─────────────────────── */}
      <CalcButton label={trig[0]} variant="function" onClick={() => unary(trig[0])} fontSize="0.8rem" />
      <CalcButton label={trig[1]} variant="function" onClick={() => unary(trig[1])} fontSize="0.8rem" />
      <CalcButton label={trig[2]} variant="function" onClick={() => unary(trig[2])} fontSize="0.8rem" />
      <CalcButton
        label="e"
        variant="function"
        onClick={() => dispatch({ type: 'PRESS_CONSTANT', value: Math.E })}
        fontSize="1rem"
      />
      <CalcButton
        label="EE"
        variant="function"
        onClick={() => op('EE')}
        fontSize="0.85rem"
      />
      <CalcButton
        label="Rand"
        variant="function"
        onClick={() => dispatch({ type: 'PRESS_CONSTANT', value: Math.random() })}
        fontSize="0.75rem"
      />
      <CalcButton label="4" onClick={() => digit('4')} />
      <CalcButton label="5" onClick={() => digit('5')} />
      <CalcButton label="6" onClick={() => digit('6')} />
      <CalcButton label="−" variant={activeOp === '-' ? 'operator-active' : 'operator'} onClick={() => op('-')} />

      {/* ── Row 4: hyp, π, ln, log, 1 2 3 + ───────────────────────── */}
      <CalcButton label={hyp[0]} variant="function" onClick={() => unary(hyp[0])} fontSize="0.75rem" />
      <CalcButton label={hyp[1]} variant="function" onClick={() => unary(hyp[1])} fontSize="0.75rem" />
      <CalcButton label={hyp[2]} variant="function" onClick={() => unary(hyp[2])} fontSize="0.75rem" />
      <CalcButton
        label="π"
        variant="function"
        onClick={() => dispatch({ type: 'PRESS_CONSTANT', value: Math.PI })}
        fontSize="1.2rem"
      />
      <CalcButton label="ln" variant="function" onClick={() => unary('ln')} fontSize="0.9rem" />
      <CalcButton label="log₁₀" variant="function" onClick={() => unary('log₁₀')} fontSize="0.75rem" />
      <CalcButton label="1" onClick={() => digit('1')} />
      <CalcButton label="2" onClick={() => digit('2')} />
      <CalcButton label="3" onClick={() => digit('3')} />
      <CalcButton label="+" variant={activeOp === '+' ? 'operator-active' : 'operator'} onClick={() => op('+')} />

      {/* ── Row 5: x! 1/x ∛x log₂ deg/rad 0 . = ──────────────────── */}
      <CalcButton label="x!" variant="function" onClick={() => unary('x!')} fontSize="0.9rem" />
      <CalcButton label="1/x" variant="function" onClick={() => unary('1/x')} fontSize="0.85rem" />
      <CalcButton label="∛x" variant="function" onClick={() => unary('∛x')} fontSize="0.9rem" />
      <CalcButton label="log₂" variant="function" onClick={() => unary('log₂')} fontSize="0.8rem" />
      <CalcButton
        label={angleMode === 'deg' ? 'DEG' : 'RAD'}
        variant={angleMode === 'rad' ? 'accent' : 'function'}
        onClick={() => dispatch({ type: 'TOGGLE_ANGLE_MODE' })}
        fontSize="0.8rem"
      />
      <CalcButton
        label="2ˣ"
        variant="function"
        onClick={() => unary('2ˣ')}
        fontSize="0.85rem"
      />
      <CalcButton label="0" wide onClick={() => digit('0')} />
      <CalcButton label="." onClick={() => dispatch({ type: 'PRESS_DECIMAL' })} />
      <CalcButton label="=" variant="operator" onClick={() => dispatch({ type: 'PRESS_EQUALS' })} />
    </div>
  );
}
