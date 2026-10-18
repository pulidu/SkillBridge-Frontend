import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { FieldErrorList } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import {
  useDeleteQuizMutation,
  useGetQuizQuery,
  useGetAllAttemptsQuery,
  useUpdateQuizMutation,
  type QuizQuestionInput,
} from '@/features/quizzes/quizzesApi';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { apiErrorMessage, apiErrors, formatDateTime, formatPercent } from '@/lib/formatters';
import type { QuestionType } from '@/types';

const QUESTION_TYPES: Array<{ value: QuestionType; label: string }> = [
  { value: 'single', label: 'Single choice' },
  { value: 'multiple', label: 'Multiple choice' },
  { value: 'truefalse', label: 'True / false' },
  { value: 'short', label: 'Short answer' },
];

/** Local draft shape: client-side ids keep React keys stable across edits. */
interface DraftQuestion {
  key: string;
  text: string;
  type: QuestionType;
  points: string;
  correctAnswer: string;
  explanation: string;
  options: Array<{ key: string; text: string; isCorrect: boolean }>;
}

const newDraft = (): DraftQuestion => ({
  key: Math.random().toString(36).slice(2),
  text: '',
  type: 'single',
  points: '1',
  correctAnswer: '',
  explanation: '',
  options: [
    { key: Math.random().toString(36).slice(2), text: '', isCorrect: true },
    { key: Math.random().toString(36).slice(2), text: '', isCorrect: false },
  ],
});

const optionKey = () => Math.random().toString(36).slice(2);

export function QuizEditorPage() {
  const { courseId = '', quizId = '' } = useParams<{ courseId: string; quizId: string }>();
  useDocumentTitle('Quiz editor');

  const navigate = useNavigate();
  const [error, setError] = useState<unknown>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [passingScore, setPassingScore] = useState('70');
  const [timeLimitMinutes, setTimeLimitMinutes] = useState('');
  const [maxAttempts, setMaxAttempts] = useState('3');
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [questions, setQuestions] = useState<DraftQuestion[]>([]);

  const { data: quiz, isFetching } = useGetQuizQuery(quizId, { skip: !quizId });
  const [updateQuiz, { isLoading: isSaving }] = useUpdateQuizMutation();
  const [deleteQuiz] = useDeleteQuizMutation();
  const { data: attempts } = useGetAllAttemptsQuery({ id: quizId, limit: 5 }, { skip: !quizId });

  useEffect(() => {
    if (!quiz) return;

    setTitle(quiz.title);
    setDescription(quiz.description ?? '');
    setPassingScore(String(quiz.passingScore));
    setTimeLimitMinutes(quiz.timeLimitMinutes ? String(quiz.timeLimitMinutes) : '');
    setMaxAttempts(String(quiz.maxAttempts));
    setShuffleQuestions(quiz.shuffleQuestions);
    setIsPublished(quiz.isPublished);
    setQuestions(
      quiz.questions.map((question) => ({
        key: question._id ?? optionKey(),
        text: question.text,
        type: question.type,
        points: String(question.points),
        correctAnswer: question.correctAnswer ?? '',
        explanation: question.explanation ?? '',
        options: question.options.map((option) => ({
          key: option._id ?? optionKey(),
          text: option.text,
          isCorrect: Boolean(option.isCorrect),
        })),
      })),
    );
  }, [quiz]);

  const patchQuestion = (key: string, patch: Partial<DraftQuestion>) => {
    setQuestions((previous) => previous.map((q) => (q.key === key ? { ...q, ...patch } : q)));
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    // Client-side guard rails so obviously invalid quizzes never reach the API.
    if (questions.length === 0) {
      setError(new Error('Add at least one question before saving.'));
      return;
    }

    const blank = questions.findIndex((question) => !question.text.trim());
    if (blank !== -1) {
      setError(new Error(`Question ${blank + 1} is missing its text.`));
      return;
    }

    const payloadQuestions: QuizQuestionInput[] = questions.map((question) => ({
      text: question.text.trim(),
      type: question.type,
      points: Number(question.points) || 1,
      explanation: question.explanation.trim() || undefined,
      correctAnswer:
        question.type === 'short'
          ? question.correctAnswer.trim() || undefined
          : undefined,
      options:
        question.type === 'short'
          ? undefined
          : question.options
              .filter((option) => option.text.trim())
              .map((option) => ({ text: option.text.trim(), isCorrect: option.isCorrect })),
    }));

    try {
      await updateQuiz({
        id: quizId,
        body: {
          title: title.trim(),
          description: description.trim() || undefined,
          passingScore: Number(passingScore) || 0,
          timeLimitMinutes: timeLimitMinutes ? Number(timeLimitMinutes) : undefined,
          maxAttempts: Number(maxAttempts) || 1,
          shuffleQuestions,
          isPublished,
          questions: payloadQuestions,
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
        <span className="text-slate-800 font-medium">Quiz editor</span>
      </nav>

      <PageHeader
        title="Quiz editor"
        subtitle="Attempts are graded on the server so correct answers never reach learners."
        action={
          <Link
            to={`/instructor/courses/${courseId}/curriculum`}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            ← Back to curriculum
          </Link>
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
          <CardHeader title="Quiz settings" />
          <CardBody className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Title"
              required
              wrapperClassName="sm:col-span-2"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />

            <Textarea
              label="Description"
              rows={3}
              wrapperClassName="sm:col-span-2"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />

            <Input
              label="Passing score (%)"
              type="number"
              min={0}
              max={100}
              value={passingScore}
              onChange={(event) => setPassingScore(event.target.value)}
            />

            <Input
              label="Time limit (minutes)"
              type="number"
              min={0}
              value={timeLimitMinutes}
              onChange={(event) => setTimeLimitMinutes(event.target.value)}
              hint="Leave empty for no limit."
            />

            <Input
              label="Maximum attempts"
              type="number"
              min={1}
              value={maxAttempts}
              onChange={(event) => setMaxAttempts(event.target.value)}
            />

            <div className="flex flex-col justify-end gap-3 pb-1">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-brand-600"
                  checked={shuffleQuestions}
                  onChange={(event) => setShuffleQuestions(event.target.checked)}
                />
                Shuffle questions per attempt
              </label>

              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-brand-600"
                  checked={isPublished}
                  onChange={(event) => setIsPublished(event.target.checked)}
                />
                Published
              </label>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title={`Questions (${questions.length})`}
            action={
              <Button size="sm" variant="outline" onClick={() => setQuestions((p) => [...p, newDraft()])}>
                Add question
              </Button>
            }
          />
          <CardBody className="space-y-5">
            {questions.length === 0 ? (
              <p className="text-sm text-slate-500">No questions yet.</p>
            ) : null}

            {questions.map((question, index) => (
              <div key={question.key} className="rounded-xl border border-slate-200 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900">Question {index + 1}</h3>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      setQuestions((previous) => previous.filter((q) => q.key !== question.key))
                    }
                  >
                    Remove
                  </Button>
                </div>

                <div className="grid gap-4 sm:grid-cols-[2fr_1fr_6rem] sm:items-start">
                  <Input
                    label="Question"
                    value={question.text}
                    onChange={(event) => patchQuestion(question.key, { text: event.target.value })}
                  />

                  <Select
                    label="Type"
                    value={question.type}
                    onChange={(event) =>
                      patchQuestion(question.key, { type: event.target.value as QuestionType })
                    }
                    options={QUESTION_TYPES}
                  />

                  <Input
                    label="Points"
                    type="number"
                    min={1}
                    value={question.points}
                    onChange={(event) => patchQuestion(question.key, { points: event.target.value })}
                  />
                </div>

                {question.type === 'short' ? (
                  <div className="mt-4">
                    <Input
                      label="Accepted answer"
                      value={question.correctAnswer}
                      onChange={(event) =>
                        patchQuestion(question.key, { correctAnswer: event.target.value })
                      }
                      hint="Compared case-insensitively."
                    />
                  </div>
                ) : (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-medium text-slate-700">Options</p>
                    {question.options.map((option, optionIndex) => (
                      <div key={option.key} className="flex items-center gap-3">
                        <input
                          type={question.type === 'multiple' ? 'checkbox' : 'radio'}
                          name={`correct-${question.key}`}
                          aria-label={`Mark option ${optionIndex + 1} as correct`}
                          className="h-4 w-4 text-brand-600"
                          checked={option.isCorrect}
                          onChange={() =>
                            patchQuestion(question.key, {
                              options: question.options.map((item) =>
                                item.key === option.key
                                  ? { ...item, isCorrect: true }
                                  : question.type === 'multiple'
                                    ? { ...item, isCorrect: false }
                                    : item,
                              ),
                            })
                          }
                        />
                        <Input
                          label={`Option ${optionIndex + 1}`}
                          wrapperClassName="flex-1"
                          value={option.text}
                          onChange={(event) =>
                            patchQuestion(question.key, {
                              options: question.options.map((item) =>
                                item.key === option.key ? { ...item, text: event.target.value } : item,
                              ),
                            })
                          }
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            patchQuestion(question.key, {
                              options: question.options.filter((item) => item.key !== option.key),
                            })
                          }
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        patchQuestion(question.key, {
                          options: [
                            ...question.options,
                            { key: optionKey(), text: '', isCorrect: false },
                          ],
                        })
                      }
                    >
                      Add option
                    </Button>
                  </div>
                )}

                <div className="mt-4">
                  <Input
                    label="Explanation"
                    value={question.explanation}
                    onChange={(event) =>
                      patchQuestion(question.key, { explanation: event.target.value })
                    }
                    hint="Shown to learners after grading."
                  />
                </div>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Recent attempts" subtitle="The five most recent submissions to this quiz." />
          <CardBody className="space-y-2">
            {(attempts?.items.length ?? 0) === 0 ? (
              <p className="text-sm text-slate-500">No attempts recorded yet.</p>
            ) : null}

            {attempts?.items.map((attempt) => (
              <div
                key={attempt.id}
                className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 px-4 py-3"
              >
                <p className="truncate text-sm text-slate-700">{attempt.student}</p>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span>{formatPercent(attempt.percentage)}</span>
                  <span>{attempt.passed ? 'Passed' : 'Not passed'}</span>
                  <span>{formatDateTime(attempt.submittedAt)}</span>
                </div>
              </div>
            ))}
          </CardBody>
        </Card>

        <div className="flex justify-end gap-3">
          <Button
            variant="danger"
            onClick={() => {
              setError(null);
              deleteQuiz(quizId)
                .unwrap()
                .then(() => navigate(`/instructor/courses/${courseId}/curriculum`))
                .catch((err) => setError(err));
            }}
          >
            Delete quiz
          </Button>
          <Button variant="outline" onClick={() => navigate(`/instructor/courses/${courseId}/curriculum`)}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSaving}>
            Save quiz
          </Button>
        </div>
      </form>
    </AppShell>
  );
}