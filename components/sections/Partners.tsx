'use client';

import { motion } from 'framer-motion';
import { useLang } from '@/lib/i18n';
import { ProgressiveBlur } from '@/components/ui/progressive-blur';
import type { Partner as DbPartner } from '@/lib/db/queries';
import type { SponsorLogo } from '@/lib/sponsors';


export default function Partners({ data, logos = [] }: { data?: DbPartner[]; logos?: SponsorLogo[] }) {
  const { t, dir } = useLang();
  const isRtl = dir === 'rtl';

  // Partners entered in the admin panel win; otherwise the files in
  // public/images/sponsor, read on the server and handed down.
  const partners = data?.length
    ? data.map(p => ({ src: p.logoUrl, alt: p.name }))
    : logos;

  // Enough copies that the track is always wider than the screen plus one
  // copy — with only two, a monitor wider than a single copy ran out of
  // logos and showed empty track before the loop came round.
  const REPEATS = 4;
  const track = Array.from({ length: REPEATS }, () => partners).flat();

  return (
    <section className="pb-16 pt-16 md:pb-32 overflow-hidden" style={{ background: 'var(--bg-base)' }}>
      <div className="max-w-5xl mx-auto px-6">

        {/* Title */}
        <div className="text-center mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="font-outfit font-bold tracking-tight"
            style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)' }}
          >
            <span
              style={{
                background: 'var(--metallic-grad)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              <span style={{ letterSpacing: '0.18em' }}>{t('partners.titleA')}</span>{' '}
              <span style={{ fontWeight: 400 }}>{t('partners.titleB')}</span>
            </span>
          </motion.h2>
        </div>
      </div>

      {/* Marquee */}
      <div className="relative">
        {/* Edge blurs */}
        <ProgressiveBlur direction="right" blurLayers={8} blurIntensity={0.5} className="absolute left-0 top-0 h-full w-32 z-10" />
        <ProgressiveBlur direction="left"  blurLayers={8} blurIntensity={0.5} className="absolute right-0 top-0 h-full w-32 z-10" />

        {/* Scrolling track */}
        <div className="overflow-hidden">
          {/* The loop is seamless only if the distance travelled is exactly
              one copy of the row.

              This used `gap-8` and translated by 50%. With a gap, a track of
              N copies is N×items wide plus (N×items − 1) gaps — one gap short
              of a whole number of copies — so 50% landed half a gap off and
              the row visibly jumped on every cycle. The spacing is padding on
              each tile now, which belongs to the tile and repeats exactly with
              it, so one copy is precisely 100/REPEATS percent of the track. */}
          <style>{`
            @keyframes marquee-ltr {
              from { transform: translateX(0); }
              to   { transform: translateX(-${100 / REPEATS}%); }
            }
            @keyframes marquee-rtl {
              from { transform: translateX(0); }
              to   { transform: translateX(${100 / REPEATS}%); }
            }
            .marquee-track {
              animation: ${isRtl ? 'marquee-rtl' : 'marquee-ltr'} ${partners.length * 3}s linear infinite;
              will-change: transform;
            }
          `}</style>
          <div className="marquee-track flex items-center w-max">
            {track.map((logo, i) => (
              <div key={i} className="flex items-center justify-center shrink-0 px-4">
                {/* Each logo sits on its own rounded tile.
                    The artwork is dark on transparency and the files differ in
                    how much padding they carry, so a tile does two things: it
                    gives every partner the same footprint whatever their file
                    looks like, and it keeps them legible on the dark theme,
                    where they would otherwise be dark-on-dark. */}
                <div
                  className="flex h-24 w-24 items-center justify-center rounded-2xl p-3.5 transition-transform duration-300 hover:scale-105"
                  style={{
                    background: 'var(--partner-tile-bg)',
                    border: '1px solid var(--partner-tile-border)',
                  }}
                >
                  <img
                    src={logo.src}
                    alt={logo.alt}
                    // No opacity: the logos were dimmed to sit quietly on the
                    // page, but on a light tile that only makes them look
                    // washed out. The tile is what keeps them quiet now.
                    className="h-full w-full object-contain"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
