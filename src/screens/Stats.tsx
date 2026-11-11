import { useState } from 'react';
import { CircleCheck, Flame, Gauge, Target } from 'lucide-react';
import { useStore } from '../store';
import { activeDays, computeRange, computeStreak } from '../stats';
import type { Bucket, StatsRange } from '../stats';
import type { Tab } from '../types';
import {
  WEEKDAYS,
  addDays,
  compactMinutes,
  formatMinutes,
  parseKey,
  todayKey,
} from '../utils';

function BarChart({ buckets }: { buckets: Bucket[] }) {
  const max = Math.max(...buckets.map(b => b.seconds), 1);
  return (
    <div
      className="flex items-end gap-2"
      role="img"
      aria-label="Focus time chart"
    >
      {buckets.map(b => {
        const pct = b.seconds > 0 ? Math.max(4, (b.seconds / max) * 100) : 0;
        return (
          <div
            key={b.label + b.sub}
            className="flex min-w-0 flex-1 flex-col items-center gap-1"
          >
            <span className="h-4 text-[10px] font-medium text-ink">
              {b.seconds > 0 ? compactMinutes(b.seconds) : ''}
            </span>
            <div className="flex h-32 w-full items-end">
              <div
                className={`w-full rounded-t-md ${b.seconds === 0 ? 'bg-slate-200' : b.highlight ? 'bg-accent' : 'bg-navy'}`}
                style={{ height: b.seconds === 0 ? 3 : `${pct}%` }}
              />
            </div>
            <span className="text-xs font-medium text-ink">{b.label}</span>
            <span className="text-[10px] text-muted">{b.sub}</span>
          </div>
        );
      })}
    </div>
  );
}

function PieChart({ buckets }: { buckets: Bucket[] }) {
  const total = buckets.reduce((s, b) => s + b.seconds, 0);
  const colors = ['#0F1A2E', '#3B9BEA', '#8B7FD4', '#34D399', '#F59E0B', '#EC4899', '#64748B'];
  if (total === 0) {
    return <p className="py-8 text-center text-sm text-muted">No focus time in this period yet.</p>;
  }
  let cumulative = 0;
  const r = 80;
  const cx = 100;
  const cy = 100;
  const arcs = buckets
    .filter(b => b.seconds > 0)
    .map((b, i) => {
      const frac = b.seconds / total;
      const start = cumulative * 2 * Math.PI;
      cumulative += frac;
      const end = cumulative * 2 * Math.PI;
      const x1 = cx + r * Math.sin(start);
      const y1 = cy - r * Math.cos(start);
      const x2 = cx + r * Math.sin(end);
      const y2 = cy - r * Math.cos(end);
      const large = frac > 0.5 ? 1 : 0;
      const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
      return { path, color: colors[i % colors.length], label: b.label, seconds: b.seconds };
    });
  return (
    <div className="flex flex-col items-center gap-4">
      <svg viewBox="0 0 200 200" className="h-48 w-48" role="img" aria-label="Focus time by period">
        {arcs.map((a, i) => (
          <path key={i} d={a.path} fill={a.color} stroke="white" strokeWidth="2" />
        ))}
        <circle cx={cx} cy={cy} r={44} fill="white" />
      </svg>
      <div className="grid w-full grid-cols-2 gap-x-4 gap-y-2">
        {arcs.map((a, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: a.color }} />
            <span className="truncate text-ink">{a.label}</span>
            <span className="ml-auto text-muted">{compactMinutes(a.seconds)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Stats({
  onNavigate,
}: {
  onNavigate: (tab: Tab) => void;
}) {
  const { data, updateSettings } = useStore();
  const [range, setRange] = useState<StatsRange>('today');
  const chartStyle = data.settings.chartStyle ?? 'bar';
  const stats = computeRange(range, data.sessions);
  const streak = computeStreak(data.sessions);
  const days = activeDays(data.sessions);
  const today = todayKey();
  const last7 = [6, 5, 4, 3, 2, 1, 0].map(n => addDays(today, -n));
  const todayMinutes = computeRange('today', data.sessions).totalSeconds / 60;
  const goal = data.settings.dailyGoalMinutes;
  const goalPct = Math.min(100, Math.round((todayMinutes / goal) * 100));
  const tabs: { key: StatsRange; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: 'week', label: 'Last Week' },
    { key: 'month', label: 'Last Month' },
  ];
  const maxCourse = Math.max(...stats.byCourse.map(c => c.seconds), 1);

  return (
    <div className="px-5 pb-8 pt-8">
      <h1 className="text-center text-xl font-semibold text-ink">My Stats</h1>
      <div className="mt-4 flex gap-6" role="tablist">
        {tabs.map(t => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={range === t.key}
            onClick={() => setRange(t.key)}
            className={`pb-1 text-base font-medium ${range === t.key ? 'border-b-2 border-navy text-navy' : 'text-muted'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6 text-center">
        <Flame className="mx-auto text-navy" size={44} />
        <p className="mt-1 text-2xl font-bold text-ink">
          {streak.current > 0
            ? `${streak.current}-day streak`
            : 'No streak yet'}
        </p>
        <p className="text-sm text-muted">
          {streak.current > 0
            ? 'You’re doing great. Keep the flow going!'
            : 'Finish a focus session today to start one.'}
        </p>
        <div
          className="mt-3 flex justify-center gap-2"
          aria-label="Last 7 days"
        >
          {last7.map(k => (
            <div key={k} className="flex flex-col items-center gap-1">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold ${days.has(k) ? 'bg-navy text-white' : 'bg-mist text-muted'}`}
              >
                {WEEKDAYS[parseKey(k).getDay()].charAt(0)}
              </span>
            </div>
          ))}
        </div>
        {streak.longest > streak.current ? (
          <p className="mt-2 text-xs text-muted">
            Longest streak: {streak.longest} days
          </p>
        ) : null}
      </div>

      <p className="mt-5 text-center text-sm text-muted">{stats.rangeLabel}</p>
      <div className="mt-2 rounded-3xl bg-blush p-6 text-center">
        <p className="text-sm text-ink">Total Focus Time</p>
        <p className="mt-1 text-3xl font-bold text-ink">
          {formatMinutes(stats.totalSeconds / 60)}
        </p>
      </div>

      {range !== 'today' ? (
        <div className="mt-4 rounded-3xl border border-slate-200 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-ink">
              {range === 'week' ? 'Focus time per day' : 'Focus time per week'}
            </p>
            <div className="flex gap-1 rounded-full bg-mist p-1">
              <button type="button" onClick={() => updateSettings({ chartStyle: 'bar' })} className={`rounded-full px-3 py-1 text-xs font-medium ${chartStyle === 'bar' ? 'bg-navy text-white' : 'text-muted'}`}>
                Bar
              </button>
              <button type="button" onClick={() => updateSettings({ chartStyle: 'pie' })} className={`rounded-full px-3 py-1 text-xs font-medium ${chartStyle === 'pie' ? 'bg-navy text-white' : 'text-muted'}`}>
                Pie
              </button>
            </div>
          </div>
          {chartStyle === 'bar' ? <BarChart buckets={stats.buckets} /> : <PieChart buckets={stats.buckets} />}
        </div>
      ) : (
        <div className="mt-4 rounded-3xl border border-slate-200 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 font-semibold text-ink">
              <Target size={16} /> Daily goal
            </span>
            <span className="text-muted">
              {formatMinutes(todayMinutes)} of {formatMinutes(goal)}
            </span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-mist">
            <div
              className="h-2 rounded-full bg-accent"
              style={{ width: `${goalPct}%` }}
            />
          </div>
          {stats.sessions.length > 0 ? (
            <ul className="mt-4 space-y-2">
              {stats.sessions.map(s => (
                <li
                  key={s.id}
                  className="flex items-center justify-between rounded-2xl bg-mist px-3 py-2 text-sm"
                >
                  <span className="font-medium text-ink">{s.course}</span>
                  <span className="text-muted">
                    {new Date(s.endedAt).toLocaleTimeString('en-GB', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    · {formatMinutes(s.actualSeconds / 60)}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="rounded-3xl bg-periwinkle p-5 text-center">
          <Gauge className="mx-auto mb-2 text-navy" size={28} />
          <p className="text-sm text-ink">Average</p>
          <p className="mt-1 text-xl font-semibold text-ink">
            {formatMinutes(stats.avgSeconds / 60)}
          </p>
        </div>
        <div className="rounded-3xl bg-mist p-5 text-center">
          <CircleCheck className="mx-auto mb-2 text-navy" size={28} />
          <p className="text-sm text-ink">Sessions Completed</p>
          <p className="mt-1 text-xl font-semibold text-ink">{stats.count}</p>
        </div>
      </div>

      {stats.count === 0 ? (
        <div className="mt-4 rounded-2xl bg-mist p-5 text-center">
          <p className="text-sm text-muted">
            No focus sessions in this period yet.
          </p>
          <button
            type="button"
            onClick={() => onNavigate('focus')}
            className="mt-3 rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white"
          >
            Start a session
          </button>
        </div>
      ) : (
        <>
          <div className="mt-4 rounded-3xl border border-slate-200 p-4">
            <p className="mb-3 text-sm font-semibold text-ink">
              Time by course
            </p>
            <div className="space-y-3">
              {stats.byCourse.slice(0, 5).map(c => (
                <div key={c.course}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="font-medium text-ink">{c.course}</span>
                    <span className="text-muted">
                      {formatMinutes(c.seconds / 60)}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-mist">
                    <div
                      className="h-2 rounded-full bg-navy"
                      style={{
                        width: `${Math.round((c.seconds / maxCourse) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <p className="mt-4 text-center text-sm text-muted">
            {stats.distractions === 0
              ? 'You stayed in the app for every session. Great focus!'
              : `You left the app ${stats.distractions} ${stats.distractions === 1 ? 'time' : 'times'} during focus sessions.`}
          </p>
        </>
      )}
    </div>
  );
}
