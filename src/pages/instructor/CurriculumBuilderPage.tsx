import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button, LinkButton } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { FieldErrorList } from '@/components/ui/Alert';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { SkeletonRows } from '@/components/ui/Skeleton';
import { usePublishCourseMutation, useUnpublishCourseMutation } from '@/features/courses/coursesApi';
import {
  useCreateLessonMutation,
  useCreateModuleMutation,
  useDeleteLessonMutation,
  useDeleteModuleMutation,
  useGetCurriculumQuery,
  useUpdateModuleMutation,
} from '@/features/curriculum/curriculumApi';
import { useCreateQuizMutation, useListCourseQuizzesQuery } from '@/features/quizzes/quizzesApi';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { apiErrorMessage, apiErrors, formatDuration } from '@/lib/formatters';
import type { LessonType } from '@/types';

const LESSON_TYPES: Array<{ value: LessonType; label: string }> = [
  { value: 'video', label: 'Video' },
  { value: 'article', label: 'Article' },
  { value: 'quiz', label: 'Quiz' },
  { value: 'assignment', label: 'Assignment' },
];

export function CurriculumBuilderPage() {
  const { courseId = '' } = useParams<{ courseId: string }>();
  useDocumentTitle('Curriculum builder');

  const [error, setError] = useState<unknown>(null);
  const [notice] = useState<string | null>(null);

  const [moduleTitle, setModuleTitle] = useState('');
  const [lessonDrafts, setLessonDrafts] = useState<Record<string, string>>({});
  const [lessonTypes, setLessonTypes] = useState<Record<string, LessonType>>({});
  const [editingModule, setEditingModule] = useState<{ id: string; title: string } | null>(null);
  const [quizForModule, setQuizForModule] = useState<{ moduleId: string; title: string } | null>(null);

  const { data: curriculum, isLoading, isError } = useGetCurriculumQuery(
    { courseId, includeUnpublished: true },
    { skip: !courseId },
  );

  const { data: quizzes } = useListCourseQuizzesQuery(courseId, { skip: !courseId });
  const [publish] = usePublishCourseMutation();
  const [unpublish] = useUnpublishCourseMutation();
  const [createModule, { isLoading: isCreatingModule }] = useCreateModuleMutation();
  const [updateModule] = useUpdateModuleMutation();
  const [deleteModule] = useDeleteModuleMutation();
  const [createLesson] = useCreateLessonMutation();
  const [deleteLesson] = useDeleteLessonMutation();
  const [createQuiz, { isLoading: isCreatingQuiz }] = useCreateQuizMutation();

  const run = async (action: () => Promise<unknown>) => {
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(err);
    }
  };

  const addModule = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!moduleTitle.trim()) return;

    await run(() =>
      createModule({
        courseId,
        body: { title: moduleTitle.trim(), position: (curriculum?.modules.length ?? 0) + 1 },
      }).unwrap(),
    );

    setModuleTitle('');
  };

  const addLesson = async (moduleId: string) => {
    const title = (lessonDrafts[moduleId] ?? '').trim();
    if (!title) return;

    await run(() =>
      createLesson({
        courseId,
        body: {
          title,
          module: moduleId,
          type: lessonTypes[moduleId] ?? 'article',
          position: (curriculum?.totalLessons ?? 0) + 1,
        },
      }).unwrap(),
    );

    setLessonDrafts((previous) => ({ ...previous, [moduleId]: '' }));
  };

  const submitQuiz = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!quizForModule) return;

    await run(() =>
      createQuiz({
        courseId,
        body: {
          title: quizForModule.title.trim(),
          lesson: quizForModule.moduleId,
          // A quiz is always created with one question so it can be edited into
          // shape immediately rather than failing validation on an empty list.
          questions: [
            { text: 'First question', type: 'multiple', options: [{ text: 'Option A' }] },
          ],
        },
      }).unwrap(),
    );

    setQuizForModule(null);
  };

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
        <span className="text-slate-800 font-medium">Curriculum</span>
      </nav>

      <PageHeader
        title="Curriculum"
        subtitle={`${curriculum?.totalLessons ?? 0} lessons · ${formatDuration(curriculum?.totalDurationMinutes ?? 0)}`}
        action={
          <div className="flex gap-2">
            <LinkButton to={`/instructor/courses/${courseId}/edit`} variant="outline" size="sm">
              Edit details
            </LinkButton>
            <Button
              size="sm"
              onClick={() => void run(() => unpublish(courseId).unwrap())}
              variant="ghost"
            >
              Unpublish
            </Button>
            <Button size="sm" onClick={() => void run(() => publish(courseId).unwrap())}>
              Publish course
            </Button>
          </div>
        }
      />

      {notice ? (
        <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          {notice}
        </p>
      ) : null}

      {error ? (
        <div className="mb-4 space-y-3">
          <FieldErrorList errors={apiErrors(error)} />
          <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
            {apiErrorMessage(error)}
          </p>
        </div>
      ) : null}

      {isLoading ? <SkeletonRows rows={6} columns={3} /> : null}

      {isError ? <EmptyState title="Could not load the curriculum" description="Please try again." /> : null}

      {!isLoading && (curriculum?.modules.length ?? 0) === 0 ? (
        <EmptyState
          title="No modules yet"
          description="Modules group your lessons into sections. Add your first one below."
        />
      ) : null}

      {curriculum && curriculum.modules.length > 0 ? (
        <div className="space-y-5">
          {curriculum.modules.map((module) => (
            <Card key={module.id}>
              <CardHeader
                title={`${module.position}. ${module.title}`}
                subtitle={`${module.lessons.length} lessons`}
                action={
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingModule({ id: module.id, title: module.title })}
                    >
                      Rename
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setQuizForModule({ moduleId: module.id, title: `${module.title} quiz` })
                      }
                    >
                      Add quiz
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => void run(() => deleteModule({ courseId, moduleId: module.id }).unwrap())}
                    >
                      Delete
                    </Button>
                  </div>
                }
              />

              <CardBody className="space-y-4">
                {module.lessons.length === 0 ? (
                  <p className="text-sm text-slate-500">No lessons in this module yet.</p>
                ) : (
                  <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                    {module.lessons.map((lesson) => (
                      <li key={lesson.id} className="flex items-center justify-between gap-4 px-4 py-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900">{lesson.title}</p>
                          <p className="text-xs text-slate-500">
                            {lesson.type} · {lesson.durationMinutes} min ·{' '}
                            {lesson.isPublished ? 'published' : 'hidden'}
                            {lesson.isPreview ? ' · free preview' : ''}
                          </p>
                        </div>

                        <div className="flex shrink-0 gap-2">
                          <LinkButton
                            to={`/instructor/courses/${courseId}/lessons/${lesson.id}`}
                            size="sm"
                            variant="outline"
                          >
                            Edit
                          </LinkButton>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              void run(() =>
                                deleteLesson({ courseId, lessonId: lesson.id }).unwrap(),
                              )
                            }
                          >
                            Delete
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="grid gap-3 sm:grid-cols-[2fr_1fr_auto] sm:items-end">
                  <Input
                    label="New lesson"
                    value={lessonDrafts[module.id] ?? ''}
                    placeholder="Lesson title"
                    onChange={(event) =>
                      setLessonDrafts((previous) => ({ ...previous, [module.id]: event.target.value }))
                    }
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        void addLesson(module.id);
                      }
                    }}
                  />

                  <Select
                    label="Type"
                    value={lessonTypes[module.id] ?? 'article'}
                    onChange={(event) =>
                      setLessonTypes((previous) => ({
                        ...previous,
                        [module.id]: event.target.value as LessonType,
                      }))
                    }
                    options={LESSON_TYPES}
                  />

                  <Button onClick={() => void addLesson(module.id)}>Add lesson</Button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      ) : null}

      {(quizzes?.length ?? 0) > 0 ? (
        <Card className="mt-6">
          <CardHeader title="Quizzes" subtitle="Attach a quiz to a lesson to grade it automatically." />
          <CardBody className="space-y-2">
            {quizzes?.map((quiz) => (
              <div
                key={quiz.id}
                className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">{quiz.title}</p>
                  <p className="text-xs text-slate-500">
                    {quiz.questions.length} questions · pass {quiz.passingScore}% ·{' '}
                    {quiz.isPublished ? 'published' : 'unpublished'}
                  </p>
                </div>
                <Link
                  to={`/instructor/courses/${courseId}/quizzes/${quiz.id}`}
                  className="text-xs font-medium text-brand-600"
                >
                  Edit
                </Link>
              </div>
            ))}
          </CardBody>
        </Card>
      ) : null}

      <Card className="mt-6">
        <CardHeader title="Add a module" subtitle="Sections keep long courses navigable." />
        <CardBody>
          <form onSubmit={addModule} className="grid gap-3 sm:grid-cols-[2fr_auto] sm:items-end">
            <Input
              label="Module title"
              required
              value={moduleTitle}
              onChange={(event) => setModuleTitle(event.target.value)}
              placeholder="Getting started"
            />
            <Button type="submit" isLoading={isCreatingModule}>
              Add module
            </Button>
          </form>
        </CardBody>
      </Card>

      <Modal
        isOpen={editingModule !== null}
        title="Rename module"
        onClose={() => setEditingModule(null)}
        footer={
          <Button
            onClick={() => {
              const target = editingModule;
              if (!target) return;
              void run(() =>
                updateModule({
                  courseId,
                  moduleId: target.id,
                  body: { title: target.title },
                }).unwrap(),
              ).then(() => setEditingModule(null));
            }}
          >
            Save
          </Button>
        }
      >
        <Input
          label="Module title"
          value={editingModule?.title ?? ''}
          onChange={(event) =>
            setEditingModule((previous) => (previous ? { ...previous, title: event.target.value } : previous))
          }
        />
      </Modal>

      <Modal
        isOpen={quizForModule !== null}
        title="Create quiz"
        onClose={() => setQuizForModule(null)}
        footer={
          <Button type="submit" form="create-quiz-form" isLoading={isCreatingQuiz}>
            Create quiz
          </Button>
        }
      >
        <form id="create-quiz-form" onSubmit={submitQuiz} className="space-y-4">
          <Input
            label="Quiz title"
            required
            value={quizForModule?.title ?? ''}
            onChange={(event) =>
              setQuizForModule((previous) =>
                previous ? { ...previous, title: event.target.value } : previous,
              )
            }
          />
          <Textarea label="Note" rows={3} disabled value="A starter question is added for you. Edit it after creation." />
        </form>
      </Modal>
    </AppShell>
  );
}