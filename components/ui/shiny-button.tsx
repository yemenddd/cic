"use client"

import type React from "react"

interface ShinyButtonProps {
  children: React.ReactNode
  onClick?: () => void
  className?: string
  href?: string
  size?: 'sm' | 'md' | 'lg'
}

export function ShinyButton({ children, onClick, className = "", href, size = 'sm' }: ShinyButtonProps) {
  const content = (
    <>
      <style jsx>{`
        @property --gradient-angle {
          syntax: "<angle>";
          initial-value: 0deg;
          inherits: false;
        }

        @property --gradient-angle-offset {
          syntax: "<angle>";
          initial-value: 0deg;
          inherits: false;
        }

        @property --gradient-percent {
          syntax: "<percentage>";
          initial-value: 5%;
          inherits: false;
        }

        @property --gradient-shine {
          syntax: "<color>";
          initial-value: white;
          inherits: false;
        }

        .shiny-cta {
          --shiny-cta-bg: #000000;
          --shiny-cta-bg-subtle: #1a1818;
          --shiny-cta-fg: #ffffff;
          --shiny-cta-highlight: blue;
          --shiny-cta-highlight-subtle: #8484ff;
          --animation: gradient-angle linear infinite;
          --duration: 3s;
          --shadow-size: 2px;
          --transition: 800ms cubic-bezier(0.25, 1, 0.5, 1);

          isolation: isolate;
          position: relative;
          overflow: hidden;
          contain: paint;
          clip-path: inset(0 round 360px);
          cursor: pointer;
          outline-offset: 4px;
          padding: var(--btn-py, 0.55rem) var(--btn-px, 1.25rem);
          font-size: var(--btn-fs, 0.8rem);
          line-height: 1.2;
          font-weight: 600;
          border: 1px solid transparent;
          border-radius: 360px;
          color: var(--shiny-cta-fg);
          background: linear-gradient(var(--shiny-cta-bg), var(--shiny-cta-bg)) padding-box,
            conic-gradient(
              from calc(var(--gradient-angle) - var(--gradient-angle-offset)),
              transparent,
              var(--shiny-cta-highlight) var(--gradient-percent),
              var(--gradient-shine) calc(var(--gradient-percent) * 2),
              var(--shiny-cta-highlight) calc(var(--gradient-percent) * 3),
              transparent calc(var(--gradient-percent) * 4)
            ) border-box;
          box-shadow: inset 0 0 0 1px var(--shiny-cta-bg-subtle);
          transition: var(--transition);
          transition-property: --gradient-angle-offset, --gradient-percent, --gradient-shine;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          white-space: nowrap;
        }

        .shiny-cta::before,
        .shiny-cta::after,
        .shiny-cta span::before {
          content: "";
          pointer-events: none;
          position: absolute;
          left: 50%;
          top: 50%;
          translate: -50% -50%;
          z-index: -1;
        }

        .shiny-cta:active {
          translate: 0 1px;
        }

        .shiny-cta::before {
          --size: calc(100% - var(--shadow-size) * 3);
          --position: 2px;
          --space: calc(var(--position) * 2);
          width: var(--size);
          height: var(--size);
          background: radial-gradient(
              circle at var(--position) var(--position),
              white calc(var(--position) / 4),
              transparent 0
            )
            padding-box;
          background-size: var(--space) var(--space);
          background-repeat: space;
          mask-image: conic-gradient(
            from calc(var(--gradient-angle) + 45deg),
            black,
            transparent 10% 90%,
            black
          );
          border-radius: inherit;
          opacity: 0.4;
          z-index: -1;
        }

        .shiny-cta::after {
          --animation: shimmer linear infinite;
          width: 100%;
          aspect-ratio: 1;
          background: linear-gradient(-50deg, transparent, var(--shiny-cta-highlight), transparent);
          mask-image: radial-gradient(circle at bottom, transparent 40%, black);
          opacity: 0.6;
        }

        [data-theme="light"] .shiny-cta {
          --shiny-cta-bg: #ffffff;
          --shiny-cta-bg-subtle: #e8e8ed;
          --shiny-cta-fg: #1c1c1e;
          --shiny-cta-highlight: #3b82f6;
          --shiny-cta-highlight-subtle: #6366f1;
        }

        .shiny-cta span {
          z-index: 1;
        }

        .shiny-cta span::before {
          --size: calc(100% + 1rem);
          width: var(--size);
          height: var(--size);
          box-shadow: inset 0 -1ex 2rem 4px var(--shiny-cta-highlight);
          opacity: 0;
          transition: opacity var(--transition);
          animation: calc(var(--duration) * 1.5) breathe linear infinite;
        }

        .shiny-cta,
        .shiny-cta::before,
        .shiny-cta::after {
          animation: var(--animation) var(--duration),
            var(--animation) calc(var(--duration) / 0.4) reverse paused;
          animation-composition: add;
        }

        .shiny-cta:is(:hover, :focus-visible) {
          --gradient-percent: 20%;
          --gradient-angle-offset: 95deg;
          --gradient-shine: var(--shiny-cta-highlight-subtle);
        }

        .shiny-cta:is(:hover, :focus-visible),
        .shiny-cta:is(:hover, :focus-visible)::before,
        .shiny-cta:is(:hover, :focus-visible)::after {
          animation-play-state: running;
        }

        .shiny-cta:is(:hover, :focus-visible) span::before {
          opacity: 1;
        }

        @keyframes gradient-angle {
          to { --gradient-angle: 360deg; }
        }

        @keyframes shimmer {
          to { rotate: 360deg; }
        }

        @keyframes breathe {
          from, to { scale: 1; }
          50% { scale: 1.2; }
        }
      `}</style>

      {href ? (
        <a
          href={href}
          className={`shiny-cta ${className}`}
          style={{
            ['--btn-py' as string]: size === 'lg' ? '1rem' : size === 'md' ? '0.75rem' : '0.55rem',
            ['--btn-px' as string]: size === 'lg' ? '2.5rem' : size === 'md' ? '1.75rem' : '1.25rem',
            ['--btn-fs' as string]: size === 'lg' ? '1.0625rem' : size === 'md' ? '0.9375rem' : '0.8rem',
          }}
        >
          <span>{children}</span>
        </a>
      ) : (
        <button
          className={`shiny-cta ${className}`}
          onClick={onClick}
          style={{
            ['--btn-py' as string]: size === 'lg' ? '1rem' : size === 'md' ? '0.75rem' : '0.55rem',
            ['--btn-px' as string]: size === 'lg' ? '2.5rem' : size === 'md' ? '1.75rem' : '1.25rem',
            ['--btn-fs' as string]: size === 'lg' ? '1.0625rem' : size === 'md' ? '0.9375rem' : '0.8rem',
          }}
        >
          <span>{children}</span>
        </button>
      )}
    </>
  )

  return content
}
