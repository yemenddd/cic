import { prisma } from '../lib/db/client';
import { SEED_QUESTIONS } from '../lib/survey';

/**
 * The survey's first set of questions.
 *
 * Idempotent and refuses to touch a survey that already has questions: this is
 * how the form is born, not a way to reset it, and an organizer who has edited
 * the list must not lose that to a redeploy.
 */
const existing = await prisma.surveyQuestion.count();
if (existing > 0) {
  console.log(`الأسئلة موجودة بالفعل (${existing}) — لم يُغيَّر شيء.`);
  process.exit(0);
}

let order = 0;
for (const q of SEED_QUESTIONS) {
  await prisma.surveyQuestion.create({
    data: {
      section: q.section,
      promptAr: q.promptAr,
      helpAr: q.helpAr ?? null,
      kind: q.kind,
      options: q.options ?? [],
      required: q.required ?? false,
      order: order++,
    },
  });
}

console.log(`أُنشئ ${order} سؤالاً.`);
for (const s of [...new Set(SEED_QUESTIONS.map((q) => q.section))]) {
  console.log(`  ${SEED_QUESTIONS.filter((q) => q.section === s).length}  ${s}`);
}
