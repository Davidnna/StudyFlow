import type { ActiveTimer } from './types';

const pad = (n: number): string => String(n).padStart(2, '0');

export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function dayKey(input: number | Date): string {
  const d = typeof input === 'number' ? new Date(input) : input;
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayKey(): string {
  return dayKey(new Date());
}

export function parseKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(key: string, n: number): string {
  const d = parseKey(key);
  d.setDate(d.getDate() + n);
  return dayKey(d);
}

export function diffDays(a: string, b: string): number {
  return Math.round((parseKey(a).getTime() - parseKey(b).getTime()) / 86400000);
}

export function shortDate(key: string): string {
  return parseKey(key).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });
}

export function formatMinutes(totalMinutes: number): string {
  const m = Math.max(0, Math.round(totalMinutes));
  if (m < 60) return m === 1 ? '1 min' : `${m} mins`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r === 0 ? `${h}h` : `${h}h ${r} mins`;
}

export function compactMinutes(totalSeconds: number): string {
  const m = Math.round(totalSeconds / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r === 0 ? `${h}h` : `${h}h ${r}m`;
}

export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.ceil(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}

export function formatDue(
  due: string | null
): { label: string; overdue: boolean } | null {
  if (!due) return null;
  const diff = diffDays(due, todayKey());
  if (diff < 0) {
    return {
      label: diff === -1 ? 'Overdue by 1 day' : `Overdue by ${-diff} days`,
      overdue: true,
    };
  }
  if (diff === 0) return { label: 'Due today', overdue: false };
  if (diff === 1) return { label: 'Due tomorrow', overdue: false };
  if (diff < 7) return { label: `Due in ${diff} days`, overdue: false };
  return { label: `Due ${shortDate(due)}`, overdue: false };
}

export function initials(name: string): string {
  const parts = name
    .trim()
    .split(' ')
    .filter(p => p.length > 0);
  if (parts.length === 0) return 'S';
  const first = parts[0].charAt(0);
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
  return (first + last).toUpperCase();
}

export function isValidEmail(value: string): boolean {
  const v = value.trim();
  const at = v.indexOf('@');
  if (at < 1 || v.includes(' ')) return false;
  const dot = v.indexOf('.', at + 2);
  return dot > 0 && !v.endsWith('.');
}

export function elapsedMs(timer: ActiveTimer, now: number): number {
  return (
    timer.accumulatedMs +
    (timer.runningSince !== null ? now - timer.runningSince : 0)
  );
}

// Centre-crops an image to a square and returns it as a small JPEG data URL,
// the same treatment as a photo uploaded from the Profile screen. Used for
// social profile photos so they can be stored in the profile document rather
// than as a blob: URL, which disappears when the page closes.
export async function imageBlobToAvatar(
  blob: Blob,
  size = 256
): Promise<string | null> {
  const url = URL.createObjectURL(blob);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('image decode failed'));
      el.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const s = Math.min(img.width, img.height);
    ctx.drawImage(
      img,
      (img.width - s) / 2,
      (img.height - s) / 2,
      s,
      s,
      0,
      0,
      size,
      size
    );
    return canvas.toDataURL('image/jpeg', 0.8);
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}
