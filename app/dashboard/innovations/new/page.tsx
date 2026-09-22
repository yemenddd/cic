import FormShell from '@/components/admin/FormShell';
import SubmissionFields from '../SubmissionFields';
import { createSubmission } from '../actions';
import { innovationAccess, NotEntitled } from '../access';

export default async function NewSubmissionPage() {
  const access = await innovationAccess();
  if (access.userId === null) return <NotEntitled category={access.category} />;

  return (
    <FormShell
      title="تقديم ابتكار"
      backHref="/dashboard/innovations"
      action={createSubmission}
      submitLabel="حفظ كمسودة"
    >
      <p className="text-[12.5px] leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
        يُحفظ المشروع كمسودة أولاً، ويمكنك تعديله متى شئت. أرسله إلى لجنة المراجعة من صفحة أعمالي حين يكون جاهزاً.
      </p>
      <SubmissionFields />
    </FormShell>
  );
}
