import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { SkeletonRows } from '@/components/ui/Skeleton';
import { DataTable, type Column } from '@/components/ui/Table';
import { useListAuditLogsQuery } from '@/features/users/usersApi';
import { useDebounce } from '@/hooks/useDebounce';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { formatDateTime } from '@/lib/formatters';
import type { AuditLog } from '@/types';

/** Reads a readable message out of the free-form `meta` object. */
const metaValue = (meta: AuditLog['meta']): string => {
  if (!meta) return '—';
  const message = meta.message ?? meta.reason ?? meta.note;
  if (typeof message === 'string') return message;
  return JSON.stringify(meta);
};

export function AuditLogPage() {
  useDocumentTitle('Audit logs');

  const [actor, setActor] = useState('');
  const [entity, setEntity] = useState('');
  const [action, setAction] = useState('');
  const [page, setPage] = useState(1);

  const debouncedActor = useDebounce(actor);

  const { data, isLoading, isError } = useListAuditLogsQuery({
    page,
    limit: 25,
    actor: debouncedActor || undefined,
    entity: entity || undefined,
    action: action || undefined,
  });

  const columns: Array<Column<AuditLog>> = [
    {
      key: 'when',
      header: 'When',
      render: (row) => (
        <span className="whitespace-nowrap text-xs text-slate-600">{formatDateTime(row.createdAt)}</span>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      render: (row) => <Badge tone="info">{row.action}</Badge>,
    },
    {
      key: 'actor',
      header: 'Actor',
      render: (row) => (
        <div className="min-w-0">
          <p className="truncate text-sm text-slate-700">{row.actor ?? 'system'}</p>
          {row.actorRole ? (
            <p className="truncate text-xs text-slate-500">{row.actorRole}</p>
          ) : null}
        </div>
      ),
    },
    {
      key: 'entity',
      header: 'Entity',
      render: (row) => (
        <div className="min-w-0">
          <p className="truncate text-sm text-slate-700">{row.entity}</p>
          {row.entityId ? (
            <p className="truncate font-mono text-[11px] text-slate-400">{row.entityId}</p>
          ) : null}
        </div>
      ),
    },
    {
      key: 'detail',
      header: 'Detail',
      render: (row) => (
        <span className="line-clamp-2 text-xs text-slate-500">{metaValue(row.meta)}</span>
      ),
      hideBelow: 'lg',
    },
    {
      key: 'ip',
      header: 'IP',
      render: (row) => <span className="font-mono text-xs text-slate-500">{row.ip ?? '—'}</span>,
      hideBelow: 'lg',
    },
  ];

  return (
    <AppShell variant="fullWidth">
      <nav className="mb-4 flex items-center gap-2 text-sm text-slate-500">
        <Link to="/admin" className="hover:text-brand-700">
          Dashboard
        </Link>
        <span>/</span>
        <span className="text-slate-800 font-medium">Audit logs</span>
      </nav>

      <PageHeader
        title="Audit logs"
        subtitle={`${data?.meta.total ?? 0} recorded events`}
        action={
          <Link
            to="/admin"
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            ← Back to dashboard
          </Link>
        }
      />

      <div className="mb-6 grid gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-3">
        <Input
          label="Actor"
          type="search"
          value={actor}
          placeholder="User id"
          onChange={(event) => {
            setActor(event.target.value);
            setPage(1);
          }}
        />

        <Input
          label="Entity"
          value={entity}
          placeholder="course, user, enrollment..."
          onChange={(event) => {
            setEntity(event.target.value);
            setPage(1);
          }}
        />

        <Input
          label="Action"
          value={action}
          placeholder="course.publish"
          onChange={(event) => {
            setAction(event.target.value);
            setPage(1);
          }}
        />
      </div>

      {isLoading ? <SkeletonRows rows={12} columns={5} /> : null}

      {isError ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          Could not load the audit trail.
        </p>
      ) : null}

      {data ? (
        <DataTable<AuditLog>
          columns={columns}
          rows={data.items}
          rowKey={(row) => row.id}
          caption="Audit trail"
          emptyMessage="No matching events."
        />
      ) : null}

      {data && data.meta.totalPages > 1 ? (
        <div className="mt-4">
          <Pagination meta={data.meta} onPageChange={setPage} />
        </div>
      ) : null}

      <Card className="mt-6">
        <CardHeader title="What gets recorded" />
        <CardBody>
          <p className="text-sm text-slate-500">
            The API writes an audit record for every privileged mutation — role changes, suspensions,
            course publishing, deletions and grading — including the acting user, the affected entity
            and the request IP. Records are append only.
          </p>
        </CardBody>
      </Card>
    </AppShell>
  );
}