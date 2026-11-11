import { useEffect, useRef, useState } from 'react';
import {
  Check,
  Coffee,
  ListChecks,
  Pause,
  Pencil,
  Play,
  Square,
  Target,
  Timer,
} from 'lucide-react';
import { Ring, Sheet, useNow } from '../components/ui';
import { GOAL_PRESETS, MIN_SAVE_SECONDS } from '../config';
import { useStore } from '../store';
import type { Tab } from '../types';
import { elapsedMs, formatClock, formatMinutes } from '../utils';

export default function Focus({
  onNavigate,
}: {
  onNavigate: (tab: Tab) => void;
}) {
  const {
    data,
    startFocus,
    pauseTimer,
    resumeTimer,
    startBreak,
    endTimer,
    selectTask,
    setGoal,
    dismissSummary,
    toggleTask,
  } = useStore();
  const { timer, summary, tasks, selectedTaskId, goalMinutes, settings } = data;
  const [pickTask, setPickTask] = useState(false);
  const [pickGoal, setPickGoal] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [customGoal, setCustomGoal] = useState('');
  const now = useNow(timer !== null && timer.runningSince !== null);

  // Keep the screen awake during an active focus session. A true system-level
  // Do Not Disturb toggle needs the native Android build (see project notes);
  // this is the closest a website is allowed to get.
  const wakeLockRef = useRef<{ release: () => Promise<void> } | null>(null);
  useEffect(() => {
    const isFocusRunning = timer !== null && timer.phase === 'focus' && timer.runningSince !== null;
    const nav = navigator as Navigator & { wakeLock?: { request: (type: 'screen') => Promise<{ release: () => Promise<void> }> } };
    if (isFocusRunning && nav.wakeLock) {
      nav.wakeLock
        .request('screen')
        .then(lock => {
          wakeLockRef.current = lock;
        })
        .catch(() => undefined);
    } else if (wakeLockRef.current) {
      wakeLockRef.current.release().catch(() => undefined);
      wakeLockRef.current = null;
    }
    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => undefined);
        wakeLockRef.current = null;
      }
    };
  }, [timer?.phase, timer?.runningSince]);

  const pending = tasks.filter(t => !t.isCompleted);
  const currentTask =
    tasks.find(t => t.id === (timer ? timer.taskId : selectedTaskId)) ?? null;

  if (summary) {
    const summaryTask = tasks.find(t => t.id === summary.taskId) ?? null;
    return (
      <div className="flex min-h-full flex-col px-5 pb-8 pt-12">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-navy text-white">
          <Check size={40} />
        </div>
        <h1 className="text-center text-2xl font-semibold text-ink">
          {summary.status === 'completed'
            ? 'Session complete'
            : 'Session saved'}
        </h1>
        <p className="mt-1 text-center text-muted">
          You focused for {formatMinutes(summary.actualSeconds / 60)}.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="rounded-3xl bg-periwinkle p-4 text-center">
            <p className="text-sm text-ink">Goal</p>
            <p className="text-lg font-semibold">
              {summary.goalMinutes} minutes
            </p>
          </div>
          <div className="rounded-3xl bg-mist p-4 text-center">
            <p className="text-sm text-ink">Left the app</p>
            <p className="text-lg font-semibold">
              {summary.distractions === 1
                ? '1 time'
                : `${summary.distractions} times`}
            </p>
          </div>
        </div>
        <p className="mt-4 text-center text-sm text-muted">
          {summaryTask
            ? `${summaryTask.course} ${summaryTask.title}`
            : 'Free focus session'}
        </p>
        <div className="mt-8 space-y-3">
          <button
            type="button"
            onClick={startBreak}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-navy text-base font-semibold text-white"
          >
            <Coffee size={20} /> Take a {settings.breakMinutes} min break
          </button>
          <button
            type="button"
            onClick={() => startFocus()}
            className="h-14 w-full rounded-2xl bg-periwinkle text-base font-semibold text-navy"
          >
            Start another session
          </button>
          {summaryTask && !summaryTask.isCompleted ? (
            <button
              type="button"
              onClick={() => toggleTask(summaryTask.id)}
              className="h-14 w-full rounded-2xl bg-mist text-base font-semibold text-navy"
            >
              Mark task as done
            </button>
          ) : null}
          <button
            type="button"
            onClick={dismissSummary}
            className="h-12 w-full text-base font-medium text-muted"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  const goalSeconds = timer ? timer.goalSeconds : goalMinutes * 60;
  const elapsed = timer ? elapsedMs(timer, now) : 0;
  const remaining = Math.max(0, goalSeconds - elapsed / 1000);
  const progress = goalSeconds > 0 ? elapsed / 1000 / goalSeconds : 0;
  const isBreak = timer !== null && timer.phase === 'break';
  const paused = timer !== null && timer.runningSince === null;
  const elapsedSeconds = Math.floor(elapsed / 1000);
  const canSave = elapsedSeconds >= MIN_SAVE_SECONDS;

  const message = isBreak
    ? 'Rest your eyes. Back soon.'
    : paused
      ? 'Paused. Take a breath.'
      : 'Stay focused. You’ve got this!';

  const applyCustom = () => {
    const n = parseInt(customGoal, 10);
    if (Number.isNaN(n)) return;
    setGoal(n);
    setCustomGoal('');
    setPickGoal(false);
  };

  return (
    <div className="flex min-h-full flex-col px-5 pb-6 pt-8">
      <h1 className="flex items-center justify-center gap-2 text-xl font-semibold text-ink">
        {isBreak ? 'Break time' : 'Focus Session'}{' '}
        {isBreak ? <Coffee size={20} /> : <Timer size={20} />}
      </h1>

      <div className="flex flex-1 items-center justify-center py-6">
        <Ring
          progress={progress}
          size={250}
          stroke={12}
          color={isBreak ? '#34D399' : '#0F1A2E'}
        >
          <span
            role="timer"
            aria-label="Time remaining"
            className="tabular text-6xl font-bold text-navy"
          >
            {formatClock(remaining)}
          </span>
          <span className="mt-1 text-sm text-muted">
            {isBreak ? 'break' : timer ? 'remaining' : 'ready'}
          </span>
        </Ring>
      </div>

      <p className="mb-1 text-center text-lg font-semibold text-ink">
        {message}
      </p>
      {timer && !isBreak ? (
        <p className="mb-4 text-center text-xs text-muted">Tip: turn on Do Not Disturb on your phone for deep focus.</p>
      ) : (
        <div className="mb-4" />
      )}

      {!timer ? (
        <button
          type="button"
          onClick={() => startFocus()}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-navy text-base font-semibold text-white"
        >
          <Play size={20} /> Start focus session
        </button>
      ) : isBreak ? (
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => startFocus()}
            className="h-14 flex-1 rounded-2xl bg-navy text-base font-semibold text-white"
          >
            Start next session
          </button>
          <button
            type="button"
            onClick={() => endTimer(false)}
            className="h-14 flex-1 rounded-2xl bg-mist text-base font-semibold text-navy"
          >
            End break
          </button>
        </div>
      ) : (
        <div className="flex gap-3">
          <button
            type="button"
            onClick={paused ? resumeTimer : pauseTimer}
            className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-navy text-base font-semibold text-white"
          >
            {paused ? <Play size={20} /> : <Pause size={20} />}{' '}
            {paused ? 'Resume' : 'Pause'}
          </button>
          <button
            type="button"
            onClick={() => setConfirmEnd(true)}
            className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-mist text-base font-semibold text-navy"
          >
            <Square size={18} /> End
          </button>
        </div>
      )}

      <div className="mt-5 grid grid-cols-2 gap-4">
        <div className="relative rounded-3xl bg-periwinkle p-5 text-center">
          {!timer ? (
            <button
              type="button"
              aria-label="Change current task"
              onClick={() => setPickTask(true)}
              className="absolute right-3 top-3 text-navy"
            >
              <Pencil size={16} />
            </button>
          ) : null}
          <ListChecks className="mx-auto mb-2 text-navy" size={28} />
          <p className="text-sm text-ink">Current Task</p>
          <p className="truncate text-lg font-semibold text-ink">
            {currentTask ? currentTask.course : 'Free focus'}
          </p>
        </div>
        <div className="relative rounded-3xl bg-mist p-5 text-center">
          {!timer ? (
            <button
              type="button"
              aria-label="Change session goal"
              onClick={() => setPickGoal(true)}
              className="absolute right-3 top-3 text-navy"
            >
              <Pencil size={16} />
            </button>
          ) : null}
          <Target className="mx-auto mb-2 text-navy" size={28} />
          <p className="text-sm text-ink">
            {isBreak ? 'Break Length' : 'Session Goal'}
          </p>
          <p className="text-lg font-semibold text-ink">
            {Math.round(goalSeconds / 60)} minutes
          </p>
        </div>
      </div>

      <Sheet
        open={pickTask}
        onClose={() => setPickTask(false)}
        title="Choose a task"
      >
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => {
              selectTask(null);
              setPickTask(false);
            }}
            className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left ${selectedTaskId === null ? 'bg-periwinkle' : 'bg-mist'}`}
          >
            <span className="font-medium">Free focus (no task)</span>
            {selectedTaskId === null ? <Check size={18} /> : null}
          </button>
          {pending.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                selectTask(t.id);
                setPickTask(false);
              }}
              className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left ${selectedTaskId === t.id ? 'bg-periwinkle' : 'bg-mist'}`}
            >
              <span className="min-w-0">
                <span className="block text-xs font-medium text-muted">
                  {t.course}
                </span>
                <span className="block truncate font-medium">{t.title}</span>
              </span>
              {selectedTaskId === t.id ? <Check size={18} /> : null}
            </button>
          ))}
          {pending.length === 0 ? (
            <button
              type="button"
              onClick={() => {
                setPickTask(false);
                onNavigate('tasks');
              }}
              className="w-full rounded-2xl bg-navy px-4 py-3 font-medium text-white"
            >
              No tasks yet. Add one
            </button>
          ) : null}
        </div>
      </Sheet>

      <Sheet
        open={pickGoal}
        onClose={() => setPickGoal(false)}
        title="Session goal"
      >
        <div className="flex flex-wrap gap-2">
          {GOAL_PRESETS.map(m => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setGoal(m);
                setPickGoal(false);
              }}
              className={`rounded-full px-4 py-2 text-sm font-medium ${goalMinutes === m ? 'bg-navy text-white' : 'bg-mist text-navy'}`}
            >
              {m} min
            </button>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={240}
            value={customGoal}
            onChange={e => setCustomGoal(e.target.value)}
            aria-label="Custom minutes"
            placeholder="Custom minutes (1–240)"
            className="h-12 flex-1 rounded-2xl bg-mist px-4 text-base placeholder:text-slate-500"
          />
          <button
            type="button"
            onClick={applyCustom}
            className="h-12 rounded-2xl bg-navy px-5 font-semibold text-white"
          >
            Set
          </button>
        </div>
      </Sheet>

      <Sheet
        open={confirmEnd}
        onClose={() => setConfirmEnd(false)}
        title="End this session?"
      >
        <p className="mb-4 text-sm text-muted">
          {canSave
            ? `You’ve focused for ${formatMinutes(elapsedSeconds / 60)}. Save it to your stats?`
            : 'Sessions shorter than 1 minute are not saved.'}
        </p>
        <div className="space-y-3">
          {canSave ? (
            <button
              type="button"
              onClick={() => {
                endTimer(true);
                setConfirmEnd(false);
              }}
              className="h-12 w-full rounded-2xl bg-navy font-semibold text-white"
            >
              Save and end
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => {
              endTimer(false);
              setConfirmEnd(false);
            }}
            className="h-12 w-full rounded-2xl bg-mist font-semibold text-navy"
          >
            Discard session
          </button>
          <button
            type="button"
            onClick={() => setConfirmEnd(false)}
            className="h-12 w-full font-medium text-muted"
          >
            Keep going
          </button>
        </div>
      </Sheet>
    </div>
  );
}
