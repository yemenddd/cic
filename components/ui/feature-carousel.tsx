"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { GraduationCap, FlaskConical, Lightbulb, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/i18n";

const FEATURES = [
  {
    id: "students",
    label: "University Students",
    icon: GraduationCap,
    image: "/images/attends/1.jpg",
    description: "Empowering the generation most capable of creating change and shaping a prosperous future for Yemen.",
  },
  {
    id: "researchers",
    label: "Researchers",
    icon: FlaskConical,
    image: "/images/attends/2.jpg",
    description: "A platform to produce robust scientific knowledge that serves and addresses critical national challenges.",
  },
  {
    id: "innovators",
    label: "Innovators",
    icon: Lightbulb,
    image: "/images/attends/3.jpg",
    description: "A dedicated space for those who possess scalable ideas and the technical vision to bring them to life.",
  },
  {
    id: "investors",
    label: "Investors",
    icon: TrendingUp,
    image: "/images/attends/4.jpg",
    description: "Connecting creators with institutions looking to fund and accelerate the most impactful projects.",
  },
];

const AUTO_PLAY_INTERVAL = 4000;
const ITEM_HEIGHT = 65;

const wrap = (min: number, max: number, v: number) => {
  const rangeSize = max - min;
  return ((((v - min) % rangeSize) + rangeSize) % rangeSize) + min;
};

export function FeatureCarousel({ currentP = 1 }: { currentP?: number }) {
  const { t } = useLang();
  const [step, setStep] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const currentIndex =
    ((step % FEATURES.length) + FEATURES.length) % FEATURES.length;

  const nextStep = useCallback(() => {
    setStep((prev) => prev + 1);
  }, []);

  const handleChipClick = (index: number) => {
    const diff = (index - currentIndex + FEATURES.length) % FEATURES.length;
    if (diff > 0) setStep((s) => s + diff);
  };

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(nextStep, AUTO_PLAY_INTERVAL);
    return () => clearInterval(interval);
  }, [nextStep, isPaused]);

  const getCardStatus = (index: number) => {
    const diff = index - currentIndex;
    const len = FEATURES.length;

    let normalizedDiff = diff;
    if (diff > len / 2) normalizedDiff -= len;
    if (diff < -len / 2) normalizedDiff += len;

    if (normalizedDiff === 0) return "active";
    if (normalizedDiff === -1) return "prev";
    if (normalizedDiff === 1) return "next";
    return "hidden";
  };

  return (
    <div className="w-full max-w-7xl mx-auto md:px-8 md:pb-8">
      <div className="relative overflow-visible flex flex-col lg:flex-row-reverse lg:items-center lg:justify-center lg:gap-6 lg:min-h-[560px] bg-transparent">
        <div className="w-full lg:w-[34%] relative z-30 flex flex-col items-center lg:items-start justify-center px-4 lg:px-0 bg-transparent mt-6 lg:mt-0">
          <div className="relative w-full grid grid-cols-2 lg:flex lg:flex-col gap-3 lg:gap-4 items-center justify-center lg:items-start z-20">
            {FEATURES.map((feature, index) => {
              const isActive = index === currentIndex;

              const threshold = 0.22 + index * 0.07;
              return (
                <motion.div
                  key={feature.id}
                  className="flex items-center justify-center w-full"
                  initial={{ opacity: 0, y: 28 }}
                  animate={{ opacity: currentP >= threshold ? 1 : 0, y: currentP >= threshold ? 0 : 28 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                >
                  <button
                    onClick={() => handleChipClick(index)}
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}
                    className={cn(
                      "relative w-full flex items-center justify-center lg:justify-start gap-1.5 md:gap-4 px-2 md:px-10 lg:px-8 py-3 lg:py-4 rounded-xl lg:rounded-full text-center lg:text-left group",
                      isActive
                        ? "text-white shadow-md z-10"
                        : "text-white/55 hover:text-white"
                    )}
                    style={isActive ? {
                      background: 'linear-gradient(135deg, #06b6d4, #3b82f6, #8b5cf6)',
                      boxShadow: '0 4px 24px rgba(59,130,246,0.30), inset 0 1px 0 rgba(255,255,255,0.20)',
                      transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                    } : {
                      background:           'rgba(15, 15, 18, 0.60)',
                      backdropFilter:       'blur(20px) saturate(180%)',
                      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                      border:               '1px solid rgba(255, 255, 255, 0.08)',
                      boxShadow:            'inset 0 1px 0 rgba(255,255,255,0.06)',
                      transition:           'border-color 0.4s cubic-bezier(0.16, 1, 0.3, 1), background 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                  >
                    <div
                      className={cn(
                        "flex items-center justify-center transition-colors duration-500 shrink-0",
                        isActive ? "text-white" : "text-slate-400 group-hover:text-[#0078D4]"
                      )}
                    >
                      <feature.icon className="w-4 h-4 md:w-[18px] md:h-[18px]" strokeWidth={2} />
                    </div>

                    <span className="font-medium text-[11px] md:text-[15px] tracking-tight whitespace-nowrap uppercase">
                      {t(`audience.${feature.id}.label`)}
                    </span>
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>

        <motion.div
          className="w-full lg:w-[44%] relative bg-transparent flex items-center justify-center py-8 lg:py-10 px-6 md:px-12 lg:px-4 border-transparent"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: currentP >= 0.22 ? 1 : 0, y: currentP >= 0.22 ? 0 : 28 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="relative w-full max-w-[380px] aspect-[4/5] flex items-center justify-center">
            {FEATURES.map((feature, index) => {
              const status = getCardStatus(index);
              const isActive = status === "active";
              const isPrev = status === "prev";
              const isNext = status === "next";

              return (
                <motion.div
                  key={feature.id}
                  initial={false}
                  animate={{
                    x: isActive ? 0 : isPrev ? -100 : isNext ? 100 : 0,
                    scale: isActive ? 1 : isPrev || isNext ? 0.85 : 0.7,
                    opacity: isActive ? 1 : isPrev || isNext ? 0.4 : 0,
                    rotate: isPrev ? -3 : isNext ? 3 : 0,
                    zIndex: isActive ? 20 : isPrev || isNext ? 10 : 0,
                    pointerEvents: isActive ? "auto" : "none",
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 25,
                    mass: 0.8,
                  }}
                  className="absolute inset-0 rounded-[2rem] md:rounded-[2.8rem] overflow-hidden border md:border-2 border-white/15 bg-transparent origin-center shadow-xl"
                >
                  <img
                    src={feature.image}
                    alt={t(`audience.${feature.id}.label`)}
                    className={cn(
                      "w-full h-full object-cover transition-all duration-700",
                      isActive
                        ? "grayscale-0 blur-0"
                        : "grayscale blur-[2px] brightness-75"
                    )}
                  />

                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute inset-x-0 bottom-0 p-10 pt-32 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end pointer-events-none"
                      >
                        {/* Liquid Glass label chip */}
                        <div
                          className="px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-[0.2em] w-fit mb-3"
                          style={{
                            background:           'rgba(15, 15, 18, 0.75)',
                            backdropFilter:       'blur(20px) saturate(180%)',
                            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                            border:               '1px solid rgba(255,255,255,0.14)',
                            boxShadow:            '0 4px 16px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.12)',
                            color:                'rgba(255,255,255,0.90)',
                          }}
                        >
                          {index + 1} • {t(`audience.${feature.id}.label`)}
                        </div>
                        <p className="font-medium text-xl md:text-2xl leading-tight drop-shadow-md tracking-tight"
                          style={{
                            background: 'linear-gradient(180deg, #FFFFFF 0%, #A2A2A6 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                          }}
                        >
                          {t(`audience.${feature.id}.desc`)}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default FeatureCarousel;
