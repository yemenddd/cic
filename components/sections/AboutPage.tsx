'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useMotionValueEvent, useTransform } from 'framer-motion';
import { Lightbulb, FlaskConical, Users, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useLang } from '@/lib/i18n';
import { cn } from '@/lib/utils';

/* ─── Animated counter — resets and replays every time it enters view ─── */
function Counter({ target, suffix = '', prefix = '', visible }: { target: number; suffix?: string; prefix?: string; visible: boolean }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!visible) { setCount(0); return; }
    const duration = 2000;
    const start = performance.now();
    let id: number;
    const step = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setCount(Math.floor(eased * target));
      if (t < 1) id = requestAnimationFrame(step);
      else setCount(target);
    };
    id = requestAnimationFrame(step);
    return () => cancelAnimationFrame(id);
  }, [visible, target]);
  return <>{prefix}{count.toLocaleString('en-US')}{suffix}</>;
}

/* ─── Section scroll hook ─── */
function useSection() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const [p, setP] = useState(0);
  useMotionValueEvent(scrollYProgress, 'change', setP);
  const reveal = (t: number) => ({
    initial: { opacity: 0, y: 28 },
    animate: { opacity: p >= t ? 1 : 0, y: p >= t ? 0 : 28 },
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  });
  const revealWord = (t: number) => ({
    initial: { opacity: 0, y: 56 },
    animate: { opacity: p >= t ? 1 : 0, y: p >= t ? 0 : 56 },
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const },
  });
  return { ref, p, scrollYProgress, reveal, revealWord };
}

/* ─── Elegant floating shape ─── */
function ElegantShape({
  className,
  delay = 0,
  width = 400,
  height = 100,
  rotate = 0,
  gradient = "from-white/[0.08]",
}: {
  className?: string;
  delay?: number;
  width?: number;
  height?: number;
  rotate?: number;
  gradient?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -150, rotate: rotate - 15 }}
      animate={{ opacity: 1, y: 0, rotate }}
      transition={{ duration: 2.4, delay, ease: [0.23, 0.86, 0.39, 0.96], opacity: { duration: 1.2 } }}
      className={cn("absolute", className)}
    >
      <motion.div
        animate={{ y: [0, 15, 0] }}
        transition={{ duration: 12, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        style={{ width, height }}
        className="relative"
      >
        <div
          className={cn(
            "absolute inset-0 rounded-full",
            "bg-gradient-to-r to-transparent",
            gradient,
            "backdrop-blur-[2px] border-2 border-white/[0.15]",
            "shadow-[0_8px_32px_0_rgba(255,255,255,0.1)]",
            "after:absolute after:inset-0 after:rounded-full",
            "after:bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent_70%)]",
          )}
        />
      </motion.div>
    </motion.div>
  );
}

/* ─── Grid background ─── */
const Grid = () => (
  <div className="absolute inset-0 z-0 pointer-events-none" style={{
    backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px)',
    backgroundSize: '3rem 3rem',
    maskImage: 'radial-gradient(ellipse 80% 70% at 50% 50%, black, transparent)',
    WebkitMaskImage: 'radial-gradient(ellipse 80% 70% at 50% 50%, black, transparent)',
  }} />
);

/* ─────────────────────────────────────────
   SECTION 1 — Hero
───────────────────────────────────────── */
function HeroSection() {
  const { ref } = useSection();
  return (
    <div ref={ref} className="relative h-screen">
      <div className="h-full w-full flex items-center justify-center overflow-hidden bg-[#030712]">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.05] via-transparent to-rose-500/[0.05] blur-3xl" />
        <div className="absolute inset-0 overflow-hidden">
          <ElegantShape delay={0.3} width={600} height={140} rotate={12} gradient="from-indigo-500/[0.15]" className="left-[-10%] md:left-[-5%] top-[15%] md:top-[20%]" />
          <ElegantShape delay={0.5} width={500} height={120} rotate={-15} gradient="from-rose-500/[0.15]" className="right-[-5%] md:right-[0%] top-[70%] md:top-[75%]" />
          <ElegantShape delay={0.4} width={300} height={80} rotate={-8} gradient="from-violet-500/[0.15]" className="left-[5%] md:left-[10%] bottom-[5%] md:bottom-[10%]" />
          <ElegantShape delay={0.6} width={200} height={60} rotate={20} gradient="from-amber-500/[0.15]" className="right-[15%] md:right-[20%] top-[10%] md:top-[15%]" />
          <ElegantShape delay={0.7} width={150} height={40} rotate={-25} gradient="from-cyan-500/[0.15]" className="left-[20%] md:left-[25%] top-[5%] md:top-[10%]" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-transparent to-[#030712]/80 pointer-events-none" />
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto" dir="rtl">

          <h1 className="font-outfit font-bold leading-[0.88] tracking-tight mb-8"
            style={{ fontSize: 'clamp(4rem, 10vw, 9rem)' }}>
            <motion.span
              className="block text-white"
              initial={{ opacity: 0, y: 56 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              عن
            </motion.span>
            <motion.span
              className="block py-[0.2em] leading-[1.1] bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 bg-clip-text text-transparent"
              initial={{ opacity: 0, y: 56 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              المؤتمر
            </motion.span>
          </h1>

          <motion.p
            className="text-lg md:text-xl text-white/50 max-w-xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.85, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            مؤتمر الإبداع والابتكار — لحظة التقاء العقل اليمني بأدوات مستقبله.
          </motion.p>

        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   SECTION 2 — Mission / Story
───────────────────────────────────────── */
function MissionSection() {
  const { ref, reveal, revealWord, scrollYProgress } = useSection();
  const mapX = useTransform(scrollYProgress, [0, 0.55], [750, 0]);
  const mapOpacity = useTransform(scrollYProgress, [0, 0.15, 1], [0, 1, 1]);
  return (
    <div ref={ref} className="relative h-[130vh]">
      <div className="sticky top-0 h-screen w-full flex items-center overflow-hidden bg-black">
        <div
          className="pointer-events-none absolute right-0 top-0 w-1/2 h-full"
          style={{ background: 'radial-gradient(ellipse 60% 50% at 80% 50%, rgba(96,165,250,0.06) 0%, transparent 70%)' }}
        />
        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full" dir="ltr">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-20">

            {/* Yemen map — reveals first */}
            <motion.div
              className="flex shrink-0 w-[240px] sm:w-[350px] lg:w-[520px] items-center justify-center relative"
              style={{ x: mapX, opacity: mapOpacity }}
            >
              <img
                src="/images/logos/yemen.png"
                alt="Yemen map"
                loading="lazy"
                decoding="async"
                className="w-full h-auto object-contain"
              />
            </motion.div>

            {/* Text */}
            <div className="flex-1" dir="rtl">
              <h2 className="font-outfit font-bold leading-[1.0] tracking-tight mb-10"
                style={{ fontSize: 'clamp(2.2rem, 4.5vw, 4rem)' }}>
                <motion.span className="block text-white" {...revealWord(0.10)}>
                  جئنا لأن اليمن يستحق
                </motion.span>
                <motion.span
                  className="block py-[0.2em] leading-[1.1] bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 bg-clip-text text-transparent"
                  {...revealWord(0.18)}
                >
                  منصة تليق بعقوله.
                </motion.span>
              </h2>

              <motion.div className="space-y-5 max-w-2xl" {...reveal(0.28)}>
                <p className="text-lg text-white/70 leading-relaxed">
                  في عام 2023، انطلق مؤتمر الإبداع والابتكار برؤية واحدة: خلق مساحة حقيقية يلتقي فيها الشباب اليمني الموهوب بالخبرات العالمية، والأفكار بالتمويل، والبحث بالتطبيق.
                </p>
                <p className="text-base text-white/45 leading-relaxed">
                  لم يكن الهدف مجرد عقد فعالية — بل بناء منظومة ابتكار مستدامة تنبع من اليمن وتخدم اليمن. دورة بعد دورة، نكبر ونتعمق، حاملين نفس السؤال: كيف نحوّل هذا العقل البشري إلى أثر ملموس؟
                </p>
              </motion.div>

              <motion.div className="mt-10" {...reveal(0.38)}>
                <Link
                  href="/history"
                  className="inline-flex items-center gap-2.5 text-sm font-semibold bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 bg-clip-text text-transparent group"
                >
                  <ArrowLeft size={15} className="text-blue-400 transition-transform duration-200 group-hover:-translate-x-1" />
                  استعرض رحلتنا عبر الدورات
                </Link>
              </motion.div>

            </div>{/* end flex-1 text */}
          </div>{/* end flex row */}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   SECTION 2.5 — President's Speech
───────────────────────────────────────── */
function PresidentSection() {
  const { ref, p, reveal } = useSection();

  return (
    <div ref={ref} className="relative h-[200vh]">
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-[#020509]">

        {/* ── Full-bleed photo ── */}
        <motion.div
          className="absolute inset-0 z-0"
          initial={{ scale: 1.06 }}
          animate={{ scale: p >= 0.04 ? 1 : 1.06 }}
          transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Desktop Image */}
          <img
            src="/images/about/president2.jpg"
            alt="رئيس المؤتمر"
            loading="lazy"
            decoding="async"
            className="hidden md:block w-full h-full object-cover"
            style={{ objectPosition: '30% 20%' }}
          />
          {/* Mobile Image */}
          <img
            src="/images/about/president_mobile.jpg"
            alt="رئيس المؤتمر"
            loading="lazy"
            decoding="async"
            className="block md:hidden w-full h-full object-cover"
            style={{ objectPosition: 'center center' }}
            onError={(e) => {
              // Fallback to desktop image if mobile one doesn't exist yet
              e.currentTarget.src = "/images/about/president2.jpg";
              e.currentTarget.style.objectPosition = "30% 20%";
            }}
          />

          {/* Left — subtle 40% vignette */}
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(to right, rgba(2,5,9,0.4) 0%, transparent 30%)'
          }} />

          {/* Right — solid dark panel on far right, transparent by 58% */}
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(to left, rgba(2,5,9,0.95) 0%, rgba(2,5,9,0.80) 20%, rgba(2,5,9,0.4) 40%, transparent 58%)'
          }} />

          {/* Top — 60% opacity fade */}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(2,5,9,0.6) 0%, transparent 15%)' }} />
          {/* Bottom — 80% opacity fade */}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(2,5,9,0.8) 0%, transparent 20%)' }} />
        </motion.div>

        {/* ── Ambient violet glow behind text panel ── */}
        <div
          className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 w-[55%] h-[80%] z-0"
          style={{ background: 'radial-gradient(ellipse 70% 60% at 85% 50%, rgba(139,92,246,0.07) 0%, transparent 70%)' }}
        />

        <div className="relative z-10 h-full">
          {/* Wrapper for precise vertical centering without Framer Motion interference */}
          <div className="absolute bottom-16 md:bottom-auto md:top-1/2 md:-translate-y-1/2 left-1/2 md:left-auto -translate-x-1/2 md:translate-x-0 md:right-[12%] lg:right-[18%] w-[92%] md:w-[540px] max-w-[540px] z-10">
            <motion.div 
              className="p-6 md:p-8 rounded-3xl bg-[#020509]/30 backdrop-blur-lg border border-white/5" 
              dir="rtl"
              {...reveal(0.04)}
            >

              {/* Big title */}
              <motion.h2
              className="text-white font-bold mb-8 leading-tight"
              style={{ fontSize: 'clamp(1.8rem, 3vw, 2.8rem)', fontFamily: 'var(--font-thmanyah)' }}
              {...reveal(0.08)}
            >
              كلمة الرئيس
            </motion.h2>

            {/* Oversized decorative quote */}
            <motion.div
              className="mb-2 select-none"
              style={{
                fontFamily: 'Georgia, serif',
                fontSize: 'clamp(3.5rem, 6vw, 6rem)',
                lineHeight: 0.75,
                background: 'linear-gradient(135deg, #67e8f9 0%, #60a5fa 50%, #8b5cf6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                opacity: 0.3,
              }}
              {...reveal(0.12)}
            >
              &ldquo;
            </motion.div>

            {/* Speech text */}
            <div className="space-y-4 mb-8">
              <motion.p
                className="text-white/90 leading-[1.8]"
                style={{ fontSize: 'clamp(1.05rem, 1.5vw, 1.25rem)', fontWeight: 500 }}
                {...reveal(0.16)}
              >
                إن ما نبنيه في هذا المؤتمر ليس مجرد فعالية تُعقد وتنتهي، بل هو جسر يصل بين ما نحمله من طاقة وإمكانات، وما يستحقه وطننا من مستقبل مشرق.
              </motion.p>
              <motion.p
                className="text-white/60 leading-[1.8]"
                style={{ fontSize: 'clamp(0.9rem, 1.3vw, 1.05rem)', fontWeight: 400 }}
                {...reveal(0.22)}
              >
                أؤمن إيمانًا راسخًا بأن الشباب اليمني يمتلك من الذكاء والإبداع والعزيمة ما يكفي لإحداث نقلة نوعية حقيقية. كل ما نحتاجه هو المنصة الصحيحة، والبيئة الداعمة، والإيمان بأن التغيير ممكن، وهذا بالضبط ما جئنا لنصنعه معًا.
              </motion.p>
            </div>

            {/* Identity badge */}
            <motion.div className="flex items-center gap-4" {...reveal(0.28)}>
              <div
                className="w-[3px] rounded-full flex-shrink-0 self-stretch"
                style={{ background: 'linear-gradient(to bottom, #67e8f9, #8b5cf6)' }}
              />
              <div className="space-y-1">
                <p
                  className="text-white font-bold"
                  style={{ fontSize: 'clamp(1rem, 1.3vw, 1.15rem)', fontFamily: 'var(--font-thmanyah)' }}
                >
                  د. أحمد العقبي
                </p>
                <p className="text-white/55 text-xs md:text-sm leading-relaxed">
                  رئيس مؤتمر الإبداع والابتكار
                </p>
                <p className="text-white/35 text-xs md:text-sm leading-relaxed">
                  رئيس مجلس الإدارة بجمعية الصداقة والتعاون اليمنية
                </p>
              </div>
            </motion.div>

            </motion.div>
          </div>
        </div>


        {/* Bottom fade to next section */}
        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-28 z-20"
          style={{ background: 'linear-gradient(to top, #030712, transparent)' }}
        />

      </div>
    </div>
  );
}


/* ─────────────────────────────────────────
   SECTION 3 — Stats (bento)
───────────────────────────────────────── */
const STATS = [
  { label: 'دورات متتالية', target: 4, suffix: '', color: '#67e8f9', colorB: '#3b82f6' },
  { label: 'حضور متوقع', target: 5000, suffix: '+', color: '#818cf8', colorB: '#6366f1' },
  { label: 'متحدث دولي', target: 120, suffix: '+', color: '#60a5fa', colorB: '#06b6d4' },
  { label: 'مسار متخصص', target: 4, suffix: '', color: '#a78bfa', colorB: '#8b5cf6' },
];

function StatsSection() {
  const { ref, p, revealWord } = useSection();
  const statsRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="relative h-[150vh]">
      <div className="sticky top-0 h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-[#030712]">
        <Grid />

        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(ellipse, rgba(96,165,250,0.04) 0%, transparent 70%)' }} />

        <div className="relative z-10 max-w-4xl mx-auto px-6 w-full text-center" dir="rtl">

          {/* Headline */}
          <h2 className="font-outfit font-bold leading-[0.9] tracking-tight mb-16"
            style={{ fontSize: 'clamp(2.6rem, 5vw, 4.5rem)' }}>
            <motion.span className="block text-white" {...revealWord(0.10)}>
              أربع سنوات من
            </motion.span>
            <motion.span
              className="block py-[0.2em] leading-[1.1] bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 bg-clip-text text-transparent"
              {...revealWord(0.17)}
            >
              الأثر الحقيقي.
            </motion.span>
          </h2>

          {/* Stats row */}
          <motion.div
            ref={statsRef}
            className="flex flex-wrap items-center justify-center gap-0"
            initial={{ opacity: 0, y: 20 }}
            animate={p >= 0.28 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            {STATS.map((stat, i) => (
              <div key={stat.label} className="flex items-center">
                {/* Stat item */}
                <div className="flex flex-col items-center gap-3 px-10 py-2">
                  <span
                    className="font-outfit font-black tabular-nums leading-none text-white"
                    style={{ fontSize: 'clamp(2.8rem, 5vw, 4.2rem)' }}
                  >
                    <Counter target={stat.target} suffix={stat.suffix} visible={inView} />
                  </span>
                  <span className="text-[11px] text-white/40 tracking-[0.18em] uppercase font-medium">
                    {stat.label}
                  </span>
                </div>

                {/* Divider — hidden after last item */}
                {i < STATS.length - 1 && (
                  <div className="w-px h-10 bg-white/10 hidden sm:block" />
                )}
              </div>
            ))}
          </motion.div>

        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   SECTION 4 — Values / Pillars
───────────────────────────────────────── */
const PILLARS = [
  {
    icon: Lightbulb,
    color: '#67e8f9',
    title: 'الإبداع',
    body: 'نؤمن أن كل فكرة جيدة تستحق مساحة للنمو. نوفّر بيئة تحتضن التفكير خارج الصندوق وتحوّل الخيال إلى مشاريع قابلة للحياة.',
  },
  {
    icon: FlaskConical,
    color: '#818cf8',
    title: 'البحث',
    body: 'المعرفة الرصينة هي أساس التغيير الحقيقي. نربط الباحثين بالواقع ونترجم الدراسات الأكاديمية إلى حلول ملموسة تخدم المجتمع.',
  },
  {
    icon: Users,
    color: '#a78bfa',
    title: 'المجتمع',
    body: 'لا يبنى المستقبل بأفراد منعزلين. نبني شبكة من المبدعين والمبتكرين الذين يدعمون بعضهم البعض ويتبادلون الخبرات والفرص.',
  },
];

function ValuesSection() {
  const { ref, p, reveal, revealWord } = useSection();
  return (
    <div ref={ref} className="relative h-[130vh]">
      <div className="sticky top-0 h-screen w-full flex items-center overflow-hidden bg-black">
        <div
          className="pointer-events-none absolute left-1/2 bottom-0 -translate-x-1/2 w-[600px] h-[400px]"
          style={{ background: 'radial-gradient(ellipse, rgba(139,92,246,0.08) 0%, transparent 70%)' }}
        />
        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full" dir="rtl">

          <div className="text-center mb-14">
            <h2 className="font-outfit font-bold leading-[0.9] tracking-tight"
              style={{ fontSize: 'clamp(2.4rem, 5vw, 4.5rem)' }}>
              <motion.span className="block text-white" {...revealWord(0.10)}>
                ثلاثة ركائز
              </motion.span>
              <motion.span
                className="block py-[0.2em] leading-[1.1] bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 bg-clip-text text-transparent"
                {...revealWord(0.17)}
              >
                لا يقوم بدونها مؤتمر.
              </motion.span>
            </h2>
          </div>

          <div className="grid lg:grid-cols-3 gap-5">
            {PILLARS.map((pillar, i) => (
              <motion.div
                key={pillar.title}
                initial={{ opacity: 0, y: 36 }}
                animate={{ opacity: p >= 0.26 + i * 0.08 ? 1 : 0, y: p >= 0.26 + i * 0.08 ? 0 : 36 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="rounded-2xl p-7 flex flex-col"
                style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-6"
                  style={{ background: `${pillar.color}18` }}>
                  <pillar.icon size={20} style={{ color: pillar.color }} />
                </div>
                <h3 className="font-outfit font-bold text-white text-2xl mb-3">{pillar.title}</h3>
                <p className="text-[15px] text-white/50 leading-relaxed flex-1">{pillar.body}</p>
              </motion.div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   PAGE EXPORT
───────────────────────────────────────── */
export default function AboutPage() {
  return (
    <main className="bg-[#030712]">
      <HeroSection />
      <MissionSection />
      <PresidentSection />
      <StatsSection />
      <ValuesSection />

      {/* ── Add more sections below ── */}

    </main>
  );
}
