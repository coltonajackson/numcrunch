import type { Action, CalcState, WorkspaceTemplate } from '../types';
import { WorkspaceDependencySidebar } from './WorkspaceDependencySidebar';

interface WorkspacePanelProps {
  state: CalcState;
  dispatch: React.Dispatch<Action>;
}

const TEMPLATE_LABELS: Record<WorkspaceTemplate, string> = {
  'tip-total': 'Tip/Total',
  'percent-change': 'Percent Change',
  'compound-interest': 'Compound Interest',
};

export function WorkspacePanel({ state, dispatch }: WorkspacePanelProps) {
  const { workspace } = state;

  return (
    <div className="px-3 pb-2">
      <div
        className="rounded-xl p-2 space-y-2"
        style={{ backgroundColor: '#111', border: '1px solid #2C2C2E' }}
      >
        <div className="flex items-center gap-2">
          <input
            value={workspace.title}
            onChange={(e) => dispatch({ type: 'SET_WORKSPACE_TITLE', title: e.target.value })}
            placeholder="Workspace title"
            spellCheck={false}
            style={{
              flex: 1,
              border: '1px solid #2C2C2E',
              borderRadius: 8,
              backgroundColor: '#000',
              color: '#E5E5EA',
              minHeight: 30,
              padding: '0 10px',
              fontSize: '0.8rem',
              outline: 'none',
            }}
          />
          <button
            onClick={() => dispatch({ type: 'ADD_WORKSPACE_LINE' })}
            style={{
              border: 'none',
              borderRadius: 8,
              padding: '6px 9px',
              backgroundColor: '#2C2C2E',
              color: '#F2F2F7',
              cursor: 'pointer',
              fontSize: '0.72rem',
              fontWeight: 700,
            }}
          >
            + Line
          </button>
        </div>

        <div className="flex items-center gap-1 flex-wrap">
          {(Object.keys(TEMPLATE_LABELS) as WorkspaceTemplate[]).map((template) => (
            <button
              key={template}
              onClick={() => dispatch({ type: 'APPLY_WORKSPACE_TEMPLATE', template })}
              style={{
                border: 'none',
                borderRadius: 8,
                padding: '5px 8px',
                backgroundColor: '#1C1C1E',
                color: '#D1D1D6',
                cursor: 'pointer',
                fontSize: '0.7rem',
                fontWeight: 700,
              }}
            >
              {TEMPLATE_LABELS[template]}
            </button>
          ))}
          <button
            onClick={() => dispatch({ type: 'EVALUATE_ALL_WORKSPACE_LINES' })}
            style={{
              border: 'none',
              borderRadius: 8,
              padding: '5px 8px',
              backgroundColor: '#30D158',
              color: '#000',
              cursor: 'pointer',
              fontSize: '0.7rem',
              fontWeight: 700,
            }}
          >
            Evaluate All
          </button>
        </div>

        <div className="grid gap-2 xl:grid-cols-[minmax(0,1fr)_280px]">
          <div>
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {workspace.lines.map((line, index) => (
                <div key={line.id} className="rounded-lg p-2" style={{ backgroundColor: '#1C1C1E' }}>
                  <div className="flex items-center gap-2">
                    <span className="text-xs w-5 shrink-0 text-center" style={{ color: '#777' }}>
                      {index + 1}
                    </span>
                    <input
                      value={line.expression}
                      onChange={(e) => dispatch({
                        type: 'UPDATE_WORKSPACE_LINE_EXPRESSION',
                        lineId: line.id,
                        expression: e.target.value,
                      })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          dispatch({ type: 'EVALUATE_WORKSPACE_LINE', lineId: line.id });
                        }
                      }}
                      placeholder="Expression (supports variables and ans)"
                      spellCheck={false}
                      style={{
                        flex: 1,
                        border: '1px solid #2C2C2E',
                        borderRadius: 8,
                        backgroundColor: '#111',
                        color: '#E5E5EA',
                        minHeight: 30,
                        padding: '0 10px',
                        fontSize: '0.78rem',
                        fontFamily: "'SF Mono', 'Fira Code', monospace",
                        outline: 'none',
                      }}
                    />
                    <button
                      onClick={() => dispatch({ type: 'EVALUATE_WORKSPACE_LINE', lineId: line.id })}
                      style={{
                        border: 'none',
                        borderRadius: 8,
                        padding: '6px 8px',
                        backgroundColor: '#2C2C2E',
                        color: '#F2F2F7',
                        cursor: 'pointer',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                      }}
                    >
                      Eval
                    </button>
                    <button
                      onClick={() => dispatch({ type: 'REMOVE_WORKSPACE_LINE', lineId: line.id })}
                      disabled={workspace.lines.length <= 1}
                      style={{
                        border: 'none',
                        borderRadius: 8,
                        padding: '6px 7px',
                        backgroundColor: workspace.lines.length <= 1 ? '#1A1A1A' : '#3A1C1C',
                        color: workspace.lines.length <= 1 ? '#555' : '#FF453A',
                        cursor: workspace.lines.length <= 1 ? 'not-allowed' : 'pointer',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                      }}
                    >
                      Del
                    </button>
                  </div>

                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] w-10" style={{ color: '#8E8E93' }}>Result</span>
                    <span
                      className="text-sm truncate flex-1"
                      style={{ color: line.resultDisplay ? '#FFF' : '#6E6E73', fontFamily: "'SF Mono', 'Fira Code', monospace" }}
                    >
                      {line.resultDisplay || '—'}
                    </span>
                  </div>
                  {line.error && (
                    <p className="text-[11px] mt-1" style={{ color: '#FF453A' }}>
                      {line.error}
                    </p>
                  )}
                  {line.dependencies.length > 0 && (
                    <p className="text-[11px] mt-1 truncate" style={{ color: '#7D7D82' }}>
                      deps: {line.dependencies.join(', ')}
                    </p>
                  )}

                  <div className="flex items-center gap-2 mt-1">
                    <input
                      value={line.variableName}
                      onChange={(e) => dispatch({
                        type: 'UPDATE_WORKSPACE_LINE_VARIABLE_NAME',
                        lineId: line.id,
                        variableName: e.target.value,
                      })}
                      placeholder="var_name"
                      spellCheck={false}
                      style={{
                        width: 120,
                        border: '1px solid #2C2C2E',
                        borderRadius: 6,
                        backgroundColor: '#111',
                        color: '#D1D1D6',
                        minHeight: 26,
                        padding: '0 8px',
                        fontSize: '0.7rem',
                        outline: 'none',
                        fontFamily: "'SF Mono', 'Fira Code', monospace",
                      }}
                    />
                    <button
                      onClick={() => dispatch({ type: 'ASSIGN_WORKSPACE_VARIABLE_FROM_LINE', lineId: line.id })}
                      style={{
                        border: 'none',
                        borderRadius: 6,
                        padding: '4px 7px',
                        backgroundColor: '#2C2C2E',
                        color: '#E5E5EA',
                        cursor: 'pointer',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                      }}
                    >
                      Save var
                    </button>
                    <input
                      value={line.note}
                      onChange={(e) => dispatch({ type: 'UPDATE_WORKSPACE_LINE_NOTE', lineId: line.id, note: e.target.value })}
                      placeholder="Note"
                      spellCheck={false}
                      style={{
                        flex: 1,
                        border: '1px solid #2C2C2E',
                        borderRadius: 6,
                        backgroundColor: '#111',
                        color: '#AFAFB4',
                        minHeight: 26,
                        padding: '0 8px',
                        fontSize: '0.7rem',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2" style={{ borderTop: '1px solid #2C2C2E' }}>
              <p className="text-xs mb-1" style={{ color: '#8E8E93' }}>
                Variables
              </p>
              {workspace.variables.length === 0 ? (
                <p className="text-[11px]" style={{ color: '#666' }}>
                  No variables yet. Set a line variable name then press “Save var”.
                </p>
              ) : (
                <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                  {workspace.variables.map((variable) => (
                    <div key={variable.id} className="flex items-center gap-2">
                      <span
                        className="text-[11px] w-24 truncate"
                        style={{ color: '#D1D1D6', fontFamily: "'SF Mono', 'Fira Code', monospace" }}
                      >
                        {variable.name}
                      </span>
                      <input
                        type="number"
                        value={variable.value}
                        onChange={(e) => {
                          const nextValue = Number.parseFloat(e.target.value);
                          if (Number.isNaN(nextValue)) return;
                          dispatch({ type: 'SET_WORKSPACE_VARIABLE_VALUE', variableId: variable.id, value: nextValue });
                        }}
                        style={{
                          flex: 1,
                          border: '1px solid #2C2C2E',
                          borderRadius: 6,
                          backgroundColor: '#111',
                          color: '#E5E5EA',
                          minHeight: 24,
                          padding: '0 6px',
                          fontSize: '0.68rem',
                          outline: 'none',
                          fontFamily: "'SF Mono', 'Fira Code', monospace",
                        }}
                      />
                      <button
                        onClick={() => dispatch({ type: 'REMOVE_WORKSPACE_VARIABLE', variableId: variable.id })}
                        style={{
                          border: 'none',
                          borderRadius: 6,
                          padding: '4px 6px',
                          backgroundColor: '#3A1C1C',
                          color: '#FF453A',
                          cursor: 'pointer',
                          fontSize: '0.66rem',
                          fontWeight: 700,
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-[11px] mt-2" style={{ color: '#666' }}>
                Use variables directly in expressions (e.g. <span style={{ color: '#888' }}>subtotal + tax</span>). The token{' '}
                <span style={{ color: '#888' }}>ans</span> references the last evaluated value.
              </p>
            </div>
          </div>

          <WorkspaceDependencySidebar workspace={workspace} />
        </div>
      </div>
    </div>
  );
}
