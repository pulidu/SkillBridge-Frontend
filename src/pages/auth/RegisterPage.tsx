import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { Alert, FieldErrorList } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useAppDispatch } from '@/app/hooks';
import { useRegisterMutation } from '@/features/auth/authApi';
import { sessionReceived } from '@/features/auth/authSlice';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { apiErrors, errorMessage, fieldError } from '@/lib/formatters';
import type { AuthPayload } from '@/types';

/** Mirrors the server-side policy so the user gets instant feedback. */
const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d).{8,72}$/;

export function RegisterPage() {
  useDocumentTitle('Create an account');

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [register, { isLoading }] = useRegisterMutation();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<unknown>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    try {
      const payload = await register({ fullName, email, password }).unwrap();
      dispatch(sessionReceived(payload as AuthPayload));
      navigate('/learn', { replace: true });
    } catch (err) {
      setError(err);
    }
  };

  const passwordHint = PASSWORD_RULE.test(password)
    ? undefined
    : 'At least 8 characters, including one letter and one number.';

  return (
    <AppShell variant="fullWidth">
      <div className="mx-auto max-w-md py-6">
        <Card>
          <CardBody className="space-y-5">
            <div>
              <h1 className="text-xl font-bold text-slate-900">Create your learner account</h1>
              <p className="mt-1 text-sm text-slate-500">
                New accounts start with the student role. Instructors are promoted by an administrator.
              </p>
            </div>

            {error ? (
              <Alert tone="error">
                {errorMessage(error, 'Registration failed')}
                <FieldErrorList errors={apiErrors(error)} className="mt-2" />
              </Alert>
            ) : null}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Full name"
                required
                autoComplete="name"
                value={fullName}
                error={fieldError(error, 'fullName')}
                onChange={(event) => setFullName(event.target.value)}
              />

              <Input
                label="Email"
                type="email"
                required
                autoComplete="email"
                value={email}
                error={fieldError(error, 'email')}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
              />

              <Input
                label="Password"
                type="password"
                required
                autoComplete="new-password"
                value={password}
                error={fieldError(error, 'password')}
                hint={passwordHint}
                onChange={(event) => setPassword(event.target.value)}
              />

              <Button type="submit" fullWidth isLoading={isLoading}>
                Create account
              </Button>
            </form>

            <p className="text-sm text-slate-500">
              Already registered?{' '}
              <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">
                Sign in
              </Link>
            </p>
          </CardBody>
        </Card>
      </div>
    </AppShell>
  );
}
