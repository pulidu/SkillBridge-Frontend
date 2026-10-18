import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { FieldErrorList } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Input, Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { SkeletonRows } from '@/components/ui/Skeleton';
import { DataTable, type Column } from '@/components/ui/Table';
import {
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
  useListCategoriesWithCountsQuery,
  useUpdateCategoryMutation,
} from '@/features/categories/categoriesApi';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { apiErrorMessage, apiErrors, formatDate } from '@/lib/formatters';
import type { CategoryWithCount } from '@/features/categories/categoriesApi';

interface Draft {
  id: string | null;
  name: string;
  slug: string;
  description: string;
  icon: string;
}

const emptyDraft = (): Draft => ({ id: null, name: '', slug: '', description: '', icon: '' });

export function CategoryManagementPage() {
  useDocumentTitle('Category management');

  const [draft, setDraft] = useState<Draft | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<CategoryWithCount | null>(null);
  const [error, setError] = useState<unknown>(null);

  const { data: categories, isLoading, isError } = useListCategoriesWithCountsQuery();
  const [createCategory, { isLoading: isCreating }] = useCreateCategoryMutation();
  const [updateCategory, { isLoading: isUpdating }] = useUpdateCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();

  const isEditing = draft?.id !== null && draft !== null;

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft) return;

    setError(null);
    const body = {
      name: draft.name.trim(),
      slug: draft.slug.trim() || undefined,
      description: draft.description.trim() || undefined,
      icon: draft.icon.trim() || undefined,
    };

    try {
      if (isEditing) {
        await updateCategory({ id: draft.id as string, body }).unwrap();
      } else {
        await createCategory(body).unwrap();
      }
      setDraft(null);
    } catch (err) {
      setError(err);
    }
  };

  const columns: Array<Column<CategoryWithCount>> = [
    {
      key: 'name',
      header: 'Category',
      render: (row) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-slate-900">{row.name}</p>
          <p className="truncate text-xs text-slate-500">/{row.slug}</p>
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      render: (row) => <span className="text-slate-600">{row.description ?? '—'}</span>,
      hideBelow: 'md',
    },
    {
      key: 'courses',
      header: 'Courses',
      render: (row) => row.courseCount,
    },
    {
      key: 'state',
      header: 'State',
      render: (row) => (
        <Badge tone={row.isActive ? 'success' : 'neutral'}>{row.isActive ? 'active' : 'hidden'}</Badge>
      ),
    },
    {
      key: 'created',
      header: 'Created',
      render: (row) => formatDate(row.createdAt),
      hideBelow: 'lg',
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <div className="flex justify-end gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() =>
              setDraft({
                id: row.id,
                name: row.name,
                slug: row.slug,
                description: row.description ?? '',
                icon: row.icon ?? '',
              })
            }
          >
            Edit
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
        <span className="text-slate-800 font-medium">Categories</span>
      </nav>

      <PageHeader
        title="Category management"
        subtitle="Categories drive the catalog navigation and admin filters."
        action={
          <div className="flex items-center gap-3">
            <Link
              to="/admin"
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              ← Back to dashboard
            </Link>
            <Button size="sm" onClick={() => setDraft(emptyDraft())}>
              New category
            </Button>
          </div>
        }
      />

      {error ? (
        <div className="mb-4 space-y-3">
          <FieldErrorList errors={apiErrors(error)} />
          <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
            {apiErrorMessage(error)}
          </p>
        </div>
      ) : null}

      {isLoading ? <SkeletonRows rows={6} columns={4} /> : null}

      {isError ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          Could not load categories.
        </p>
      ) : null}

      {categories ? (
        <DataTable<CategoryWithCount>
          columns={columns}
          rows={categories}
          rowKey={(row) => row.id}
          caption="Course categories"
          emptyMessage="No categories yet."
        />
      ) : null}

      <Card className="mt-6">
        <CardHeader title="Notes" />
        <CardBody>
          <p className="text-sm text-slate-500">
            A category can only be deleted once no course references it. Set a category to hidden
            instead of deleting it if you want to retire it without breaking existing course links.
          </p>
        </CardBody>
      </Card>

      <Modal
        isOpen={draft !== null}
        title={isEditing ? 'Edit category' : 'New category'}
        onClose={() => setDraft(null)}
        footer={
          <Button type="submit" form="category-form" isLoading={isCreating || isUpdating}>
            Save
          </Button>
        }
      >
        <form id="category-form" onSubmit={save} className="space-y-4">
          <Input
            label="Name"
            required
            value={draft?.name ?? ''}
            onChange={(event) => setDraft((p) => (p ? { ...p, name: event.target.value } : p))}
          />

          <Input
            label="Slug"
            value={draft?.slug ?? ''}
            onChange={(event) => setDraft((p) => (p ? { ...p, slug: event.target.value } : p))}
            hint="Generated from the name when left blank."
          />

          <Textarea
            label="Description"
            rows={3}
            value={draft?.description ?? ''}
            onChange={(event) => setDraft((p) => (p ? { ...p, description: event.target.value } : p))}
          />

          <Input
            label="Icon"
            value={draft?.icon ?? ''}
            onChange={(event) => setDraft((p) => (p ? { ...p, icon: event.target.value } : p))}
            placeholder="code, chart, palette..."
            hint="A short key used by the UI to pick an icon."
          />
        </form>
      </Modal>

      <Modal
        isOpen={confirmDelete !== null}
        title="Delete category"
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
                deleteCategory(target.id)
                  .unwrap()
                  .then(() => setConfirmDelete(null))
                  .catch(setError);
              }}
            >
              Delete
            </Button>
          </div>
        }
      >
        <p className="text-sm text-slate-600">
          Deleting <strong>{confirmDelete?.name}</strong> affects {confirmDelete?.courseCount}{' '}
          course(s). This action cannot be undone.
        </p>
      </Modal>
    </AppShell>
  );
}