import { cn } from '@/lib/cn';
import type { PaginationMeta } from '@/types';

export interface PaginationProps {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
  className?: string;
}

/** Builds a compact page list with ellipses, e.g. 1 … 4 5 6 … 12. */
const pageWindow = (current: number, total: number): Array<number | 'gap'> => {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);

  const pages = new Set<number>([1, total, current, current - 1, current + 1]);
  const sorted = [...pages].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b);

  const output: Array<number | 'gap'> = [];
  sorted.forEach((page, index) => {
    if (index > 0 && page - (sorted[index - 1] as number) > 1) output.push('gap');
    output.push(page);
  });

  return output;
};

export function Pagination({ meta, onPageChange, className }: PaginationProps) {
  const { page, totalPages, total } = meta;

  if (totalPages <= 1) {
    return total > 0 ? (
      <p className={cn('px-1 py-3 text-xs text-slate-500', className)}>
        Showing all {total} result{total === 1 ? '' : 's'}
      </p>
    ) : null;
  }

  return (
    <nav
      aria-label="Pagination"
      className={cn('flex flex-wrap items-center justify-between gap-3 py-4', className)}
    >
      <p className="text-xs text-slate-500">
        Page {page} of {totalPages} · {total} result{total === 1 ? '' : 's'}
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={!meta.hasPrev}
          aria-label="Previous page"
          className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          ‹
        </button>

        {pageWindow(page, totalPages).map((entry, index) =>
          entry === 'gap' ? (
            <span key={`gap-${index}`} className="px-1.5 text-sm text-slate-400">
              …
            </span>
          ) : (
            <button
              key={entry}
              type="button"
              onClick={() => onPageChange(entry)}
              aria-current={entry === page ? 'page' : undefined}
              className={cn(
                'min-w-[2.25rem] rounded-md border px-2.5 py-1.5 text-sm transition-colors',
                entry === page
                  ? 'border-brand-600 bg-brand-600 text-white'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
              )}
            >
              {entry}
            </button>
          ),
        )}

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={!meta.hasNext}
          aria-label="Next page"
          className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          ›
        </button>
      </div>
    </nav>
  );
}
