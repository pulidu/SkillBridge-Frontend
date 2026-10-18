import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { SkeletonRows } from '@/components/ui/Skeleton';
import {
  useGetWeeklyScheduleQuery,
  useUpdateTaskMutation,
} from '@/features/planner/plannerApi';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import type { StudyTask, StudyTaskPriority, StudyTaskStatus } from '@/types';

export function WeeklySchedulePage() {
  useDocumentTitle('Weekly Study Schedule');

  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const mon = new Date(d.setDate(diff));
    mon.setHours(0, 0, 0, 0);
    return mon;
  });

  const weekStartStr = currentWeekStart.toISOString().split('T')[0];

  const { data: schedule, isLoading, isError } = useGetWeeklyScheduleQuery(weekStartStr);
  const [updateTask] = useUpdateTaskMutation();

  const handlePrevWeek = () => {
    const prev = new Date(currentWeekStart);
    prev.setDate(prev.getDate() - 7);
    setCurrentWeekStart(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(currentWeekStart);
    next.setDate(next.getDate() + 7);
    setCurrentWeekStart(next);
  };

  const handleCurrentWeek = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const mon = new Date(d.setDate(diff));
    mon.setHours(0, 0, 0, 0);
    setCurrentWeekStart(mon);
  };

  const handleToggle = async (task: StudyTask) => {
    const nextStatus: StudyTaskStatus =
      task.status === 'completed' ? 'todo' : 'completed';
    try {
      await updateTask({
        id: task.id,
        body: { status: nextStatus },
      }).unwrap();
    } catch {
      // Handled by RTK Query
    }
  };

  const priorityTone = (priority: StudyTaskPriority) => {
    if (priority === 'high') return 'danger';
    if (priority === 'medium') return 'warning';
    return 'neutral';
  };

  return (
    <AppShell variant="fullWidth">
      <nav className="mb-4 flex items-center gap-2 text-sm text-slate-500">
        <Link to="/learn" className="hover:text-brand-700">
          Dashboard
        </Link>
        <span>/</span>
        <span className="text-slate-800 font-medium">Weekly schedule</span>
      </nav>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Weekly Study Schedule"
          subtitle="View study commitments mapped across the week to balance your workload."
        />
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/learn"
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            ← Back to dashboard
          </Link>
          <Button variant="outline" size="sm" onClick={handlePrevWeek}>
            ‹ Previous Week
          </Button>
          <Button variant="outline" size="sm" onClick={handleCurrentWeek}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={handleNextWeek}>
            Next Week ›
          </Button>
        </div>
      </div>

      {schedule ? (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardBody className="p-4 text-center">
              <p className="text-xs font-semibold text-slate-500 uppercase">Week Range</p>
              <p className="mt-1 font-semibold text-slate-900">
                {schedule.weekStart} to {schedule.weekEnd}
              </p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="p-4 text-center">
              <p className="text-xs font-semibold text-slate-500 uppercase">Total Weekly Tasks</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {schedule.completedWeeklyTasks} / {schedule.totalWeeklyTasks}
              </p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="p-4 text-center">
              <p className="text-xs font-semibold text-slate-500 uppercase">Total Study Time</p>
              <p className="mt-1 text-2xl font-bold text-brand-600">
                {Math.round(schedule.totalWeeklyMinutes / 60)} hrs ({schedule.totalWeeklyMinutes} mins)
              </p>
            </CardBody>
          </Card>
        </div>
      ) : null}

      {isLoading ? (
        <SkeletonRows rows={7} columns={3} />
      ) : isError ? (
        <p className="text-sm text-rose-600">Failed to load weekly schedule.</p>
      ) : (
        <div className="space-y-4">
          {schedule?.scheduleByDay.map((day) => (
            <Card key={day.date} className={day.tasks.length > 0 ? 'border-brand-200' : ''}>
              <CardHeader
                title={
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">
                      {day.day} <span className="text-sm font-normal text-slate-500">({day.date})</span>
                    </span>
                    <span className="text-xs font-medium text-slate-600">
                      ⏱️ {day.totalMinutes} mins | {day.completedCount}/{day.tasks.length} completed
                    </span>
                  </div>
                }
              />
              <CardBody>
                {day.tasks.length === 0 ? (
                  <p className="py-2 text-sm text-slate-400 italic">No tasks scheduled for this day</p>
                ) : (
                  <div className="space-y-2">
                    {day.tasks.map((task) => (
                      <div
                        key={task.id}
                        className={`flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-3 transition-colors ${
                          task.status === 'completed' ? 'opacity-60 bg-emerald-50/40' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleToggle(task)}
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                              task.status === 'completed'
                                ? 'border-emerald-600 bg-emerald-600 text-white'
                                : 'border-slate-300 hover:border-slate-400 bg-white'
                            }`}
                          >
                            {task.status === 'completed' ? '✓' : ''}
                          </button>
                          <div>
                            <p
                              className={`text-sm font-medium text-slate-900 ${
                                task.status === 'completed' ? 'line-through text-slate-500' : ''
                              }`}
                            >
                              {task.title}
                            </p>
                            <p className="text-xs text-slate-500">
                              {task.course ? `${task.course.title} · ` : ''}
                              {task.estimatedStudyMinutes} mins
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge tone={priorityTone(task.priority)}>{task.priority}</Badge>
                          {task.source === 'assignment' ? (
                            <Badge tone="info">Assignment</Badge>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}
