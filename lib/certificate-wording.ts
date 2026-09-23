import { arabicCountBare, HOUR } from '@/lib/arabic-plural';

/**
 * What each certificate actually says.
 *
 * Three categories were sharing two sentences: a volunteer and a visitor were
 * handed the same "شارك في فعاليات المؤتمر", which is true of anybody who
 * walked through the door and says nothing about what either of them did. A
 * certificate that does not distinguish them is not worth presenting to an
 * employer or a university, which is the only reason to want one.
 *
 * So: a volunteer's says which committee they worked with and for how many
 * hours; a participant's says which path they entered and what they presented;
 * a visitor's says they attended, which is the honest whole of it.
 *
 * Both languages are produced here side by side so they cannot drift — the
 * sheet prints them facing each other, and a discrepancy between the two
 * halves of one document is worse than either half alone.
 *
 * Pure, so the sentences can be checked without rendering a certificate.
 */

export interface CertificateFacts {
  categoryId: string;
  /** Arabic label of the category, for the chip. */
  categoryLabel: string;
  /** The participant's path, in canonical Arabic (lib/submissions.ts). */
  track?: string | null;
  /** The volunteer's committee, already resolved to its Arabic name. */
  committeeAr?: string | null;
  /** The same committee in English, for the facing column. */
  committeeEn?: string | null;
  /** Hours on the rota, summed from shifts whose times could be read. */
  volunteerHours?: number;
  /** The title of the work they presented, when exactly one was approved. */
  projectTitle?: string | null;
  /** The author's own English title, when they supplied one. */
  projectTitleEn?: string | null;
  /** How many of their works the committee approved. */
  approvedProjects?: number;
  dateAr: string;
  dateEn: string;
  locationAr: string;
  locationEn: string;
}

export interface CertificateWording {
  titleAr: string;
  titleEn: string;
  /** "تشهد اللجنة المنظمة بأنّ" — the line above the name. */
  leadAr: string;
  leadEn: string;
  bodyAr: string;
  bodyEn: string;
  /** The label on the category chip. */
  kindAr: string;
  kindEn: string;
}

const CONFERENCE_AR = 'مؤتمر الإبداع والابتكار الرابع';
const CONFERENCE_EN = 'the Fourth Creativity & Innovation Conference';

/** English hours, where one is "hour" and everything else is "hours". */
function englishHours(n: number): string {
  return `${n} ${n === 1 ? 'hour' : 'hours'}`;
}

/**
 * Which kind of work a path describes.
 *
 * Read from the canonical Arabic rather than compared against a list of
 * spellings at the call site: the paths were renamed once already, and the
 * sentence on a printed certificate must not be the thing that quietly stops
 * matching.
 */
function isResearchPath(track?: string | null): boolean {
  return Boolean(track && track.includes('البحث'));
}

function volunteerWording(f: CertificateFacts): CertificateWording {
  // The hours are what turn "شهادة تطوّع معتمدة" from a title into a document
  // that says something — an employer reads the number, not the adjective.
  // Stated only when the rota has hours to state: a volunteer with no recorded
  // shift gets the sentence without a figure rather than a claim of zero.
  const hours = f.volunteerHours && f.volunteerHours > 0 ? f.volunteerHours : 0;

  const withCommitteeAr = f.committeeAr ? ` ضمن لجنة ${f.committeeAr}،` : '';
  const withCommitteeEn = f.committeeEn ? ` with the ${f.committeeEn} committee,` : '';
  const hoursAr = hours > 0 ? ` بواقع ${arabicCountBare(hours, HOUR)} من العمل التنظيمي،` : '';
  const hoursEn = hours > 0 ? ` contributing ${englishHours(hours)} of organizing work,` : '';

  return {
    titleAr: 'شهادة تطوّع',
    titleEn: 'Certificate of Volunteering',
    leadAr: 'تشهد اللجنة المنظمة للمؤتمر بأنّ',
    leadEn: 'The organizing committee hereby certifies that',
    bodyAr:
      `قد ساهم ضمن الفريق التطوّعي ل${CONFERENCE_AR}، المنعقد يومي ${f.dateAr} في ${f.locationAr}،`
      + `${withCommitteeAr}${hoursAr} وأدّى مهامه التنظيمية بالتزامٍ وتفانٍ يستحقان التقدير.`,
    bodyEn:
      `served on the volunteer team of ${CONFERENCE_EN}, held ${f.dateEn} in ${f.locationEn},`
      + `${withCommitteeEn}${hoursEn} carrying out their organizing duties with commitment and dedication.`,
    kindAr: 'صفة التطوّع',
    kindEn: 'Volunteering',
  };
}

function participantWording(f: CertificateFacts): CertificateWording {
  const research = isResearchPath(f.track);

  const pathAr = f.track ? ` ضمن ${f.track}،` : '';
  const pathEn = f.track
    ? ` in the ${research ? 'Scientific Research' : 'Invention & Innovation'} Path,`
    : '';

  // Named when there is exactly one to name. Two approved projects on one
  // certificate would need a list, and a list belongs on a transcript rather
  // than on a single line of a printed sheet.
  const count = f.approvedProjects ?? 0;
  const workAr = count === 1 && f.projectTitle
    ? ` بعمله «${f.projectTitle}»،`
    : count > 1
      ? ` بأعماله المقبولة،`
      : '';
  // The author's English title when they wrote one; otherwise the Arabic, as
  // they wrote it. Transliterating a project title nobody checked would put a
  // name on a signed document that its own author does not use.
  const workEn = count === 1 && (f.projectTitleEn || f.projectTitle)
    ? ` with the work “${f.projectTitleEn || f.projectTitle}”,`
    : count > 1
      ? ` with their accepted works,`
      : '';

  const verbAr = research ? 'وعرض بحثه على لجنة التحكيم' : 'وعرض ابتكاره على لجنة التحكيم';
  const verbEn = research
    ? 'presenting their research before the review committee'
    : 'presenting their invention before the review committee';

  return {
    titleAr: 'شهادة مشاركة',
    titleEn: 'Certificate of Participation',
    leadAr: 'تشهد اللجنة المنظمة للمؤتمر بأنّ',
    leadEn: 'The organizing committee hereby certifies that',
    bodyAr:
      `قد شارك في ${CONFERENCE_AR}، المنعقد يومي ${f.dateAr} في ${f.locationAr}،`
      + `${pathAr}${workAr} ${verbAr}، وأسهم بذلك في إثراء فعاليات المؤتمر.`,
    bodyEn:
      `participated in ${CONFERENCE_EN}, held ${f.dateEn} in ${f.locationEn},`
      + `${pathEn}${workEn} ${verbEn}, contributing to the work of the conference.`,
    kindAr: 'صفة المشاركة',
    kindEn: 'Participation',
  };
}

function visitorWording(f: CertificateFacts): CertificateWording {
  return {
    titleAr: 'شهادة حضور',
    titleEn: 'Certificate of Attendance',
    leadAr: 'تشهد اللجنة المنظمة للمؤتمر بأنّ',
    leadEn: 'The organizing committee hereby certifies that',
    // Says attendance and nothing more. Claiming participation for somebody
    // who came to watch is what makes every other certificate here worth less.
    bodyAr:
      `قد حضر فعاليات ${CONFERENCE_AR}، المنعقد يومي ${f.dateAr} في ${f.locationAr}،`
      + ` وتابع جلساته العلمية ومعرض الابتكار.`,
    bodyEn:
      `attended ${CONFERENCE_EN}, held ${f.dateEn} in ${f.locationEn},`
      + ` following its sessions and the innovation exhibition.`,
    kindAr: 'صفة الحضور',
    kindEn: 'Attendance',
  };
}

export function certificateWording(f: CertificateFacts): CertificateWording {
  switch (f.categoryId) {
    case 'volunteer':
      return volunteerWording(f);
    case 'participant':
      return participantWording(f);
    case 'visitor':
      return visitorWording(f);
    default:
      // An account with no category, or one from a future tier nobody has
      // taught this file about. Attendance is the claim that is true of
      // everybody who holds a badge, so it is the safe one to make.
      return visitorWording(f);
  }
}
