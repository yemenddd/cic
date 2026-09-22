'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import {
  Check, X, Loader2, AlertTriangle, Mail, Phone, Globe, Building2, RotateCcw,
} from 'lucide-react';
import { approveAccount, rejectAccount, resetToPending } from './actions';

/**
 * One application, with the decision attached to it.
 *
 * Everything an organizer needs to decide is on the card — who they say they
 * are, how to reach them, which category and path they asked for — because a
 * decision that requires opening another page to make is a decision that waits
 * until tomorrow.
 */

export interface Applicant {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  country: string | null;
  organization: string | null;
  categoryLabel: string;
  track: string | null;
  committeeLabel: string;
  registeredAt: string;
  waitedDays: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  statusNote: string | null;
}

function Detail({ icon: Icon, value }: { icon: typeof Mail; value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
      {value}
    </span>
  );
}

export default function ApplicantCard({ applicant }: { applicant: Applicant }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');

  const run = (fn: () => Promise<{ error?: string; success?: string } | void>) => {
    setError(null);
    startTransition(async () => {
      const result = await fn();
      if (result?.error) setError(result.error);
      else setRejecting(false);
    });
  };

  const waiting = applicant.status === 'PENDING';

  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--mat-liquid-border)',
        // The ones that have been waiting longest are the ones this page
        // exists for, so a week of silence is visible without reading a date.
        borderInlineStartWidth: waiting && applicant.waitedDays >= 3 ? '3px' : '1px',
        borderInlineStartColor:
          waiting && applicant.waitedDays >= 3 ? 'var(--destructive)' : 'var(--mat-liquid-border)',
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/admin/users/${applicant.id}`}
              className="text-[14.5px] font-semibold"
              style={{ color: 'var(--text-primary)' }}
            >
              {applicant.name || applicant.email}
            </Link>
            <span
              className="rounded-lg px-2 py-0.5 text-[11px] font-semibold"
              style={{
                background: 'var(--mat-liquid-bg)',
                border: '1px solid var(--mat-liquid-border)',
                color: 'var(--text-secondary)',
              }}
            >
              {applicant.categoryLabel}
            </span>
            {applicant.track && (
              <span className="text-[11.5px]" style={{ color: 'var(--text-tertiary)' }}>
                {applicant.track}
              </span>
            )}
            {applicant.committeeLabel && (
              <span className="text-[11.5px]" style={{ color: 'var(--text-tertiary)' }}>
                {applicant.committeeLabel}
              </span>
            )}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-3.5 gap-y-1.5">
            <Detail icon={Mail} value={applicant.email} />
            {applicant.phone && <Detail icon={Phone} value={applicant.phone} />}
            {applicant.country && <Detail icon={Globe} value={applicant.country} />}
            {applicant.organization && <Detail icon={Building2} value={applicant.organization} />}
          </div>

          <p className="mt-2 text-[11.5px]" style={{ color: 'var(--text-tertiary)' }}>
            سجّل {applicant.registeredAt}
            {waiting && applicant.waitedDays >= 3 && (
              <span style={{ color: 'var(--destructive)' }}>
                {' '}— ينتظر منذ {applicant.waitedDays} أيام
              </span>
            )}
          </p>

          {applicant.statusNote && !waiting && (
            <p className="mt-2 text-[12px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              الملاحظة المرسلة: {applicant.statusNote}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {waiting ? (
            <>
              <button
                type="button"
                disabled={pending}
                onClick={() => run(() => approveAccount(applicant.id))}
                className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[12.5px] font-semibold transition-opacity disabled:opacity-60"
                style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
              >
                {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                قبول
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => setRejecting((v) => !v)}
                className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12.5px] font-semibold transition-opacity disabled:opacity-60"
                style={{
                  background: 'var(--mat-liquid-bg)',
                  border: '1px solid var(--mat-liquid-border)',
                  color: 'var(--destructive)',
                }}
              >
                <X className="h-3.5 w-3.5" />
                رفض
              </button>
            </>
          ) : (
            <button
              type="button"
              disabled={pending}
              onClick={() => run(async () => resetToPending(applicant.id))}
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12.5px] font-semibold transition-opacity disabled:opacity-60"
              style={{
                background: 'var(--mat-liquid-bg)',
                border: '1px solid var(--mat-liquid-border)',
                color: 'var(--text-secondary)',
              }}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              إعادة للانتظار
            </button>
          )}
        </div>
      </div>

      {/* The reason is typed before the refusal is sent, not after — it is the
          only thing the person will receive. */}
      {rejecting && (
        <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--mat-liquid-border)' }}>
          <label className="block text-[12.5px] font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            سبب الرفض — يصل إلى صاحب الحساب كما تكتبه
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            maxLength={500}
            className="input-glass"
            style={{ height: 'auto', resize: 'vertical', paddingTop: '0.6rem', paddingBottom: '0.6rem' }}
          />
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              disabled={pending || !reason.trim()}
              onClick={() => run(() => rejectAccount(applicant.id, reason))}
              className="rounded-xl px-4 py-2 text-[12.5px] font-semibold transition-opacity disabled:opacity-50"
              style={{ background: 'var(--destructive)', color: '#fff' }}
            >
              إرسال الرفض
            </button>
            <button
              type="button"
              onClick={() => setRejecting(false)}
              className="text-[12.5px] font-semibold"
              style={{ color: 'var(--text-secondary)' }}
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      {error && (
        <p
          role="status"
          className="mt-2.5 flex items-start gap-2 text-[12.5px]"
          style={{ color: 'var(--destructive)' }}
        >
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      )}
    </div>
  );
}
