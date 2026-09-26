import { ListPageHeader } from '@/components/admin/ListPage';
import QRCode from '@/components/ui/QRCode';
import { siteUrl } from '@/lib/site';
import RegisterPoster from './RegisterPoster';

export const metadata = {
  title: 'رمز التسجيل | لوحة CIC',
};

const REGISTER_URL = `${siteUrl}/register`;

/**
 * Whether the address this symbol encodes is the one the public uses.
 *
 * `siteUrl` comes from NEXT_PUBLIC_SITE_URL, and it has been wrong before —
 * it pointed at the Vercel preview host for a while, which made every
 * canonical link and OG tag point there too. Those are fixed by a redeploy.
 * A QR is not: once this poster is printed and taped to a wall, whatever it
 * encodes is what people's cameras will open, and nobody will scan it to
 * check. So the page says so before anyone prints it.
 */
const LOOKS_PUBLIC = /^https:\/\/(www\.)?cictr\.org$/.test(siteUrl);

/**
 * A printable QR for the registration page.
 *
 * Correction level Q, not the M the badges use: a badge is scanned once, held
 * still, a hand's width from the camera. This gets printed, taped to a wall,
 * photographed at an angle by whoever walks past, and photocopied — so it is
 * worth spending a quarter of the symbol on recovering from damage rather than
 * finding out at the venue that a scuffed corner made it unreadable.
 */
export default function RegisterQrPage() {
  return (
    <div dir="rtl">
      <ListPageHeader
        title="رمز التسجيل"
        description="رمز يفتح صفحة التسجيل مباشرة. اطبعه أو أرسله كما هو."
      />

      {!LOOKS_PUBLIC && (
        <div
          className="mt-5 rounded-xl px-4 py-3 text-[13px] leading-relaxed"
          style={{ background: 'rgba(248,113,113,0.10)', border: '1px solid rgba(248,113,113,0.35)', color: '#f87171' }}
        >
          <strong>لا تطبع هذا الرمز.</strong> هو يشير حالياً إلى{' '}
          <span dir="ltr" style={{ unicodeBidi: 'isolate' }}>{siteUrl}</span>{' '}
          وليس إلى العنوان العام للموقع. صحّح <code>NEXT_PUBLIC_SITE_URL</code> أولاً.
        </div>
      )}

      <div
        className="mt-6 rounded-2xl p-5"
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--mat-liquid-border)' }}
      >
        {/* The poster: white, fixed colours, no theme tokens. It is captured as
            an image and printed, so it must look the same whatever theme the
            organizer happens to be using when they press the button. */}
        {/* The wrapper is what adapts to a narrow panel; the poster itself
            keeps one fixed width. html-to-image clones the node into an
            isolated document to rasterise it, and a `maxWidth: 100%` there
            resolves against a container that has no width — which collapsed
            the poster into a strip down one side of the PDF. Nothing inside
            the captured node may be sized in percentages. */}
        <div style={{ overflowX: 'auto', display: 'flex', justifyContent: 'center' }}>
        <div
          id="cic-register-poster"
          dir="rtl"
          style={{
            width: 420,
            flexShrink: 0,
            background: '#ffffff',
            borderRadius: 18,
            padding: '34px 30px 28px',
            textAlign: 'center',
            fontFamily: 'var(--font-ibm), system-ui, sans-serif',
          }}
        >
          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, letterSpacing: '0.18em', color: '#6b7280' }}>
            CIC · إسطنبول
          </p>
          <p style={{ margin: '10px 0 0', fontSize: 22, fontWeight: 800, color: '#0f172a', lineHeight: 1.3 }}>
            مؤتمر الإبداع والابتكار
          </p>
          <p style={{ margin: '6px 0 0', fontSize: 15, fontWeight: 600, color: '#334155' }}>
            امسح الرمز للتسجيل
          </p>

          <div style={{ margin: '22px auto 0', width: 260, height: 260 }}>
            <QRCode value={REGISTER_URL} size={260} correction="Q" title="رمز صفحة التسجيل" />
          </div>

          {/* The address in full underneath: a QR is unreadable to a person,
              and somebody whose camera will not focus needs to be able to type
              it. LTR so the slashes do not reorder in a right-to-left block. */}
          <p dir="ltr" style={{ margin: '18px 0 0', fontSize: 13, fontWeight: 600, color: '#0f172a', wordBreak: 'break-all' }}>
            {REGISTER_URL}
          </p>
          <p style={{ margin: '6px 0 0', fontSize: 11.5, color: '#6b7280' }}>
            ٢ – ٣ أكتوبر ٢٠٢٦ · إسطنبول، تركيا
          </p>
        </div>
        </div>

        <div className="text-center">
          <RegisterPoster targetId="cic-register-poster" />
          <p className="mt-3 text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
            الملف بحجم A4، جاهز للطباعة.
          </p>
        </div>
      </div>
    </div>
  );
}
