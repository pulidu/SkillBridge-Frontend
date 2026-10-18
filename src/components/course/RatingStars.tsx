import { cn } from '@/lib/cn';
import type { LessonType } from '@/types';

const CONFIG: Record<LessonType, { label: string; className: string }> = {
  video: { label: 'Video', className: 'bg-sky-50 text-sky-700 ring-sky-200' },
  article: { label: 'Reading', className: 'bg-slate-100 text-slate-700 ring-slate-200' },
  quiz: { label: 'Quiz', className: 'bg-violet-50 text-violet-700 ring-violet-200' },
  assignment: { label: 'Assignment', className: 'bg-orange-50 text-orange-700 ring-orange-200' },
};

export function LessonTypeBadge({ type, className }: { type: LessonType; className?: string }) {
  const config = CONFIG[type] ?? CONFIG.article;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-wide ring-1 ring-inset',
        config.className,
        className,
      )}
    >
      {config.label}
    </span>
  );
}

export interface RatingStarsProps {
  value: number;
  count?: number;
  className?: string;
  interactive?: boolean;
  onChange?: (value: number) => void;
}

/** Read-only star display, or a 1-5 picker when `interactive` is set. */
export function RatingStars({ value, count, className, interactive = false, onChange }: RatingStarsProps) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = value >= star - 0.25;

          if (interactive) {
            return (
              <button
                key={star}
                type="button"
                onClick={() => onChange?.(star)}
                aria-label={`${star} star${star === 1 ? '' : 's'}`}
                className="p-0.5 transition-transform hover:scale-110"
              >
                <Star filled={filled} />
              </button>
            );
          }

          return (
            <span key={star} aria-hidden="true">
              <Star filled={filled} />
            </span>
          );
        })}
      </div>

      <span className="ml-1 text-xs text-slate-500">
        {value > 0 ? value.toFixed(1) : 'Not rated'}
        {count !== undefined ? ` (${count})` : ''}
      </span>
    </div>
  );
}

function Star({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={1.4}
      aria-hidden="true"
      className={filled ? 'h-4 w-4 text-amber-400' : 'h-4 w-4 text-slate-300'}
    >
      <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
    </svg>
  );
}
