import type { ReactNode } from 'react';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}

/** Consistent title block at the top of every page. */
export function PageHeader({ title, subtitle, action, className }: PageHeaderProps) {
  return (
    <div className={`mb-6 flex flex-wrap items-start justify-between gap-4 ${className ?? ''}`}>
      <div className="min-w-0">
        <h1 className="page-title">{title}</h1>
        {subtitle ? <p className="page-subtitle">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
