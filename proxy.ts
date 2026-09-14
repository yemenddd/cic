import { NextResponse } from 'next/server';
import { auth } from '@/auth';

// Next.js 16 renamed "middleware" to "proxy" — same mechanism, new file name.
// Proxy defaults to the Node.js runtime here, so `auth()` (and the Prisma
// lookup it can trigger via the JWT session) works without an Edge split.
export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isLoginPage = req.nextUrl.pathname === '/admin/login';

  if (!isLoggedIn && !isLoginPage) {
    return NextResponse.redirect(new URL('/admin/login', req.nextUrl));
  }
  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL('/admin', req.nextUrl));
  }
});

export const config = {
  matcher: ['/admin/:path*'],
};
