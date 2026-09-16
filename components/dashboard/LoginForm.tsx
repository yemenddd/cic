'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { LogIn, Loader2, Sun, Moon } from 'lucide-react';
import CICTLogo from '@/components/ui/CICTLogo';
import { useTheme } from '@/lib/theme-context';

export default function LoginForm() {
  const router = useRouter();
  const { theme, toggle } = useTheme();
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
    router.push('/dashboard');
    router.refresh();
  };

  return (
    <div
      className="font-platform flex min-h-screen items-center justify-center px-4"
      style={{ background: 'var(--bg-base)' }}
      dir="rtl"
    >
      <button
        type="button"
        onClick={toggle}
        aria-label={theme === 'dark' ? 'الوضع الفاتح' : 'الوضع الداكن'}
        className="fixed top-5 end-5 p-2.5 rounded-xl transition-colors"
        style={{
          background: 'var(--mat-liquid-bg)',
          border: '1px solid var(--mat-liquid-border)',
          color: 'var(--text-secondary)',
        }}
      >
        {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>

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
          background: 'var(--bg-elevated)',
          border: '1px solid var(--mat-liquid-border)',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <div className="flex flex-col items-center mb-8">
          <CICTLogo height={44} />
          <h1 className="mt-5 font-outfit font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
            تسجيل الدخول
          </h1>
          <p className="mt-1 text-[13px] text-center" style={{ color: 'var(--text-tertiary)' }}>
            ادخل إلى لوحتك الشخصية في منصة الإبداع والابتكار
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
            style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
          >
            {status === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
            دخول
          </button>
        </form>

        <p className="mt-6 text-center text-[13px]" style={{ color: 'var(--text-tertiary)' }}>
          ليس لديك حساب؟{' '}
          <Link href="/register" className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            سجّل الآن
          </Link>
        </p>
      </div>
    </div>
  );
}
