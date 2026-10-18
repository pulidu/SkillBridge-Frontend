import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { Alert, FieldErrorList } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useAppDispatch } from '@/app/hooks';
import { useLoginMutation } from '@/features/auth/authApi';
import { sessionReceived } from '@/features/auth/authSlice';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { apiErrors, errorMessage } from '@/lib/formatters';
import { AuthPayload } from '@/types';

export function LoginPage() {
  useDocumentTitle('Sign in');

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [login, { isLoading }] = useLoginMutation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<unknown>(null);

  const redirect = searchParams.get('redirect');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    try {
      const payload = await login({ email, password }).unwrap();
      dispatch(sessionReceived(payload as AuthPayload));
      navigate(redirect ? decodeURIComponent(redirect) : '/dashboard', { replace: true });
    } catch (err) {
      setError(err);
    }
  };

  return (
    <AppShell variant="fullWidth">
      <div className="mx-auto max-w-md py-6">
        <Card>
          <CardBody className="space-y-5">
            <div>
              <h1 className="text-xl font-bold text-slate-900">Sign in</h1>
              <p className="mt-1 text-sm text-slate-500">
                Welcome back. Use your account to continue learning.
              </p>
            </div>

            {error ? (
              <Alert tone="error">
                {errorMessage(error, 'Sign in failed')}
                <FieldErrorList errors={apiErrors(error)} className="mt-2" />
              </Alert>
            ) : null}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
              />

              <Input
                label="Password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />

              <Button type="submit" fullWidth isLoading={isLoading}>
                Sign in
              </Button>
            </form>

            <div className="flex flex-col gap-1 text-sm text-slate-500">
              <Link to="/forgot-password" className="hover:text-brand-700">
                Forgot your password?
              </Link>
              <span>
                No account yet?{' '}
                <Link to="/register" className="font-medium text-brand-600 hover:text-brand-700">
                  Create one
                </Link>
              </span>
            </div>
          </CardBody>
        </Card>
      </div>
    </AppShell>
  );
}
