import type { CalcMode } from '../types';

interface ModeBarProps {
  mode: CalcMode;
  onSelect: (mode: CalcMode) => void;
}

const MODES: { id: CalcMode; label: string }[] = [
  { id: 'basic', label: 'Basic' },
  { id: 'scientific', label: 'Scientific' },
  { id: 'programmer', label: 'Programmer' },
];

export function ModeBar({ mode, onSelect }: ModeBarProps) {
  return (
    <div
      style={{ backgroundColor: '#1C1C1E' }}
      className="flex rounded-xl mx-3 mt-3 p-1 gap-1"
    >
      {MODES.map((m) => (
        <button
          key={m.id}
          onClick={() => onSelect(m.id)}
          style={{
            backgroundColor: mode === m.id ? '#3A3A3C' : 'transparent',
            color: mode === m.id ? '#FFFFFF' : '#888888',
            fontFamily: "'SF Pro Display', -apple-system, sans-serif",
            transition: 'background-color 200ms ease, color 200ms ease',
          }}
          className="flex-1 py-1.5 rounded-lg text-sm font-medium select-none"
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
