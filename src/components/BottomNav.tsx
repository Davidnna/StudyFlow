import { BarChart3, Home, ListChecks, Timer, UserRound } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Tab } from '../types';

const ITEMS: { tab: Tab; label: string; Icon: LucideIcon }[] = [
  { tab: 'home', label: 'Home', Icon: Home },
  { tab: 'focus', label: 'Focus', Icon: Timer },
  { tab: 'tasks', label: 'Tasks', Icon: ListChecks },
  { tab: 'stats', label: 'Stats', Icon: BarChart3 },
  { tab: 'profile', label: 'Profile', Icon: UserRound },
];

export default function BottomNav({
  tab,
  onChange,
  timerActive,
}: {
  tab: Tab;
  onChange: (t: Tab) => void;
  timerActive: boolean;
}) {
  return (
    <nav
      aria-label="Main"
      className="flex h-[72px] shrink-0 items-center justify-around bg-navy px-2 pb-1"
    >
      {ITEMS.map(({ tab: t, label, Icon }) => {
        const active = t === tab;
        return (
          <button
            key={t}
            type="button"
            aria-label={label}
            aria-current={active ? 'page' : undefined}
            onClick={() => onChange(t)}
            className={`relative flex h-12 items-center gap-2 rounded-full px-3 transition-all ${
              active ? 'bg-periwinkle text-navy' : 'text-slate-300'
            }`}
          >
            <Icon size={24} />
            {active ? (
              <span className="text-sm font-semibold">{label}</span>
            ) : null}
            {t === 'focus' && timerActive && !active ? (
              <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-accent" />
            ) : null}
          </button>
        );
      })}
    </nav>
  );
}
