import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { LessonTypeBadge } from '@/components/course/RatingStars';
import { FieldErrorList } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { useGetLessonQuery, useUpdateLessonMutation } from '@/features/curriculum/curriculumApi';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { apiErrorMessage, apiErrors, formatFileSize } from '@/lib/formatters';
import type { LessonAttachment, LessonType } from '@/types';

const LESSON_TYPES: Array<{ value: LessonType; label: string }> = [
  { value: 'video', label: 'Video' },
  { value: 'article', label: 'Article' },
  { value: 'quiz', label: 'Quiz' },
  { value: 'assignment', label: 'Assignment' },
];

interface LessonForm {
  title: string;
  type: LessonType;
  content: string;
  videoUrl: string;
  durationMinutes: string;
  isPreview: boolean;
  isPublished: boolean;
}

const EMPTY_FORM: LessonForm = {
  title: '',
  type: 'article',
  content: '',
  videoUrl: '',
  durationMinutes: '5',
  isPreview: false,
  isPublished: false,
};

export function LessonEditorPage() {
  const { courseId = '', lessonId = '' } = useParams<{ courseId: string; lessonId: string }>();
  useDocumentTitle('Lesson editor');

  const navigate = useNavigate();
  const [form, setForm] = useState<LessonForm>(EMPTY_FORM);
  const [attachments, setAttachments] = useState<LessonAttachment[]>([]);
  const [error, setError] = useState<unknown>(null);

  const { data: lesson, isFetching } = useGetLessonQuery({ courseId, lessonId }, { skip: !courseId || !lessonId });
  const [updateLesson, { isLoading: isSaving }] = useUpdateLessonMutation();

  useEffect(() => {
    if (!lesson) return;

    setForm({
      title: lesson.title,
      type: lesson.type,
      content: lesson.content ?? '',
      videoUrl: lesson.videoUrl ?? '',
      durationMinutes: String(lesson.durationMinutes),
      isPreview: lesson.isPreview,
      isPublished: lesson.isPublished,
    });
    setAttachments(lesson.attachments ?? []);
  }, [lesson]);

  const update = <K extends keyof LessonForm>(key: K, value: LessonForm[K]) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const addAttachmentRow = () => {
    setAttachments((previous) => [...previous, { name: '', url: '', size: 0 }]);
  };

  const updateAttachment = (index: number, patch: Partial<LessonAttachment>) => {
    setAttachments((previous) => previous.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    try {
      await updateLesson({
        courseId,
        lessonId,
        body: {
          title: form.title.trim(),
          type: form.type,
          content: form.content.trim() || undefined,
          videoUrl: form.videoUrl.trim() || undefined,
          durationMinutes: Number(form.durationMinutes) || 0,
          isPreview: form.isPreview,
          isPublished: form.isPublished,
          attachments: attachments
            .filter((item) => item.name.trim() && item.url.trim())
            .map((item) => ({ ...item, name: item.name.trim(), url: item.url.trim() })),
        },
      }).unwrap();

      navigate(`/instructor/courses/${courseId}/curriculum`);
    } catch (err) {
      setError(err);
    }
  };

  if (isFetching) {
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
        <Link to={`/instructor/courses/${courseId}/curriculum`} className="hover:text-brand-700">
          Curriculum
        </Link>
        <span>/</span>
        <span className="text-slate-800 font-medium">{form.title || 'Lesson'}</span>
      </nav>

      <PageHeader
        title={form.title || 'Lesson'}
        subtitle="Lesson content, media and visibility."
        action={
          <div className="flex items-center gap-2">
            <Link
              to={`/instructor/courses/${courseId}/curriculum`}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              ← Back to curriculum
            </Link>
            <LessonTypeBadge type={form.type} />
          </div>
        }
      />

      <form onSubmit={onSubmit} className="space-y-6">
        {error ? (
          <div className="space-y-3">
            <FieldErrorList errors={apiErrors(error)} />
            <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
              {apiErrorMessage(error)}
            </p>
          </div>
        ) : null}

        <Card>
          <CardHeader title="Lesson" />
          <CardBody className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Title"
              required
              wrapperClassName="sm:col-span-2"
              value={form.title}
              onChange={(event) => update('title', event.target.value)}
            />

            <Select
              label="Type"
              value={form.type}
              onChange={(event) => update('type', event.target.value as LessonType)}
              options={LESSON_TYPES}
            />

            <Input
              label="Duration (minutes)"
              type="number"
              min={0}
              value={form.durationMinutes}
              onChange={(event) => update('durationMinutes', event.target.value)}
            />

            <Input
              label="Video URL"
              type="url"
              wrapperClassName="sm:col-span-2"
              value={form.videoUrl}
              onChange={(event) => update('videoUrl', event.target.value)}
              placeholder="https://..."
              hint="Required for video lessons."
            />

            <Textarea
              label="Content"
              rows={10}
              wrapperClassName="sm:col-span-2"
              value={form.content}
              onChange={(event) => update('content', event.target.value)}
              hint="Markdown is supported."
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Visibility"
            action={
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-brand-600"
                    checked={form.isPublished}
                    onChange={(event) => update('isPublished', event.target.checked)}
                  />
                  Published
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-brand-600"
                    checked={form.isPreview}
                    onChange={(event) => update('isPreview', event.target.checked)}
                  />
                  Free preview
                </label>
              </div>
            }
          />
          <CardBody>
            <p className="text-sm text-slate-500">
              Unpublished lessons stay hidden from learners but remain editable. Free previews can be
              opened before enrolling.
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Attachments"
            subtitle="Downloadable resources for this lesson."
            action={
              <Button size="sm" variant="outline" onClick={addAttachmentRow}>
                Add attachment
              </Button>
            }
          />
          <CardBody className="space-y-3">
            {attachments.length === 0 ? (
              <p className="text-sm text-slate-500">No attachments yet.</p>
            ) : null}

            {attachments.map((attachment, index) => (
              <div key={index} className="grid gap-3 sm:grid-cols-[1fr_2fr_8rem_auto] sm:items-end">
                <Input
                  label="Name"
                  value={attachment.name}
                  onChange={(event) => updateAttachment(index, { name: event.target.value })}
                />
                <Input
                  label="URL"
                  type="url"
                  value={attachment.url}
                  onChange={(event) => updateAttachment(index, { url: event.target.value })}
                />
                <Input
                  label="Size (bytes)"
                  type="number"
                  min={0}
                  value={attachment.size || ''}
                  onChange={(event) =>
                    updateAttachment(index, { size: Number(event.target.value) || 0 })
                  }
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAttachments((previous) => previous.filter((_, i) => i !== index))}
                >
                  Remove
                </Button>
              </div>
            ))}

            {attachments.length > 0 ? (
              <p className="text-xs text-slate-500">
                Total declared size: {formatFileSize(attachments.reduce((sum, item) => sum + item.size, 0))}
              </p>
            ) : null}
          </CardBody>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => navigate(`/instructor/courses/${courseId}/curriculum`)}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSaving}>
            Save lesson
          </Button>
        </div>
      </form>
    </AppShell>
  );
}