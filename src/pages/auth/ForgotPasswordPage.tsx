import { Link } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { Alert } from '@/components/ui/Alert';
import { Card, CardBody } from '@/components/ui/Card';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

/**
 * Password recovery is intentionally not implemented as a form.
 *
 * The API has no reset-token endpoint in this iteration (see
 * `docs/ARCHITECTURE.md`, "Explicit non-goals": no email delivery), so this page
 * explains the supported recovery path instead of posting to an endpoint that
 * does not exist and failing at runtime.
 */
export function ForgotPasswordPage() {
  useDocumentTitle('Forgot password');

  return (
    <AppShell variant="fullWidth">
      <div className="mx-auto max-w-md py-6">
        <Card>
          <CardBody className="space-y-4">
            <div>
              <h1 className="text-xl font-bold text-slate-900">Forgot your password?</h1>
              <p className="mt-1 text-sm text-slate-500">
                Self-service password reset is not part of this release.
              </p>
            </div>

            <Alert tone="info" title="How to recover access">
              <ul className="list-disc space-y-1 pl-4 text-sm">
                <li>Ask a platform administrator to reset the password on your behalf.</li>
                <li>
                  If you still remember it, <Link to="/login" className="underline">sign in</Link> and
                  change it from your profile.
                </li>
              </ul>
            </Alert>

            <Link
              to="/login"
              className="inline-block text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              Back to sign in
            </Link>
          </CardBody>
        </Card>
      </div>
    </AppShell>
  );
}
