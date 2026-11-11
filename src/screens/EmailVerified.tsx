import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Logo } from '../components/ui';
import { auth, applyActionCode } from '../firebase';

type Status = 'checking' | 'success' | 'already' | 'error';

// The actual page that opens when someone taps the verification link in
// their email — replaces Firebase's plain default confirmation page.
export default function EmailVerified({ oobCode, onDone }: { oobCode: string; onDone: () => void }) {
  const [status, setStatus] = useState<Status>('checking');

  useEffect(() => {
    let cancelled = false;
    applyActionCode(auth, oobCode)
      .then(() => {
        if (cancelled) return;
        setStatus('success');
        // If this link is opened on the same device/browser that's still
        // signed in, refresh the cached session so it reflects verified
        // status right away rather than waiting for the next poll.
        void auth.currentUser?.reload();
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        const code = e instanceof Error ? e.message : String(e);
        setStatus(code.includes('invalid-action-code') || code.includes('expired-action-code') ? 'already' : 'error');
      });
    return () => {
      cancelled = true;
    };
  }, [oobCode]);

  const content = {
    checking: {
      icon: <Loader2 size={32} className="animate-spin" />,
      title: 'Verifying\u2026',
      body: 'Hold on a moment.',
      iconBg: 'bg-periwinkle text-navy',
    },
    success: {
      icon: <CheckCircle2 size={32} />,
      title: 'Email verified!',
      body: 'Your account is confirmed. You can now sign in and start using StudyFlow.',
      iconBg: 'bg-green-100 text-green-700',
    },
    already: {
      icon: <CheckCircle2 size={32} />,
      title: 'Already verified',
      body: 'This link has already been used or has expired, but your email is likely already confirmed. Try signing in.',
      iconBg: 'bg-periwinkle text-navy',
    },
    error: {
      icon: <XCircle size={32} />,
      title: 'Something went wrong',
      body: "This link didn't work. Go back to the app and request a new verification email.",
      iconBg: 'bg-red-100 text-red-700',
    },
  }[status];

  return (
    <div
      className="relative flex h-full flex-col overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #334f90 0%, #0f172a 100%)' }}
    >
      <div className="flex justify-center pb-6 pt-10">
        <Logo size={44} light />
      </div>
      <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden rounded-t-[32px] bg-white px-8 pb-10 text-center">
        <div className={`mb-6 flex h-16 w-16 items-center justify-center rounded-full ${content.iconBg}`}>
          {content.icon}
        </div>
        <h1 className="mb-2 font-jersey text-3xl text-[#0f172a]">{content.title}</h1>
        <p className="mb-8 text-sm text-muted">{content.body}</p>
        {status !== 'checking' ? (
          <button
            type="button"
            onClick={onDone}
            className="flex h-14 w-full items-center justify-center rounded-2xl bg-[#0f172a] text-base font-semibold text-white"
          >
            Continue to StudyFlow
          </button>
        ) : null}
      </div>
    </div>
  );
}
