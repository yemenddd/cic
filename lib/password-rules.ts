/**
 * The one rule about passwords that both sides of the wire need to know.
 *
 * It lives alone, with no imports, because the strength meter on the account
 * page runs in the browser and the reset logic runs on the server. Reading the
 * constant straight out of lib/password-reset.ts — which is where it used to
 * be — dragged node:crypto, bcrypt and the Prisma client into a client bundle
 * and failed the build outright:
 *
 *   Module build failed: UnhandledSchemeError:
 *   Reading from "node:crypto" is not handled by plugins
 *
 * Duplicating the number instead would have been worse than the crash: the two
 * copies would agree right up until somebody raised one of them, and then the
 * meter would promise a length the server refuses.
 */

/**
 * The shortest password the platform will set, wherever it is set from: the
 * reset form, either account page, and an organiser resetting somebody else's.
 *
 * Ten rather than the more familiar eight, and with no demand for symbols —
 * length is what costs an attacker time, and a rule that asks for one capital
 * and one digit mostly produces `Password1`.
 */
/**
 * Six characters.
 *
 * Lowered from ten deliberately, and it is a real trade. What buys it back is
 * that guessing is rate-limited rather than free: four wrong attempts on an
 * account cost nothing, the fifth locks it, and each further attempt doubles
 * the wait to a ceiling of fifteen minutes — so an online attack gets a few
 * hundred tries a day against one account, not a few billion.
 *
 * The reason is the audience. A conference whose attendees include people who
 * do not use a password manager, typing on a phone, at a desk, with a queue
 * behind them: a ten-character minimum there does not produce stronger
 * passwords, it produces written-down ones and abandoned registrations.
 */
export const MIN_PASSWORD_LENGTH = 6;
