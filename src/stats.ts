import type { Session, Task } from './types';
import {
  WEEKDAYS,
  addDays,
  dayKey,
  parseKey,
  shortDate,
  todayKey,
} from './utils';

export type StatsRange = 'today' | 'week' | 'month';

export interface Bucket {
  label: string;
  sub: string;
  seconds: number;
  highlight: boolean;
}

export interface CourseTotal {
  course: string;
  seconds: number;
}

export interface RangeStats {
  rangeLabel: string;
  totalSeconds: number;
  count: number;
  avgSeconds: number;
  distractions: number;
  buckets: Bucket[];
  byCourse: CourseTotal[];
  sessions: Session[];
}

export function activeDays(sessions: Session[]): Set<string> {
  return new Set(sessions.map(s => dayKey(s.endedAt)));
}

export function computeStreak(sessions: Session[]): {
  current: number;
  longest: number;
} {
  const days = activeDays(sessions);
  const today = todayKey();
  const yesterday = addDays(today, -1);
  let cursor: string | null = days.has(today)
    ? today
    : days.has(yesterday)
      ? yesterday
      : null;
  let current = 0;
  while (cursor !== null && days.has(cursor)) {
    current += 1;
    cursor = addDays(cursor, -1);
  }
  const sorted = [...days].sort();
  let longest = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of sorted) {
    run = prev !== null && addDays(prev, 1) === d ? run + 1 : 1;
    if (run > longest) longest = run;
    prev = d;
  }
  return { current, longest };
}

function secondsIn(sessions: Session[], from: string, to: string): number {
  let total = 0;
  for (const s of sessions) {
    const k = dayKey(s.endedAt);
    if (k >= from && k <= to) total += s.actualSeconds;
  }
  return total;
}

export function computeRange(
  range: StatsRange,
  sessions: Session[]
): RangeStats {
  const today = todayKey();
  const startKey =
    range === 'today'
      ? today
      : range === 'week'
        ? addDays(today, -6)
        : addDays(today, -27);
  const inRange = sessions
    .filter(s => {
      const k = dayKey(s.endedAt);
      return k >= startKey && k <= today;
    })
    .sort((a, b) => b.endedAt - a.endedAt);
  const totalSeconds = inRange.reduce((sum, s) => sum + s.actualSeconds, 0);
  const count = inRange.length;
  const distractions = inRange.reduce((sum, s) => sum + s.distractions, 0);
  const buckets: Bucket[] = [];
  if (range === 'week') {
    for (let i = 0; i < 7; i += 1) {
      const key = addDays(startKey, i);
      buckets.push({
        label: WEEKDAYS[parseKey(key).getDay()],
        sub: shortDate(key),
        seconds: secondsIn(sessions, key, key),
        highlight: key === today,
      });
    }
  }
  if (range === 'month') {
    for (let w = 0; w < 4; w += 1) {
      const from = addDays(startKey, w * 7);
      const to = addDays(from, 6);
      buckets.push({
        label: `Wk ${w + 1}`,
        sub: shortDate(from),
        seconds: secondsIn(sessions, from, to),
        highlight: w === 3,
      });
    }
  }
  const courseMap = new Map<string, number>();
  for (const s of inRange) {
    const name = s.course || 'General';
    courseMap.set(name, (courseMap.get(name) ?? 0) + s.actualSeconds);
  }
  const byCourse = [...courseMap.entries()]
    .map(([course, seconds]) => ({ course, seconds }))
    .sort((a, b) => b.seconds - a.seconds);
  const rangeLabel =
    range === 'today'
      ? parseKey(today).toLocaleDateString('en-GB', {
          weekday: 'long',
          day: 'numeric',
          month: 'short',
        })
      : `${shortDate(startKey)} – ${shortDate(today)}`;
  return {
    rangeLabel,
    totalSeconds,
    count,
    avgSeconds: count > 0 ? totalSeconds / count : 0,
    distractions,
    buckets,
    byCourse,
    sessions: inRange,
  };
}

export function taskSeconds(sessions: Session[], taskId: string): number {
  return sessions
    .filter(s => s.taskId === taskId)
    .reduce((sum, s) => sum + s.actualSeconds, 0);
}

export function taskPercent(task: Task, seconds: number): number {
  if (task.isCompleted) return 100;
  if (task.estimatedMinutes <= 0) return 0;
  return Math.min(
    100,
    Math.round((seconds / (task.estimatedMinutes * 60)) * 100)
  );
}

export function sortPending(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    if (a.dueDate && b.dueDate && a.dueDate !== b.dueDate)
      return a.dueDate < b.dueDate ? -1 : 1;
    if (a.dueDate && !b.dueDate) return -1;
    if (!a.dueDate && b.dueDate) return 1;
    return b.createdAt - a.createdAt;
  });
}
