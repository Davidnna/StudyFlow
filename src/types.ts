export type Tab = 'home' | 'focus' | 'tasks' | 'stats' | 'profile';

export interface User {
  id: string;
  name: string;
  email: string;
  tagline: string;
  avatar: string | null;
  emailVerified: boolean;
  // Only email/password accounts need the verification gate. Google,
  // Microsoft and X already assert identity themselves, and X in particular
  // often supplies no verified email at all, so there's nothing to verify.
  requiresEmailVerification: boolean;
  createdAt: number;
}

export interface Task {
  id: string;
  course: string;
  title: string;
  description: string;
  dueDate: string | null;
  estimatedMinutes: number;
  isCompleted: boolean;
  completedAt: number | null;
  createdAt: number;
}

export type TaskInput = Pick<Task, 'course' | 'title' | 'description' | 'dueDate' | 'estimatedMinutes'>;

export interface Session {
  id: string;
  taskId: string | null;
  course: string;
  goalMinutes: number;
  actualSeconds: number;
  startedAt: number;
  endedAt: number;
  status: 'completed' | 'ended_early';
  distractions: number;
}

export interface Settings {
  remindersOn: boolean;
  autoStartNext: boolean;
  muteNotifications: boolean;
  focusMinutes: number;
  breakMinutes: number;
  dailyGoalMinutes: number;
  chartStyle: 'bar' | 'pie';
}

export interface ActiveTimer {
  phase: 'focus' | 'break';
  taskId: string | null;
  goalSeconds: number;
  accumulatedMs: number;
  runningSince: number | null;
  startedAt: number;
  distractions: number;
}

export interface UserData {
  tasks: Task[];
  sessions: Session[];
  settings: Settings;
  selectedTaskId: string | null;
  goalMinutes: number;
  timer: ActiveTimer | null;
  summary: Session | null;
}
