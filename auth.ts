import NextAuth, { CredentialsSignin } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db/client';
import {
  LOGIN_BY_EMAIL,
  LOGIN_BY_IP,
  clearFailures,
  clientIp,
  pruneThrottles,
  recordFailure,
  throttleState,
} from '@/lib/rate-limit';
import { refusalCode, type AccountStatus } from '@/lib/account-status';

/**
 * Surfaces a locked-out attempt distinctly from a wrong password, so the login
 * form can say how long the wait is instead of insisting the credentials are
 * wrong. The number of minutes is safe to expose — whoever is locked out
 * already knows they are being refused.
 */
class TooManyAttempts extends CredentialsSignin {
  code: string;
  constructor(retryAfterSeconds: number) {
    super();
    this.code = `throttled-${Math.max(1, Math.ceil(retryAfterSeconds / 60))}`;
  }
}

/**
 * The password was right and the account is still not admitted.
 *
 * Raised only after the password has been verified, so it tells nobody
 * anything they could not already learn by registering with that address
 * themselves — and it means a stranger guessing at addresses learns nothing
 * about which of them are waiting for a decision.
 */
class NotAdmitted extends CredentialsSignin {
  code: string;
  constructor(status: AccountStatus, note?: string | null) {
    super();
    // The note travels with the refusal because the notification carrying it
    // sits inside the account, which is the one thing they cannot open.
    this.code = refusalCode(status, note);
  }
}

// Compared against whenever the email is unknown. Without it, a missing
// account returns in a millisecond while a real one costs a bcrypt hash —
// a gap wide enough to sort real addresses from invented ones by timing
// alone. This keeps both paths on the same clock.
//
// It is a real cost-12 hash of a random string, so the comparison does the
// full amount of work — a malformed one would be rejected instantly and defeat
// the point. Nothing hashes to it, so it can never authenticate anybody.
const DUMMY_HASH = '$2b$12$OhgroOi4ucfQy.WB2AdZfeD/VO3xaVZ0RXaIJS/80gXHuCTvBn9VK';

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials, request) {
        const rawEmail = credentials?.email;
        const password = credentials?.password;
        if (typeof rawEmail !== 'string' || typeof password !== 'string') return null;

        const email = rawEmail.toLowerCase().trim();
        const ip = clientIp(request.headers);

        // Checked BEFORE the password is hashed, not after: bcrypt at cost 12
        // is a quarter-second of CPU, so refusing early is what stops a flood
        // of guesses from becoming a bill as well as a breach.
        const [byEmail, byIp] = await Promise.all([
          throttleState('login:email', email),
          ip ? throttleState('login:ip', ip) : Promise.resolve(null),
        ]);
        const blocked = [byEmail, byIp].find((s) => s?.blocked);
        if (blocked) throw new TooManyAttempts(blocked.retryAfter);

        const user = await prisma.user.findUnique({ where: { email } });

        // Always runs a comparison, even with nobody to compare against.
        const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);

        if (!user || !valid) {
          const [emailState, ipState] = await Promise.all([
            recordFailure('login:email', email, LOGIN_BY_EMAIL),
            ip ? recordFailure('login:ip', ip, LOGIN_BY_IP) : Promise.resolve(null),
          ]);

          // Tell them on the attempt that trips the limit, rather than letting
          // the next one look like yet another wrong password.
          const tripped = [emailState, ipState].find((s) => s?.blocked);
          if (tripped) throw new TooManyAttempts(tripped.retryAfter);

          return null;
        }

        // The password is right; whether the door is open is a separate
        // question. Checked here rather than in the layouts, because a session
        // that exists at all is one that proxy.ts will wave through — and
        // "signed in but allowed nowhere" is a worse experience than being
        // told plainly at the door.
        //
        // An organizer is never held: the role is granted by another organizer,
        // which is the approval.
        if (user.role !== 'ADMIN' && user.status !== 'APPROVED') {
          throw new NotAdmitted(user.status as AccountStatus, user.statusNote);
        }

        // A correct password clears the slate — someone who finally remembers
        // their password should not stay locked out by earlier typos.
        await Promise.all([
          clearFailures('login:email', email),
          ip ? clearFailures('login:ip', ip) : Promise.resolve(),
        ]);
        await pruneThrottles();

        return { id: user.id, email: user.email, name: user.name ?? undefined, role: user.role };
      },
    }),
  ],
  callbacks: {
    // The JWT is the only thing proxy.ts can read, so the role has to ride
    // along in it. Note it is a snapshot taken at sign-in: anything that must
    // reflect the current role reads the database through lib/auth-guards.ts.
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as 'ADMIN' | 'ATTENDEE';
        // `iat` is the standard claim Auth.js stamps when the token is minted.
        // lib/auth-guards.ts compares it with the account's passwordChangedAt,
        // which is how a password reset ends sessions that already exist —
        // there is no server-side session store to delete from.
        session.user.tokenIssuedAt = typeof token.iat === 'number' ? token.iat : undefined;
      }
      return session;
    },
  },
});
