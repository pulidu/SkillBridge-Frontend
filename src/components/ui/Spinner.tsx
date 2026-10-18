import { cn } from '@/lib/cn';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

const SIZES = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-10 w-10 border-4',
} as const;

export function Spinner({ size = 'md', className, label = 'Loading' }: SpinnerProps) {
  return (
    <span role="status" aria-live="polite" className="inline-flex items-center gap-2">
      <span
        aria-hidden="true"
        className={cn(
          'inline-block animate-spin rounded-full border-current border-t-transparent',
          SIZES[size],
          className,
        )}
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}

export interface PageLoaderProps {
  label?: string;
}

/** Full-height loader used while a route waits for its first query. */
export function PageLoader({ label = 'Loading' }: PageLoaderProps) {
  return (
    <div className="flex min-h-[40vh] w-full items-center justify-center text-brand-600">
      <Spinner size="lg" label={label} />
    </div>
  );
}
