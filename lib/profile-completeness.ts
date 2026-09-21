/**
 * How ready an attendee's details are for the things they get printed on.
 *
 * The account page has always said "these are printed on your badge and your
 * certificate, check them before the conference" and then shown a form that
 * looks equally finished whether every field is filled or only one is. Nothing
 * on the page distinguished a complete profile from a half-empty one, which
 * made the instruction impossible to act on.
 *
 * Each field carries *what it is for* rather than a generic "required". An
 * attendee deciding whether to bother filling in their organisation is helped
 * by knowing it appears under their name on the badge at the door, and not at
 * all by an asterisk.
 *
 * Pure and free of React so the same reckoning serves the server render and
 * the live updates as the form is typed into — and so it can be checked.
 */

export interface ProfileFields {
  name?: string | null;
  phone?: string | null;
  country?: string | null;
  organization?: string | null;
  track?: string | null;
}

export interface ProfileItem {
  key: keyof ProfileFields;
  label: string;
  /** What this value is actually used for. */
  why: string;
  filled: boolean;
  /** Missing this one means a document goes out wrong, not merely sparse. */
  essential: boolean;
}

export interface ProfileCompleteness {
  items: ProfileItem[];
  filled: number;
  total: number;
  /** 0–1. */
  ratio: number;
  /** Essentials still missing, in the order they appear on the form. */
  missingEssential: ProfileItem[];
}

/** Whitespace is not a value: " " in a name field prints as a blank line. */
function has(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

const FIELDS: Array<Omit<ProfileItem, 'filled'>> = [
  {
    key: 'name',
    label: 'الاسم الكامل',
    why: 'يُطبع على بطاقتك وشهادتك كما تكتبه هنا',
    essential: true,
  },
  {
    key: 'country',
    label: 'الدولة',
    why: 'تظهر تحت اسمك على البطاقة',
    essential: false,
  },
  {
    key: 'organization',
    label: 'الجهة / المؤسسة',
    why: 'تظهر على البطاقة، ويعرفك بها من تقابلهم',
    essential: false,
  },
  {
    key: 'track',
    label: 'المسار',
    why: 'يُطبع على الشهادة — بدونه تصدر بلا مسار',
    essential: true,
  },
  {
    key: 'phone',
    label: 'رقم الهاتف',
    why: 'الطريقة التي يصلك بها الفريق إن استجدّ شيء',
    essential: false,
  },
];

export function profileCompleteness(fields: ProfileFields): ProfileCompleteness {
  const items: ProfileItem[] = FIELDS.map((f) => ({ ...f, filled: has(fields[f.key]) }));
  const filled = items.filter((i) => i.filled).length;

  return {
    items,
    filled,
    total: items.length,
    ratio: items.length > 0 ? filled / items.length : 0,
    missingEssential: items.filter((i) => i.essential && !i.filled),
  };
}
