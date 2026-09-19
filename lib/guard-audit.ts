import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Finds server actions that nobody checked the caller of.
 *
 * Every export of a `'use server'` module is a public POST endpoint. Next.js
 * gives it an opaque id, which is not a security control — it ships to the
 * browser, and anyone holding it can call the action directly, with no page,
 * no layout and no navigation in the way. The panel layout guards the /admin
 * *pages*; it does not guard these.
 *
 * That rule was written down in several places in this codebase and followed
 * in some of them. Nine modules — every one that edits the public site, plus
 * the one that deletes registrations — had no check at all, so a stranger
 * could delete the programme, reorder the speakers, or empty the registration
 * list. Comments do not enforce rules, so this does.
 *
 * It reads source text rather than importing anything: importing a
 * `'use server'` module to inspect it would pull in the database client and
 * the auth stack, and the question here is purely structural.
 */

/**
 * Calling any of these near the top of an action counts as resolving who is
 * asking. They are not equivalent to each other — `requireAdmin` proves a
 * role, `currentUserId` only proves a session — but each one means the action
 * decided its caller's identity on the server rather than trusting the
 * arguments it was handed.
 */
const GUARDS = [
  'requireAdmin',
  'assertAdmin',
  'currentUser',
  'currentUserId',
  'isAdmin',
  'entitledUserId',
  'auth',
];

/**
 * The marker that makes an action deliberately public.
 *
 * Some actions must work for somebody who is not signed in — asking for a
 * password-reset link is the whole point of being locked out. Those are not
 * exceptions to the rule so much as a different rule, and they have to say so
 * in the source: an action is public because someone decided it should be,
 * not because a guard was forgotten.
 */
const PUBLIC_MARKER = '@public-action';

const EXPORTED_ACTION = /export async function (\w+)\([\s\S]*?\): Promise<[^>]*> \{\n/g;
const GUARD_CALL = new RegExp(`\\b(${GUARDS.join('|')})\\s*\\(`);

export interface ActionRef {
  file: string;
  action: string;
}

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) walk(path, out);
    else if (entry.endsWith('.ts')) out.push(path);
  }
  return out;
}

export interface GuardAudit {
  /** Actions with neither a guard nor a declared reason to be public. */
  unguarded: ActionRef[];
  /** Actions that say, in the source, that being public is the point. */
  declaredPublic: ActionRef[];
  total: number;
}

/**
 * Audit every `'use server'` module under `root`.
 *
 * Whether an action "reaches for a guard" is judged over its whole body rather
 * than its first line, because several of these legitimately open with a
 * comment explaining which guard they use and why.
 */
export function auditServerActions(root = 'app'): GuardAudit {
  const unguarded: ActionRef[] = [];
  const declaredPublic: ActionRef[] = [];
  let total = 0;

  for (const file of walk(root)) {
    const source = readFileSync(file, 'utf8');
    if (!source.startsWith("'use server'")) continue;

    for (const match of source.matchAll(EXPORTED_ACTION)) {
      total++;
      const name = match[1];
      const start = match.index + match[0].length;
      // Bounded at the end of this function, so a guard in the *next* one
      // cannot launder an unguarded neighbour.
      const body = source.slice(start).split('\n}')[0];

      // The marker is looked for in the doc comment above the signature as
      // well as in the body, since that is where the reasoning belongs.
      const preamble = source.slice(Math.max(0, match.index - 1200), match.index);

      if (preamble.includes(PUBLIC_MARKER) || body.includes(PUBLIC_MARKER)) {
        declaredPublic.push({ file, action: name });
      } else if (!GUARD_CALL.test(body)) {
        unguarded.push({ file, action: name });
      }
    }
  }

  return { unguarded, declaredPublic, total };
}
