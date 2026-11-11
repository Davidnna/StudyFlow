import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { ArrowLeft, Bell, ChevronRight, Flame } from 'lucide-react';
import { Logo, Ring } from '../components/ui';

function FloatCard({ className, children }: { className: string; children: ReactNode }) {
  return <div className={`float absolute rounded-xl bg-white shadow-lg ${className}`}>{children}</div>;
}

function Line({ w, done = false }: { w: string; done?: boolean }) {
  return (
    <div className="mb-1.5 flex items-center gap-1.5">
      <span className={`h-2.5 w-2.5 rounded-sm ${done ? 'bg-accent' : 'border border-slate-400'}`} />
      <span className="h-1.5 rounded bg-slate-300" style={{ width: w }} />
    </div>
  );
}

function DrawnIllustration({ index }: { index: number }) {
  if (index === 0) {
    return (
      <div className="relative mx-auto h-64 w-72">
        <div className="absolute left-1/2 top-10 flex h-44 w-44 -translate-x-1/2 items-center justify-center rounded-3xl bg-navy shadow-xl">
          <Ring progress={0.35} size={124} stroke={8} color="#3B9BEA" track="#2B3A5A">
            <span className="font-display text-2xl font-bold text-white">25:00</span>
          </Ring>
        </div>
        <FloatCard className="left-0 top-2 w-24 p-2">
          <p className="mb-1 text-[9px] font-semibold text-navy">TASKS</p>
          <Line w="40px" done />
          <Line w="34px" done />
          <Line w="44px" />
        </FloatCard>
        <FloatCard className="right-0 top-6 w-20 overflow-hidden">
          <div className="bg-navy py-0.5 text-center text-[9px] font-semibold text-white">OCTOBER</div>
          <div className="py-1 text-center font-display text-2xl font-bold text-navy">26</div>
        </FloatCard>
        <FloatCard className="bottom-2 left-2 flex items-center gap-1 px-2 py-1">
          <Bell size={12} className="text-accent" />
          <span className="text-[10px] font-medium text-navy">Due tomorrow</span>
        </FloatCard>
        <FloatCard className="bottom-6 right-2 flex items-center gap-1 px-2 py-1">
          <Flame size={14} className="text-orange-500" />
          <span className="text-xs font-semibold text-navy">7 days</span>
        </FloatCard>
      </div>
    );
  }
  if (index === 1) {
    return (
      <div className="relative mx-auto h-64 w-72">
        <div className="absolute left-4 top-8 flex h-48 w-48 items-center justify-center rounded-full bg-gradient-to-br from-slate-600 to-navy shadow-2xl">
          <Ring progress={0.75} size={150} stroke={12} color="#2FE6D2" track="#1B2A45">
            <span className="font-display text-4xl font-bold text-[#2FE6D2]">75%</span>
          </Ring>
        </div>
        <div className="float absolute right-0 top-16 w-32 rotate-[-12deg] rounded-xl bg-navy p-3 shadow-xl">
          <div className="mb-1.5 flex items-center gap-1.5 text-[10px] text-white">
            <span className="text-accent">✓</span> Math Homework
          </div>
          <div className="mb-1.5 flex items-center gap-1.5 text-[10px] text-white">
            <span className="text-accent">✓</span> Read Chapter 3
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-300">
            <span className="h-2.5 w-2.5 rounded-sm border border-slate-400" /> Project Proposal
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="relative mx-auto h-64 w-72">
      <FloatCard className="left-0 top-6 w-28 p-2">
        <p className="mb-1 text-[9px] font-semibold text-navy">WEEKLY PROGRESS</p>
        <div className="flex h-16 items-end gap-1">
          {[40, 25, 55, 35, 60].map((h, i) => (
            <div key={i} className="w-full rounded-t bg-navy" style={{ height: `${h}%` }} />
          ))}
        </div>
      </FloatCard>
      <FloatCard className="right-0 top-2 flex items-center gap-1 bg-orange-100 px-3 py-2">
        <Flame size={16} className="text-orange-600" />
        <span className="font-display text-sm font-bold text-orange-900">STREAK: 35 DAYS</span>
      </FloatCard>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
        <Ring progress={0.75} size={150} stroke={12} color="#34D399" track="#DDE3EE">
          <span className="text-center text-[10px] font-semibold text-navy">COURSE COMPLETION</span>
          <span className="font-display text-3xl font-bold text-navy">75%</span>
        </Ring>
      </div>
    </div>
  );
}

const IMAGES = ['./resources/onboarding-1.png', './resources/onboarding-2.png', './resources/onboarding-3.png'];

const ALTS = [
  'A student studying at a desk with floating timer, task and progress cards',
  'A progress ring showing 75% next to a task checklist',
  'A student presenting weekly progress, a streak and course completion',
];

function Illustration({ index }: { index: number }) {
  const [failed, setFailed] = useState<Record<number, boolean>>({});
  if (failed[index]) return <DrawnIllustration index={index} />;
  return (
    <img
      src={IMAGES[index]}
      alt={ALTS[index]}
      className="max-h-72 w-auto max-w-full object-contain"
      onError={() => setFailed(prev => ({ ...prev, [index]: true }))}
    />
  );
}

const SLIDES = [
  'Focus better and study smarter. Cut out distractions.',
  'Build better study habits, and make every study session count.',
  'Track your progress easily and measure your improvement.',
];

const AUTO_ADVANCE_MS = 4000;

export default function Onboarding({
  onFinish,
  onBack,
}: {
  onFinish: (mode: 'signin' | 'signup') => void;
  onBack?: () => void;
}) {
  const [index, setIndex] = useState(0);
  const last = index === SLIDES.length - 1;

  useEffect(() => {
    const id = window.setTimeout(() => {
      setIndex(i => (i + 1) % SLIDES.length);
    }, AUTO_ADVANCE_MS);
    return () => window.clearTimeout(id);
  }, [index]);

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-white px-5 pb-8 pt-6">
      <div
        className="onboarding-bg-fade pointer-events-none absolute inset-0"
        style={{ background: 'linear-gradient(180deg, #334f90 0%, #0f172a 100%)' }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute"
        style={{
          left: '618.23px',
          top: '126.48px',
          width: '464px',
          height: '1010px',
          backgroundColor: '#0a2d40',
          transform: 'rotate(22.9deg)',
          transformOrigin: 'center',
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute shadow-[10px_0px_30px_0px_rgba(255,255,255,0.35)]"
        style={{
          left: '-482.73px',
          top: '-504.72px',
          width: '463px',
          height: '1010px',
          backgroundColor: '#195f83',
          transform: 'rotate(22.9deg)',
          transformOrigin: 'center',
        }}
        aria-hidden="true"
      />
      <div
        className="onboarding-logo-fade pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        aria-hidden="true"
      >
        <Logo size={56} light />
      </div>

      <div className="onboarding-in relative flex h-full flex-col">
        <div className="flex items-center justify-between">
          <button
            type="button"
            aria-label="Back"
            onClick={() => (index === 0 ? onBack?.() : setIndex(i => Math.max(0, i - 1)))}
            className={`p-2 text-[#0f172a] ${index === 0 && !onBack ? 'invisible' : ''}`}
          >
            <ArrowLeft size={24} />
          </button>
          <button type="button" onClick={() => onFinish('signin')} className="p-2 font-jersey text-xl text-[#0f172a]">
            Skip
          </button>
        </div>

        {/* Sliding track: all three slides sit side by side; translateX moves
            between them so the illustration and caption slide together as one
            unit, instead of a plain crossfade. */}
        <div className="relative z-10 flex-1 overflow-hidden bg-white">
          <div
            className="flex h-full transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {SLIDES.map((slide, i) => (
              <div key={i} className="flex h-full w-full shrink-0 flex-col items-center justify-center px-2">
                <div className="flex flex-1 items-center justify-center">
                  <Illustration index={i} />
                </div>
                <h1 className="mb-2 px-4 text-center font-jersey text-3xl leading-snug text-[#0f172a]">{slide}</h1>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6 mt-2 flex justify-center gap-2" aria-hidden="true">
          {SLIDES.map((_, i) => (
            <button
              key={`dot-${i}`}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-2.5 w-2.5 rounded-full transition-colors duration-300 ${
                i === index ? 'bg-[#0f172a]' : 'border border-slate-400'
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => (last ? onFinish('signup') : setIndex(i => i + 1))}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#0f172a] font-jersey text-2xl text-white"
        >
          {last ? 'Get Started' : 'Continue'}
          {last ? null : <ChevronRight size={20} />}
        </button>
      </div>
    </div>
  );
}
