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
  name: "مؤتمر الإبداع والابتكار 2026 (CIC 2026)",
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

export default async function Home() {
  const [partners, speakers] = await Promise.all([getPartners(), getSpeakers()]);

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

      {/* 05 · Keynote speakers — dark, flip cards */}
      <Speakers data={speakers} />

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
