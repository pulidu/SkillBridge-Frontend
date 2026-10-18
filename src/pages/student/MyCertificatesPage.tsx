import { Link } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button, LinkButton } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { useGetMyCertificatesQuery } from '@/features/certificates/certificatesApi';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { formatDate } from '@/lib/formatters';

export function MyCertificatesPage() {
  useDocumentTitle('My certificates');

  const { data: certificates, isLoading } = useGetMyCertificatesQuery();

  return (
    <AppShell>
      <PageHeader
        title="My certificates"
        subtitle="Issued automatically when you complete every lesson in a course."
        action={<LinkButton to="/verify" variant="outline">Verify a certificate</LinkButton>}
      />

      {isLoading ? <p className="text-sm text-slate-500">Loading certificates…</p> : null}

      {!isLoading && (certificates?.length ?? 0) === 0 ? (
        <EmptyState
          title="No certificates yet"
          description="Complete all lessons in a course to earn your first certificate."
          action={<LinkButton to="/learn">Go to my learning</LinkButton>}
        />
      ) : null}

      {certificates && certificates.length > 0 ? (
        <ul className="grid gap-4 sm:grid-cols-2">
          {certificates.map((certificate) => {
            const revoked = Boolean(certificate.revokedAt);
            const courseTitle =
              typeof certificate.course === 'string' ? certificate.course : certificate.course.title;

            return (
              <li key={certificate.id}>
                <Card>
                  <CardBody className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          Certificate
                        </p>
                        <p className="mt-1 truncate text-base font-semibold text-slate-900">
                          {courseTitle}
                        </p>
                      </div>
                      <Badge tone={revoked ? 'danger' : 'success'}>
                        {revoked ? 'Revoked' : 'Valid'}
                      </Badge>
                    </div>

                    <dl className="space-y-1.5 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-slate-500">Serial</dt>
                        <dd className="font-mono text-slate-900">{certificate.serialNumber}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-slate-500">Issued</dt>
                        <dd className="text-slate-900">{formatDate(certificate.issuedAt)}</dd>
                      </div>
                      {typeof certificate.finalScore === 'number' ? (
                        <div className="flex justify-between">
                          <dt className="text-slate-500">Final score</dt>
                          <dd className="text-slate-900">{certificate.finalScore}%</dd>
                        </div>
                      ) : null}
                    </dl>

                    {revoked ? (
                      <p className="text-xs text-rose-700">
                        Revoked on {formatDate(certificate.revokedAt)}.
                      </p>
                    ) : (
                      <Link
                        to={`/verify?serial=${certificate.serialNumber}`}
                        className="text-sm font-medium text-brand-600 hover:text-brand-700"
                      >
                        Share verification link
                      </Link>
                    )}
                  </CardBody>
                </Card>
              </li>
            );
          })}
        </ul>
      ) : null}

      {certificates && certificates.length > 0 ? (
        <p className="mt-6 text-xs text-slate-500">
          Need a copy? Use the verification link above, or contact your instructor.
        </p>
      ) : null}

      <div className="mt-6">
        <Button variant="ghost" onClick={() => window.print()}>
          Print this page
        </Button>
      </div>
    </AppShell>
  );
}
