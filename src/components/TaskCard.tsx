import { Check } from 'lucide-react';
import type { ReactNode } from 'react';
import type { Task } from '../types';
import { formatDue, formatMinutes } from '../utils';

export default function TaskCard({
  task,
  seconds,
  onOpen,
  onToggle,
}: {
  task: Task;
  seconds: number;
  onOpen: () => void;
  onToggle: () => void;
}) {
  const done = task.isCompleted;
  const due = formatDue(task.dueDate);
  const parts: ReactNode[] = [];
  if (due && !done) {
    parts.push(
      <span key="due" className={due.overdue ? 'font-medium text-red-600' : ''}>
        {due.label}
      </span>
    );
  }
  if (seconds > 0)
    parts.push(<span key="log">{formatMinutes(seconds / 60)} logged</span>);
  if (parts.length === 0)
    parts.push(
      <span key="desc">{task.description || 'No time logged yet'}</span>
    );

  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border-2 bg-white px-4 py-3 ${done ? 'border-slate-300' : 'border-navy'}`}
    >
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Open ${task.course} ${task.title}`}
        className="min-w-0 flex-1 text-left"
      >
        <span className="mb-1 inline-block rounded-full bg-periwinkle px-2 py-0.5 text-xs font-medium text-navy">
          {task.course}
        </span>
        <span
          className={`block truncate text-base font-medium ${done ? 'text-slate-400 line-through' : 'text-ink'}`}
        >
          {task.title}
        </span>
        <span className="mt-0.5 block truncate text-sm text-muted">
          {parts.map((p, i) => (
            <span key={i}>
              {i > 0 ? ' · ' : ''}
              {p}
            </span>
          ))}
        </span>
      </button>
      <button
        type="button"
        role="checkbox"
        aria-checked={done}
        aria-label={`Mark ${task.title} as ${done ? 'not done' : 'done'}`}
        onClick={onToggle}
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${
          done
            ? 'border-slate-500 bg-slate-500 text-white'
            : 'border-navy text-transparent'
        }`}
      >
        <Check size={18} />
      </button>
    </div>
  );
}
