'use client';

import FormShell from '@/components/admin/FormShell';
import { TextField, TextAreaField, SelectField } from '@/components/admin/fields';

type ActionResult = { error?: string; success?: string } | void;

export interface ShiftDefaults {
  titleAr?: string;
  teamAr?: string;
  day?: string;
  startTime?: string;
  endTime?: string;
  location?: string | null;
  notesAr?: string | null;
  capacity?: number;
  isOpen?: boolean;
}

// Suggestions, not a fixed list: the teams differ from one conference to the
// next, and a `select` here would mean a migration every time the organizers
// invent one. A datalist gives the common four without forbidding a fifth.
const TEAMS = ['الاستقبال والتسجيل', 'القاعة الرئيسية', 'الدعم التقني', 'الإعلام والتصوير', 'الضيافة', 'التنظيم العام'];

export default function ShiftForm({
  title,
  action,
  defaults,
  submitLabel,
}: {
  title: string;
  action: (state: ActionResult, formData: FormData) => Promise<ActionResult>;
  defaults?: ShiftDefaults;
  submitLabel?: string;
}) {
  return (
    <FormShell title={title} backHref="/admin/volunteering" action={action} submitLabel={submitLabel}>
      <TextField name="titleAr" label="عنوان الفترة" defaultValue={defaults?.titleAr} required />

      <div>
        <TextField name="teamAr" label="الفريق" defaultValue={defaults?.teamAr} required list="volunteer-teams" />
        <datalist id="volunteer-teams">
          {TEAMS.map((t) => (
            <option key={t} value={t} />
          ))}
        </datalist>
        <p className="mt-1.5 text-[11.5px]" style={{ color: 'var(--text-tertiary)' }}>
          مثل: {TEAMS.slice(0, 3).join(' · ')}
        </p>
      </div>

      <SelectField
        name="day"
        label="اليوم"
        defaultValue={defaults?.day ?? 'dayOne'}
        options={[
          { value: 'dayOne', label: 'اليوم الأول' },
          { value: 'dayTwo', label: 'اليوم الثاني' },
        ]}
        required
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* type=time so the browser enforces the 24-hour shape the clash
            detection parses — a free-text "9 صباحاً" would be stored happily
            and then silently excluded from every overlap check. */}
        <TextField name="startTime" label="من" type="time" defaultValue={defaults?.startTime ?? '09:00'} required dir="ltr" />
        <TextField name="endTime" label="إلى" type="time" defaultValue={defaults?.endTime ?? '13:00'} required dir="ltr" />
      </div>

      <TextField name="location" label="المكان" defaultValue={defaults?.location ?? ''} />

      <div>
        <TextField
          name="capacity"
          label="عدد المتطوعين المطلوب"
          type="number"
          defaultValue={defaults?.capacity ?? 2}
          required
        />
        <p className="mt-1.5 text-[11.5px]" style={{ color: 'var(--text-tertiary)' }}>
          يتوقف التسجيل تلقائياً عند بلوغ هذا العدد.
        </p>
      </div>

      <TextAreaField name="notesAr" label="ملاحظات للمتطوع" defaultValue={defaults?.notesAr ?? ''} />

      <label className="flex items-center gap-2.5 text-[13px]" style={{ color: 'var(--text-secondary)' }}>
        <input
          type="checkbox"
          name="isOpen"
          defaultChecked={defaults?.isOpen ?? true}
          className="h-4 w-4"
        />
        مفتوحة للتسجيل
      </label>
    </FormShell>
  );
}
