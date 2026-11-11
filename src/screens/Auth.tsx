import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Field, Logo, Sheet } from '../components/ui';
import { useStore } from '../store';
import { isValidEmail } from '../utils';

type Mode = 'signin' | 'signup' | 'forgot';

function GoogleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l6-6C34.5 5.1 29.5 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21 21-9.4 21-21c0-1.4-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.9 18.9 13 24 13c3.1 0 5.8 1.1 8 3l6-6C34.5 5.1 29.5 3 24 3 16.3 3 9.7 7.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 45c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.1 36.4 26.7 37 24 37c-5.3 0-9.7-3.4-11.3-8.1l-6.5 5C9.6 40.5 16.3 45 24 45z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.2 5.6l6.2 5.2C40.9 36 44 30.6 44 24c0-1.4-.1-2.4-.4-3.5z" />
    </svg>
  );
}
function XIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#0f172a" aria-hidden="true">
      <path d="M18.9 2H22l-7.6 8.7L23.3 22h-7.1l-5.5-7.2L4.4 22H1.3l8.1-9.3L1 2h7.3l5 6.6L18.9 2zm-1.2 18h1.9L7.4 4h-2l12.3 16z" />
    </svg>
  );
}
function MicrosoftIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 23 23" aria-hidden="true">
      <rect x="1" y="1" width="10" height="10" fill="#f25022" />
      <rect x="12" y="1" width="10" height="10" fill="#7fba00" />
      <rect x="1" y="12" width="10" height="10" fill="#00a4ef" />
      <rect x="12" y="12" width="10" height="10" fill="#ffb900" />
    </svg>
  );
}
export default function AuthScreen({ initialMode = 'signin' }: { initialMode?: Mode }) {
  const { signUpEmail, signInEmail, signInGoogle, signInMicrosoft, signInX, resetPassword, notify, pendingLink, completeLink, cancelLink } = useStore();
  const [linkPassword, setLinkPassword] = useState('');
  const [linkBusy, setLinkBusy] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  const runLink = async (method: 'password' | 'google.com' | 'microsoft.com' | 'twitter.com') => {
    setLinkError(null);
    setLinkBusy(true);
    const result = await completeLink(method, method === 'password' ? linkPassword : undefined);
    setLinkBusy(false);
    if (result) setLinkError(result);
    else setLinkPassword('');
  };

  const closeLinkSheet = () => {
    setLinkError(null);
    setLinkPassword('');
    cancelLink();
  };
  const [mode, setMode] = useState<Mode>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const switchMode = (m: Mode) => {
    setMode(m);
    setError(null);
    setPassword('');
    setConfirm('');
    setShowPw(false);
  };

  const submit = async () => {
    setError(null);
    if (mode === 'signup' && name.trim().length === 0) {
      setError('Please enter your first name.');
      return;
    }
    if (!isValidEmail(email)) {
      setError('Enter a valid email address.');
      return;
    }
    if (mode === 'signin' && password.length === 0) {
      setError('Enter your password.');
      return;
    }
    if (mode === 'signup' && password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (mode === 'signup' && password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setBusy(true);
    let result: string | null;
    if (mode === 'signin') result = await signInEmail(email, password);
    else if (mode === 'signup') result = await signUpEmail(name, email, password);
    else result = await resetPassword(email);
    setBusy(false);
    if (result) {
      setError(result);
      return;
    }
    if (mode === 'forgot') {
      notify('Password reset email sent. Check your inbox.');
      switchMode('signin');
    }
  };

  const social = async (fn: () => Promise<string | null>) => {
    setError(null);
    setBusy(true);
    const result = await fn();
    setBusy(false);
    if (result) setError(result);
  };

  const heading = mode === 'signin' ? 'Login to your Account' : mode === 'signup' ? 'Create your Account' : 'Reset your password';
  const action = mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Sign up' : 'Send reset email';
  const eye = (
    <button type="button" aria-label={showPw ? 'Hide password' : 'Show password'} onClick={() => setShowPw(v => !v)} className="p-1 text-black/40">
      {showPw ? <EyeOff size={20} /> : <Eye size={20} />}
    </button>
  );

  return (
    <div className="relative h-full overflow-hidden bg-white">
      {/* Two soft glow accents from Figma, sitting just off the left and right edges */}
      <div
        className="pointer-events-none absolute rounded-full opacity-70 blur-3xl"
        style={{ left: '-333px', top: '261px', width: '340px', height: '340px', background: 'radial-gradient(circle, rgba(15,23,42,0.18), transparent 70%)' }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute rounded-full opacity-70 blur-3xl"
        style={{ right: '-170px', top: '135px', width: '340px', height: '340px', background: 'radial-gradient(circle, rgba(15,23,42,0.18), transparent 70%)' }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute"
        style={{ left: '618.23px', top: '126.48px', width: '464px', height: '1010px', backgroundColor: '#0a2d40', transform: 'rotate(22.9deg)', transformOrigin: 'center' }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute shadow-[10px_0px_30px_0px_rgba(255,255,255,0.35)]"
        style={{ left: '-482.73px', top: '-504.72px', width: '463px', height: '1010px', backgroundColor: '#195f83', transform: 'rotate(22.9deg)', transformOrigin: 'center' }}
        aria-hidden="true"
      />

      <div className="auth-in relative h-full overflow-y-auto px-5 pb-10 pt-14">
        <div className="mb-8 flex justify-center">
          <Logo size={72} />
        </div>
        <h1 className="mb-5 text-xl font-semibold text-black">{heading}</h1>
        <form
          className="space-y-[26px]"
          onSubmit={e => {
            e.preventDefault();
            void submit();
          }}
        >
          {mode === 'signup' ? <Field label="First name" value={name} onChange={setName} autoComplete="given-name" /> : null}
          <Field label="Email" value={email} onChange={setEmail} type="email" autoComplete="email" />
          {mode !== 'forgot' ? (
            <Field
              label="Password"
              value={password}
              onChange={setPassword}
              type={showPw ? 'text' : 'password'}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              right={eye}
            />
          ) : null}
          {mode === 'signup' ? (
            <Field label="Confirm Password" value={confirm} onChange={setConfirm} type={showPw ? 'text' : 'password'} autoComplete="new-password" />
          ) : null}
          {error ? (
            <p role="alert" className="text-sm font-medium text-red-600">
              {error}
            </p>
          ) : null}
          {mode === 'signin' ? (
            <button type="button" onClick={() => switchMode('forgot')} className="text-sm font-medium text-[#0f172a] underline">
              Forgot password?
            </button>
          ) : null}
          <button
            type="submit"
            disabled={busy}
            className="flex h-[60px] w-full items-center justify-center rounded-xl bg-[#0f172a] text-xl font-semibold text-white shadow-[0_0_3px_rgba(15,23,42,0.25)] disabled:opacity-60"
          >
            {busy ? 'Please wait\u2026' : action}
          </button>
        </form>

        {mode !== 'forgot' ? (
          <div className="mt-8 flex flex-col items-center gap-[30px]">
            <div className="flex items-center gap-1">
              <span className="h-px w-[10px] bg-black/20" />
              <p className="whitespace-nowrap text-sm text-black/30">Or {mode === 'signin' ? 'sign in' : 'sign up'} with</p>
              <span className="h-px w-[10px] bg-black/20" />
            </div>
            <div className="flex items-center gap-[50px]">
              <button
                type="button"
                aria-label="Continue with Google"
                disabled={busy}
                onClick={() => social(signInGoogle)}
                className="flex h-[46px] w-[46px] items-center justify-center rounded-full border-[1.2px] border-[#0f172a]"
              >
                <GoogleIcon />
              </button>
              <button
                type="button"
                aria-label="Continue with X"
                disabled={busy}
                onClick={() => social(signInX)}
                className="flex h-[46px] w-[46px] items-center justify-center rounded-full border-[1.2px] border-[#0f172a]"
              >
                <XIcon />
              </button>
              <button
                type="button"
                aria-label="Continue with Microsoft"
                disabled={busy}
                onClick={() => social(signInMicrosoft)}
                className="flex h-[46px] w-[46px] items-center justify-center rounded-full border-[1.2px] border-[#0f172a]"
              >
                <MicrosoftIcon />
              </button>
            </div>
          </div>
        ) : null}

        <p className="mt-10 flex items-center justify-center gap-1 text-center text-base">
          <span className="text-black/49">
            {mode === 'signup' ? 'Already have an account?' : mode === 'signin' ? 'Don\u2019t have an account?' : 'Remembered it?'}
          </span>
          <button type="button" onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')} className="font-semibold text-[#0f172a]">
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>

      <Sheet open={pendingLink !== null} onClose={closeLinkSheet} title="Link your accounts">
        {pendingLink ? (
          <div className="space-y-4">
            <p className="text-sm text-muted">
              An account already exists for <span className="font-medium text-ink">{pendingLink.email}</span>. We can't
              tell which method you used originally — pick it below and sign in that way once to link both to the same
              account.
            </p>

            <div>
              <input
                type="password"
                value={linkPassword}
                onChange={e => setLinkPassword(e.target.value)}
                placeholder="Password (if you signed up with email)"
                className="mb-2 h-12 w-full rounded-2xl bg-mist px-4 text-base placeholder:text-slate-500"
              />
              <button
                type="button"
                onClick={() => void runLink('password')}
                disabled={linkBusy || linkPassword.length === 0}
                className="h-12 w-full rounded-2xl bg-navy font-semibold text-white disabled:opacity-60"
              >
                {linkBusy ? 'Linking\u2026' : 'Sign in with password'}
              </button>
            </div>

            {linkError ? (
              <p role="alert" className="text-sm font-medium text-red-600">
                {linkError}
              </p>
            ) : null}

            <div className="flex items-center gap-1">
              <span className="h-px flex-1 bg-black/10" />
              <p className="text-xs text-black/30">or sign in with</p>
              <span className="h-px flex-1 bg-black/10" />
            </div>
            <div className="flex justify-center gap-[36px]">
              <button
                type="button"
                aria-label="Link with Google"
                disabled={linkBusy}
                onClick={() => void runLink('google.com')}
                className="flex h-12 w-12 items-center justify-center rounded-full border-[1.2px] border-[#0f172a]"
              >
                <GoogleIcon />
              </button>
              <button
                type="button"
                aria-label="Link with X"
                disabled={linkBusy}
                onClick={() => void runLink('twitter.com')}
                className="flex h-12 w-12 items-center justify-center rounded-full border-[1.2px] border-[#0f172a]"
              >
                <XIcon />
              </button>
              <button
                type="button"
                aria-label="Link with Microsoft"
                disabled={linkBusy}
                onClick={() => void runLink('microsoft.com')}
                className="flex h-12 w-12 items-center justify-center rounded-full border-[1.2px] border-[#0f172a]"
              >
                <MicrosoftIcon />
              </button>
            </div>

            <button type="button" onClick={closeLinkSheet} className="h-10 w-full text-sm font-medium text-muted">
              Cancel
            </button>
          </div>
        ) : null}
      </Sheet>
    </div>
  );
}
