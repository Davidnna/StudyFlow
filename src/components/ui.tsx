import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import type { User } from '../types';
import { initials } from '../utils';

export function useNow(active: boolean): number {
  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    setNow(Date.now());
    if (!active) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [active]);
  return now;
}

export function Logo({
  size = 44,
  light = false,
}: {
  size?: number;
  light?: boolean;
}) {
  const c = light ? '#FFFFFF' : '#0F1A2E';
  const [imgFailed, setImgFailed] = useState(false);
  return (
    <div className="flex flex-col items-center gap-2">
      {imgFailed ? (
        <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
          <circle
            cx="24"
            cy="24"
            r="21"
            fill="none"
            stroke={c}
            strokeWidth="2.5"
          />
          <circle
            cx="24"
            cy="24"
            r="14"
            fill="none"
            stroke={c}
            strokeWidth="2.5"
          />
          <circle
            cx="24"
            cy="24"
            r="7"
            fill="none"
            stroke={c}
            strokeWidth="2.5"
          />
          <circle cx="24" cy="24" r="2.5" fill={c} />
          <path
            d="M31 17l7-7M34 9h5v5"
            stroke={c}
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <img
          src="./resources/logo-mark.png"
          alt=""
          width={size}
          height={size}
          className="rounded-full object-cover"
          style={{ width: size, height: size }}
          onError={() => setImgFailed(true)}
        />
      )}
      <span
        className="font-jersey text-3xl tracking-tight"
        style={{ color: c }}
      >
        StudyFlow
      </span>
    </div>
  );
}

export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="absolute inset-0 z-40 flex items-end"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        type="button"
        aria-label="Dismiss"
        tabIndex={-1}
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div className="sheet-in relative z-10 max-h-[90%] w-full overflow-y-auto rounded-t-3xl bg-white p-5 pb-8 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">{title}</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="rounded-full bg-mist p-2 text-navy"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  danger = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center p-6"
      role="alertdialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="absolute inset-0 bg-black/50" />
      <div className="sheet-in relative w-full rounded-3xl bg-white p-6 shadow-2xl">
        <h2 className="text-lg font-semibold text-ink">{title}</h2>
        <p className="mt-2 text-sm text-muted">{message}</p>
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="h-12 flex-1 rounded-2xl bg-mist font-medium text-navy"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`h-12 flex-1 rounded-2xl font-medium text-white ${danger ? 'bg-red-600' : 'bg-navy'}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? 'bg-navy' : 'bg-slate-300'}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`}
      />
    </button>
  );
}

export function Ring({
  progress,
  size = 250,
  stroke = 12,
  color = '#0F1A2E',
  track = '#E5E7EB',
  children,
}: {
  progress: number;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  children?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.min(1, Math.max(0, progress));
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={track}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - p)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
}

export function Avatar({
  user,
  size = 96,
}: {
  user: User | null;
  size?: number;
}) {
  // Browsers with strict tracking prevention (Edge "Balanced" and up) block
  // avatar hosts like pbs.twimg.com outright (ERR_BLOCKED_BY_CLIENT). So a
  // photo is tried directly first, then once through the wsrv.nl image proxy,
  // and if that also fails the initials circle is shown. Only real web URLs
  // are ever proxied: uploaded and Microsoft photos are data: URLs stored in
  // the profile and never leave the device. The privacy policy discloses the
  // proxy.
  const avatar = user?.avatar ?? null;
  const [stage, setStage] = useState<'direct' | 'proxy' | 'failed'>('direct');
  // Start over whenever the photo itself changes (e.g. a new upload), so one
  // failed photo doesn't force every later one through the proxy or the
  // initials circle.
  useEffect(() => {
    setStage('direct');
  }, [avatar]);
  const canProxy = avatar !== null && /^https?:\/\//i.test(avatar);
  const src =
    !avatar || stage === 'failed'
      ? null
      : stage === 'proxy'
        ? `https://wsrv.nl/?url=${encodeURIComponent(avatar)}`
        : avatar;
  if (user && src) {
    return (
      <img
        src={src}
        alt="Profile"
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
        onError={() =>
          setStage(s => (s === 'direct' && canProxy ? 'proxy' : 'failed'))
        }
      />
    );
  }
  return (
    <div
      className="flex items-center justify-center rounded-full bg-periwinkle font-semibold text-navy"
      style={{ width: size, height: size, fontSize: size / 3 }}
    >
      {initials(user ? user.name : '')}
    </div>
  );
}

export function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  autoComplete,
  right,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  right?: ReactNode;
}) {
  return (
    <div className="relative">
      <input
        aria-label={label}
        placeholder={placeholder ?? label}
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={e => onChange(e.target.value)}
        className="h-[60px] w-full rounded-xl bg-white px-[14px] pr-12 text-base text-black shadow-[0_0_3px_rgba(0,0,0,0.25)] placeholder:text-black/49"
      />
      {right ? (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">{right}</div>
      ) : null}
    </div>
  );
}
