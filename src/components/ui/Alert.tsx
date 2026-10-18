import { cn } from '@/lib/cn';

type Tone = 'info' | 'success' | 'warning' | 'error';

const TONES: Record<Tone, string> = {
  info: 'border-sky-200 bg-sky-50 text-sky-900',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
  error: 'border-rose-200 bg-rose-50 text-rose-900',
};

const ICONS: Record<Tone, string> = {
  info: 'i',
  success: '✓',
  warning: '!',
  error: '×',
};

export interface AlertProps {
  tone?: Tone;
  title?: string;
  children?: React.ReactNode;
  className?: string;
  onDismiss?: () => void;
}

export function Alert({ tone = 'info', title, children, className, onDismiss }: AlertProps) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn('flex items-start gap-3 rounded-lg border p-4 text-sm', TONES[tone], className)}
    >
      <span
        aria-hidden="true"
        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/70 text-xs font-bold"
      >
        {ICONS[tone]}
      </span>

      <div className="min-w-0 flex-1">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? <div className={cn(title && 'mt-1')}>{children}</div> : null}
      </div>

      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="shrink-0 rounded p-1 text-lg leading-none opacity-60 transition-opacity hover:opacity-100"
        >
          ×
        </button>
      ) : null}
    </div>
  );
}

/** Renders the `errors[]` array returned by the API validation middleware. */
export function FieldErrorList({
  errors,
  className,
}: {
  errors?: Array<{ field: string; message: string }>;
  className?: string;
}) {
  if (!errors?.length) return null;

  return (
    <Alert tone="error" title="Please fix the following" className={className}>
      <ul className="list-disc space-y-0.5 pl-4">
        {errors.map((item) => (
          <li key={`${item.field}-${item.message}`}>
            <span className="font-medium">{item.field}</span>: {item.message}
          </li>
        ))}
      </ul>
    </Alert>
  );
}
