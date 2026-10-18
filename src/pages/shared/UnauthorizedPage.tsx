import { Link } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { useAppSelector } from '@/app/hooks';
import { selectPrimaryRole, selectUser } from '@/features/auth/authSlice';

export function UnauthorizedPage() {
  const user = useAppSelector(selectUser);
  const role = useAppSelector(selectPrimaryRole);

  return (
    <AppShell>
      <PageHeader
        title="You do not have access to that page"
        subtitle="Your account does not hold the role this area requires."
      />

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
        <p className="font-semibold">Signed in as {user?.email ?? 'unknown user'}</p>
        <p className="mt-1">
          Current role: <span className="font-medium">{role}</span>. Ask an administrator if you need
          different permissions.
        </p>
      </div>

      <Link
        to="/dashboard"
        className="mt-6 inline-block rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
      >
        Back to my dashboard
      </Link>
    </AppShell>
  );
}
