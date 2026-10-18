import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useVerifyCertificateQuery } from '@/features/certificates/certificatesApi';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { formatDate } from '@/lib/formatters';

/**
 * Public certificate verification. Learners and employers can confirm that a
 * serial number is genuine without needing an account.
 */
export function VerifyCertificatePage() {
  useDocumentTitle('Verify certificate');

  const [input, setInput] = useState('');
  const [serial, setSerial] = useState('');

  const { data, isFetching, isError, error } = useVerifyCertificateQuery(serial, { skip: !serial });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setSerial(input.trim());
  };

  return (
    <AppShell>
      <PageHeader
        title="Verify a certificate"
        subtitle="Enter the serial number printed on a SkillBridge certificate."
      />

      <Card className="max-w-2xl">
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Serial number"
              required
              placeholder="SB-2026-000123"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              hint="Serial numbers look like SB-YYYY-NNNNNN."
            />
            <Button type="submit" isLoading={isFetching && Boolean(serial)} disabled={!input.trim()}>
              Verify
            </Button>
          </form>

          {serial && isError ? (
            <Alert tone="error" className="mt-5">
              {error && typeof error === 'object' && 'message' in error
                ? String((error as { message: string }).message)
                : 'No certificate matches that serial number.'}
            </Alert>
          ) : null}

          {data ? (
            <Alert tone={data.revokedAt ? 'warning' : 'success'} className="mt-5">
              <p className="font-semibold">
                {data.revokedAt ? 'This certificate has been revoked' : 'This certificate is valid'}
              </p>
              <p className="mt-1 text-sm">
                Serial {data.serialNumber} · issued {formatDate(data.issuedAt)}
              </p>
              {data.revokedAt ? (
                <p className="mt-1 text-sm">Revoked on {formatDate(data.revokedAt)}.</p>
              ) : null}
            </Alert>
          ) : null}
        </CardBody>
      </Card>
    </AppShell>
  );
}
