'use client';

import { useLang } from '@/lib/i18n';

interface PrivacyCopy {
  title: string;
  updated: string;
  intro: string;
  s1Title: string; s1Body: string;
  s2Title: string; s2Body: string;
  s3Title: string; s3Body: string;
  s4Title: string; s4Body: string;
  contactLabel: string;
  contactEmail: string;
}

export default function PrivacyPage() {
  const { tx, dir } = useLang();
  const p = tx<PrivacyCopy>('privacyPage');

  const sections = [
    { title: p.s1Title, body: p.s1Body },
    { title: p.s2Title, body: p.s2Body },
    { title: p.s3Title, body: p.s3Body },
    { title: p.s4Title, body: p.s4Body },
  ];

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }} dir={dir}>
      <div className="mx-auto max-w-2xl px-6 pt-32 pb-24">
        <h1
          className="font-outfit font-black tracking-tight"
          style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', color: 'var(--text-primary)', lineHeight: 1.1 }}
        >
          {p.title}
        </h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--text-tertiary)' }}>{p.updated}</p>
        <p className="mt-6 leading-relaxed" style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          {p.intro}
        </p>

        <div className="mt-10 space-y-8">
          {sections.map((s, i) => (
            <div key={i}>
              <h2 className="font-bold mb-2" style={{ fontSize: '1.05rem', color: 'var(--text-primary)' }}>{s.title}</h2>
              <p className="leading-relaxed" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{s.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-6" style={{ borderTop: '1px solid var(--mat-liquid-border)' }}>
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            {p.contactLabel}:{' '}
            <a href={`mailto:${p.contactEmail}`} style={{ color: 'var(--text-primary)', textDecoration: 'underline' }}>
              {p.contactEmail}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
