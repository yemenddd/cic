import { Globe, Info } from 'lucide-react';
import { ListPageHeader } from '@/components/admin/ListPage';
import { TextField, TextAreaField } from '@/components/admin/fields';
import AccountForm from '@/components/dashboard/AccountForm';
import { getSiteSettings } from '@/lib/site-settings-server';
import { DEFAULT_SETTINGS } from '@/lib/site-settings';
import ToggleField from './ToggleField';
import { saveSiteSettings } from './actions';

export const metadata = {
  title: 'إعدادات الموقع | لوحة CICT',
};

export default async function SiteSettingsPage() {
  const settings = await getSiteSettings();

  return (
    <div dir="rtl">
      <ListPageHeader title="إعدادات الموقع" />

      <p className="mb-5 max-w-2xl text-[12.5px] leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
        قيم تظهر على الموقع العام. الحقل الفارغ يعود إلى القيمة الافتراضية — لا يُفرِّغ الموقع.
      </p>

      <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr] lg:items-start">
        <AccountForm
          title="التواصل وحسابات التواصل"
          description="تظهر في تذييل كل صفحة من الموقع."
          action={saveSiteSettings}
          submitLabel="حفظ الإعدادات"
        >
          <TextField
            name="contactEmail"
            label="البريد الإلكتروني للتواصل"
            defaultValue={settings.contactEmail}
            type="email"
            dir="ltr"
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <TextField name="facebookUrl" label="فيسبوك" defaultValue={settings.facebookUrl} dir="ltr" />
            <TextField name="instagramUrl" label="إنستغرام" defaultValue={settings.instagramUrl} dir="ltr" />
            <TextField name="youtubeUrl" label="يوتيوب" defaultValue={settings.youtubeUrl} dir="ltr" />
            <TextField name="xUrl" label="X" defaultValue={settings.xUrl} dir="ltr" />
          </div>

          <hr style={{ borderColor: 'var(--mat-liquid-border)' }} />

          <ToggleField
            name="registrationOpen"
            label="التسجيل مفتوح"
            description="عند الإغلاق يختفي النموذج من صفحة التسجيل، ويُرفض أي إرسال إلى الخادم."
            defaultChecked={settings.registrationOpen}
          />

          <TextAreaField
            name="registrationClosedNote"
            label="الرسالة التي تظهر عند إغلاق التسجيل"
            defaultValue={settings.registrationClosedNote}
          />
        </AccountForm>

        <section
          className="rounded-2xl p-5"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--mat-liquid-border)' }}
        >
          <h2
            className="mb-3 flex items-center gap-2 font-outfit font-bold text-[14.5px]"
            style={{ color: 'var(--text-primary)' }}
          >
            <Globe className="h-4 w-4" style={{ color: 'var(--accent-violet)' }} />
            ما الذي يتغيّر فعلاً
          </h2>

          <ul className="space-y-3 text-[12.5px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            <li className="flex items-start gap-2.5">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: 'var(--text-tertiary)' }} />
              روابط التواصل تظهر في تذييل كل صفحة. الرابط غير الصالح يُرفض عند الحفظ ولا يُكتب —
              لأنه يُوضع مباشرة في صفحة عامة.
            </li>
            <li className="flex items-start gap-2.5">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: 'var(--text-tertiary)' }} />
              إغلاق التسجيل يُطبَّق على الخادم أيضاً، لا في الواجهة فقط. نموذج مُخفى ما زال يقبل
              الإرسال ليس مغلقاً.
            </li>
            <li className="flex items-start gap-2.5">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: 'var(--text-tertiary)' }} />
              الحسابات المسجَّلة مسبقاً لا تتأثر بإغلاق التسجيل — يواصل أصحابها الدخول إلى لوحاتهم
              كالمعتاد.
            </li>
          </ul>

          <p className="mt-5 text-[11.5px] leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
            القيم الافتراضية عند ترك الحقل فارغاً:
            <br />
            <span dir="ltr" className="block mt-1.5 font-mono text-[11px]">
              {DEFAULT_SETTINGS.contactEmail}
            </span>
          </p>
        </section>
      </div>
    </div>
  );
}
