'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { CATEGORIES } from '@/lib/categories';
import { SUBMISSION_TRACKS } from '@/lib/submissions';
import { TextField, SelectField } from '@/components/admin/fields';
import { updateUserProfile } from '../actions';

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl px-5 py-2 text-[13px] font-semibold transition-opacity disabled:opacity-60"
      style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
    >
      {pending ? '...جارٍ الحفظ' : 'حفظ البيانات'}
    </button>
  );
}

export interface EditableProfile {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  country: string | null;
  organization: string | null;
  category: string | null;
  track: string | null;
}

/**
 * The profile, editable in place.
 *
 * These fields are not administrative metadata — the name and organization
 * here are what the badge and the certificate print, so a typo made during
 * registration is a document with the wrong name on it. Read-only fields left
 * the only fix as "delete the account and ask them to register again".
 *
 * The track select carries the account's own stored value even when it is not
 * one of the current options, so saving an unrelated field cannot silently
 * drop a track that predates the list.
 */
export default function UserProfileForm({ user }: { user: EditableProfile }) {
  const [state, formAction] = useActionState(updateUserProfile, undefined);

  const trackOptions = [
    { value: '', label: 'بدون مسار' },
    ...SUBMISSION_TRACKS.map((t) => ({ value: t, label: t })),
    ...(user.track && !SUBMISSION_TRACKS.includes(user.track)
      ? [{ value: user.track, label: `${user.track} (قديم)` }]
      : []),
  ];

  return (
    <form
      action={formAction}
      className="rounded-2xl p-6 space-y-5"
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--mat-liquid-border)' }}
    >
      <input type="hidden" name="userId" value={user.id} />

      <h2 className="font-outfit font-bold text-[15px]" style={{ color: 'var(--text-primary)' }}>
        بيانات المستخدم
      </h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField name="name" label="الاسم الكامل" defaultValue={user.name} required />
        <TextField name="email" label="البريد الإلكتروني" type="email" defaultValue={user.email} required dir="ltr" />
        <TextField name="phone" label="رقم الهاتف" defaultValue={user.phone} dir="ltr" />
        <TextField name="country" label="الدولة" defaultValue={user.country} />
        <TextField name="organization" label="الجهة" defaultValue={user.organization} />
        <SelectField
          name="category"
          label="الفئة"
          defaultValue={user.category ?? ''}
          options={[{ value: '', label: 'بلا فئة' }, ...CATEGORIES.map((c) => ({ value: c.id, label: c.labels.ar }))]}
        />
        <SelectField name="track" label="المسار" defaultValue={user.track ?? ''} options={trackOptions} />
      </div>

      {state?.error && <p className="text-[13px]" style={{ color: 'var(--destructive)' }}>{state.error}</p>}
      {state?.success && <p className="text-[13px]" style={{ color: 'var(--accent-cyan)' }}>{state.success}</p>}

      <div className="pt-2" style={{ borderTop: '1px solid var(--mat-liquid-border)' }}>
        <SaveButton />
      </div>
    </form>
  );
}
