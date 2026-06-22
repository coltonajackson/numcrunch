import { useState } from 'react';

export type ButtonVariant =
  | 'number'
  | 'operator'
  | 'operator-active'
  | 'function'
  | 'special'
  | 'accent'
  | 'danger'
  | 'dim';

interface CalcButtonProps {
  label: string;
  subLabel?: string;
  onClick: () => void;
  variant?: ButtonVariant;
  wide?: boolean;
  disabled?: boolean;
  className?: string;
  fontSize?: string;
}

const VARIANT_COLORS: Record<ButtonVariant, { bg: string; text: string; hover: string; active: string }> = {
  number:          { bg: '#333333', text: '#FFFFFF', hover: '#444444', active: '#555555' },
  operator:        { bg: '#FF9F0A', text: '#FFFFFF', hover: '#FFB340', active: '#FFC563' },
  'operator-active': { bg: '#FFFFFF', text: '#FF9F0A', hover: '#F0F0F0', active: '#E8E8E8' },
  function:        { bg: '#505050', text: '#FFFFFF', hover: '#626262', active: '#737373' },
  special:         { bg: '#A5A5A5', text: '#000000', hover: '#B8B8B8', active: '#C8C8C8' },
  accent:          { bg: '#1C2A1C', text: '#30D158', hover: '#223022', active: '#2A3A2A' },
  danger:          { bg: '#3A1C1C', text: '#FF453A', hover: '#4A2222', active: '#5A2828' },
  dim:             { bg: '#1A1A1A', text: '#4A4A4A', hover: '#1A1A1A', active: '#1A1A1A' },
};

export function CalcButton({
  label,
  subLabel,
  onClick,
  variant = 'number',
  wide = false,
  disabled = false,
  className = '',
  fontSize,
}: CalcButtonProps) {
  const [pressed, setPressed] = useState(false);
  const colors = VARIANT_COLORS[variant];

  const bg = pressed ? colors.active : colors.bg;

  return (
    <button
      onClick={disabled ? undefined : onClick}
      onPointerDown={disabled ? undefined : () => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      disabled={disabled}
      aria-label={label}
      style={{
        backgroundColor: bg,
        color: colors.text,
        fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        fontSize: fontSize ?? (label.length > 4 ? '0.85rem' : '1.35rem'),
        transform: pressed ? 'scale(0.94)' : 'scale(1)',
        transition: 'transform 80ms ease, background-color 80ms ease',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.35 : 1,
        gridColumn: wide ? 'span 2' : undefined,
      }}
      className={`
        flex flex-col items-center justify-center gap-0.5
        rounded-full select-none outline-none
        min-h-[68px] w-full
        font-medium
        ${className}
      `}
    >
      <span style={{ lineHeight: 1 }}>{label}</span>
      {subLabel && (
        <span style={{ fontSize: '0.6rem', opacity: 0.65, lineHeight: 1 }}>{subLabel}</span>
      )}
    </button>
  );
}
