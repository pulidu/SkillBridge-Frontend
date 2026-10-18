import { useEffect, useState, type FormEvent } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Alert, FieldErrorList } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Input, Textarea } from '@/components/ui/Input';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { useChangePasswordMutation, useUpdateProfileMutation } from '@/features/auth/authApi';
import { profileUpdated, selectUser } from '@/features/auth/authSlice';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { apiErrors, errorMessage, fieldError, formatDate } from '@/lib/formatters';

export function ProfilePage() {
  useDocumentTitle('My profile');

  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);

  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [profileError, setProfileError] = useState<unknown>(null);
  const [passwordError, setPasswordError] = useState<unknown>(null);
  const [passwordDone, setPasswordDone] = useState(false);

  const [updateProfile, { isLoading: isSavingProfile }] = useUpdateProfileMutation();
  const [changePassword, { isLoading: isSavingPassword }] = useChangePasswordMutation();

  // Re-seed the form when the cached profile arrives after the first render.
  useEffect(() => {
    if (!user) return;
    setFullName(user.fullName);
    setAvatarUrl(user.avatarUrl ?? '');
    setBio(user.bio ?? '');
  }, [user]);

  const handleProfileSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setProfileError(null);

    try {
      const updated = await updateProfile({
        fullName,
        avatarUrl: avatarUrl || undefined,
        bio: bio || undefined,
      }).unwrap();
      dispatch(profileUpdated(updated));
    } catch (err) {
      setProfileError(err);
    }
  };

  const handlePasswordSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setPasswordError(null);
    setPasswordDone(false);

    try {
      await changePassword({ currentPassword, newPassword }).unwrap();
      setCurrentPassword('');
      setNewPassword('');
      setPasswordDone(true);
    } catch (err) {
      setPasswordError(err);
    }
  };

  return (
    <AppShell>
      <PageHeader title="My profile" subtitle="Keep your public details up to date." />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Profile details"
            action={
              user ? (
                <Badge tone="brand">{user.roles.join(', ')}</Badge>
              ) : null
            }
          />
          <CardBody>
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              {profileError ? (
                <Alert tone="error">
                  {errorMessage(profileError)}
                  <FieldErrorList errors={apiErrors(profileError)} className="mt-2" />
                </Alert>
              ) : null}

              <Input
                label="Full name"
                required
                value={fullName}
                error={fieldError(profileError, 'fullName')}
                onChange={(event) => setFullName(event.target.value)}
              />

              <Input
                label="Email"
                value={user?.email ?? ''}
                disabled
                hint="Email changes are handled by an administrator."
              />

              <Input
                label="Avatar URL"
                type="url"
                value={avatarUrl}
                error={fieldError(profileError, 'avatarUrl')}
                onChange={(event) => setAvatarUrl(event.target.value)}
                placeholder="https://example.com/avatar.png"
              />

              <Textarea
                label="Bio"
                rows={4}
                maxLength={500}
                value={bio}
                error={fieldError(profileError, 'bio')}
                onChange={(event) => setBio(event.target.value)}
                hint={`${bio.length}/500 characters`}
              />

              <Button type="submit" isLoading={isSavingProfile}>
                Save changes
              </Button>
            </form>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Change password" subtitle="You will be asked to sign in again." />
          <CardBody>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {passwordDone ? <Alert tone="success">Password updated. Sign in again to continue.</Alert> : null}

              {passwordError ? (
                <Alert tone="error">
                  {errorMessage(passwordError)}
                  <FieldErrorList errors={apiErrors(passwordError)} className="mt-2" />
                </Alert>
              ) : null}

              <Input
                label="Current password"
                type="password"
                required
                autoComplete="current-password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
              />

              <Input
                label="New password"
                type="password"
                required
                autoComplete="new-password"
                value={newPassword}
                error={fieldError(passwordError, 'newPassword')}
                onChange={(event) => setNewPassword(event.target.value)}
                hint="At least 8 characters, including one letter and one number."
              />

              <Button type="submit" isLoading={isSavingPassword} variant="secondary">
                Update password
              </Button>

              {user?.lastLoginAt ? (
                <p className="text-xs text-slate-500">Last signed in {formatDate(user.lastLoginAt)}.</p>
              ) : null}
            </form>
          </CardBody>
        </Card>
      </div>
    </AppShell>
  );
}
