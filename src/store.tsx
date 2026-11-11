import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  auth,
  db,
  googleProvider,
  microsoftProvider,
  twitterProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateAuthProfile,
  onAuthStateChanged,
  firebaseSignOut,
  deleteUser,
  linkWithCredential,
  EmailAuthProvider,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
  TwitterAuthProvider,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  onSnapshot,
} from './firebase';
import type { AuthCredential } from './firebase';
import { DEFAULT_SETTINGS, MIN_SAVE_SECONDS } from './config';
import { buildSample } from './sample';
import type { ActiveTimer, Session, Settings, Task, TaskInput, User, UserData } from './types';
import { elapsedMs, imageBlobToAvatar, uid } from './utils';

export interface PendingLink {
  email: string;
}

interface Store {
  user: User | null;
  authLoading: boolean;
  data: UserData;
  toast: string | null;
  pendingLink: PendingLink | null;
  notify: (message: string) => void;
  signUpEmail: (name: string, email: string, password: string) => Promise<string | null>;
  signInEmail: (email: string, password: string) => Promise<string | null>;
  signInGoogle: () => Promise<string | null>;
  signInMicrosoft: () => Promise<string | null>;
  signInX: () => Promise<string | null>;
  completeLink: (method: 'password' | 'google.com' | 'microsoft.com' | 'twitter.com', password?: string) => Promise<string | null>;
  cancelLink: () => void;
  resendVerification: () => Promise<void>;
  refreshEmailVerified: () => Promise<void>;
  resetPassword: (email: string) => Promise<string | null>;
  signOut: () => void;
  getAuthProviders: () => string[];
  deleteAccount: (
    method: 'password' | 'google.com' | 'microsoft.com' | 'twitter.com',
    password?: string
  ) => Promise<string | null>;
  updateProfile: (patch: Partial<Pick<User, 'name' | 'tagline' | 'avatar'>>) => void;
  addTask: (input: TaskInput) => Task;
  updateTask: (id: string, patch: Partial<TaskInput>) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  selectTask: (id: string | null) => void;
  setGoal: (minutes: number) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  startFocus: (taskId?: string | null) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  startBreak: () => void;
  endTimer: (saveSession: boolean) => void;
  dismissSummary: () => void;
  loadSample: () => void;
  clearStudyData: () => void;
}

const StoreContext = createContext<Store | null>(null);

export function useStore(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}

function defaultData(): UserData {
  return {
    tasks: [],
    sessions: [],
    settings: { ...DEFAULT_SETTINGS },
    selectedTaskId: null,
    goalMinutes: DEFAULT_SETTINGS.focusMinutes,
    timer: null,
    summary: null,
  };
}

function beep(): void {
  try {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    osc.start();
    osc.stop(ctx.currentTime + 0.8);
  } catch {
    // Sound is optional.
  }
}

function alertEnd(phase: 'focus' | 'break', settings: Settings): void {
  if (settings.muteNotifications) return;
  try {
    navigator.vibrate([200, 100, 200]);
  } catch {
    // Vibration is optional.
  }
  beep();
  if (settings.remindersOn && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    try {
      new Notification(phase === 'focus' ? 'Focus session complete' : 'Break is over', {
        body: phase === 'focus' ? 'Great work. Time for a short break.' : 'Ready for the next session?',
      });
    } catch {
      // Notifications are optional.
    }
  }
}

function buildSession(d: UserData, t: ActiveTimer, seconds: number, status: Session['status']): Session {
  const task = d.tasks.find(x => x.id === t.taskId);
  return {
    id: uid(),
    taskId: t.taskId,
    course: task ? task.course : 'General',
    goalMinutes: Math.round(t.goalSeconds / 60),
    actualSeconds: seconds,
    startedAt: t.startedAt,
    endedAt: Date.now(),
    status,
    distractions: t.distractions,
  };
}

function freshFocus(d: UserData, taskId: string | null): ActiveTimer {
  const now = Date.now();
  return { phase: 'focus', taskId, goalSeconds: d.goalMinutes * 60, accumulatedMs: 0, runningSince: now, startedAt: now, distractions: 0 };
}

function cloudDocRef(uidVal: string) {
  return doc(db, 'students', uidVal);
}

// Sends the person straight back into our own app (with ?mode=verifyEmail&
// oobCode=... attached) instead of Firebase's plain generic confirmation
// page, so App.tsx can show a properly styled "Email verified" screen.
const verifyActionSettings = { url: window.location.origin + '/', handleCodeInApp: true };

export function StoreProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [data, setData] = useState<UserData>(defaultData());
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);
  const dataRef = useRef<UserData>(data);
  const suppressWrite = useRef(false);
  // True while an account is being deleted, so a debounced write can't
  // re-create the document we've just removed.
  const deletingRef = useRef(false);
  dataRef.current = data;
  const authMessageRef = useRef<(code: string) => string>(() => 'Something went wrong. Please try again.');
  const [pendingLink, setPendingLink] = useState<PendingLink | null>(null);
  const pendingCredentialRef = useRef<AuthCredential | null>(null);

  const notify = (message: string) => {
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2400);
  };

  useEffect(() => {
    let unsubData: (() => void) | null = null;
    const unsubAuth = onAuthStateChanged(auth, async fbUser => {
      if (unsubData) {
        unsubData();
        unsubData = null;
      }
      if (!fbUser) {
        setUser(null);
        setData(defaultData());
        setAuthLoading(false);
        return;
      }
      const onlyPasswordProvider =
        fbUser.providerData.length > 0 && fbUser.providerData.every(p => p.providerId === 'password');
      const appUser: User = {
        id: fbUser.uid,
        name: fbUser.displayName || (fbUser.email ? fbUser.email.split('@')[0] : 'Student'),
        email: fbUser.email || '',
        tagline: 'Taking things one day at a time.',
        avatar: fbUser.photoURL || null,
        emailVerified: fbUser.emailVerified,
        requiresEmailVerification: onlyPasswordProvider,
        createdAt: Date.parse(fbUser.metadata.creationTime || '') || Date.now(),
      };
      setUser(appUser);
      const ref = cloudDocRef(fbUser.uid);
      try {
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          const seed = defaultData();
          // merge + no null avatar: a social avatar can be written to this
          // document while we're seeding it (see saveSocialAvatar), and a
          // plain set() would overwrite it with null.
          await setDoc(
            ref,
            {
              profile: {
                name: appUser.name,
                tagline: appUser.tagline,
                ...(appUser.avatar ? { avatar: appUser.avatar } : {}),
              },
              tasks: seed.tasks,
              sessions: seed.sessions,
              settings: seed.settings,
              selectedTaskId: seed.selectedTaskId,
              goalMinutes: seed.goalMinutes,
            },
            { merge: true }
          );
        }
      } catch {
        // Offline on first sign-in with no cache yet; the listener below will
        // pick up data once a connection is available.
      }
      unsubData = onSnapshot(
        ref,
        docSnap => {
          const remote = docSnap.data();
          if (!remote) return;
          suppressWrite.current = true;
          setData(d => ({
            ...d,
            tasks: remote.tasks ?? [],
            sessions: remote.sessions ?? [],
            settings: { ...DEFAULT_SETTINGS, ...(remote.settings ?? {}) },
            selectedTaskId: remote.selectedTaskId ?? null,
            goalMinutes: remote.goalMinutes ?? DEFAULT_SETTINGS.focusMinutes,
          }));
          if (remote.profile) {
            setUser(u => (u ? { ...u, name: remote.profile.name ?? u.name, tagline: remote.profile.tagline ?? u.tagline, avatar: remote.profile.avatar ?? u.avatar } : u));
          }
          setAuthLoading(false);
        },
        () => setAuthLoading(false)
      );
      setAuthLoading(false);
    });
    return () => {
      unsubAuth();
      if (unsubData) unsubData();
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    if (suppressWrite.current) {
      suppressWrite.current = false;
      return;
    }
    const t = window.setTimeout(() => {
      if (deletingRef.current) return;
      setDoc(
        cloudDocRef(user.id),
        {
          tasks: data.tasks,
          sessions: data.sessions,
          settings: data.settings,
          selectedTaskId: data.selectedTaskId,
          goalMinutes: data.goalMinutes,
        },
        { merge: true }
      ).catch(() => {
        // Queued locally by Firestore; will retry once online.
      });
    }, 400);
    return () => window.clearTimeout(t);
  }, [data.tasks, data.sessions, data.settings, data.selectedTaskId, data.goalMinutes, user]);

  const finishTimer = () => {
    const t = dataRef.current.timer;
    if (!t) return;
    const settings = dataRef.current.settings;
    setData(d => {
      const tm = d.timer;
      if (!tm) return d;
      if (tm.phase === 'break') {
        if (d.settings.autoStartNext) return { ...d, summary: null, timer: freshFocus(d, d.selectedTaskId) };
        return { ...d, timer: null };
      }
      const session = buildSession(d, tm, tm.goalSeconds, 'completed');
      return { ...d, timer: null, sessions: [...d.sessions, session], summary: session };
    });
    alertEnd(t.phase, settings);
  };

  const running = data.timer !== null && data.timer.runningSince !== null;

  useEffect(() => {
    if (!running) return;
    const check = () => {
      const t = dataRef.current.timer;
      if (!t || t.runningSince === null) return;
      if (elapsedMs(t, Date.now()) >= t.goalSeconds * 1000) finishTimer();
    };
    const id = window.setInterval(check, 500);
    document.addEventListener('visibilitychange', check);
    check();
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', check);
    };
  }, [running]);

  useEffect(() => {
    const onChange = () => {
      if (!document.hidden) return;
      setData(d => {
        const t = d.timer;
        if (!t || t.phase !== 'focus' || t.runningSince === null) return d;
        return { ...d, timer: { ...t, distractions: t.distractions + 1 } };
      });
    };
    document.addEventListener('visibilitychange', onChange);
    return () => document.removeEventListener('visibilitychange', onChange);
  }, []);

  const authMessage = (code: string): string => {
    if (code.includes('email-already-in-use')) return 'An account with this email already exists.';
    if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found')) return 'Incorrect email or password.';
    if (code.includes('weak-password')) return 'Password must be at least 6 characters.';
    if (code.includes('invalid-email')) return 'Enter a valid email address.';
    if (code.includes('popup-closed-by-user') || code.includes('cancelled-popup-request')) return 'Sign-in was cancelled.';
    if (code.includes('network-request-failed')) return 'No internet connection. Try again once you are online.';
    if (code.includes('user-mismatch')) return 'That sign-in belongs to a different account. Use the same account you are signed in with.';
    if (code.includes('unauthorized-domain')) return 'This site is not yet authorized in Firebase for sign-in. Add it under Authentication → Settings → Authorized domains.';
    if (code.includes('account-exists-with-different-credential')) {
      return 'An account already exists with this email using a different sign-in method. Try signing in with that method instead (email/password, or another provider you used before).';
    }
    if (code.includes('popup-blocked')) return 'Your browser blocked the sign-in popup. Allow popups for this site and try again.';
    if (code.includes('operation-not-allowed')) return 'This sign-in method is not enabled yet. Check it is turned on in Firebase Authentication settings.';
    return 'Something went wrong. Please try again.';
  };
  authMessageRef.current = authMessage;

  const signUpEmail = async (name: string, email: string, password: string): Promise<string | null> => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      await updateAuthProfile(cred.user, { displayName: name.trim() });
      // onAuthStateChanged fires as soon as the account is created, before
      // the profile update above finishes, so it initially falls back to
      // the email prefix as the name. Correct it locally right away rather
      // than waiting for a reload to pick up the real display name.
      setUser(u => (u ? { ...u, name: name.trim() } : u));
      await sendEmailVerification(cred.user, verifyActionSettings);
      notify('Verification email sent. Check your inbox (and your spam folder).');
      return null;
    } catch (e) {
      return authMessage(e instanceof Error ? e.message : String(e));
    }
  };

  const signInEmail = async (email: string, password: string): Promise<string | null> => {
    try {
      await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      return null;
    } catch (e) {
      return authMessage(e instanceof Error ? e.message : String(e));
    }
  };

  const credentialFromError = (providerId: string, e: unknown): AuthCredential | null => {
    if (providerId === 'google.com') return GoogleAuthProvider.credentialFromError(e as Parameters<typeof GoogleAuthProvider.credentialFromError>[0]);
    if (providerId === 'twitter.com') return TwitterAuthProvider.credentialFromError(e as Parameters<typeof TwitterAuthProvider.credentialFromError>[0]);
    return OAuthProvider.credentialFromError(e as Parameters<typeof OAuthProvider.credentialFromError>[0]);
  };

  const providerById = (id: string): typeof googleProvider | null => {
    if (id === 'google.com') return googleProvider;
    if (id === 'microsoft.com') return microsoftProvider;
    if (id === 'twitter.com') return twitterProvider;
    return null;
  };

  // Saves a social provider's photo as the profile avatar, but never over a
  // photo the person uploaded themselves (those are stored as data: URLs).
  // replaceRemote lets X refresh an older remote URL, e.g. the small _normal
  // variant seeded at sign-up, with the larger one.
  const saveSocialAvatar = async (uid: string, avatar: string, replaceRemote = false) => {
    try {
      const snap = await getDoc(cloudDocRef(uid));
      const existing = (snap.data()?.profile?.avatar as string | null | undefined) ?? null;
      if (existing && (!replaceRemote || existing.startsWith('data:'))) return;
      await setDoc(cloudDocRef(uid), { profile: { avatar } }, { merge: true });
    } catch {
      // Best effort: the photo just won't persist this time.
    }
  };

  // Uses a popup rather than a full-page redirect: onAuthStateChanged fires as
  // soon as the popup's credential resolves, so the app can stay mounted and
  // swap straight to the Home screen.
  const signInWithSocial = async (provider: typeof googleProvider): Promise<string | null> => {
    try {
      const result = await signInWithPopup(auth, provider);
      // X applies its avatar to the auth record asynchronously — on first
      // sign-up photoURL lands a beat after the credential resolves — so
      // reload the user to pull the freshly-written profile fields. This
      // makes the picture show at sign-up *and* on later sign-ins.
      if (provider.providerId === 'twitter.com') {
        try {
          await result.user.reload();
        } catch {
          // Fall back to whatever the credential response already carries.
        }
        const raw = auth.currentUser?.photoURL ?? result.user.photoURL ?? null;
        // Twitter serves a small _normal variant by default; ask for _400x400.
        const avatarUrl = raw ? raw.replace(/_(?:normal|bigger|mini)(\.\w+)$/, '_400x400$1') : null;
        if (avatarUrl) {
          setUser(u => (u ? { ...u, avatar: u.avatar ?? avatarUrl } : u));
          if (auth.currentUser && !auth.currentUser.photoURL) {
            try {
              await updateAuthProfile(auth.currentUser, { photoURL: avatarUrl });
            } catch {
              // Cosmetic only; the sign-in itself succeeded.
            }
          }
          // Persist into the profile doc: sign-up seeds it before the X
          // avatar resolves, so without this the stored profile keeps
          // avatar: null and later sign-ins read the empty one back. Never
          // over a photo the person uploaded themselves.
          void saveSocialAvatar(result.user.uid, avatarUrl, true);
        }
      }
      // Microsoft's OIDC claims carry no picture, so photoURL is always null
      // and Avatar falls back to initials. Fetch the photo from Microsoft
      // Graph with the access token that comes with the sign-in.
      if (provider.providerId === 'microsoft.com') {
        // The access token comes from credentialFromResult(). A popup result
        // has no `credential` property in the modular SDK (it only carries
        // user, providerId and operationType), so reading result.credential
        // always gave undefined and the photo was never requested.
        const token = OAuthProvider.credentialFromResult(result)?.accessToken;
        if (token) {
          try {
            // /me/photo returns the largest photo available (the 48x48
            // variant looked blurry at profile size). It's cropped to a small
            // square data URL and saved to the profile document, so it
            // survives reloads and shows on other devices — a blob: URL
            // would vanish when the page closes.
            const res = await fetch('https://graph.microsoft.com/v1.0/me/photo/$value', {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
              const avatarUrl = await imageBlobToAvatar(await res.blob());
              if (avatarUrl) {
                setUser(u => (u ? { ...u, avatar: u.avatar ?? avatarUrl } : u));
                void saveSocialAvatar(result.user.uid, avatarUrl);
              }
            }
          } catch {
            // Cosmetic only; the sign-in itself succeeded.
          }
        }
      }
      return null;
    } catch (e) {
      const code = e instanceof Error ? e.message : String(e);
      if (code.includes('account-exists-with-different-credential')) {
        // fetchSignInMethodsForEmail is unreliable here: Firebase's Email
        // Enumeration Protection (on by default on newer projects) makes it
        // always return an empty list, so we can't learn which method the
        // existing account actually uses. Instead, ask the person directly
        // and let them try whichever one they remember.
        const anyErr = e as { customData?: { email?: string } };
        const email = anyErr.customData?.email;
        const credential = credentialFromError(provider.providerId, e);
        if (email && credential) {
          pendingCredentialRef.current = credential;
          setPendingLink({ email });
          return null;
        }
      }
      return authMessage(code);
    }
  };

  const signInGoogle = () => signInWithSocial(googleProvider);
  const signInMicrosoft = () => signInWithSocial(microsoftProvider);
  const signInX = () => signInWithSocial(twitterProvider);

  // Completes an account link: signs in via whichever method the person
  // says the existing account actually uses, then attaches the new
  // provider's credential to that same account so both work going forward.
  const completeLink = async (
    method: 'password' | 'google.com' | 'microsoft.com' | 'twitter.com',
    password?: string
  ): Promise<string | null> => {
    if (!pendingLink || !pendingCredentialRef.current) return null;
    const { email } = pendingLink;
    try {
      if (method === 'password') {
        if (!password) return 'Enter the password for your existing account.';
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const existing = providerById(method);
        if (!existing) return 'Something went wrong. Please try again.';
        await signInWithPopup(auth, existing);
      }
      if (auth.currentUser) {
        await linkWithCredential(auth.currentUser, pendingCredentialRef.current);
      }
      pendingCredentialRef.current = null;
      setPendingLink(null);
      notify('Accounts linked — you can now sign in either way.');
      return null;
    } catch (e) {
      return authMessage(e instanceof Error ? e.message : String(e));
    }
  };

  const cancelLink = () => {
    pendingCredentialRef.current = null;
    setPendingLink(null);
  };

  const resendVerification = async () => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser, verifyActionSettings);
      notify('Verification email sent. Check your inbox (and your spam folder).');
    }
  };

  // Firebase caches emailVerified on the ID token; it does not update in
  // real time when the link is clicked elsewhere (e.g. in an email app).
  // Reload pulls the fresh value from Firebase's servers.
  const refreshEmailVerified = async () => {
    if (!auth.currentUser) return;
    await auth.currentUser.reload();
    setUser(u => (u && auth.currentUser ? { ...u, emailVerified: auth.currentUser.emailVerified } : u));
  };

  const resetPassword = async (email: string): Promise<string | null> => {
    try {
      await sendPasswordResetEmail(auth, email.trim().toLowerCase());
      return null;
    } catch (e) {
      return authMessage(e instanceof Error ? e.message : String(e));
    }
  };

  const signOut = () => {
    void firebaseSignOut(auth);
  };

  // Which sign-in methods are linked to the current account, read live from
  // Firebase so methods added through account linking are included.
  const getAuthProviders = (): string[] =>
    auth.currentUser ? auth.currentUser.providerData.map(p => p.providerId) : [];

  // Deleting an account needs a recent sign-in, so the person re-authenticates
  // first. Only then is the data removed, and the account last: the Firestore
  // rules need a signed-in user, so the data has to go before the account does,
  // but nothing may be deleted until we know the account deletion can succeed.
  // (Deleting the data first and the account second used to leave people
  // with an account but no data whenever Firebase asked them to sign in again.)
  const deleteAccount = async (
    method: 'password' | 'google.com' | 'microsoft.com' | 'twitter.com',
    password?: string
  ): Promise<string | null> => {
    const u = auth.currentUser;
    if (!u) return null;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      return 'You are offline. Connect to the internet to delete your account.';
    }
    try {
      if (method === 'password') {
        if (!password) return 'Enter your password to confirm.';
        if (!u.email) return 'This account has no email address to confirm with.';
        await reauthenticateWithCredential(u, EmailAuthProvider.credential(u.email, password));
      } else {
        const provider = providerById(method);
        if (!provider) return 'Something went wrong. Please try again.';
        await reauthenticateWithPopup(u, provider);
      }
    } catch (e) {
      return authMessage(e instanceof Error ? e.message : String(e));
    }
    deletingRef.current = true;
    try {
      try {
        await deleteDoc(cloudDocRef(u.uid));
      } catch {
        return 'Could not delete your data. Check your connection and try again. Nothing was removed.';
      }
      try {
        await deleteUser(u);
        return null;
      } catch {
        return 'Your data was removed, but the account could not be deleted. Please try again.';
      }
    } finally {
      deletingRef.current = false;
    }
  };

  const updateProfile = (patch: Partial<Pick<User, 'name' | 'tagline' | 'avatar'>>) => {
    setUser(u => (u ? { ...u, ...patch } : u));
    if (auth.currentUser && patch.name) void updateAuthProfile(auth.currentUser, { displayName: patch.name });
    if (user) {
      void setDoc(
        cloudDocRef(user.id),
        { profile: { name: patch.name ?? user.name, tagline: patch.tagline ?? user.tagline, avatar: patch.avatar ?? user.avatar } },
        { merge: true }
      );
    }
  };

  const addTask = (input: TaskInput): Task => {
    const task: Task = { ...input, id: uid(), isCompleted: false, completedAt: null, createdAt: Date.now() };
    setData(d => ({ ...d, tasks: [task, ...d.tasks] }));
    return task;
  };

  const updateTask = (id: string, patch: Partial<TaskInput>) => {
    setData(d => ({ ...d, tasks: d.tasks.map(t => (t.id === id ? { ...t, ...patch } : t)) }));
  };

  const toggleTask = (id: string) => {
    setData(d => ({
      ...d,
      tasks: d.tasks.map(t => (t.id === id ? { ...t, isCompleted: !t.isCompleted, completedAt: t.isCompleted ? null : Date.now() } : t)),
    }));
  };

  const deleteTask = (id: string) => {
    setData(d => ({ ...d, tasks: d.tasks.filter(t => t.id !== id), selectedTaskId: d.selectedTaskId === id ? null : d.selectedTaskId }));
  };

  const selectTask = (id: string | null) => setData(d => ({ ...d, selectedTaskId: id }));

  const setGoal = (minutes: number) => {
    const clamped = Math.min(240, Math.max(1, Math.round(minutes)));
    setData(d => ({ ...d, goalMinutes: clamped }));
  };

  const updateSettings = (patch: Partial<Settings>) => {
    setData(d => ({
      ...d,
      settings: { ...d.settings, ...patch },
      goalMinutes: patch.focusMinutes !== undefined && d.timer === null ? patch.focusMinutes : d.goalMinutes,
    }));
  };

  const startFocus = (taskId?: string | null) => {
    setData(d => {
      const chosen = taskId === undefined ? d.selectedTaskId : taskId;
      return { ...d, selectedTaskId: chosen, summary: null, timer: freshFocus(d, chosen) };
    });
  };

  const pauseTimer = () => {
    setData(d => {
      const t = d.timer;
      if (!t || t.runningSince === null) return d;
      return { ...d, timer: { ...t, accumulatedMs: t.accumulatedMs + (Date.now() - t.runningSince), runningSince: null } };
    });
  };

  const resumeTimer = () => {
    setData(d => {
      const t = d.timer;
      if (!t || t.runningSince !== null) return d;
      return { ...d, timer: { ...t, runningSince: Date.now() } };
    });
  };

  const startBreak = () => {
    setData(d => {
      const now = Date.now();
      return {
        ...d,
        summary: null,
        timer: { phase: 'break', taskId: d.selectedTaskId, goalSeconds: d.settings.breakMinutes * 60, accumulatedMs: 0, runningSince: now, startedAt: now, distractions: 0 },
      };
    });
  };

  const endTimer = (saveSession: boolean) => {
    setData(d => {
      const t = d.timer;
      if (!t) return d;
      if (t.phase === 'break') return { ...d, timer: null };
      const elapsed = Math.min(t.goalSeconds * 1000, elapsedMs(t, Date.now()));
      const seconds = Math.floor(elapsed / 1000);
      if (!saveSession || seconds < MIN_SAVE_SECONDS) return { ...d, timer: null };
      const session = buildSession(d, t, seconds, 'ended_early');
      return { ...d, timer: null, sessions: [...d.sessions, session], summary: session };
    });
  };

  const dismissSummary = () => setData(d => ({ ...d, summary: null }));

  const loadSample = () => {
    const sample = buildSample();
    setData(d => ({ ...d, tasks: sample.tasks, sessions: sample.sessions, selectedTaskId: null, timer: null, summary: null }));
    notify('Sample data loaded');
  };

  const clearStudyData = () => {
    setData(d => ({ ...d, tasks: [], sessions: [], selectedTaskId: null, timer: null, summary: null }));
    notify('Tasks and sessions cleared');
  };

  const value: Store = {
    user,
    authLoading,
    data,
    toast,
    pendingLink,
    notify,
    signUpEmail,
    signInEmail,
    signInGoogle,
    signInMicrosoft,
    signInX,
    completeLink,
    cancelLink,
    resendVerification,
    refreshEmailVerified,
    resetPassword,
    signOut,
    getAuthProviders,
    deleteAccount,
    updateProfile,
    addTask,
    updateTask,
    toggleTask,
    deleteTask,
    selectTask,
    setGoal,
    updateSettings,
    startFocus,
    pauseTimer,
    resumeTimer,
    startBreak,
    endTimer,
    dismissSummary,
    loadSample,
    clearStudyData,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
