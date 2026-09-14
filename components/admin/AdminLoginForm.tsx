'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Lock, Loader2 } from 'lucide-react';
import CICTLogo from '@/components/ui/CICTLogo';

export default function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    const res = await signIn('credentials', { email, password, redirect: false });
    if (res?.error) {
      setStatus('error');
      return;
    }
    router.push('/admin');
    router.refresh();
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{ background: 'var(--bg-base)' }}
      dir="rtl"
    >
      {/* Subtle grid background, matching the site's dark surfaces */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(var(--mat-liquid-border) 1px, transparent 1px),
                              linear-gradient(90deg, var(--mat-liquid-border) 1px, transparent 1px)`,
            backgroundSize: '80px 80px',
            opacity: 0.4,
          }}
        />
      </div>

      <div
        className="w-full max-w-sm rounded-3xl p-8"
        style={{
          background: '#161618',
          border: '1px solid var(--mat-liquid-border)',
          boxShadow: '0 4px 48px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)',
          backdropFilter: 'blur(24px)',
        }}
      >
        <div className="flex flex-col items-center mb-8">
          <CICTLogo height={44} />
          <h1 className="mt-5 font-outfit font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
            لوحة تحكم CICT
          </h1>
          <p className="mt-1 text-[13px]" style={{ color: 'var(--text-tertiary)' }}>
            سجّل الدخول للمتابعة
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[13px] font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              البريد الإلكتروني
            </label>
            <input
              required
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-glass"
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              كلمة المرور
            </label>
            <input
              required
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-glass"
              dir="ltr"
            />
          </div>

          {status === 'error' && (
            <p className="text-[13px] text-center" style={{ color: '#ef4444' }}>
              بيانات الدخول غير صحيحة
            </p>
          )}

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-[14px] font-semibold transition-opacity disabled:opacity-60"
            style={{ background: 'rgba(255,255,255,0.92)', color: '#0d0d0f' }}
          >
            {status === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
            دخول
          </button>
        </form>
      </div>
    </div>
  );
}
