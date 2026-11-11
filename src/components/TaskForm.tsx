import { useEffect, useState } from 'react';
import { Sheet } from './ui';
import type { Task, TaskInput } from '../types';

const inputCls =
  'h-12 w-full rounded-2xl bg-mist px-4 text-base text-ink placeholder:text-slate-500';

export default function TaskForm({
  open,
  initial,
  courses,
  onClose,
  onSave,
}: {
  open: boolean;
  initial: Task | null;
  courses: string[];
  onClose: () => void;
  onSave: (input: TaskInput) => void;
}) {
  const [course, setCourse] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [estimate, setEstimate] = useState('60');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setCourse(initial ? initial.course : '');
    setTitle(initial ? initial.title : '');
    setDescription(initial ? initial.description : '');
    setDueDate(initial && initial.dueDate ? initial.dueDate : '');
    setEstimate(initial ? String(initial.estimatedMinutes) : '60');
    setError(null);
  }, [open, initial]);

  const submit = () => {
    if (title.trim().length === 0) {
      setError('Please enter a task title.');
      return;
    }
    const minutes = parseInt(estimate, 10);
    if (Number.isNaN(minutes) || minutes < 5 || minutes > 1440) {
      setError('Estimated time must be between 5 and 1440 minutes.');
      return;
    }
    onSave({
      course: course.trim().toUpperCase() || 'General',
      title: title.trim(),
      description: description.trim(),
      dueDate: dueDate || null,
      estimatedMinutes: minutes,
    });
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={initial ? 'Edit task' : 'New task'}
    >
      <div className="space-y-3">
        <label className="block text-sm font-medium text-ink">
          Course
          <input
            list="course-options"
            value={course}
            onChange={e => setCourse(e.target.value)}
            placeholder="e.g. CSC 451"
            className={`${inputCls} mt-1`}
          />
        </label>
        <datalist id="course-options">
          {courses.map(c => (
            <option key={c} value={c} />
          ))}
        </datalist>
        <label className="block text-sm font-medium text-ink">
          Title
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Software Testing Assignment"
            className={`${inputCls} mt-1`}
          />
        </label>
        <label className="block text-sm font-medium text-ink">
          Notes (optional)
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={2}
            placeholder="What needs to be done?"
            className="mt-1 w-full rounded-2xl bg-mist px-4 py-3 text-base text-ink placeholder:text-slate-500"
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-medium text-ink">
            Due date
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className={`${inputCls} mt-1`}
            />
          </label>
          <label className="block text-sm font-medium text-ink">
            Estimated minutes
            <input
              type="number"
              inputMode="numeric"
              min={5}
              value={estimate}
              onChange={e => setEstimate(e.target.value)}
              className={`${inputCls} mt-1`}
            />
          </label>
        </div>
        {error ? (
          <p role="alert" className="text-sm font-medium text-red-600">
            {error}
          </p>
        ) : null}
        <button
          type="button"
          onClick={submit}
          className="h-14 w-full rounded-2xl bg-navy text-base font-semibold text-white"
        >
          Save task
        </button>
      </div>
    </Sheet>
  );
}
