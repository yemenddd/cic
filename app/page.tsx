import HeroSlider from "@/components/sections/HeroSlider";
import Hero from "@/components/sections/Hero";
import CinematicBreak from "@/components/sections/CinematicBreak";
import BoldStatement from "@/components/sections/BoldStatement";
import HorizontalGallery from "@/components/sections/HorizontalGallery";
import Speakers from "@/components/sections/Speakers";
import Program from "@/components/sections/Program";
import ScrollGallery from "@/components/sections/ScrollGallery";
import Partners from "@/components/sections/Partners";
import RegisterCTA from "@/components/sections/RegisterCTA";
import { getPartners, getSpeakers } from "@/lib/db/queries";
import { sponsorLogos } from "@/lib/sponsors";
import { siteUrl } from "@/lib/site";

/**
 * Was an `Event` with a startDate and an endDate.
 *
 * schema.org requires a start date on an Event, and a search engine shows one
 * with its date attached — so after the fourth edition closed, the only honest
 * Event markup would have been a past date advertised on the homepage. What
 * the site is between editions is an organization with a platform, not a
 * scheduled event, and that is what it now declares. An Event block comes back
 * when there is a fifth date to put in it.
 */
const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "مؤتمر الإبداع والابتكار (CIC)",
  url: siteUrl,
  // The file, not the route: this was a generated ImageResponse at
  // /opengraph-image and is now a static PNG, so the extension is part of it.
  logo: `${siteUrl}/opengraph-image.png`,
  image: [`${siteUrl}/opengraph-image.png`],
  description:
    "منصة مؤتمر الإبداع والابتكار — الإبداع والبحث العلمي والابتكار، ومجتمع من المبدعين والباحثين.",
  address: { "@type": "PostalAddress", addressLocality: "Istanbul", addressCountry: "TR" },
};

/**
 * Whether the keynote speakers section appears on the homepage.
 *
 * Hidden for now, at the organizers' request — the line-up is not settled and
 * the section named people as confirmed speakers. Nothing about them is
 * deleted: the six rows are still in the database and still editable from
 * /admin/speakers, and the section itself is untouched. Set this to true to
 * bring it back.
 */
const SHOW_SPEAKERS: boolean = false;

export default async function Home() {
  // Not queried while the section is hidden — there is nothing to render it
  // into, and the homepage should not pay for a round-trip it discards.
  const [partners, speakers] = await Promise.all([
    getPartners(),
    SHOW_SPEAKERS ? getSpeakers() : [],
  ]);

  return (
    <div className="overflow-x-clip bg-black">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />
      {/* 01 · Full-screen image slider */}
      <HeroSlider />

      {/* 02 · Hero — dark, 3-D robot, countdown */}
      <Hero />

      {/* 02 · Cinematic break — parallax photo, play-reel CTA */}
      <CinematicBreak />

      {/* 03 · Concept / Bold Statement — dark→light transition */}
      <BoldStatement />

      {/* 04 · Horizontal photo gallery — pinned, scroll-driven */}
      <HorizontalGallery />

      {/* 05 · Keynote speakers — dark, flip cards. See SHOW_SPEAKERS above. */}
      {SHOW_SPEAKERS && <Speakers data={speakers} />}

      {/* 05 · Program streams — Fluent light */}
      <Program />

      {/* 06 · Scroll gallery — Fluent light */}
      <ScrollGallery />

      {/* 07 · Final register CTA — dark, countdown + email */}
      <RegisterCTA />

      {/* 08 · Partners & sponsors */}
      <Partners data={partners} logos={sponsorLogos()} />
    </div>
  );
}
