import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { SkeletonRows } from '@/components/ui/Skeleton';
import {
  useCreateTaskMutation,
  useDeleteTaskMutation,
  useGenerateSuggestionsMutation,
  useGetStudentPlannerStatsQuery,
  useListTasksQuery,
  useUpdateTaskMutation,
} from '@/features/planner/plannerApi';
import { useGetMyEnrollmentsQuery } from '@/features/enrollments/enrollmentsApi';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { formatDate } from '@/lib/formatters';
import type { StudyTask, StudyTaskPriority, StudyTaskStatus } from '@/types';

export function StudyPlannerPage() {
  useDocumentTitle('Smart Study Planner');

  const [statusFilter, setStatusFilter] = useState<StudyTaskStatus | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<StudyTaskPriority | ''>('');
  const [courseFilter, setCourseFilter] = useState('');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<StudyTask | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Form state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskCourseId, setTaskCourseId] = useState('');
  const [taskMinutes, setTaskMinutes] = useState(60);
  const [taskPriority, setTaskPriority] = useState<StudyTaskPriority>('medium');
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Queries & Mutations
  const { data: tasks, isLoading, isError, refetch } = useListTasksQuery({
    status: statusFilter,
    priority: priorityFilter,
    courseId: courseFilter || undefined,
  });

  const { data: stats } = useGetStudentPlannerStatsQuery();
  const { data: enrollments } = useGetMyEnrollmentsQuery();

  const [createTask, { isLoading: isCreating }] = useCreateTaskMutation();
  const [updateTask] = useUpdateTaskMutation();
  const [deleteTask] = useDeleteTaskMutation();
  const [generateSuggestions, { isLoading: isGenerating }] = useGenerateSuggestionsMutation();

  const handleOpenCreate = () => {
    setTaskTitle('');
    setTaskDescription('');
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    setTaskDueDate(tomorrow);
    setTaskCourseId('');
    setTaskMinutes(60);
    setTaskPriority('medium');
    setIsCreateOpen(true);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle || !taskDueDate) return;

    try {
      if (editingTask) {
        await updateTask({
          id: editingTask.id,
          body: {
            title: taskTitle,
            description: taskDescription,
            dueDate: new Date(taskDueDate).toISOString(),
            estimatedStudyMinutes: Number(taskMinutes),
            priority: taskPriority,
          },
        }).unwrap();
        setEditingTask(null);
      } else {
        await createTask({
          title: taskTitle,
          description: taskDescription,
          courseId: taskCourseId || undefined,
          dueDate: new Date(taskDueDate).toISOString(),
          estimatedStudyMinutes: Number(taskMinutes),
          priority: taskPriority,
        }).unwrap();
        setIsCreateOpen(false);
      }
      setActionMessage('Task saved successfully.');
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      setActionMessage(err?.data?.message || 'Failed to save task.');
    }
  };

  const handleStatusToggle = async (task: StudyTask) => {
    const nextStatus: StudyTaskStatus =
      task.status === 'completed' ? 'todo' : task.status === 'todo' ? 'in_progress' : 'completed';

    try {
      await updateTask({
        id: task.id,
        body: { status: nextStatus },
      }).unwrap();
    } catch {
      // Handled by RTK Query
    }
  };

  const handleGenerate = async () => {
    try {
      const res = await generateSuggestions().unwrap();
      setActionMessage(res.message);
      refetch();
      setTimeout(() => setActionMessage(null), 5000);
    } catch (err: any) {
      setActionMessage(err?.data?.message || 'Failed to generate suggestions.');
    }
  };

  const openEditModal = (task: StudyTask) => {
    setEditingTask(task);
    setTaskTitle(task.title);
    setTaskDescription(task.description || '');
    setTaskDueDate(new Date(task.dueDate).toISOString().split('T')[0]);
    setTaskCourseId(task.course?.id || '');
    setTaskMinutes(task.estimatedStudyMinutes);
    setTaskPriority(task.priority);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTask(id).unwrap();
      setConfirmDeleteId(null);
      setActionMessage('Task deleted.');
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      setActionMessage(err?.data?.message || 'Failed to delete task.');
    }
  };

  const priorityTone = (priority: StudyTaskPriority) => {
    if (priority === 'high') return 'danger';
    if (priority === 'medium') return 'warning';
    return 'neutral';
  };

  const statusTone = (status: StudyTaskStatus) => {
    if (status === 'completed') return 'success';
    if (status === 'in_progress') return 'info';
    return 'neutral';
  };

  return (
    <AppShell variant="fullWidth">
      <nav className="mb-4 flex items-center gap-2 text-sm text-slate-500">
        <Link to="/learn" className="hover:text-brand-700">
          Dashboard
        </Link>
        <span>/</span>
        <span className="text-slate-800 font-medium">Study planner</span>
      </nav>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Smart Study Planner"
          subtitle="Plan study tasks, track deadlines, and auto-sync upcoming course assignments."
        />
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/learn"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            ← Back to dashboard
          </Link>
          <Button
            variant="outline"
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? 'Generating...' : '✨ Generate AI Study Suggestions'}
          </Button>
          <Button onClick={handleOpenCreate}>+ Add Personal Task</Button>
        </div>
      </div>

      {actionMessage ? (
        <div className="mb-6 rounded-lg border border-brand-200 bg-brand-50 p-4 text-sm font-medium text-brand-800">
          {actionMessage}
        </div>
      ) : null}

      {/* Stats Cards */}
      {stats ? (
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <Card>
            <CardBody className="p-4 text-center">
              <p className="text-xs font-semibold text-slate-500 uppercase">Total Tasks</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{stats.totalTasks}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="p-4 text-center">
              <p className="text-xs font-semibold text-slate-500 uppercase">Completed</p>
              <p className="mt-1 text-2xl font-bold text-emerald-600">{stats.completedTasks}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="p-4 text-center">
              <p className="text-xs font-semibold text-slate-500 uppercase">Completion Rate</p>
              <p className="mt-1 text-2xl font-bold text-brand-600">{stats.completionRate}%</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="p-4 text-center">
              <p className="text-xs font-semibold text-slate-500 uppercase">Due This Week</p>
              <p className="mt-1 text-2xl font-bold text-amber-600">{stats.tasksDueThisWeek}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="p-4 text-center">
              <p className="text-xs font-semibold text-slate-500 uppercase">Overdue</p>
              <p className="mt-1 text-2xl font-bold text-rose-600">{stats.overdueTasks}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="p-4 text-center">
              <p className="text-xs font-semibold text-slate-500 uppercase">Remaining Study</p>
              <p className="mt-1 text-2xl font-bold text-indigo-600">
                {Math.round(stats.remainingStudyMinutes / 60)} hrs
              </p>
            </CardBody>
          </Card>
        </div>
      ) : null}

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader title="Filter Study Tasks" />
        <CardBody className="grid gap-4 sm:grid-cols-3">
          <Select
            label="Status"
            placeholder="All Statuses"
            value={statusFilter}
            options={[
              { value: 'todo', label: 'To Do' },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'completed', label: 'Completed' },
            ]}
            onChange={(e) => setStatusFilter(e.target.value as StudyTaskStatus | '')}
          />
          <Select
            label="Priority"
            placeholder="All Priorities"
            value={priorityFilter}
            options={[
              { value: 'high', label: 'High Priority (0-2 days)' },
              { value: 'medium', label: 'Medium Priority (3-7 days)' },
              { value: 'low', label: 'Low Priority (>7 days)' },
            ]}
            onChange={(e) => setPriorityFilter(e.target.value as StudyTaskPriority | '')}
          />
          <Select
            label="Course"
            placeholder="All Enrolled Courses"
            value={courseFilter}
            options={
              enrollments?.items?.map((item: any) => ({
                value: typeof item.course === 'object' ? item.course.id : item.course,
                label: typeof item.course === 'object' ? item.course.title : 'Course',
              })) || []
            }
            onChange={(e) => setCourseFilter(e.target.value)}
          />
        </CardBody>
      </Card>

      {/* Task List */}
      <Card>
        <CardHeader
          title="My Study Tasks"
          subtitle={tasks ? `${tasks.length} task(s) found` : 'Loading...'}
        />
        <CardBody>
          {isLoading ? (
            <SkeletonRows rows={5} columns={4} />
          ) : isError ? (
            <p className="text-sm text-rose-600">Failed to load study tasks.</p>
          ) : tasks && tasks.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-lg font-medium text-slate-700">No study tasks found</p>
              <p className="mt-1 text-sm text-slate-500">
                Click "Generate AI Study Suggestions" above to auto-create study tasks from your course assignments, or add a personal task!
              </p>
              <div className="mt-4 flex justify-center gap-3">
                <Button variant="outline" onClick={handleGenerate}>
                  ✨ Generate Suggestions
                </Button>
                <Button onClick={handleOpenCreate}>+ Add Task</Button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {tasks?.map((task) => (
                <div
                  key={task.id}
                  className={`flex flex-col gap-3 py-4 transition-colors sm:flex-row sm:items-center sm:justify-between ${
                    task.status === 'completed' ? 'opacity-70' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => handleStatusToggle(task)}
                      className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                        task.status === 'completed'
                          ? 'border-emerald-600 bg-emerald-600 text-white'
                          : task.status === 'in_progress'
                            ? 'border-brand-500 bg-brand-50 text-brand-600'
                            : 'border-slate-300 hover:border-slate-400'
                      }`}
                    >
                      {task.status === 'completed' ? '✓' : task.status === 'in_progress' ? '▶' : ''}
                    </button>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4
                          className={`text-base font-semibold text-slate-900 ${
                            task.status === 'completed' ? 'line-through text-slate-500' : ''
                          }`}
                        >
                          {task.title}
                        </h4>
                        <Badge tone={priorityTone(task.priority)}>{task.priority} priority</Badge>
                        <Badge tone={statusTone(task.status)}>
                          {task.status.replace('_', ' ')}
                        </Badge>
                        {task.source === 'assignment' ? (
                          <Badge tone="info">Course Assignment</Badge>
                        ) : null}
                      </div>
                      {task.description ? (
                        <p className="mt-1 text-sm text-slate-600">{task.description}</p>
                      ) : null}
                      <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                        {task.course ? <span>📚 {task.course.title}</span> : null}
                        <span>📅 Due: {formatDate(task.dueDate)}</span>
                        <span>⏱️ Est: {task.estimatedStudyMinutes} mins</span>
                        {task.completedAt ? (
                          <span className="text-emerald-600">
                            Completed: {formatDate(task.completedAt)}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2 sm:self-center">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleStatusToggle(task)}
                    >
                      {task.status === 'completed'
                        ? 'Reopen'
                        : task.status === 'todo'
                          ? 'Start'
                          : 'Complete'}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => openEditModal(task)}>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-rose-600 hover:bg-rose-50"
                      onClick={() => setConfirmDeleteId(task.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isCreateOpen || editingTask !== null}
        title={editingTask ? 'Edit Study Task' : 'Create Personal Study Task'}
        onClose={() => {
          setIsCreateOpen(false);
          setEditingTask(null);
        }}
      >
        <form onSubmit={handleSaveTask} className="space-y-4">
          <Input
            label="Task Title *"
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            placeholder="e.g. Read Chapter 4 & take notes"
            required
          />
          <Textarea
            label="Description"
            value={taskDescription}
            onChange={(e) => setTaskDescription(e.target.value)}
            placeholder="Details, key concepts, or revision notes..."
            rows={3}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Due Date *"
              type="date"
              value={taskDueDate}
              onChange={(e) => setTaskDueDate(e.target.value)}
              required
            />
            <Input
              label="Estimated Study Time (minutes) *"
              type="number"
              min={5}
              max={720}
              value={taskMinutes}
              onChange={(e) => setTaskMinutes(Number(e.target.value))}
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Priority"
              value={taskPriority}
              options={[
                { value: 'high', label: 'High' },
                { value: 'medium', label: 'Medium' },
                { value: 'low', label: 'Low' },
              ]}
              onChange={(e) => setTaskPriority(e.target.value as StudyTaskPriority)}
            />
            <Select
              label="Related Course (Optional)"
              placeholder="No course linked"
              value={taskCourseId}
              options={
                enrollments?.items?.map((item: any) => ({
                  value: typeof item.course === 'object' ? item.course.id : item.course,
                  label: typeof item.course === 'object' ? item.course.title : 'Course',
                })) || []
              }
              onChange={(e) => setTaskCourseId(e.target.value)}
            />
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsCreateOpen(false);
                setEditingTask(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating}>
              {editingTask ? 'Save Changes' : 'Create Task'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={confirmDeleteId !== null}
        title="Delete Study Task"
        size="sm"
        onClose={() => setConfirmDeleteId(null)}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => confirmDeleteId && handleDelete(confirmDeleteId)}
            >
              Delete
            </Button>
          </div>
        }
      >
        <p className="text-sm text-slate-600">
          Are you sure you want to delete this study task? This action cannot be undone.
        </p>
      </Modal>
    </AppShell>
  );
}
