import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'لوحة تحكم CICT',
  robots: { index: false, follow: false },
};

// Deliberately does no auth work: /admin/login has to render for someone who
// is *not* signed in, and a guard here could only redirect them to that same
// page — a loop. The guard lives one level down, in (panel)/layout.tsx, which
// wraps every admin route except the login page.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
