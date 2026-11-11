import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import {
  Camera,
  Database,
  Download,
  Info,
  LogOut,
  Mail,
  Minus,
  Pencil,
  Plus,
  Settings as SettingsIcon,
  Trash2,
} from 'lucide-react';
import { Avatar, ConfirmDialog, Sheet, Toggle } from '../components/ui';
import { APP_NAME, SUPPORT_EMAIL } from '../config';
import { useStore } from '../store';

const FAQS: { q: string; a: string }[] = [
  {
    q: 'How does the focus timer work?',
    a: 'Pick a task and a goal length, then start. When time is up you get a summary and can take a short break. Ending early saves the time you completed if it is at least 1 minute.',
  },
  {
    q: 'What counts as leaving the app?',
    a: 'Switching to another app or locking your screen during a running focus session is logged as leaving the app. It never stops your timer.',
  },
  {
    q: 'Does StudyFlow work without internet?',
    a: 'Yes, once you have signed in. Your tasks and sessions are cached on this device, so you can study offline, and changes sync to your account automatically when you are back online. You need internet to sign in the first time.',
  },
  {
    q: 'How is my streak calculated?',
    a: 'Every day with at least one saved focus session counts. Miss a full day and the streak restarts.',
  },
  {
    q: 'How is task progress calculated?',
    a: 'Progress is the focus time logged on the task divided by its estimated time. Completed tasks show 100%.',
  },
  {
    q: 'Can I move my data to another phone?',
    a: 'Sign in with the same account on the other phone and your tasks and sessions will sync automatically. You can also use Export my data in Profile to download a backup file.',
  },
];

function Stepper({
  label,
  value,
  unit,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-[15px] text-slate-600">{label}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          disabled={value <= min}
          onClick={() => onChange(Math.max(min, value - step))}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-mist text-navy disabled:opacity-40"
        >
          <Minus size={14} />
        </button>
        <span className="tabular w-16 text-center text-sm font-medium">
          {value} {unit}
        </span>
        <button
          type="button"
          aria-label={`Increase ${label}`}
          disabled={value >= max}
          onClick={() => onChange(Math.min(max, value + step))}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-mist text-navy disabled:opacity-40"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}

type DeleteMethod = 'password' | 'google.com' | 'microsoft.com' | 'twitter.com';

const SOCIAL_LABELS: Record<Exclude<DeleteMethod, 'password'>, string> = {
  'google.com': 'Google',
  'microsoft.com': 'Microsoft',
  'twitter.com': 'X',
};

export default function Profile() {
  const {
    user,
    data,
    updateProfile,
    updateSettings,
    signOut,
    getAuthProviders,
    deleteAccount,
    loadSample,
    clearStudyData,
    notify,
    resendVerification,
  } = useStore();
  const { settings } = data;
  const fileRef = useRef<HTMLInputElement>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [taglineDraft, setTaglineDraft] = useState('');
  const [faqOpen, setFaqOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [confirm, setConfirm] = useState<'sample' | 'clear' | 'delete' | null>(
    null
  );
  const [reauthOpen, setReauthOpen] = useState(false);
  const [delProviders, setDelProviders] = useState<string[]>([]);
  const [delPassword, setDelPassword] = useState('');
  const [delBusy, setDelBusy] = useState(false);
  const [delError, setDelError] = useState<string | null>(null);

  const socialMethods = (
    Object.keys(SOCIAL_LABELS) as Array<keyof typeof SOCIAL_LABELS>
  ).filter(m => delProviders.includes(m));

  const openReauth = () => {
    setDelProviders(getAuthProviders());
    setDelPassword('');
    setDelError(null);
    setReauthOpen(true);
  };

  const closeReauth = () => {
    setReauthOpen(false);
    setDelPassword('');
    setDelError(null);
  };

  // Deleting needs a recent sign-in. The store re-authenticates first and
  // only then removes the data and the account, so a failed re-auth can never
  // leave someone with an account but no data.
  const runDelete = async (method: DeleteMethod) => {
    setDelError(null);
    setDelBusy(true);
    const result = await deleteAccount(
      method,
      method === 'password' ? delPassword : undefined
    );
    setDelBusy(false);
    if (result) setDelError(result);
  };

  const onPickAvatar = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : undefined;
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const size = 256;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
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
        updateProfile({ avatar: canvas.toDataURL('image/jpeg', 0.8) });
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const onReminders = (v: boolean) => {
    updateSettings({ remindersOn: v });
    if (
      v &&
      typeof Notification !== 'undefined' &&
      Notification.permission === 'default'
    ) {
      void Notification.requestPermission();
    }
  };

  const exportData = () => {
    const payload = {
      app: APP_NAME,
      exportedAt: new Date().toISOString(),
      user: { name: user ? user.name : '', email: user ? user.email : '' },
      tasks: data.tasks,
      sessions: data.sessions,
      settings: data.settings,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'studyflow-backup.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    notify('Backup downloaded');
  };

  const openEdit = () => {
    setNameDraft(user ? user.name : '');
    setTaglineDraft(user ? user.tagline : '');
    setEditOpen(true);
  };

  const saveEdit = () => {
    if (nameDraft.trim().length === 0) return;
    updateProfile({ name: nameDraft.trim(), tagline: taglineDraft.trim() });
    setEditOpen(false);
  };

  const rowCls =
    'flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-50 text-sm font-medium text-ink';

  return (
    <div className="px-5 pb-8 pt-8">
      <div className="flex flex-col items-center">
        <div className="relative">
          <Avatar user={user} size={104} />
          <button
            type="button"
            aria-label="Change profile photo"
            onClick={() => fileRef.current?.click()}
            className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-white text-navy shadow"
          >
            <Camera size={18} />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onPickAvatar}
            aria-label="Upload photo"
          />
        </div>
        <button
          type="button"
          onClick={openEdit}
          aria-label="Edit profile"
          className="mt-3 flex items-center gap-2"
        >
          <span className="text-2xl font-bold text-ink">
            {user ? user.name : ''}
          </span>
          <Pencil size={16} className="text-muted" />
        </button>
        <p className="text-sm text-muted">{user ? user.tagline : ''}</p>
        <p className="text-xs text-muted">{user ? user.email : ''}</p>
        {user && user.requiresEmailVerification && !user.emailVerified ? (
          <button type="button" onClick={() => void resendVerification()} className="mt-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
            Email not verified · Tap to resend
          </button>
        ) : null}
      </div>

      <section className="mt-6 rounded-3xl border border-slate-200 p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink">
            Productivity Settings
          </h2>
          <SettingsIcon size={22} className="text-slate-500" />
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[15px] text-slate-600">
              Focus session reminders
            </span>
            <Toggle
              checked={settings.remindersOn}
              onChange={onReminders}
              label="Focus session reminders"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[15px] text-slate-600">
              Auto-start next session
            </span>
            <Toggle
              checked={settings.autoStartNext}
              onChange={v => updateSettings({ autoStartNext: v })}
              label="Auto-start next session"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[15px] text-slate-600">
              Mute Notifications
            </span>
            <Toggle
              checked={settings.muteNotifications}
              onChange={v => updateSettings({ muteNotifications: v })}
              label="Mute Notifications"
            />
          </div>
        </div>
        <div className="mt-3 border-t border-slate-100 pt-2">
          <Stepper
            label="Focus length"
            value={settings.focusMinutes}
            unit="min"
            min={5}
            max={120}
            step={5}
            onChange={v => updateSettings({ focusMinutes: v })}
          />
          <Stepper
            label="Break length"
            value={settings.breakMinutes}
            unit="min"
            min={1}
            max={30}
            step={1}
            onChange={v => updateSettings({ breakMinutes: v })}
          />
          <Stepper
            label="Daily goal"
            value={settings.dailyGoalMinutes}
            unit="min"
            min={15}
            max={480}
            step={15}
            onChange={v => updateSettings({ dailyGoalMinutes: v })}
          />
        </div>
      </section>

      <section className="mt-4 rounded-3xl border border-slate-200 p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink">
            Help &amp; Support
          </h2>
          <Info size={22} className="text-slate-500" />
        </div>
        <div className="space-y-2">
          <a
            href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('StudyFlow feedback')}`}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-100 text-sm font-semibold text-navy"
          >
            <Mail size={18} /> Send feedback
          </a>
          <button
            type="button"
            onClick={() => setFaqOpen(true)}
            className={rowCls}
          >
            FAQs
          </button>
          <button
            type="button"
            onClick={() => setAboutOpen(true)}
            className={rowCls}
          >
            About StudyFlow
          </button>
        </div>
      </section>

      <section className="mt-4 rounded-3xl border border-slate-200 p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink">Your data</h2>
          <Database size={22} className="text-slate-500" />
        </div>
        <div className="space-y-2">
          <button type="button" onClick={exportData} className={rowCls}>
            <Download size={18} /> Export my data
          </button>
          <button
            type="button"
            onClick={() => setConfirm('sample')}
            className={rowCls}
          >
            Load sample data
          </button>
          <button
            type="button"
            onClick={() => setConfirm('clear')}
            className={rowCls}
          >
            Clear tasks and sessions
          </button>
        </div>
      </section>

      <hr className="my-6 border-slate-200" />
      <button
        type="button"
        onClick={signOut}
        className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-mist text-base font-medium text-navy"
      >
        Log Out <LogOut size={18} />
      </button>
      <button
        type="button"
        onClick={() => setConfirm('delete')}
        className="mt-4 flex w-full items-center justify-center gap-2 text-base font-medium text-ink"
      >
        Delete account <Trash2 size={18} className="text-red-700" />
      </button>

      <Sheet
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit profile"
      >
        <div className="space-y-3">
          <label className="block text-sm font-medium text-ink">
            Name
            <input
              value={nameDraft}
              onChange={e => setNameDraft(e.target.value)}
              className="mt-1 h-12 w-full rounded-2xl bg-mist px-4 text-base"
            />
          </label>
          <label className="block text-sm font-medium text-ink">
            Tagline
            <input
              value={taglineDraft}
              onChange={e => setTaglineDraft(e.target.value)}
              className="mt-1 h-12 w-full rounded-2xl bg-mist px-4 text-base"
            />
          </label>
          <button
            type="button"
            onClick={saveEdit}
            className="h-12 w-full rounded-2xl bg-navy font-semibold text-white"
          >
            Save
          </button>
        </div>
      </Sheet>

      <Sheet open={faqOpen} onClose={() => setFaqOpen(false)} title="FAQs">
        <div className="space-y-2">
          {FAQS.map(f => (
            <details key={f.q} className="rounded-2xl bg-mist px-4 py-3">
              <summary className="cursor-pointer text-sm font-semibold text-ink">
                {f.q}
              </summary>
              <p className="mt-2 text-sm text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </Sheet>

      <Sheet
        open={aboutOpen}
        onClose={() => setAboutOpen(false)}
        title="About StudyFlow"
      >
        <p className="text-sm text-muted">
          StudyFlow is a mobile study focus tracker built for students of Ebonyi
          State University (EBSU). It helps you plan tasks, stay focused with
          timed sessions and see your progress, even without internet.
        </p>
        <p className="mt-3 text-xs text-muted">
          Version 1.0 · Final year project
        </p>
      </Sheet>

      <ConfirmDialog
        open={confirm === 'sample'}
        title="Load sample data?"
        message="This replaces your current tasks and sessions with example data so you can explore the app."
        confirmLabel="Load sample"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          loadSample();
          setConfirm(null);
        }}
      />
      <ConfirmDialog
        open={confirm === 'clear'}
        title="Clear tasks and sessions?"
        message="All tasks and focus sessions will be permanently removed from your account, on every device."
        confirmLabel="Clear"
        danger
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          clearStudyData();
          setConfirm(null);
        }}
      />
      <ConfirmDialog
        open={confirm === 'delete'}
        title="Delete your account?"
        message="Your account, tasks and sessions will be permanently deleted from all your devices. This cannot be undone."
        confirmLabel="Delete account"
        danger
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          setConfirm(null);
          openReauth();
        }}
      />

      <Sheet open={reauthOpen} onClose={closeReauth} title="Confirm it's you">
        <div className="space-y-4">
          <p className="text-sm text-muted">
            To delete your account, sign in once more. This permanently deletes
            your account and all your tasks and sessions. It cannot be undone.
          </p>

          {delProviders.includes('password') ? (
            <div>
              <input
                type="password"
                value={delPassword}
                onChange={e => setDelPassword(e.target.value)}
                placeholder="Password"
                aria-label="Password"
                autoComplete="current-password"
                className="mb-2 h-12 w-full rounded-2xl bg-mist px-4 text-base placeholder:text-slate-500"
              />
              <button
                type="button"
                onClick={() => void runDelete('password')}
                disabled={delBusy || delPassword.length === 0}
                className="h-12 w-full rounded-2xl bg-red-600 font-semibold text-white disabled:opacity-60"
              >
                {delBusy ? 'Deleting\u2026' : 'Delete my account'}
              </button>
            </div>
          ) : null}

          {socialMethods.map(m => (
            <button
              key={m}
              type="button"
              onClick={() => void runDelete(m)}
              disabled={delBusy}
              className="h-12 w-full rounded-2xl border-2 border-red-600 font-semibold text-red-700 disabled:opacity-60"
            >
              {delBusy ? 'Deleting\u2026' : `Confirm with ${SOCIAL_LABELS[m]} and delete`}
            </button>
          ))}

          {delProviders.length === 0 ? (
            <p className="text-sm text-muted">
              Could not work out how you signed in. Sign out and back in, then try again.
            </p>
          ) : null}

          {delError ? (
            <p role="alert" className="text-sm font-medium text-red-600">
              {delError}
            </p>
          ) : null}

          <button
            type="button"
            onClick={closeReauth}
            className="h-10 w-full text-sm font-medium text-muted"
          >
            Cancel
          </button>
        </div>
      </Sheet>
    </div>
  );
}
