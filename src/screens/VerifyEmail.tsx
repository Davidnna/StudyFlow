import { useEffect, useState } from 'react';
import { Mail, LogOut, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Logo } from '../components/ui';
import { useStore } from '../store';

const POLL_MS = 4000;

// Gates email/password accounts until the person clicks the link in their
// verification email. Polls automatically every 4s so no manual click is
// needed; the manual button stays as a way to check sooner.
export default function VerifyEmail() {
  const { user, resendVerification, refreshEmailVerified, signOut } = useStore();
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [justSent, setJustSent] = useState(false);

  useEffect(() => {
    const id = window.setInterval(() => {
      void refreshEmailVerified();
    }, POLL_MS);
    return () => window.clearInterval(id);
  }, [refreshEmailVerified]);

  const checkNow = async () => {
    setChecking(true);
    await refreshEmailVerified();
    setChecking(false);
  };

  const resend = async () => {
    setResending(true);
    await resendVerification();
    setResending(false);
    setJustSent(true);
    window.setTimeout(() => setJustSent(false), 4000);
  };

  return (
    <div
      className="relative flex h-full flex-col overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #334f90 0%, #0f172a 100%)' }}
    >
      <div className="flex justify-center pb-6 pt-10">
        <Logo size={44} light />
      </div>

      <div className="relative flex flex-1 flex-col overflow-hidden rounded-t-[32px] bg-white px-6 pb-8 pt-10">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-periwinkle">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-navy text-white">
            <Mail size={26} />
          </div>
        </div>

        <h1 className="mb-2 text-center font-jersey text-3xl text-[#0f172a]">Check your inbox</h1>
        <p className="mb-1 text-center text-sm text-muted">We sent a verification link to</p>
        <p className="mb-8 text-center text-base font-semibold text-ink">{user ? user.email : 'your email'}</p>

        <div className="mb-8 flex items-center justify-center gap-2 text-sm text-muted">
          <RefreshCw size={14} className="animate-spin" />
          <span>Checking automatically\u2026 this page will continue on its own</span>
        </div>

        <div className="mt-auto space-y-3">
          <button
            type="button"
            onClick={() => void checkNow()}
            disabled={checking}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-navy text-base font-semibold text-white disabled:opacity-60"
          >
            {checking ? <RefreshCw size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
            {checking ? 'Checking\u2026' : "I've verified — check now"}
          </button>
          <button
            type="button"
            onClick={() => void resend()}
            disabled={resending || justSent}
            className="h-12 w-full rounded-2xl bg-mist text-sm font-medium text-navy disabled:opacity-60"
          >
            {justSent ? 'Sent — check your inbox' : resending ? 'Sending\u2026' : 'Resend verification email'}
          </button>
          <p className="text-center text-xs text-muted">Not seeing it? Check your spam or junk folder.</p>
          <button
            type="button"
            onClick={signOut}
            className="mx-auto flex items-center gap-2 pt-2 text-sm font-medium text-muted"
          >
            <LogOut size={16} /> Sign out and use a different account
          </button>
        </div>
      </div>
    </div>
  );
}
