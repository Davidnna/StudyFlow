import { useMemo } from 'react';
import { CircleCheck, Clock, Flame } from 'lucide-react';
import TaskCard from '../components/TaskCard';
import { useStore } from '../store';
import {
  computeRange,
  computeStreak,
  sortPending,
  taskPercent,
  taskSeconds,
} from '../stats';
import type { Tab } from '../types';
import { formatDue, formatMinutes } from '../utils';

export default function Home({
  onNavigate,
}: {
  onNavigate: (tab: Tab) => void;
}) {
  const { user, data, startFocus, toggleTask, loadSample } = useStore();
  const pending = useMemo(
    () => sortPending(data.tasks.filter(t => !t.isCompleted)),
    [data.tasks]
  );
  const recent = useMemo(
    () =>
      data.tasks
        .filter(t => !t.isCompleted)
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 3),
    [data.tasks]
  );
  const focusTask = pending.length > 0 ? pending[0] : null;
  const today = computeRange('today', data.sessions);
  const streak = computeStreak(data.sessions);
  const firstName = user ? user.name.split(' ')[0] : '';
  const percent = focusTask
    ? taskPercent(focusTask, taskSeconds(data.sessions, focusTask.id))
    : 0;
  const due = focusTask ? formatDue(focusTask.dueDate) : null;

  const begin = () => {
    if (!data.timer) startFocus(focusTask ? focusTask.id : data.selectedTaskId);
    onNavigate('focus');
  };

  return (
    <div className="px-5 pb-6 pt-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">
            Hey {firstName} 👋
          </h1>
          <p className="text-sm text-muted">Let’s make today productive.</p>
        </div>
        {streak.current > 0 ? (
          <div className="flex items-center gap-1 rounded-full bg-orange-50 px-3 py-1.5 text-sm font-semibold text-orange-700">
            <Flame size={16} /> {streak.current}
          </div>
        ) : null}
      </div>

      <div
        className="mt-5 rounded-3xl p-6 text-white"
        style={{
          background: 'linear-gradient(180deg, #111A2C 0%, #56637C 100%)',
        }}
      >
        <p className="text-2xl font-semibold">Today’s Focus</p>
        {focusTask ? (
          <>
            <p className="mt-3 text-lg font-medium leading-snug">
              {focusTask.course} {focusTask.title}
            </p>
            <p
              className={`mt-1 text-sm ${due && due.overdue ? 'text-red-200' : 'text-slate-200'}`}
            >
              {due ? due.label : 'No due date'}
            </p>
            <div className="mt-4 flex items-center gap-3">
              <div className="h-1.5 flex-1 rounded-full bg-white/30">
                <div
                  className="h-1.5 rounded-full bg-accent"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <span className="text-sm text-slate-100">{percent}%</span>
            </div>
          </>
        ) : (
          <>
            <p className="mt-3 text-base text-slate-200">
              Nothing planned yet. Add a task to choose what to focus on.
            </p>
            <button
              type="button"
              onClick={() => onNavigate('tasks')}
              className="mt-4 rounded-full bg-white px-4 py-2 text-sm font-semibold text-navy"
            >
              Add a task
            </button>
          </>
        )}
      </div>

      <button
        type="button"
        onClick={begin}
        className="mt-4 h-14 w-full rounded-2xl bg-navy text-lg font-semibold text-white"
      >
        Start a focus session
      </button>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="rounded-3xl bg-blush p-5 text-center">
          <Clock className="mx-auto mb-2 text-navy" size={28} />
          <p className="text-sm text-ink">Focus Time Today</p>
          <p className="mt-1 text-xl font-semibold text-ink">
            {formatMinutes(today.totalSeconds / 60)}
          </p>
        </div>
        <div className="rounded-3xl bg-mist p-5 text-center">
          <CircleCheck className="mx-auto mb-2 text-navy" size={28} />
          <p className="text-sm text-ink">Sessions Completed</p>
          <p className="mt-1 text-xl font-semibold text-ink">{today.count}</p>
        </div>
      </div>

      <div className="mt-7 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-ink">Recent Tasks</h2>
        {recent.length > 0 ? (
          <button
            type="button"
            onClick={() => onNavigate('tasks')}
            className="text-sm font-medium text-navy underline"
          >
            See all
          </button>
        ) : null}
      </div>
      {recent.length > 0 ? (
        <div className="mt-3 space-y-3">
          {recent.map(t => (
            <TaskCard
              key={t.id}
              task={t}
              seconds={taskSeconds(data.sessions, t.id)}
              onOpen={() => onNavigate('tasks')}
              onToggle={() => toggleTask(t.id)}
            />
          ))}
        </div>
      ) : (
        <div className="mt-3 rounded-2xl bg-mist p-5 text-center">
          <p className="text-sm text-muted">
            New here? Add your first task, or explore the app with sample data.
          </p>
          <button
            type="button"
            onClick={loadSample}
            className="mt-3 rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white"
          >
            Try with sample data
          </button>
        </div>
      )}
    </div>
  );
}
