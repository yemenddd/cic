'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ImagePlus } from 'lucide-react';

const labelStyle = { color: 'var(--text-secondary)' };
const fieldWrapper = 'block';
const labelClass = 'block text-[13px] font-medium mb-1.5';

export function TextField({
  name, label, defaultValue, required, type = 'text', dir,
}: {
  name: string; label: string; defaultValue?: string | number | null; required?: boolean;
  type?: string; dir?: 'ltr' | 'rtl';
}) {
  return (
    <div className={fieldWrapper}>
      <label className={labelClass} style={labelStyle}>{label}{required && <span style={{ color: '#ef4444' }}> *</span>}</label>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue ?? ''}
        required={required}
        dir={dir}
        className="input-glass"
      />
    </div>
  );
}

export function TextAreaField({
  name, label, defaultValue, required,
}: { name: string; label: string; defaultValue?: string | null; required?: boolean }) {
  return (
    <div className={fieldWrapper}>
      <label className={labelClass} style={labelStyle}>{label}{required && <span style={{ color: '#ef4444' }}> *</span>}</label>
      <textarea
        name={name}
        defaultValue={defaultValue ?? ''}
        required={required}
        rows={3}
        className="input-glass"
        style={{ height: 'auto', resize: 'vertical', paddingTop: '0.6rem', paddingBottom: '0.6rem' }}
      />
    </div>
  );
}

// Renders three stacked inputs (ar/en/tr) for one localized field —
// `namePrefix` becomes namePrefixAr / namePrefixEn / namePrefixTr in the
// submitted FormData, matching each Prisma model's *Ar/*En/*Tr columns.
export function LocaleTextField({
  namePrefix, label, defaultValue, required, multiline,
}: {
  namePrefix: string; label: string;
  defaultValue?: { ar?: string | null; en?: string | null; tr?: string | null };
  required?: boolean; multiline?: boolean;
}) {
  const Field = multiline ? TextAreaField : TextField;
  return (
    <div>
      <p className="text-[13px] font-medium mb-2" style={labelStyle}>{label}{required && <span style={{ color: '#ef4444' }}> *</span>}</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Field name={`${namePrefix}Ar`} label="عربي" defaultValue={defaultValue?.ar} required={required} />
        <Field name={`${namePrefix}En`} label="English" defaultValue={defaultValue?.en} />
        <Field name={`${namePrefix}Tr`} label="Türkçe" defaultValue={defaultValue?.tr} />
      </div>
    </div>
  );
}

export function SelectField({
  name, label, defaultValue, options, required, onChange,
}: {
  name: string; label: string; defaultValue?: string; options: { value: string; label: string }[];
  required?: boolean;
  // Optional: most forms only read the value on submit, but a form that
  // previews the consequence of the choice needs it as it changes.
  onChange?: (value: string) => void;
}) {
  return (
    <div className={fieldWrapper}>
      <label className={labelClass} style={labelStyle}>{label}</label>
      <select
        name={name}
        defaultValue={defaultValue}
        required={required}
        onChange={onChange && ((e) => onChange(e.target.value))}
        className="input-glass"
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

// Single image upload — shows the current image (when editing) and lets the
// admin pick a replacement. The actual upload happens server-side inside the
// form's Server Action (FormData carries the File through natively).
export function ImageUploadField({ name, label, currentUrl }: { name: string; label: string; currentUrl?: string | null }) {
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);

  return (
    <div>
      <label className={labelClass} style={labelStyle}>{label}</label>
      <div className="flex items-center gap-4">
        <div
          className="w-20 h-20 rounded-xl overflow-hidden flex items-center justify-center shrink-0"
          style={{ background: 'var(--mat-liquid-bg)', border: '1px solid var(--mat-liquid-border)' }}
        >
          {preview
            ? <Image src={preview} alt="" width={80} height={80} className="w-full h-full object-cover" unoptimized={preview.startsWith('blob:')} />
            : <ImagePlus className="h-6 w-6" style={{ color: 'var(--text-tertiary)' }} />}
        </div>
        <input
          name={name}
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) setPreview(URL.createObjectURL(file));
          }}
          className="text-[13px]"
          style={{ color: 'var(--text-secondary)' }}
        />
      </div>
    </div>
  );
}

// Multiple images (e.g. achievement student photos) — up to `max`.
export function ImageListUploadField({ name, label, currentUrls = [], max = 3 }: {
  name: string; label: string; currentUrls?: string[]; max?: number;
}) {
  const slots = Array.from({ length: max }, (_, i) => i);
  return (
    <div>
      <label className={labelClass} style={labelStyle}>{label}</label>
      <div className="flex flex-wrap gap-4">
        {slots.map((i) => (
          <ImageUploadField key={i} name={`${name}_${i}`} label={`#${i + 1}`} currentUrl={currentUrls[i]} />
        ))}
      </div>
    </div>
  );
}
