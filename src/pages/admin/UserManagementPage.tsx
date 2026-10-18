import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Input, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { SkeletonRows } from '@/components/ui/Skeleton';
import { DataTable, type Column } from '@/components/ui/Table';
import { useDebounce } from '@/hooks/useDebounce';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { formatDate, formatDateTime } from '@/lib/formatters';
import {
  useCreateUserMutation,
  useDeleteUserMutation,
  useListUsersQuery,
  useUpdateUserMutation,
  useUpdateUserRoleMutation,
  useUpdateUserStatusMutation,
} from '@/features/users/usersApi';
import type { Role, User, UserStatus } from '@/types';

const ROLE_OPTIONS: Array<{ value: Role; label: string }> = [
  { value: 'student', label: 'Student' },
  { value: 'instructor', label: 'Instructor' },
  { value: 'admin', label: 'Admin' },
];

/** Mirrors the API: only these two roles may be created here. */
const CREATABLE_ROLE_OPTIONS = ROLE_OPTIONS.filter((option) => option.value !== 'student');

const STATUS_OPTIONS: Array<{ value: UserStatus; label: string }> = [
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
];

export function UserManagementPage() {
  useDocumentTitle('User management');

  const [search, setSearch] = useState('');
  const [role, setRole] = useState<Role | ''>('');
  const [status, setStatus] = useState<UserStatus | ''>('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<User | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<User | null>(null);
  const [creating, setCreating] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'instructor' | 'admin'>('instructor');
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [error, setError] = useState<unknown>(null);

  const debouncedSearch = useDebounce(search);

  const { data, isLoading, isError } = useListUsersQuery({
    page,
    limit: 20,
    search: debouncedSearch || undefined,
    role: role || undefined,
    status: status || undefined,
  });

  const [updateUser] = useUpdateUserMutation();
  const [updateRole] = useUpdateUserRoleMutation();
  const [updateStatus] = useUpdateUserStatusMutation();
  const [deleteUser] = useDeleteUserMutation();
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();

  const openCreate = () => {
    setNewFullName('');
    setNewEmail('');
    setNewPassword('');
    setNewRole('instructor');
    setError(null);
    setCreating(true);
  };

  const submitCreate = async (event: React.FormEvent) => {
    event.preventDefault();

    setError(null);
    try {
      await createUser({
        fullName: newFullName.trim(),
        email: newEmail.trim(),
        password: newPassword,
        role: newRole,
      }).unwrap();
      setCreating(false);
    } catch (err) {
      setError(err);
    }
  };

  const openEdit = (user: User) => {
    setEditing(user);
    setFullName(user.fullName);
    setBio(user.bio ?? '');
    setError(null);
  };

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editing) return;

    setError(null);
    try {
      await updateUser({
        id: editing.id,
        body: { fullName: fullName.trim(), bio: bio.trim() || undefined },
      }).unwrap();
      setEditing(null);
    } catch (err) {
      setError(err);
    }
  };

  const run = (action: () => Promise<unknown>) => {
    setError(null);
    return action().catch(setError);
  };

  const columns: Array<Column<User>> = [
    {
      key: 'user',
      header: 'User',
      render: (row) => (
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
            {row.initials}
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium text-slate-900">{row.fullName}</p>
            <p className="truncate text-xs text-slate-500">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (row) => (
        <Badge tone={row.primaryRole === 'admin' ? 'info' : 'neutral'}>{row.primaryRole}</Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge tone={row.status === 'active' ? 'success' : 'warning'}>{row.status}</Badge>
      ),
    },
    {
      key: 'joined',
      header: 'Joined',
      render: (row) => formatDate(row.createdAt),
      hideBelow: 'md',
    },
    {
      key: 'lastLogin',
      header: 'Last login',
      render: (row) => formatDateTime(row.lastLoginAt),
      hideBelow: 'lg',
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <div className="flex justify-end gap-1">
          <Button size="sm" variant="ghost" onClick={() => openEdit(row)}>
            Edit
          </Button>

          {ROLE_OPTIONS.filter((option) => option.value !== row.primaryRole).map((option) => (
            <Button
              key={option.value}
              size="sm"
              variant="ghost"
              onClick={() => run(() => updateRole({ id: row.id, role: option.value }).unwrap())}
            >
              Make {option.label.toLowerCase()}
            </Button>
          ))}

          <Button
            size="sm"
            variant="ghost"
            onClick={() =>
              run(() =>
                updateStatus({
                  id: row.id,
                  status: row.status === 'active' ? 'suspended' : 'active',
                }).unwrap(),
              )
            }
          >
            {row.status === 'active' ? 'Suspend' : 'Activate'}
          </Button>

          <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(row)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <AppShell variant="fullWidth">
      <nav className="mb-4 flex items-center gap-2 text-sm text-slate-500">
        <Link to="/admin" className="hover:text-brand-700">
          Dashboard
        </Link>
        <span>/</span>
        <span className="text-slate-800 font-medium">User management</span>
      </nav>

      <PageHeader
        title="User management"
        subtitle={`${data?.meta.total ?? 0} accounts`}
        action={
          <div className="flex items-center gap-3">
            <Link
              to="/admin"
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              ← Back to dashboard
            </Link>
            <Button onClick={openCreate}>New instructor</Button>
          </div>
        }
      />

      <div className="mb-6 grid gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-3">
        <Input
          label="Search"
          type="search"
          value={search}
          placeholder="Name or email"
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />

        <Select
          label="Role"
          value={role}
          placeholder="All roles"
          onChange={(event) => {
            setRole(event.target.value as Role | '');
            setPage(1);
          }}
          options={ROLE_OPTIONS}
        />

        <Select
          label="Status"
          value={status}
          placeholder="Any status"
          onChange={(event) => {
            setStatus(event.target.value as UserStatus | '');
            setPage(1);
          }}
          options={STATUS_OPTIONS}
        />
      </div>

      {error ? (
        <p className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          {error instanceof Error ? error.message : 'That action could not be completed.'}
        </p>
      ) : null}

      {isLoading ? <SkeletonRows rows={10} columns={5} /> : null}

      {isError ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          Could not load users.
        </p>
      ) : null}

      {data ? (
        <DataTable<User> columns={columns} rows={data.items} rowKey={(row) => row.id} caption="Platform users" />
      ) : null}

      {data && data.meta.totalPages > 1 ? (
        <div className="mt-4">
          <Pagination meta={data.meta} onPageChange={setPage} />
        </div>
      ) : null}

      <Card className="mt-6">
        <CardHeader title="Permission model" />
        <CardBody>
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
            <li>Students can browse, enrol, submit assignments and earn certificates.</li>
            <li>Instructors can additionally author courses, publish them and grade submissions.</li>
            <li>
              Admins can moderate every account, manage categories and read the audit trail. Every
              privileged action is recorded server side.
            </li>
          </ul>
        </CardBody>
      </Card>

      <Modal
        isOpen={creating}
        title="Create instructor account"
        onClose={() => setCreating(false)}
        footer={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setCreating(false)}>
              Cancel
            </Button>
            <Button type="submit" form="create-user-form" disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Create account'}
            </Button>
          </div>
        }
      >
        <form id="create-user-form" onSubmit={submitCreate} className="space-y-4">
          <p className="text-sm text-slate-600">
            Learners sign themselves up and always receive the student role. Instructor and admin
            accounts can only be created here.
          </p>

          <Input
            label="Full name"
            required
            value={newFullName}
            onChange={(event) => setNewFullName(event.target.value)}
          />

          <Input
            label="Email"
            type="email"
            required
            value={newEmail}
            onChange={(event) => setNewEmail(event.target.value)}
          />

          <Input
            label="Temporary password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            hint="At least 8 characters, including one letter and one number."
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
          />

          <Select
            label="Role"
            value={newRole}
            onChange={(event) => setNewRole(event.target.value as 'instructor' | 'admin')}
            options={CREATABLE_ROLE_OPTIONS.map((option) => ({
              value: option.value as 'instructor' | 'admin',
              label: option.label,
            }))}
          />

          <p className="text-xs text-slate-500">
            Share the password over a trusted channel and ask the account holder to change it. The
            password is hashed server side and is never returned by the API.
          </p>
        </form>
      </Modal>

      <Modal
        isOpen={editing !== null}
        title="Edit user"
        onClose={() => setEditing(null)}
        footer={
          <Button type="submit" form="edit-user-form">
            Save
          </Button>
        }
      >
        <form id="edit-user-form" onSubmit={saveProfile} className="space-y-4">
          <Input
            label="Full name"
            required
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
          />
          <Input label="Email" value={editing?.email ?? ''} disabled onChange={() => undefined} />
          <Input
            label="Bio"
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            wrapperClassName="[&_input]:min-h-[80px]"
          />
        </form>
      </Modal>

      <Modal
        isOpen={confirmDelete !== null}
        title="Delete user"
        size="sm"
        onClose={() => setConfirmDelete(null)}
        footer={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                const target = confirmDelete;
                if (!target) return;
                run(() => deleteUser(target.id).unwrap()).then(() => setConfirmDelete(null));
              }}
            >
              Delete
            </Button>
          </div>
        }
      >
        <p className="text-sm text-slate-600">
          This permanently removes {confirmDelete?.fullName} and every related record. The API will
          refuse if the account still owns content.
        </p>
      </Modal>
    </AppShell>
  );
}