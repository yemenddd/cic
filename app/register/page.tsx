import RegisterForm from '@/components/sections/RegisterForm';
import { pageMetadata } from '@/lib/page-metadata';

export const metadata = pageMetadata({
  title: 'التسجيل | مؤتمر الإبداع والابتكار 2026',
  description: 'سجّل الآن في مؤتمر الإبداع والابتكار — النسخة الرابعة، إسطنبول 2026.',
});

export default function RegisterPage() {
  return <RegisterForm />;
}
