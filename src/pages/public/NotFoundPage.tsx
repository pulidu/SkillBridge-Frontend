import { Link } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { EmptyState } from '@/components/ui/EmptyState';

export function NotFoundPage() {
  return (
    <AppShell>
      <EmptyState
        title="404 — page not found"
        description="The page you were looking for does not exist or has moved."
        action={
          <Link
            to="/"
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
          >
            Back to home
          </Link>
        }
        className="mt-10"
      />
    </AppShell>
  );
}
