'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight, CameraOff, CircleCheck, CircleX, Keyboard, RefreshCw, ScanLine, TriangleAlert,
} from 'lucide-react';
import type { CheckInOutcome } from '@/lib/attendance';
import { OUTCOME_LABELS } from '@/lib/attendance';
import { scanBadge } from '../actions';

export interface ScannerCheckpoint {
  id: string;
  label: string;
  isOpen: boolean;
}

/**
 * Time a badge must be out of frame before the same one counts as a new scan.
 *
 * The camera decodes the symbol ~30 times a second while it is held up, and
 * without this every one of those is a request. Three seconds is longer than
 * anybody holds a pass at a door and shorter than the gap between two people.
 */
const REPEAT_COOLDOWN_MS = 3000;

/** How long a result stays on screen before the view returns to "ready". */
const RESULT_LINGER_MS = 4000;

type Tone = 'ok' | 'warn' | 'bad';

const OUTCOME_TONE: Record<CheckInOutcome['status'], Tone> = {
  recorded: 'ok',
  duplicate: 'warn',
  unknown: 'bad',
  // Not a fault of the badge and not an error the organizer can fix at the
  // door — it is a real person whose application has not been decided. Amber,
  // so it reads as "send them to the desk" rather than "forged pass".
  'not-admitted': 'warn',
  unreadable: 'bad',
  closed: 'bad',
  'no-checkpoint': 'bad',
};

const TONE_COLOR: Record<Tone, string> = {
  ok: 'var(--accent-cyan)',
  warn: '#f59e0b',
  bad: 'var(--destructive)',
};

/** Two short tones for "counted", one long low one for anything else. */
const TONE_BEEPS: Record<Tone, { freq: number; ms: number }[]> = {
  ok: [{ freq: 880, ms: 90 }, { freq: 1320, ms: 110 }],
  warn: [{ freq: 660, ms: 180 }],
  bad: [{ freq: 220, ms: 320 }],
};

interface RecentScan {
  key: number;
  name: string;
  detail: string;
  tone: Tone;
}

const TIME = new Intl.DateTimeFormat('ar-u-nu-latn', { timeStyle: 'short' });

export default function Scanner({
  checkpoints,
  initialCheckpointId,
}: {
  checkpoints: ScannerCheckpoint[];
  initialCheckpointId: string;
}) {
  const [checkpointId, setCheckpointId] = useState(initialCheckpointId);
  const [status, setStatus] = useState<'idle' | 'starting' | 'scanning' | 'denied' | 'unsupported'>('idle');
  const [outcome, setOutcome] = useState<CheckInOutcome | null>(null);
  const [recent, setRecent] = useState<RecentScan[]>([]);
  const [counted, setCounted] = useState(0);
  const [manual, setManual] = useState('');
  const [busy, setBusy] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);
  const audioRef = useRef<AudioContext | null>(null);

  // Refs, not state: the decode loop reads these every frame, and re-creating
  // the loop on each change would drop the camera mid-queue.
  const lastPayloadRef = useRef<{ value: string; at: number } | null>(null);
  const inFlightRef = useRef(false);
  const checkpointRef = useRef(checkpointId);

  // Synced after commit rather than during render: the decode loop only reads
  // this in a callback, so it never needs the value earlier than this.
  useEffect(() => {
    checkpointRef.current = checkpointId;
  }, [checkpointId]);

  const beep = useCallback((tone: Tone) => {
    const ctx = audioRef.current;
    if (!ctx) return;
    let at = ctx.currentTime;
    for (const { freq, ms } of TONE_BEEPS[tone]) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      osc.type = 'sine';
      // A hard stop on a square edge clicks; a short ramp does not.
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(0.28, at + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + ms / 1000);
      osc.connect(gain).connect(ctx.destination);
      osc.start(at);
      osc.stop(at + ms / 1000 + 0.02);
      at += ms / 1000 + 0.04;
    }
  }, []);

  /** Send one payload to the server and report what came back. */
  const submit = useCallback(
    async (payload: string) => {
      if (inFlightRef.current) return;
      const id = checkpointRef.current;
      if (!id) {
        setOutcome({ status: 'no-checkpoint' });
        return;
      }

      inFlightRef.current = true;
      setBusy(true);
      try {
        const result = await scanBadge(id, payload);
        const tone = OUTCOME_TONE[result.status];

        setOutcome(result);
        beep(tone);
        // A door is loud and the operator is not looking at the screen.
        navigator.vibrate?.(tone === 'ok' ? 60 : [60, 60, 60]);

        if (result.status === 'recorded') setCounted((n) => n + 1);

        if (result.status === 'recorded' || result.status === 'duplicate') {
          setRecent((prev) =>
            [
              {
                key: Date.now(),
                name: result.attendee.name || result.attendee.email,
                detail:
                  result.status === 'recorded'
                    ? TIME.format(new Date(result.at))
                    : `مسجَّل منذ ${TIME.format(new Date(result.at))}`,
                tone,
              },
              ...prev,
            ].slice(0, 12),
          );
        }
      } finally {
        inFlightRef.current = false;
        setBusy(false);
      }
    },
    [beep],
  );

  /** Decoded text from either decoder lands here. */
  const onDecoded = useCallback(
    (value: string) => {
      const now = Date.now();
      const last = lastPayloadRef.current;
      // The same badge still in frame is not a second person.
      if (last && last.value === value && now - last.at < REPEAT_COOLDOWN_MS) return;
      lastPayloadRef.current = { value, at: now };
      void submit(value);
    },
    [submit],
  );

  const stop = useCallback(() => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setStatus('idle');
  }, []);

  const start = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('unsupported');
      return;
    }

    setStatus('starting');

    // Created inside the click that starts the camera: an AudioContext made
    // without a user gesture is suspended, and the first "counted" beep — the
    // one that matters — would be silent.
    if (!audioRef.current) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (Ctor) audioRef.current = new Ctor();
    }
    void audioRef.current?.resume();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        // The rear camera on a phone; ignored by a laptop, which has one.
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;

      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await video.play();

      setStatus('scanning');

      // Native decoding where the browser has it — it runs off the main
      // thread, so the preview stays smooth on the cheap phone that is
      // realistically being used at a door.
      const Detector = (window as unknown as {
        BarcodeDetector?: new (opts: { formats: string[] }) => { detect(source: CanvasImageSource): Promise<{ rawValue: string }[]> };
      }).BarcodeDetector;

      const detector = Detector ? new Detector({ formats: ['qr_code'] }) : null;
      const jsQR = detector ? null : (await import('jsqr')).default;

      const canvas = (canvasRef.current ??= document.createElement('canvas'));
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      let running = true;
      const tick = async () => {
        if (!running || !videoRef.current) return;
        const v = videoRef.current;

        if (v.readyState === v.HAVE_ENOUGH_DATA) {
          try {
            if (detector) {
              const found = await detector.detect(v);
              if (found[0]?.rawValue) onDecoded(found[0].rawValue);
            } else if (jsQR && ctx) {
              // Downscaled: jsQR is O(pixels) on the main thread, and a QR
              // filling a 480-wide frame decodes just as well as one at 1280.
              const scale = Math.min(1, 480 / (v.videoWidth || 480));
              canvas.width = Math.round((v.videoWidth || 480) * scale);
              canvas.height = Math.round((v.videoHeight || 360) * scale);
              ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
              const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
              const found = jsQR(image.data, image.width, image.height, { inversionAttempts: 'dontInvert' });
              if (found?.data) onDecoded(found.data);
            }
          } catch {
            // A single dropped frame is not worth stopping the camera for.
          }
        }

        frameRef.current = requestAnimationFrame(() => void tick());
      };

      void tick();

      return () => {
        running = false;
      };
    } catch {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setStatus('denied');
    }
  }, [onDecoded]);

  // Releases the camera when the page is left. Without this the indicator
  // light stays on and the device stays warm until the tab is closed.
  useEffect(() => stop, [stop]);

  // Results clear themselves, so the screen a queue is looking at returns to
  // "ready" instead of still showing the previous person's name.
  useEffect(() => {
    if (!outcome) return;
    const timer = setTimeout(() => setOutcome(null), RESULT_LINGER_MS);
    return () => clearTimeout(timer);
  }, [outcome]);

  const selected = checkpoints.find((c) => c.id === checkpointId);
  const tone = outcome ? OUTCOME_TONE[outcome.status] : null;

  return (
    <div className="space-y-5" dir="rtl">
      <div className="flex items-center gap-3">
        <Link href="/admin/attendance" style={{ color: 'var(--text-tertiary)' }} aria-label="رجوع">
          <ArrowRight className="h-5 w-5 rotate-180" />
        </Link>
        <h1 className="font-outfit font-bold text-xl" style={{ color: 'var(--text-primary)' }}>
          مسح الحضور
        </h1>
        {counted > 0 && (
          <span
            className="ms-auto rounded-full px-3 py-1 text-[12.5px] font-bold"
            style={{
              background: 'color-mix(in srgb, var(--accent-cyan) 14%, transparent)',
              color: 'var(--accent-cyan)',
            }}
          >
            {counted} في هذه الجلسة
          </span>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px] lg:items-start">
        <div className="space-y-4">
          <div>
            <label className="block text-[12.5px] font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              نقطة الحضور
            </label>
            <select
              value={checkpointId}
              onChange={(e) => setCheckpointId(e.target.value)}
              className="input-glass"
              style={{ padding: '10px 14px', fontSize: '13.5px' }}
            >
              {checkpoints.length === 0 && <option value="">لا توجد نقاط حضور</option>}
              {checkpoints.map((c) => (
                <option key={c.id} value={c.id} disabled={!c.isOpen}>
                  {c.label}{c.isOpen ? '' : ' (مغلقة)'}
                </option>
              ))}
            </select>
            {selected && !selected.isOpen && (
              <p className="mt-2 flex items-center gap-1.5 text-[12px]" style={{ color: 'var(--destructive)' }}>
                <TriangleAlert className="h-3.5 w-3.5" />
                هذه النقطة مغلقة ولن تقبل أي مسح — افتحها من إدارة النقاط أولاً.
              </p>
            )}
          </div>

          {/* ── the viewfinder ── */}
          <div
            className="relative overflow-hidden rounded-2xl"
            style={{
              aspectRatio: '4 / 3',
              background: '#0b0b0d',
              border: `2px solid ${tone ? TONE_COLOR[tone] : 'var(--mat-liquid-border)'}`,
              transition: 'border-color 160ms ease',
            }}
          >
            <video
              ref={videoRef}
              playsInline
              muted
              className="h-full w-full object-cover"
              style={{ display: status === 'scanning' ? 'block' : 'none' }}
            />

            {status === 'scanning' && !outcome && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div
                  className="rounded-2xl"
                  style={{
                    width: '62%',
                    aspectRatio: '1',
                    border: '3px solid rgba(255,255,255,0.85)',
                    boxShadow: '0 0 0 9999px rgba(0,0,0,0.35)',
                  }}
                />
              </div>
            )}

            {/* The result covers the preview: at a door the operator glances
                at the screen for under a second, and a small chip beside a
                live camera feed is not what gets seen in that second. */}
            {outcome && tone && (
              <div
                className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center"
                style={{ background: `color-mix(in srgb, ${TONE_COLOR[tone]} 22%, rgba(8,8,10,0.94))` }}
              >
                {tone === 'ok' ? (
                  <CircleCheck className="h-14 w-14" style={{ color: TONE_COLOR[tone] }} />
                ) : tone === 'warn' ? (
                  <TriangleAlert className="h-14 w-14" style={{ color: TONE_COLOR[tone] }} />
                ) : (
                  <CircleX className="h-14 w-14" style={{ color: TONE_COLOR[tone] }} />
                )}

                <p className="font-outfit text-[20px] font-bold" style={{ color: '#fff' }}>
                  {outcome.status === 'closed'
                    ? `${OUTCOME_LABELS.closed} — ${outcome.checkpointName}`
                    : OUTCOME_LABELS[outcome.status]}
                </p>

                {/* A real person the committee has not admitted. The organizer
                    at the door needs their name to send them to the desk —
                    "لم يُقبل هذا الحساب" over an anonymous screen is an
                    argument waiting to happen. */}
                {outcome.status === 'not-admitted' && (
                  <>
                    <p className="font-outfit text-[26px] font-black leading-tight" style={{ color: '#fff' }}>
                      {outcome.attendee.name || outcome.attendee.email}
                    </p>
                    <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.75)' }}>
                      {outcome.accountStatus === 'PENDING'
                        ? 'طلبه ما زال بانتظار قرار اللجنة — وجّهه إلى مكتب التسجيل'
                        : 'لم يُقبل طلب انضمامه — وجّهه إلى مكتب التسجيل'}
                    </p>
                  </>
                )}

                {(outcome.status === 'recorded' || outcome.status === 'duplicate') && (
                  <>
                    <p className="font-outfit text-[26px] font-black leading-tight" style={{ color: '#fff' }}>
                      {outcome.attendee.name || outcome.attendee.email}
                    </p>
                    <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.75)' }}>
                      {[outcome.attendee.organization, outcome.attendee.confirmationCode]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                    {outcome.status === 'duplicate' && (
                      <p className="text-[12.5px]" style={{ color: 'rgba(255,255,255,0.75)' }}>
                        سُجّل الساعة {TIME.format(new Date(outcome.at))}
                      </p>
                    )}
                  </>
                )}
              </div>
            )}

            {status !== 'scanning' && !outcome && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
                {status === 'denied' || status === 'unsupported' ? (
                  <>
                    <CameraOff className="h-10 w-10" style={{ color: 'rgba(255,255,255,0.5)' }} />
                    <p className="max-w-xs text-[13px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>
                      {status === 'denied'
                        ? 'تعذّر الوصول إلى الكاميرا — اسمح بالإذن من إعدادات المتصفح، أو استخدم الإدخال اليدوي بالأسفل.'
                        : 'هذا المتصفح لا يدعم الكاميرا — استخدم الإدخال اليدوي بالأسفل.'}
                    </p>
                  </>
                ) : (
                  <ScanLine className="h-10 w-10" style={{ color: 'rgba(255,255,255,0.5)' }} />
                )}

                <button
                  type="button"
                  onClick={() => void start()}
                  disabled={status === 'starting'}
                  className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-[14px] font-semibold transition-opacity disabled:opacity-60"
                  style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
                >
                  {status === 'starting' ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ScanLine className="h-4 w-4" />}
                  {status === 'starting' ? 'جارٍ تشغيل الكاميرا' : status === 'idle' ? 'بدء المسح' : 'إعادة المحاولة'}
                </button>
              </div>
            )}
          </div>

          {status === 'scanning' && (
            <button
              type="button"
              onClick={stop}
              className="rounded-xl px-4 py-2 text-[13px] font-semibold"
              style={{ background: 'var(--mat-liquid-bg)', border: '1px solid var(--mat-liquid-border)', color: 'var(--text-primary)' }}
            >
              إيقاف الكاميرا
            </button>
          )}

          {/* ── manual entry ── */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const value = manual.trim();
              if (!value) return;
              // Bypasses the repeat cooldown: typing the same code twice is a
              // deliberate act, not a badge left in front of the lens.
              lastPayloadRef.current = null;
              setManual('');
              void submit(value);
            }}
            className="rounded-2xl p-4 space-y-3"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--mat-liquid-border)' }}
          >
            <label className="flex items-center gap-2 text-[12.5px] font-medium" style={{ color: 'var(--text-secondary)' }}>
              <Keyboard className="h-4 w-4" />
              إدخال يدوي — رمز التأكيد المطبوع على البطاقة
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={manual}
                onChange={(e) => setManual(e.target.value)}
                placeholder="CIC-2026-XXXXXX"
                className="input-glass flex-1 min-w-[200px]"
                dir="ltr"
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="submit"
                disabled={busy || !manual.trim()}
                className="rounded-xl px-5 py-2.5 text-[13.5px] font-semibold transition-opacity disabled:opacity-60"
                style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
              >
                تسجيل
              </button>
            </div>
          </form>
        </div>

        {/* ── what has just been counted ── */}
        <aside
          className="rounded-2xl p-5"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--mat-liquid-border)' }}
        >
          <h2 className="mb-3.5 font-outfit font-bold text-[14.5px]" style={{ color: 'var(--text-primary)' }}>
            آخر عمليات المسح
          </h2>

          {recent.length === 0 ? (
            <p className="py-6 text-center text-[12.5px] leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
              لم تُسجَّل أي عملية بعد. وجّه الكاميرا نحو رمز QR على بطاقة المشارك.
            </p>
          ) : (
            <ul className="space-y-2">
              {recent.map((r) => (
                <li
                  key={r.key}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2.5"
                  style={{ background: 'var(--mat-liquid-bg)', border: '1px solid var(--mat-liquid-border)' }}
                >
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: TONE_COLOR[r.tone] }} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px]" style={{ color: 'var(--text-primary)' }}>
                      {r.name}
                    </span>
                    <span className="block text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                      {r.detail}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}
