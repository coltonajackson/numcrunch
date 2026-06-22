import { useMemo, useState } from 'react';
import type { Action, CalcState, CalcMode, HistoryEntry } from '../types';

interface HistoryPanelProps {
  state: CalcState;
  dispatch: React.Dispatch<Action>;
}

const MODE_LABELS: Record<CalcMode, string> = {
  basic: 'Basic',
  scientific: 'Scientific',
  programmer: 'Programmer',
};

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function matchesSearch(entry: HistoryEntry, normalizedQuery: string): boolean {
  if (!normalizedQuery) return true;
  const haystack = [
    entry.expression,
    entry.resultDisplay,
    MODE_LABELS[entry.mode],
    entry.note,
    entry.createdAt,
  ].join(' ').toLowerCase();
  return haystack.includes(normalizedQuery);
}

export function HistoryPanel({ state, dispatch }: HistoryPanelProps) {
  const [query, setQuery] = useState('');

  const filteredHistory = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const visible = state.history.filter((entry) => matchesSearch(entry, normalized));
    return visible.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.createdAt.localeCompare(a.createdAt);
    });
  }, [query, state.history]);

  return (
    <div className="px-3 pb-2">
      <div
        className="rounded-xl p-2"
        style={{ backgroundColor: '#111', border: '1px solid #2C2C2E' }}
      >
        <div className="flex items-center gap-2 mb-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search history (expression, result, note)"
            spellCheck={false}
            style={{
              flex: 1,
              border: '1px solid #2C2C2E',
              borderRadius: 8,
              backgroundColor: '#000',
              color: '#E5E5EA',
              minHeight: 30,
              padding: '0 10px',
              fontSize: '0.75rem',
              outline: 'none',
            }}
          />
          <button
            onClick={() => dispatch({ type: 'CLEAR_HISTORY' })}
            disabled={state.history.length === 0}
            style={{
              border: 'none',
              borderRadius: 8,
              padding: '6px 8px',
              backgroundColor: state.history.length === 0 ? '#1A1A1A' : '#3A1C1C',
              color: state.history.length === 0 ? '#555' : '#FF453A',
              cursor: state.history.length === 0 ? 'not-allowed' : 'pointer',
              fontSize: '0.72rem',
              fontWeight: 700,
            }}
          >
            Clear
          </button>
        </div>

        <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
          {filteredHistory.length === 0 ? (
            <p className="text-xs text-center py-3" style={{ color: '#666' }}>
              {state.history.length === 0 ? 'No calculations yet.' : 'No history entries match your search.'}
            </p>
          ) : (
            filteredHistory.map((entry) => (
              <div
                key={entry.id}
                className="rounded-lg p-2"
                style={{ backgroundColor: '#1C1C1E' }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p
                      className="text-xs truncate"
                      style={{ color: '#8E8E93', fontFamily: 'var(--app-font-mono)' }}
                    >
                      {entry.expression}
                    </p>
                    <p
                      className="text-base truncate"
                      style={{ color: '#FFF', fontWeight: 500, fontFamily: 'var(--app-font-display)' }}
                    >
                      {entry.resultDisplay}
                    </p>
                    <p className="text-[11px]" style={{ color: '#777' }}>
                      {MODE_LABELS[entry.mode]} · {formatTimestamp(entry.createdAt)}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => dispatch({ type: 'TOGGLE_HISTORY_PIN', id: entry.id })}
                      style={{
                        border: 'none',
                        borderRadius: 6,
                        padding: '4px 7px',
                        cursor: 'pointer',
                        backgroundColor: entry.pinned ? '#2A2310' : '#2C2C2E',
                        color: entry.pinned ? '#FFD60A' : '#A1A1A6',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                      }}
                    >
                      {entry.pinned ? '★' : '☆'}
                    </button>
                    <button
                      onClick={() => dispatch({ type: 'RECALL_HISTORY_ENTRY', id: entry.id })}
                      style={{
                        border: 'none',
                        borderRadius: 6,
                        padding: '4px 7px',
                        cursor: 'pointer',
                        backgroundColor: '#2C2C2E',
                        color: '#E5E5EA',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                      }}
                    >
                      Use
                    </button>
                  </div>
                </div>
                <input
                  value={entry.note}
                  onChange={(e) => dispatch({ type: 'SET_HISTORY_NOTE', id: entry.id, note: e.target.value })}
                  placeholder="Add a note..."
                  spellCheck={false}
                  style={{
                    width: '100%',
                    marginTop: 6,
                    border: '1px solid #2C2C2E',
                    borderRadius: 6,
                    backgroundColor: '#111',
                    color: '#D1D1D6',
                    minHeight: 26,
                    padding: '0 8px',
                    fontSize: '0.7rem',
                    outline: 'none',
                  }}
                />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
