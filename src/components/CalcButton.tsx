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
  number:            { bg: 'var(--app-number-bg)', text: 'var(--app-number-text)', hover: 'var(--app-number-bg)', active: 'var(--app-number-active)' },
  operator:          { bg: 'var(--app-operator-bg)', text: 'var(--app-operator-text)', hover: 'var(--app-operator-bg)', active: 'var(--app-operator-active)' },
  'operator-active': { bg: 'var(--app-operator-active-bg)', text: 'var(--app-operator-active-text)', hover: 'var(--app-operator-active-bg)', active: 'var(--app-operator-active-bg)' },
  function:          { bg: 'var(--app-function-bg)', text: 'var(--app-function-text)', hover: 'var(--app-function-bg)', active: 'var(--app-function-active)' },
  special:           { bg: 'var(--app-special-bg)', text: 'var(--app-special-text)', hover: 'var(--app-special-bg)', active: 'var(--app-special-active)' },
  accent:            { bg: 'var(--app-accent-bg)', text: 'var(--app-accent-text)', hover: 'var(--app-accent-bg)', active: 'var(--app-accent-active)' },
  danger:            { bg: 'var(--app-danger-bg)', text: 'var(--app-danger-text)', hover: 'var(--app-danger-bg)', active: 'var(--app-danger-active)' },
  dim:               { bg: 'var(--app-dim-bg)', text: 'var(--app-dim-text)', hover: 'var(--app-dim-bg)', active: 'var(--app-dim-active)' },
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
        fontFamily: 'var(--app-font-display)',
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
