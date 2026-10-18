import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { FieldErrorList } from '@/components/ui/Alert';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { useListCategoriesQuery } from '@/features/categories/categoriesApi';
import { useCreateCourseMutation, useGetCourseQuery, useUpdateCourseMutation } from '@/features/courses/coursesApi';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { apiErrorMessage, apiErrors } from '@/lib/formatters';
import type { CourseLevel } from '@/types';

const LEVEL_OPTIONS: Array<{ value: CourseLevel; label: string }> = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

const EMPTY_FORM = {
  title: '',
  shortDescription: '',
  description: '',
  category: '',
  thumbnailUrl: '',
  level: 'beginner' as CourseLevel,
  price: '0',
  currency: 'USD',
  tags: '',
  outcomes: '',
  requirements: '',
};

type FormState = typeof EMPTY_FORM;

/** One textarea per list field, one entry per line. */
const splitLines = (value: string): string[] =>
  value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

export function CourseEditorPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const isEdit = Boolean(courseId);

  useDocumentTitle(isEdit ? 'Edit course' : 'New course');

  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState<unknown>(null);

  const { data: categories } = useListCategoriesQuery();
  const { data: course, isFetching: isLoadingCourse } = useGetCourseQuery(courseId as string, {
    skip: !isEdit,
  });

  const [createCourse, { isLoading: isCreating }] = useCreateCourseMutation();
  const [updateCourse, { isLoading: isUpdating }] = useUpdateCourseMutation();

  // Hydrate the form once the existing course arrives, then keep it in sync so
  // background refetches do not clobber in-progress edits.
  useEffect(() => {
    if (!course) return;

    setForm({
      title: course.title,
      shortDescription: course.shortDescription ?? '',
      description: course.description,
      category: typeof course.category === 'string' ? course.category : course.category.id,
      thumbnailUrl: course.thumbnailUrl ?? '',
      level: course.level,
      price: String(course.price ?? 0),
      currency: course.currency ?? 'USD',
      tags: (course.tags ?? []).join('\n'),
      outcomes: (course.outcomes ?? []).join('\n'),
      requirements: (course.requirements ?? []).join('\n'),
    });
  }, [course]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const payload = {
      title: form.title.trim(),
      shortDescription: form.shortDescription.trim() || undefined,
      description: form.description.trim(),
      category: form.category,
      thumbnailUrl: form.thumbnailUrl.trim() || undefined,
      level: form.level,
      price: Number(form.price) || 0,
      currency: form.currency,
      tags: splitLines(form.tags),
      outcomes: splitLines(form.outcomes),
      requirements: splitLines(form.requirements),
    };

    try {
      if (isEdit) {
        const updated = await updateCourse({ id: courseId as string, body: payload }).unwrap();
        navigate(`/instructor/courses/${updated.id}/curriculum`);
      } else {
        const created = await createCourse(payload).unwrap();
        navigate(`/instructor/courses/${created.id}/curriculum`);
      }
    } catch (err) {
      setError(err);
    }
  };

  const isSaving = isCreating || isUpdating;

  if (isEdit && isLoadingCourse) {
    return (
      <AppShell variant="fullWidth">
        <div className="flex justify-center py-24">
          <Spinner size="lg" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell variant="fullWidth">
      <nav className="mb-4 flex items-center gap-2 text-sm text-slate-500">
        <Link to="/instructor" className="hover:text-brand-700">
          Dashboard
        </Link>
        <span>/</span>
        <Link to="/instructor/courses" className="hover:text-brand-700">
          My courses
        </Link>
        <span>/</span>
        <span className="text-slate-800 font-medium">{isEdit ? 'Edit course' : 'New course'}</span>
      </nav>

      <PageHeader
        title={isEdit ? 'Edit course' : 'Create a course'}
        subtitle={
          isEdit
            ? 'Changes take effect for learners as soon as you save.'
            : 'Start with the details learners will see in the catalog.'
        }
        action={
          <Link
            to="/instructor/courses"
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            ← Back to courses
          </Link>
        }
      />

      <form onSubmit={onSubmit} className="space-y-6">
        {error ? (
          <FieldErrorList errors={apiErrors(error)} className="mb-2" />
        ) : null}

        {error ? (
          <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
            {apiErrorMessage(error)}
          </p>
        ) : null}

        <Card>
          <CardHeader title="Basics" />
          <CardBody className="space-y-4">
            <Input
              label="Title"
              required
              value={form.title}
              onChange={(event) => update('title', event.target.value)}
              placeholder="Introduction to Modern Web Development"
            />

            <Input
              label="Short description"
              hint="One line shown on course cards."
              maxLength={200}
              value={form.shortDescription}
              onChange={(event) => update('shortDescription', event.target.value)}
            />

            <Textarea
              label="Full description"
              required
              rows={6}
              value={form.description}
              onChange={(event) => update('description', event.target.value)}
            />

            <Textarea label="What learners will be able to do" hint="One outcome per line." rows={4} value={form.outcomes} onChange={(event) => update('outcomes', event.target.value)} />
            <Textarea label="Requirements / prerequisites" hint="One requirement per line." rows={3} value={form.requirements} onChange={(event) => update('requirements', event.target.value)} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Organisation" />
          <CardBody className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Category"
              required
              placeholder="Select a category"
              value={form.category}
              onChange={(event) => update('category', event.target.value)}
              options={(categories ?? []).map((category) => ({
                value: category.id,
                label: category.name,
              }))}
            />

            <Select
              label="Level"
              value={form.level}
              onChange={(event) => update('level', event.target.value as CourseLevel)}
              options={LEVEL_OPTIONS}
            />

            <Input
              label="Thumbnail URL"
              type="url"
              value={form.thumbnailUrl}
              onChange={(event) => update('thumbnailUrl', event.target.value)}
              placeholder="https://..."
            />

            <Textarea label="Tags" hint="One tag per line." rows={3} value={form.tags} onChange={(event) => update('tags', event.target.value)} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Pricing" subtitle="Free courses work with a price of 0." />
          <CardBody className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Price"
              type="number"
              min={0}
              step="0.01"
              value={form.price}
              onChange={(event) => update('price', event.target.value)}
            />

            <Input
              label="Currency"
              value={form.currency}
              maxLength={3}
              onChange={(event) => update('currency', event.target.value.toUpperCase())}
            />
          </CardBody>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => navigate('/instructor/courses')}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSaving}>
            {isEdit ? 'Save changes' : 'Create course'}
          </Button>
        </div>
      </form>
    </AppShell>
  );
}