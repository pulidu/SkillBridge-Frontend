import { cn } from '@/lib/cn';
import { formatPercent } from '@/lib/formatters';

export interface ProgressBarProps {
  value: number;
  label?: string;
  showValue?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export function ProgressBar({ value, label, showValue = true, size = 'md', className }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, Math.round(value || 0)));

  return (
    <div className={cn('w-full', className)}>
      {label || showValue ? (
        <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
          {label ? <span className="font-medium">{label}</span> : <span />}
          {showValue ? <span className="tabular-nums">{formatPercent(clamped)}</span> : null}
        </div>
      ) : null}

      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? 'Progress'}
        className={cn('w-full overflow-hidden rounded-full bg-slate-200', size === 'sm' ? 'h-1.5' : 'h-2.5')}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-300',
            clamped >= 100 ? 'bg-emerald-500' : 'bg-brand-600',
          )}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
