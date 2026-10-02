'use client';

import { useEffect, useRef, useState } from 'react';
import { Search, UserRoundSearch } from 'lucide-react';
import type { CheckInOutcome } from '@/lib/attendance';
import type { AttendeeMatch } from '@/lib/attendee-lookup';
import { categoryLabel } from '@/lib/categories';
import { manualCheckIn, searchAttendees } from '../actions';

/**
 * Counting somebody who has nothing to present.
 *
 * On the first day 136 of the 199 people counted were registered at this desk,
 * which means they hold an account and a confirmation code they have never
 * seen: no email was sent to them, no badge was printed for them. On the
 * second day they walk up with nothing.
 *
 * The alternative the desk would otherwise reach for is the walk-in form,
 * which creates a new account every time it is used — so the same person would
 * be counted twice, and every figure the conference reports would be wrong by
 * however many of them came back. Finding the account that already exists is
 * the whole point of this box.
 */
export default function AttendeeSearch({
  checkpointId,
  onResult,
}: {
  checkpointId: string;
  onResult: (outcome: CheckInOutcome) => void;
}) {
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  /**
   * The rows, and the term they answer.
   *
   * Kept together rather than as a list plus a "searching" flag, because the
   * two must never disagree: results carrying the term they were found for can
   * be told apart from results for what was typed two letters ago, and both
   * "there is nothing to show yet" and "a search is in flight" fall out of
   * comparing them instead of being tracked by hand.
   */
  const [result, setResult] = useState<{ term: string; rows: AttendeeMatch[] }>({ term: '', rows: [] });

  // Only the last search may write. Typing a name sends several, and they do
  // not come back in the order they were sent — so without this a slow early
  // reply can land on top of the right answer.
  const runRef = useRef(0);

  const term = query.trim();
  const tooShort = term.length < 2;
  const fresh = result.term === term;
  const matches = fresh ? result.rows : [];
  const searching = !tooShort && !fresh;

  useEffect(() => {
    if (tooShort) return;

    const run = ++runRef.current;
    // Typed at a door, one letter at a time; without a pause that is a request
    // per keystroke.
    const timer = setTimeout(async () => {
      const rows = await searchAttendees(term, checkpointId);
      if (run !== runRef.current) return;
      setResult({ term, rows });
    }, 300);

    return () => clearTimeout(timer);
  }, [term, tooShort, checkpointId]);

  const check = async (m: AttendeeMatch) => {
    setBusyId(m.id);
    try {
      const outcome = await manualCheckIn(checkpointId, m.id);
      onResult(outcome);
      // The row updates in place rather than the list being thrown away: the
      // next person in the queue may be the next name in the same search.
      if (outcome.status === 'recorded' || outcome.status === 'duplicate') {
        setResult((prev) => ({
          ...prev,
          rows: prev.rows.map((x) => (x.id === m.id ? { ...x, alreadyHere: true } : x)),
        }));
      }
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div
      className="rounded-2xl p-4 space-y-3"
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--mat-liquid-border)' }}
    >
      <label className="flex items-center gap-2 text-[12.5px] font-medium" style={{ color: 'var(--text-secondary)' }}>
        <UserRoundSearch className="h-4 w-4" />
        بحث بالاسم — لمن لا يحمل بطاقة ولا يعرف رمزه
      </label>

      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2"
          style={{ insetInlineStart: 12, color: 'var(--text-tertiary)' }}
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="الاسم، أو رقم الهاتف، أو الجهة"
          className="input-glass"
          style={{ paddingInlineStart: 38 }}
          autoComplete="off"
        />
      </div>

      {!tooShort && (
        <div className="space-y-2">
          {searching && matches.length === 0 && (
            <p className="text-[12.5px]" style={{ color: 'var(--text-tertiary)' }}>...جارٍ البحث</p>
          )}

          {!searching && matches.length === 0 && (
            <p className="text-[12.5px] leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
              لا أحد بهذا الاسم. إن كان يحضر لأول مرة فأضفه من «تسجيل حضور بلا تسجيل مسبق».
            </p>
          )}

          {matches.map((m) => (
            <div
              key={m.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl px-3.5 py-2.5"
              style={{ background: 'var(--mat-liquid-bg)', border: '1px solid var(--mat-liquid-border)' }}
            >
              <div className="min-w-0">
                <p className="text-[13.5px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                  {m.name || '—'}
                </p>
                <p className="text-[11.5px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                  {[
                    categoryLabel(m.category ?? '', 'ar') || null,
                    m.organization || null,
                    m.phone || null,
                  ].filter(Boolean).join(' · ')}
                </p>
              </div>

              {/* Three different answers, and the desk needs to tell them
                  apart while the person is still in front of them. */}
              {m.alreadyHere ? (
                <span className="text-[12px] font-semibold whitespace-nowrap" style={{ color: '#f59e0b' }}>
                  مسجَّل هنا مسبقاً
                </span>
              ) : !m.admitted ? (
                <span className="text-[12px] font-semibold whitespace-nowrap" style={{ color: '#f59e0b' }}>
                  لم يُقبل بعد — إلى المكتب
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => check(m)}
                  disabled={busyId === m.id}
                  className="rounded-xl px-4 py-2 text-[12.5px] font-semibold whitespace-nowrap transition-opacity disabled:opacity-60"
                  style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
                >
                  {busyId === m.id ? '...' : 'تسجيل الحضور'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
