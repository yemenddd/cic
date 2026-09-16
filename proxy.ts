import { NextResponse } from 'next/server';
import { auth } from '@/auth';

// Next.js 16 renamed "middleware" to "proxy" — same mechanism, new file name.
// Proxy defaults to the Node.js runtime here, so `auth()` works without an
// Edge split.
//
// Note this checks the ROLE, not just "is there a session": now that attendees
// can sign in too, `!!req.auth` alone would let any attendee into /admin.
export default auth((req) => {
  const { pathname } = req.nextUrl;
  const user = req.auth?.user;
  const isAdmin = user?.role === 'ADMIN';

  const isAdminLogin = pathname === '/admin/login';
  const isUserLogin = pathname === '/login';

  // Already signed in and sitting on a login page → send them home.
  if (user && (isAdminLogin || isUserLogin)) {
    return NextResponse.redirect(new URL(isAdmin ? '/admin' : '/dashboard', req.nextUrl));
  }

  if (pathname.startsWith('/admin') && !isAdminLogin) {
    if (!user) return NextResponse.redirect(new URL('/admin/login', req.nextUrl));
    // Signed in, but as an attendee — send them to their own dashboard
    // rather than a login page they've already passed.
    if (!isAdmin) return NextResponse.redirect(new URL('/dashboard', req.nextUrl));
  }

  if (pathname.startsWith('/dashboard') && !user) {
    return NextResponse.redirect(new URL('/login', req.nextUrl));
  }
});

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*', '/login'],
};
