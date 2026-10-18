import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/cn';
import type { CourseLevel } from '@/types';

const CONFIG: Record<CourseLevel, { label: string; className: string }> = {
  beginner: { label: 'Beginner', className: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  intermediate: { label: 'Intermediate', className: 'bg-amber-50 text-amber-800 ring-amber-200' },
  advanced: { label: 'Advanced', className: 'bg-rose-50 text-rose-700 ring-rose-200' },
};

export function LevelBadge({ level, className }: { level: CourseLevel; className?: string }) {
  const config = CONFIG[level] ?? CONFIG.beginner;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        config.className,
        className,
      )}
    >
      {config.label}
    </span>
  );
}

/** Course status chip, coloured by lifecycle state. */
export function CourseStatusBadge({ status }: { status: string }) {
  return <Badge tone={status === 'published' ? 'success' : status === 'draft' ? 'warning' : 'danger'}>{status}</Badge>;
}
