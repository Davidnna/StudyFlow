import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import BottomNav from './components/BottomNav';
import { KEYS } from './config';
import AuthScreen from './screens/Auth';
import Focus from './screens/Focus';
import Home from './screens/Home';
import Onboarding from './screens/Onboarding';
import Profile from './screens/Profile';
import EmailVerified from './screens/EmailVerified';
import Splash from './screens/Splash';
import Stats from './screens/Stats';
import Tasks from './screens/Tasks';
import VerifyEmail from './screens/VerifyEmail';
import { load, save } from './storage';
import { StoreProvider, useStore } from './store';
import type { Tab } from './types';

function Shell() {
  const { user, data, toast, authLoading } = useStore();
  const [verifyCode] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('mode') === 'verifyEmail' ? params.get('oobCode') : null;
  });
  const [verifyHandled, setVerifyHandled] = useState(false);
  const [splashDone, setSplashDone] = useState(false);
  const [splashKey, setSplashKey] = useState(0);
  const [onboarded, setOnboarded] = useState<boolean>(() =>
    load<boolean>(KEYS.onboarded, false)
  );
  const [tab, setTab] = useState<Tab>('home');
  const scrollRef = useRef<HTMLDivElement>(null);
  const userId = user ? user.id : null;

  useEffect(() => {
    setSplashDone(false);
    const id = window.setTimeout(() => setSplashDone(true), 1210);
    return () => window.clearTimeout(id);
  }, [splashKey]);

  const showSplash = !splashDone || authLoading;

  // Replays the full Splash 1 -> Splash 2 -> Onboarding 1 entrance, used when
  // the person taps Back on the first onboarding slide.
  const replaySplash = () => setSplashKey(k => k + 1);

  useEffect(() => {
    setTab('home');
  }, [userId]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [tab]);

  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  const finishOnboarding = (mode: 'signin' | 'signup') => {
    setAuthMode(mode);
    save(KEYS.onboarded, true);
    setOnboarded(true);
  };

  let body: ReactNode;
  if (verifyCode && !verifyHandled) {
    body = (
      <EmailVerified
        oobCode={verifyCode}
        onDone={() => {
          window.history.replaceState(null, '', window.location.pathname);
          setVerifyHandled(true);
        }}
      />
    );
  } else if (showSplash) {
    body = <Splash key={splashKey} />;
  } else if (!onboarded) {
    body = <Onboarding onFinish={finishOnboarding} onBack={replaySplash} />;
  } else if (!user) {
    body = <AuthScreen initialMode={authMode} />;
  } else if (user.requiresEmailVerification && !user.emailVerified) {
    body = <VerifyEmail />;
  } else {
    const screen =
      tab === 'home' ? (
        <Home onNavigate={setTab} />
      ) : tab === 'focus' ? (
        <Focus onNavigate={setTab} />
      ) : tab === 'tasks' ? (
        <Tasks onNavigate={setTab} />
      ) : tab === 'stats' ? (
        <Stats onNavigate={setTab} />
      ) : (
        <Profile />
      );
    body = (
      <>
        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
          {screen}
        </div>
        <BottomNav
          tab={tab}
          onChange={setTab}
          timerActive={data.timer !== null}
        />
      </>
    );
  }

  return (
    <div className="flex h-[100dvh] w-full justify-center bg-slate-200">
      <div className="relative flex h-full w-full max-w-[430px] flex-col overflow-hidden bg-white shadow-2xl">
        {body}
        {toast ? (
          <div
            role="status"
            className="pointer-events-none absolute bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-navy px-4 py-2 text-sm text-white shadow-lg"
          >
            {toast}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}
