import type { ProjectSubmission } from '@prisma/client';
import SubmissionFiles, { type AttachedFile } from './SubmissionFiles';
import { TextField, TextAreaField, SelectField, ImageUploadField } from '@/components/admin/fields';
import { SUBMISSION_TRACKS } from '@/lib/submissions';

const TRACK_OPTIONS = [
  { value: '', label: '— اختر المسار —' },
  ...SUBMISSION_TRACKS.map((t) => ({ value: t, label: t })),
];

// Shared by the new/edit pages so the two forms can never drift apart.
export default function SubmissionFields({
  submission,
  files = [],
  editable = true,
}: {
  submission?: ProjectSubmission;
  files?: AttachedFile[];
  /** False once the committee has it — see SubmissionFiles. */
  editable?: boolean;
}) {
  return (
    <>
      <TextField name="titleAr" label="عنوان المشروع" defaultValue={submission?.titleAr} required />
      <TextField name="titleEn" label="العنوان بالإنجليزية" defaultValue={submission?.titleEn} dir="ltr" />
      <TextAreaField
        name="summaryAr"
        label="ملخص قصير (جملة تعريفية بالمشروع)"
        defaultValue={submission?.summaryAr}
        required
      />
      <TextAreaField name="descriptionAr" label="وصف تفصيلي" defaultValue={submission?.descriptionAr} />
      <SelectField name="track" label="المسار" defaultValue={submission?.track ?? ''} options={TRACK_OPTIONS} />
      <TextAreaField
        name="teamMembers"
        label="أعضاء الفريق (اسم واحد في كل سطر)"
        defaultValue={submission?.teamMembers.join('\n')}
      />
      <ImageUploadField name="cover" label="صورة الغلاف" currentUrl={submission?.coverImageUrl} />
      {/* The work itself, for whichever path this is — a paper, a deck, photos
          of a prototype. The cover image above introduces it; this is it. */}
      <SubmissionFiles files={files} editable={editable} />
      <TextField
        name="videoId"
        label="معرّف فيديو يوتيوب (مثال: dQw4w9WgXcQ)"
        defaultValue={submission?.videoId}
        dir="ltr"
      />
    </>
  );
}
