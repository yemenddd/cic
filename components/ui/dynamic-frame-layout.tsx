"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface Frame {
  id: number;
  youtubeId: string;
  title: string;
  defaultPos: { x: number; y: number; w: number; h: number };
}

function FrameComponent({
  youtubeId,
  title,
  isHovered,
  onClick,
}: {
  youtubeId: string;
  title: string;
  isHovered: boolean;
  onClick: () => void;
}) {
  return (
    <div
      className="relative w-full h-full overflow-hidden rounded-xl md:rounded-2xl cursor-pointer"
      onClick={onClick}
    >
      {/* Thumbnail */}
      <img
        src={`https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`}
        alt={title}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500"
        style={{ transform: isHovered ? "scale(1.06)" : "scale(1)" }}
      />

      {/* Dark overlay */}
      <div
        className="absolute inset-0 transition-all duration-300"
        style={{
          background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.15) 50%, transparent 100%)",
          opacity: isHovered ? 0.7 : 0.9,
        }}
      />

      {/* Play icon on hover — frosted glass */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        initial={{ opacity: 0, scale: 0.85 }}
        animate={isHovered ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.85 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      >
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center"
          style={{
            background: 'rgba(255,255,255,0.12)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.25)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white" style={{ marginLeft: '2px' }}>
            <path d="M8 5v14l11-7z"/>
          </svg>
        </div>
      </motion.div>

      {/* Title on hover */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 p-3 md:p-4"
        initial={{ opacity: 0, y: 8 }}
        animate={isHovered ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
        transition={{ duration: 0.22 }}
      >
        <p className="text-white font-semibold text-[11px] md:text-[13px] leading-snug line-clamp-2">
          {title}
        </p>
      </motion.div>
    </div>
  );
}

interface DynamicFrameLayoutProps {
  frames: Frame[];
  className?: string;
  hoverSize?: number;
  gapSize?: number;
  cols?: number;
  rows?: number;
  onPlay?: (youtubeId: string) => void;
}

export function DynamicFrameLayout({
  frames,
  className = "",
  hoverSize = 6,
  gapSize = 6,
  cols = 3,
  rows = 3,
  onPlay,
}: DynamicFrameLayoutProps) {
  const [hovered, setHovered] = useState<{ row: number; col: number } | null>(null);

  const getSizes = (count: number, hoveredIdx: number | null) => {
    if (hoveredIdx === null) return Array(count).fill("1fr").join(" ");
    const nonHoveredSize = (count * 4 - hoverSize) / (count - 1);
    return Array.from({ length: count }, (_, i) =>
      i === hoveredIdx ? `${hoverSize}fr` : `${nonHoveredSize}fr`
    ).join(" ");
  };

  const rowSizes = getSizes(rows, hovered?.row ?? null);
  const colSizes = getSizes(cols, hovered?.col ?? null);

  return (
    <div
      className={`w-full h-full ${className}`}
      style={{
        display: "grid",
        gridTemplateRows: rowSizes,
        gridTemplateColumns: colSizes,
        gap: `${gapSize}px`,
        transition: "grid-template-rows 0.45s ease, grid-template-columns 0.45s ease",
      }}
    >
      {frames.map((frame) => {
        const row = Math.floor(frame.defaultPos.y / (12 / rows));
        const col = Math.floor(frame.defaultPos.x / (12 / cols));
        const isHoveredFrame = hovered?.row === row && hovered?.col === col;

        return (
          <motion.div
            key={frame.id}
            className="relative cursor-pointer"
            onMouseEnter={() => setHovered({ row, col })}
            onMouseLeave={() => setHovered(null)}
          >
            <FrameComponent
              youtubeId={frame.youtubeId}
              title={frame.title}
              isHovered={isHoveredFrame}
              onClick={() => onPlay?.(frame.youtubeId)}
            />
          </motion.div>
        );
      })}
    </div>
  );
}
