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
import { siteUrl } from "@/lib/site";

const eventJsonLd = {
  "@context": "https://schema.org",
  "@type": "Event",
  name: "مؤتمر الإبداع والابتكار (CIC)",
  startDate: "2026-10-02",
  endDate: "2026-10-03",
  eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
  eventStatus: "https://schema.org/EventScheduled",
  location: {
    "@type": "Place",
    name: "إسطنبول، تركيا",
    address: { "@type": "PostalAddress", addressLocality: "Istanbul", addressCountry: "TR" },
  },
  image: [`${siteUrl}/opengraph-image`],
  description:
    "انضم إلينا في مؤتمر الإبداع والابتكار يومي ٢–٣ أكتوبر ٢٠٢٦. اكتشف مستقبل الابتكار.",
  organizer: { "@type": "Organization", name: "CIC", url: siteUrl },
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd) }}
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
      <Partners data={partners} />
    </div>
  );
}
