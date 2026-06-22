export type CalcMode = 'basic' | 'scientific' | 'programmer';
export type AngleMode = 'deg' | 'rad';
export type NumBase = 'hex' | 'dec' | 'oct' | 'bin';
export type BitWidth = 8 | 16 | 32 | 64;

export interface CalcState {
  displayValue: string;
  expression: string;
  pythonExpression: string;
  pythonInputEnabled: boolean;
  accumulator: number | null;
  pendingOp: string | null;
  lastOperand: number | null;
  lastOp: string | null;
  replaceOnInput: boolean;
  hasDecimal: boolean;
  memory: number;
  activeOp: string | null;
  mode: CalcMode;
  angleMode: AngleMode;
  isSecondFn: boolean;
  numBase: NumBase;
  bitWidth: BitWidth;
  isError: boolean;
}

export type Action =
  | { type: 'PRESS_DIGIT'; digit: string }
  | { type: 'PRESS_DECIMAL' }
  | { type: 'PRESS_OPERATOR'; op: string }
  | { type: 'PRESS_EQUALS' }
  | { type: 'PRESS_UNARY'; op: string }
  | { type: 'PRESS_CLEAR' }
  | { type: 'PRESS_BACKSPACE' }
  | { type: 'PRESS_MEMORY'; op: 'mc' | 'm+' | 'm-' | 'mr' }
  | { type: 'PRESS_CONSTANT'; value: number }
  | { type: 'TOGGLE_BIT'; bitIndex: number }
  | { type: 'SET_MODE'; mode: CalcMode }
  | { type: 'SET_BASE'; base: NumBase }
  | { type: 'SET_BIT_WIDTH'; width: BitWidth }
  | { type: 'TOGGLE_ANGLE_MODE' }
  | { type: 'TOGGLE_SECOND_FN' }
  | { type: 'TOGGLE_PYTHON_INPUT' }
  | { type: 'SET_PYTHON_EXPRESSION'; expression: string }
  | { type: 'EVALUATE_PYTHON_EXPRESSION' };
