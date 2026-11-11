import type { Session, Task } from './types';
import { addDays, parseKey, todayKey, uid } from './utils';

// Placeholder course codes and titles. Edit them to match the EBSU curriculum.
export function buildSample(): { tasks: Task[]; sessions: Session[] } {
  const today = todayKey();
  const now = Date.now();
  const startOfToday = parseKey(today).getTime();

  const make = (
    course: string,
    title: string,
    description: string,
    dueOffset: number | null,
    estimatedMinutes: number,
    done: boolean,
    age: number
  ): Task => ({
    id: uid(),
    course,
    title,
    description,
    dueDate: dueOffset === null ? null : addDays(today, dueOffset),
    estimatedMinutes,
    isCompleted: done,
    completedAt: done ? now - 86400000 : null,
    createdAt: now - age * 60000,
  });

  const t1 = make(
    'CSC 451',
    'Software Testing Assignment',
    'Write test cases for the login module',
    1,
    135,
    false,
    10
  );
  const t2 = make(
    'CSC 429',
    'Research Essay',
    'Compare Agile and Waterfall for student projects',
    3,
    180,
    false,
    20
  );
  const t3 = make('CSC 435', 'Reading', 'Chapters 5–7', 4, 90, false, 30);
  const t4 = make(
    'CSC 423',
    'Database Practical',
    'ER diagram and SQL queries',
    6,
    120,
    false,
    40
  );
  const t5 = make(
    'CSC 427',
    'Practicals',
    'Revise this week lab exercises',
    null,
    60,
    true,
    50
  );
  const t6 = make('CSC 411', 'Assignment', 'Exercises 1–10', -2, 45, true, 60);
  const open = [t1, t2, t3, t4];

  const sessions: Session[] = [];
  const push = (
    dayOffset: number,
    minutes: number,
    idx: number,
    task: Task
  ) => {
    const dayStart = parseKey(addDays(today, -dayOffset)).getTime();
    const end =
      dayOffset === 0
        ? Math.max(startOfToday + 60000 * (idx + 1), now - (3 - idx) * 120000)
        : dayStart + (1140 - idx * 150) * 60000;
    sessions.push({
      id: uid(),
      taskId: task.id,
      course: task.course,
      goalMinutes: minutes,
      actualSeconds: minutes * 60,
      startedAt: end - minutes * 60000,
      endedAt: end,
      status: 'completed',
      distractions: (idx + dayOffset) % 3 === 0 ? 1 : 0,
    });
  };

  const plan: Record<number, number[]> = {
    0: [25, 30, 25],
    1: [60, 60],
    2: [45, 40, 40],
    3: [85],
    4: [55, 50],
    5: [45],
    6: [50, 40],
  };
  for (let d = 0; d <= 6; d += 1) {
    plan[d].forEach((m, i) => push(d, m, i, open[(d + i) % 4]));
  }
  for (let d = 7; d < 28; d += 1) {
    if (d % 4 === 0) continue;
    push(d, 30 + ((d * 37) % 60), 0, open[d % 4]);
  }

  return { tasks: [t1, t2, t3, t4, t5, t6], sessions };
}
