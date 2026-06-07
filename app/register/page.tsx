import type { Metadata } from 'next';
import RegisterForm from '@/components/sections/RegisterForm';

export const metadata: Metadata = {
  title: 'التسجيل | مؤتمر الإبداع والابتكار 2026',
  description: 'سجّل الآن في مؤتمر الإبداع والابتكار — النسخة الرابعة، إسطنبول 2026.',
};

export default function RegisterPage() {
  return <RegisterForm />;
}
