import FormShell from '@/components/admin/FormShell';
import SubmissionFields from '../SubmissionFields';
import { createSubmission } from '../actions';

export default function NewSubmissionPage() {
  return (
    <FormShell
      title="تقديم ابتكار"
      backHref="/dashboard/innovations"
      action={createSubmission}
      submitLabel="حفظ كمسودة"
    >
      <p className="text-[12.5px] leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
        يُحفظ المشروع كمسودة أولاً، ويمكنك تعديله متى شئت. أرسله إلى لجنة المراجعة من صفحة ابتكاراتي حين يكون جاهزاً.
      </p>
      <SubmissionFields />
    </FormShell>
  );
}
