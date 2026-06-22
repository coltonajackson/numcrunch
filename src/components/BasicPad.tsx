import type { Action, CalcState } from '../types';
import { CalcButton } from './CalcButton';

interface BasicPadProps {
  state: CalcState;
  dispatch: React.Dispatch<Action>;
}

export function BasicPad({ state, dispatch }: BasicPadProps) {
  const isAC = state.displayValue === '0' || state.replaceOnInput || state.isError;
  const op = (o: string) => dispatch({ type: 'PRESS_OPERATOR', op: o });

  return (
    <div className="grid grid-cols-4 gap-3 p-3">
      {/* Row 1 */}
      <CalcButton
        label={isAC ? 'AC' : 'C'}
        variant="special"
        onClick={() => dispatch({ type: 'PRESS_CLEAR' })}
      />
      <CalcButton
        label="±"
        variant="special"
        onClick={() => dispatch({ type: 'PRESS_UNARY', op: '+/-' })}
      />
      <CalcButton
        label="%"
        variant="special"
        onClick={() => dispatch({ type: 'PRESS_UNARY', op: '%' })}
      />
      <CalcButton
        label="÷"
        variant={state.activeOp === '÷' ? 'operator-active' : 'operator'}
        onClick={() => op('÷')}
      />

      {/* Row 2 */}
      <CalcButton label="7" onClick={() => dispatch({ type: 'PRESS_DIGIT', digit: '7' })} />
      <CalcButton label="8" onClick={() => dispatch({ type: 'PRESS_DIGIT', digit: '8' })} />
      <CalcButton label="9" onClick={() => dispatch({ type: 'PRESS_DIGIT', digit: '9' })} />
      <CalcButton
        label="×"
        variant={state.activeOp === '×' ? 'operator-active' : 'operator'}
        onClick={() => op('×')}
      />

      {/* Row 3 */}
      <CalcButton label="4" onClick={() => dispatch({ type: 'PRESS_DIGIT', digit: '4' })} />
      <CalcButton label="5" onClick={() => dispatch({ type: 'PRESS_DIGIT', digit: '5' })} />
      <CalcButton label="6" onClick={() => dispatch({ type: 'PRESS_DIGIT', digit: '6' })} />
      <CalcButton
        label="−"
        variant={state.activeOp === '-' ? 'operator-active' : 'operator'}
        onClick={() => op('-')}
      />

      {/* Row 4 */}
      <CalcButton label="1" onClick={() => dispatch({ type: 'PRESS_DIGIT', digit: '1' })} />
      <CalcButton label="2" onClick={() => dispatch({ type: 'PRESS_DIGIT', digit: '2' })} />
      <CalcButton label="3" onClick={() => dispatch({ type: 'PRESS_DIGIT', digit: '3' })} />
      <CalcButton
        label="+"
        variant={state.activeOp === '+' ? 'operator-active' : 'operator'}
        onClick={() => op('+')}
      />

      {/* Row 5 */}
      <CalcButton
        label="0"
        wide
        onClick={() => dispatch({ type: 'PRESS_DIGIT', digit: '0' })}
      />
      <CalcButton label="." onClick={() => dispatch({ type: 'PRESS_DECIMAL' })} />
      <CalcButton label="=" variant="operator" onClick={() => dispatch({ type: 'PRESS_EQUALS' })} />
    </div>
  );
}
