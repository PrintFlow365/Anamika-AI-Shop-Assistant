import { useState } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { Mic, Mail, Lock, LogIn, UserPlus, AlertCircle, Loader2 } from 'lucide-react';

export function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setBusy(true);
    setError(null);
    const { error } = mode === 'signin'
      ? await signIn(email.trim(), password)
      : await signUp(email.trim(), password);
    setBusy(false);
    if (error) setError(error);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-700 to-primary-900 flex flex-col items-center justify-center px-6">
      {/* Logo */}
      <div className="flex flex-col items-center gap-3 mb-10">
        <div className="w-20 h-20 rounded-full bg-white/15 backdrop-blur grid place-items-center shadow-float">
          <Mic className="w-10 h-10 text-white" strokeWidth={2.5} />
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">অনামিকা</h1>
          <p className="text-sm text-primary-200 mt-1">এআই দোকান সহকারী</p>
        </div>
      </div>

      {/* Form card */}
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-float p-6">
        <div className="flex bg-ink-100 rounded-xl p-1 mb-5">
          <button
            onClick={() => { setMode('signin'); setError(null); }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold btn-press transition-colors ${mode === 'signin' ? 'bg-white text-primary-700 shadow-card' : 'text-ink-500'}`}
          >
            প্রবেশ
          </button>
          <button
            onClick={() => { setMode('signup'); setError(null); }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold btn-press transition-colors ${mode === 'signup' ? 'bg-white text-primary-700 shadow-card' : 'text-ink-500'}`}
          >
            নতুন অ্যাকাউন্ট
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-ink-500 mb-1.5 block">ইমেইল</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-300" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full bg-ink-50 rounded-xl pl-10 pr-4 py-3 text-sm font-medium text-ink-800 outline-none focus:ring-2 ring-primary-400"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-ink-500 mb-1.5 block">পাসওয়ার্ড</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-300" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                className="w-full bg-ink-50 rounded-xl pl-10 pr-4 py-3 text-sm font-medium text-ink-800 outline-none focus:ring-2 ring-primary-400"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-danger-50 border border-danger-200 rounded-xl px-3 py-2.5">
              <AlertCircle className="w-4 h-4 text-danger-600 shrink-0 mt-0.5" />
              <p className="text-xs text-danger-800">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={busy || !email.trim() || !password}
            className="w-full py-3.5 rounded-xl bg-primary-700 text-white font-semibold btn-press hover:bg-primary-800 disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {busy ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : mode === 'signin' ? (
              <><LogIn className="w-4 h-4" /> প্রবেশ করুন</>
            ) : (
              <><UserPlus className="w-4 h-4" /> অ্যাকাউন্ট তৈরি</>
            )}
          </button>
        </form>

        <p className="text-xs text-ink-400 text-center mt-4">
          {mode === 'signin'
            ? 'নতুন? অ্যাকাউন্ট তৈরি করুন'
            : 'অ্যাকাউন্ট আছে? প্রবেশ করুন'}
        </p>
      </div>
    </div>
  );
}
