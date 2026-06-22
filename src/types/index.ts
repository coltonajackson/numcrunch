export type CalcMode = 'basic' | 'scientific' | 'programmer';
export type AngleMode = 'deg' | 'rad';
export type NumBase = 'hex' | 'dec' | 'oct' | 'bin';
export type BitWidth = 8 | 16 | 32 | 64;
export type NotationMode = 'auto' | 'fixed' | 'scientific' | 'engineering';
export type WorkspaceTemplate = 'tip-total' | 'percent-change' | 'compound-interest';

export interface FormatSettings {
  significantDigits: number;
  notation: NotationMode;
}

export interface HistoryEntry {
  id: string;
  expression: string;
  resultValue: number;
  resultDisplay: string;
  mode: CalcMode;
  createdAt: string;
  pinned: boolean;
  note: string;
}

export interface WorkspaceVariable {
  id: string;
  name: string;
  value: number;
  sourceLineId: string | null;
  updatedAt: string;
}

export interface WorkspaceLine {
  id: string;
  expression: string;
  resultValue: number | null;
  resultDisplay: string;
  variableName: string;
  note: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceDocument {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  isOpen: boolean;
  lines: WorkspaceLine[];
  variables: WorkspaceVariable[];
}

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
  formatSettings: FormatSettings;
  history: HistoryEntry[];
  workspace: WorkspaceDocument;
  isError: boolean;
}

export type Action =
  | { type: 'UNDO' }
  | { type: 'REDO' }
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
  | { type: 'SET_FORMAT_SIGNIFICANT_DIGITS'; digits: number }
  | { type: 'SET_FORMAT_NOTATION'; notation: NotationMode }
  | { type: 'TOGGLE_HISTORY_PIN'; id: string }
  | { type: 'SET_HISTORY_NOTE'; id: string; note: string }
  | { type: 'CLEAR_HISTORY' }
  | { type: 'RECALL_HISTORY_ENTRY'; id: string }
  | { type: 'TOGGLE_WORKSPACE' }
  | { type: 'SET_WORKSPACE_TITLE'; title: string }
  | { type: 'ADD_WORKSPACE_LINE' }
  | { type: 'REMOVE_WORKSPACE_LINE'; lineId: string }
  | { type: 'UPDATE_WORKSPACE_LINE_EXPRESSION'; lineId: string; expression: string }
  | { type: 'UPDATE_WORKSPACE_LINE_NOTE'; lineId: string; note: string }
  | { type: 'UPDATE_WORKSPACE_LINE_VARIABLE_NAME'; lineId: string; variableName: string }
  | { type: 'EVALUATE_WORKSPACE_LINE'; lineId: string }
  | { type: 'ASSIGN_WORKSPACE_VARIABLE_FROM_LINE'; lineId: string }
  | { type: 'SET_WORKSPACE_VARIABLE_VALUE'; variableId: string; value: number }
  | { type: 'REMOVE_WORKSPACE_VARIABLE'; variableId: string }
  | { type: 'APPLY_WORKSPACE_TEMPLATE'; template: WorkspaceTemplate }
  | { type: 'TOGGLE_ANGLE_MODE' }
  | { type: 'TOGGLE_SECOND_FN' }
  | { type: 'TOGGLE_PYTHON_INPUT' }
  | { type: 'SET_PYTHON_EXPRESSION'; expression: string }
  | { type: 'EVALUATE_PYTHON_EXPRESSION' };
