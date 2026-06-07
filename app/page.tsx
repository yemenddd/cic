import Hero from "@/components/sections/Hero";
import CinematicBreak from "@/components/sections/CinematicBreak";
import BoldStatement from "@/components/sections/BoldStatement";
import HorizontalGallery from "@/components/sections/HorizontalGallery";
import Speakers from "@/components/sections/Speakers";
import Program from "@/components/sections/Program";
import ScrollGallery from "@/components/sections/ScrollGallery";
import Partners from "@/components/sections/Partners";
import WordHero from "@/components/sections/WordHero";

export default function Home() {
  return (
    <div className="overflow-x-clip bg-black">
      {/* 01 · Hero — dark, 3-D robot, countdown */}
      <Hero />

      {/* 02 · Cinematic break — parallax photo, play-reel CTA */}
      <CinematicBreak />

      {/* 03 · Concept / Bold Statement — dark→light transition */}
      <BoldStatement />

      {/* 04 · Horizontal photo gallery — pinned, scroll-driven */}
      <HorizontalGallery />

      {/* 05 · Keynote speakers — dark, flip cards */}
      <Speakers />

      {/* 05 · Program streams — Fluent light */}
      <Program />

      {/* 06 · Scroll gallery — Fluent light */}
      <ScrollGallery />

      {/* 07 · Word cycling hero CTA — sticky scroll, register */}
      <WordHero />

      {/* 08 · Partners & sponsors — dark */}
      <Partners />
    </div>
  );
}
