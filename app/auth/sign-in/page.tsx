'use client';

import { useState } from 'react';
import { authClient } from '@/lib/auth/client';
import { Music2 } from 'lucide-react';
import Link from 'next/link';

export default function SignInPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'signup') {
        const res = await authClient.signUp.email({ name, email, password });
        if (res.error) { setError(res.error.message || 'Sign up failed'); setLoading(false); return; }
        // Store user info for the UI
        localStorage.setItem('panda_user', JSON.stringify({ name, email }));
      } else {
        const res = await authClient.signIn.email({ email, password });
        if (res.error) { setError(res.error.message || 'Sign in failed'); setLoading(false); return; }
        // Fetch session to get user name
        const session = await authClient.getSession();
        const userName = session?.data?.user?.name || email.split('@')[0];
        localStorage.setItem('panda_user', JSON.stringify({ name: userName, email }));
      }
      window.location.href = '/';
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center px-4">
      <div className="w-full max-w-sm flex flex-col gap-6">
        {/* Logo */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-3 mb-6">
            <div className="h-12 w-12 rounded-xl bg-violet-600 flex items-center justify-center shadow-[0_0_30px_rgba(124,58,237,0.4)]">
              <Music2 size={24} className="text-white" />
            </div>
            <span className="text-xl font-black text-white tracking-tight">PANDA PLAYLIST</span>
          </Link>
          <h1 className="text-2xl font-black text-white">
            {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-white/40 text-sm mt-2">
            {mode === 'signin' ? 'Sign in to your studio' : 'Join Panda Playlist'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {mode === 'signup' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/50">Name</label>
              <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="Your name"
                className="h-12 rounded-xl bg-white/5 px-4 text-white placeholder:text-white/20 border border-white/10 focus:border-violet-500 focus:outline-none transition-colors" />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-white/50">Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
              className="h-12 rounded-xl bg-white/5 px-4 text-white placeholder:text-white/20 border border-white/10 focus:border-violet-500 focus:outline-none transition-colors" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-white/50">Password</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
              className="h-12 rounded-xl bg-white/5 px-4 text-white placeholder:text-white/20 border border-white/10 focus:border-violet-500 focus:outline-none transition-colors" />
          </div>

          {error && (
            <div className="rounded-xl px-4 py-3 text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20">{error}</div>
          )}

          <button type="submit" disabled={loading}
            className="h-12 rounded-xl bg-violet-600 text-white text-xs font-black uppercase tracking-widest hover:bg-violet-500 transition-all shadow-[0_0_20px_rgba(124,58,237,0.3)] disabled:opacity-50">
            {loading ? 'Please wait...' : (mode === 'signin' ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <p className="text-center text-sm text-white/30">
          {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); }}
            className="text-violet-400 hover:underline">
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}
