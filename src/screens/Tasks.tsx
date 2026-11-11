import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import TaskCard from '../components/TaskCard';
import TaskForm from '../components/TaskForm';
import { ConfirmDialog, Sheet } from '../components/ui';
import { useStore } from '../store';
import { sortPending, taskPercent, taskSeconds } from '../stats';
import type { Tab, Task, TaskInput } from '../types';
import { formatDue, formatMinutes } from '../utils';

export default function Tasks({
  onNavigate,
}: {
  onNavigate: (tab: Tab) => void;
}) {
  const {
    data,
    addTask,
    updateTask,
    toggleTask,
    deleteTask,
    startFocus,
    notify,
    loadSample,
  } = useStore();
  const [tab, setTab] = useState<'all' | 'completed'>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const pending = useMemo(
    () => sortPending(data.tasks.filter(t => !t.isCompleted)),
    [data.tasks]
  );
  const completed = useMemo(
    () =>
      data.tasks
        .filter(t => t.isCompleted)
        .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0)),
    [data.tasks]
  );
  const courses = useMemo(
    () => Array.from(new Set(data.tasks.map(t => t.course))),
    [data.tasks]
  );
  const list = tab === 'all' ? [...pending, ...completed] : completed;
  const detail = data.tasks.find(t => t.id === detailId) ?? null;

  const handleSave = (input: TaskInput) => {
    if (editing) {
      updateTask(editing.id, input);
      notify('Task updated');
    } else {
      addTask(input);
      notify('Task added');
    }
    setFormOpen(false);
    setEditing(null);
  };

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const detailSeconds = detail ? taskSeconds(data.sessions, detail.id) : 0;
  const detailPercent = detail ? taskPercent(detail, detailSeconds) : 0;
  const detailDue = detail ? formatDue(detail.dueDate) : null;

  return (
    <div className="relative min-h-full px-5 pb-32 pt-8">
      <h1 className="text-center text-xl font-semibold text-ink">My Tasks</h1>
      <div className="mt-4 flex gap-6" role="tablist">
        {(['all', 'completed'] as const).map(key => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`pb-1 text-base font-medium ${tab === key ? 'border-b-2 border-navy text-navy' : 'text-muted'}`}
          >
            {key === 'all' ? 'All' : 'Completed'}
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-3">
        {list.map(t => (
          <TaskCard
            key={t.id}
            task={t}
            seconds={taskSeconds(data.sessions, t.id)}
            onOpen={() => setDetailId(t.id)}
            onToggle={() => toggleTask(t.id)}
          />
        ))}
        {list.length === 0 ? (
          <div className="rounded-2xl bg-mist p-6 text-center">
            <p className="text-base font-medium text-ink">
              {tab === 'all' ? 'No tasks yet' : 'Nothing completed yet'}
            </p>
            <p className="mt-1 text-sm text-muted">
              {tab === 'all'
                ? 'Tap the + button to add your first task.'
                : 'Finished tasks will show up here.'}
            </p>
            {tab === 'all' && data.tasks.length === 0 ? (
              <button
                type="button"
                onClick={loadSample}
                className="mt-3 rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white"
              >
                Try with sample data
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      <button
        type="button"
        aria-label="Add task"
        onClick={openNew}
        className="absolute bottom-6 left-1/2 flex h-16 w-16 -translate-x-1/2 items-center justify-center rounded-full bg-navy text-white shadow-xl"
        style={{ position: 'fixed', bottom: 92, left: '50%' }}
      >
        <Plus size={30} />
      </button>

      <TaskForm
        open={formOpen}
        initial={editing}
        courses={courses}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSave={handleSave}
      />

      <Sheet
        open={detail !== null}
        onClose={() => setDetailId(null)}
        title="Task details"
      >
        {detail ? (
          <div>
            <span className="inline-block rounded-full bg-periwinkle px-2 py-0.5 text-xs font-medium text-navy">
              {detail.course}
            </span>
            <h3 className="mt-2 text-xl font-semibold text-ink">
              {detail.title}
            </h3>
            {detail.description ? (
              <p className="mt-1 text-sm text-muted">{detail.description}</p>
            ) : null}
            <p
              className={`mt-3 text-sm ${detailDue && detailDue.overdue && !detail.isCompleted ? 'font-medium text-red-600' : 'text-muted'}`}
            >
              {detailDue ? detailDue.label : 'No due date'} · Estimated{' '}
              {formatMinutes(detail.estimatedMinutes)}
            </p>
            <div className="mt-4 flex items-center gap-3">
              <div className="h-2 flex-1 rounded-full bg-mist">
                <div
                  className="h-2 rounded-full bg-accent"
                  style={{ width: `${detailPercent}%` }}
                />
              </div>
              <span className="text-sm font-medium">{detailPercent}%</span>
            </div>
            <p className="mt-1 text-xs text-muted">
              {formatMinutes(detailSeconds / 60)} of focus logged
            </p>
            <div className="mt-5 space-y-3">
              {!detail.isCompleted ? (
                <button
                  type="button"
                  onClick={() => {
                    startFocus(detail.id);
                    setDetailId(null);
                    onNavigate('focus');
                  }}
                  className="h-12 w-full rounded-2xl bg-navy font-semibold text-white"
                >
                  Start focus session
                </button>
              ) : null}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditing(detail);
                    setDetailId(null);
                    setFormOpen(true);
                  }}
                  className="h-12 flex-1 rounded-2xl bg-periwinkle font-semibold text-navy"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="h-12 flex-1 rounded-2xl bg-red-50 font-semibold text-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </Sheet>

      <ConfirmDialog
        open={confirmDelete && detail !== null}
        title="Delete this task?"
        message={
          detail
            ? `“${detail.title}” will be removed. Focus time already logged stays in your stats.`
            : ''
        }
        confirmLabel="Delete"
        danger
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          if (detail) deleteTask(detail.id);
          setConfirmDelete(false);
          setDetailId(null);
          notify('Task deleted');
        }}
      />
    </div>
  );
}
