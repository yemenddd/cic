import { NextResponse } from 'next/server';
import { auth } from '@/auth';

// Next.js 16 renamed "middleware" to "proxy" — same mechanism, new file name.
// Proxy defaults to the Node.js runtime here, so `auth()` works without an
// Edge split.
//
// This is a *redirect* layer, not the security boundary. Everything it knows
// comes from the JWT, which is written once at sign-in and carried for up to
// 30 days — so the role it reads can be out of date. The real checks are the
// DB-backed guards in lib/auth-guards.ts, used by the panel layouts and by
// every server action.
//
// It deliberately does NOT bounce signed-in visitors away from the login
// pages. It can't tell a current admin from a demoted one, and a stale token
// pointing someone at a panel the layout will push them straight back out of
// is how you build a redirect loop. The login pages decide that themselves,
// from the database.
export default auth((req) => {
  const { pathname } = req.nextUrl;
  const user = req.auth?.user;

  // Has to stay reachable while signed out — and while signed in as someone
  // who just lost their admin rights and needs a way back to a login form.
  if (pathname === '/admin/login') return;

  // Only "is there a session at all". The role is deliberately not consulted
  // here any more.
  //
  // It used to send a non-admin away from /admin, which was fine while
  // /dashboard accepted everybody. Now that the dashboard sends admins to
  // /admin — an organizer should not also have an attendee account, with a
  // badge and a certificate — that rule becomes half of a loop. The role in
  // this JWT is a copy written at sign-in: an account promoted since then
  // still carries `ATTENDEE`, so /admin would bounce it to /dashboard, the
  // dashboard would read ADMIN from the database and bounce it back, and
  // neither side would ever win.
  //
  // Both panel layouts already decide from the database, which cannot
  // disagree with itself. One source of truth, no loop.
  if (pathname.startsWith('/admin') && !user) {
    return NextResponse.redirect(new URL('/admin/login', req.nextUrl));
  }

  if (pathname.startsWith('/dashboard') && !user) {
    return NextResponse.redirect(new URL('/login', req.nextUrl));
  }
});

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*'],
};
