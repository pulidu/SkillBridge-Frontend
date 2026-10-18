import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { Alert, FieldErrorList } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { PageLoader } from '@/components/ui/Spinner';
import { useGetMyAttemptsQuery, useGetQuizQuery, useSubmitAttemptMutation } from '@/features/quizzes/quizzesApi';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { apiErrors, errorMessage, formatDateTime, formatPercent } from '@/lib/formatters';

type AnswerMap = Record<string, { optionIds: string[]; text: string }>;

/**
 * Student quiz runner.
 *
 * Correct options are never sent to the browser before submission, so this page
 * only ever collects answers and renders the graded result returned afterwards.
 */
export function QuizAttemptPage() {
  const { quizId = '' } = useParams();
  const navigate = useNavigate();

  const { data: quiz, isLoading, isError, error } = useGetQuizQuery(quizId);
  const { data: attempts } = useGetMyAttemptsQuery(quizId);
  const [submitAttempt, { isLoading: isSubmitting }] = useSubmitAttemptMutation();

  const [answers, setAnswers] = useState<AnswerMap>({});
  const [startedAt] = useState(() => Date.now());
  const [result, setResult] = useState<Awaited<ReturnType<typeof submitAttempt>> | null>(null);
  const [submitError, setSubmitError] = useState<unknown>(null);

  useDocumentTitle(quiz?.title);

  const attemptsUsed = attempts?.length ?? 0;
  const attemptsLeft = quiz ? quiz.maxAttempts - attemptsUsed : 0;

  const answeredCount = useMemo(
    () =>
      Object.values(answers).filter(
        (entry) => entry.optionIds.length > 0 || entry.text.trim().length > 0,
      ).length,
    [answers],
  );

  if (isLoading) {
    return (
      <AppShell>
        <PageLoader />
      </AppShell>
    );
  }

  if (isError || !quiz) {
    return (
      <AppShell>
        <EmptyState
          title="Quiz unavailable"
          description={errorMessage(error, 'You may not be enrolled in this course.')}
          action={<Button onClick={() => navigate('/learn')}>Back to my learning</Button>}
        />
      </AppShell>
    );
  }

  const toggleOption = (questionId: string, optionId: string, multiple: boolean) => {
    setAnswers((previous) => {
      const current = previous[questionId] ?? { optionIds: [], text: '' };
      const optionIds = multiple
        ? current.optionIds.includes(optionId)
          ? current.optionIds.filter((id) => id !== optionId)
          : [...current.optionIds, optionId]
        : [optionId];

      return { ...previous, [questionId]: { ...current, optionIds } };
    });
  };

  const setText = (questionId: string, text: string) => {
    setAnswers((previous) => ({
      ...previous,
      [questionId]: { optionIds: previous[questionId]?.optionIds ?? [], text },
    }));
  };

  const handleSubmit = async () => {
    setSubmitError(null);

    const payload = {
      answers: quiz.questions.map((question) => {
        const entry = answers[question._id ?? ''] ?? { optionIds: [], text: '' };
        return {
          question: question._id ?? '',
          selectedOptionIds: entry.optionIds,
          textAnswer: entry.text || undefined,
        };
      }),
      timeSpentSeconds: Math.round((Date.now() - startedAt) / 1000),
    };

    try {
      const attempt = await submitAttempt({ id: quiz.id, body: payload }).unwrap();
      setResult({ data: attempt });
    } catch (err) {
      setSubmitError(err);
    }
  };

  const attemptResult = result?.data;

  return (
    <AppShell>
      <nav className="mb-4 text-sm text-slate-500">
        <Link to="/learn" className="hover:text-brand-700">
          My learning
        </Link>
        <span className="mx-2">/</span>
        <span className="text-slate-700">{quiz.title}</span>
      </nav>

      <Card>
        <CardHeader
          title={quiz.title}
          subtitle={`${quiz.questions.length} questions · pass mark ${quiz.passingScore}% · ${attemptsUsed}/${quiz.maxAttempts} attempts used`}
          action={quiz.isPublished ? <Badge tone="success">Published</Badge> : <Badge tone="warning">Closed</Badge>}
        />
        <CardBody>
          {quiz.description ? <p className="mb-5 text-sm text-slate-600">{quiz.description}</p> : null}

          {attemptResult ? (
            <Alert tone={attemptResult.passed ? 'success' : 'error'} title={attemptResult.passed ? 'Passed' : 'Not passed'}>
              <p className="text-sm">
                You scored {attemptResult.score}/{attemptResult.maxScore} (
                {formatPercent(attemptResult.percentage)}). Attempt {attemptResult.attemptNumber}.
              </p>
            </Alert>
          ) : null}

          {attemptsLeft <= 0 && !attemptResult ? (
            <Alert tone="warning" title="No attempts remaining">
              You have used all {quiz.maxAttempts} attempts for this quiz.
            </Alert>
          ) : null}

          {submitError ? (
            <div className="mt-4">
              <Alert tone="error">
                {errorMessage(submitError)}
                <FieldErrorList errors={apiErrors(submitError)} className="mt-2" />
              </Alert>
            </div>
          ) : null}

          <div className="mt-6 space-y-6">
            {quiz.questions.map((question, index) => {
              const questionId = question._id ?? '';
              const entry = answers[questionId] ?? { optionIds: [], text: '' };
              const graded = attemptResult?.answers.find((item) => item.question === questionId);

              return (
                <div key={questionId} className="rounded-lg border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-900">
                      {index + 1}. {question.text}
                    </p>
                    <span className="shrink-0 text-xs text-slate-500">{question.points} pts</span>
                  </div>

                  {question.type === 'short' ? (
                    <div className="mt-3">
                      <Input
                        label="Your answer"
                        value={entry.text}
                        disabled={Boolean(attemptResult)}
                        onChange={(event) => setText(questionId, event.target.value)}
                      />
                    </div>
                  ) : (
                    <ul className="mt-3 space-y-2">
                      {question.options.map((option, optionIndex) => {
                        const optionId = option._id ?? String(optionIndex);
                        const checked = entry.optionIds.includes(optionId);

                        return (
                          <li key={optionId}>
                            <label
                              className={`flex cursor-pointer items-center gap-2 rounded-md border p-2.5 text-sm transition-colors ${
                                checked ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:bg-slate-50'
                              } ${attemptResult ? 'cursor-not-allowed' : ''}`}
                            >
                              <input
                                type={question.type === 'multiple' ? 'checkbox' : 'radio'}
                                name={questionId}
                                checked={checked}
                                disabled={Boolean(attemptResult)}
                                onChange={() => toggleOption(questionId, optionId, question.type === 'multiple')}
                                className="h-4 w-4 accent-brand-600"
                              />
                              <span className="text-slate-700">{option.text}</span>
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  )}

                  {attemptResult && graded?.isCorrect !== undefined ? (
                    <p className="mt-2 text-xs font-medium text-slate-600">
                      {graded.isCorrect ? 'Correct' : 'Incorrect'}
                      {question.explanation ? ` — ${question.explanation}` : ''}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5">
            {!attemptResult ? (
              <Button
                isLoading={isSubmitting}
                disabled={answeredCount === 0 || attemptsLeft <= 0}
                onClick={() => void handleSubmit()}
              >
                Submit answers
              </Button>
            ) : null}

            <span className="text-sm text-slate-500">
              {answeredCount} of {quiz.questions.length} answered
            </span>

            <Button variant="ghost" onClick={() => navigate(-1)}>
              Back
            </Button>
          </div>
        </CardBody>
      </Card>

      {(attempts?.length ?? 0) > 0 ? (
        <Card className="mt-6">
          <CardHeader title="Previous attempts" />
          <CardBody className="p-0">
            <ul className="divide-y divide-slate-100">
              {attempts?.map((attempt) => (
                <li
                  key={attempt.id}
                  className="flex items-center justify-between gap-4 px-5 py-3 text-sm"
                >
                  <div>
                    <p className="font-medium text-slate-800">Attempt {attempt.attemptNumber}</p>
                    <p className="text-xs text-slate-500">{formatDateTime(attempt.submittedAt)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="tabular-nums text-slate-700">
                      {attempt.score}/{attempt.maxScore} ({formatPercent(attempt.percentage)})
                    </span>
                    <Badge tone={attempt.passed ? 'success' : 'danger'}>
                      {attempt.passed ? 'Passed' : 'Failed'}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      ) : null}
    </AppShell>
  );
}
