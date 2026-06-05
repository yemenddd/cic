'use client'

import { Suspense, lazy } from 'react'
const Spline = lazy(() => import('@splinetool/react-spline'))

interface SplineSceneProps {
  scene: string
  className?: string
}

function RobotSkeleton() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <svg
        viewBox="0 0 160 260"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-40 h-64 opacity-60"
        style={{ filter: 'drop-shadow(0 0 24px rgba(96,165,250,0.25))' }}
      >
        <defs>
          <linearGradient id="rg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#67e8f9" stopOpacity="0.9">
              <animate attributeName="stop-color" values="#67e8f9;#818cf8;#60a5fa;#67e8f9" dur="2.4s" repeatCount="indefinite" />
            </stop>
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.6">
              <animate attributeName="stop-color" values="#8b5cf6;#60a5fa;#67e8f9;#8b5cf6" dur="2.4s" repeatCount="indefinite" />
            </stop>
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Antenna */}
        <rect x="77" y="2" width="6" height="16" rx="3" fill="url(#rg)" filter="url(#glow)">
          <animate attributeName="opacity" values="0.4;1;0.4" dur="1.6s" repeatCount="indefinite" />
        </rect>
        <circle cx="80" cy="2" r="4" fill="url(#rg)" filter="url(#glow)">
          <animate attributeName="opacity" values="0.4;1;0.4" dur="1.6s" repeatCount="indefinite" />
        </circle>

        {/* Head */}
        <rect x="44" y="18" width="72" height="52" rx="12" fill="url(#rg)" opacity="0.18" />
        <rect x="44" y="18" width="72" height="52" rx="12" stroke="url(#rg)" strokeWidth="1.5" filter="url(#glow)">
          <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" />
        </rect>

        {/* Eyes */}
        <circle cx="66" cy="42" r="8" fill="url(#rg)" opacity="0.25" />
        <circle cx="66" cy="42" r="8" stroke="url(#rg)" strokeWidth="1.5" filter="url(#glow)">
          <animate attributeName="opacity" values="0.5;1;0.5" dur="1.8s" repeatCount="indefinite" />
        </circle>
        <circle cx="66" cy="42" r="3.5" fill="url(#rg)" filter="url(#glow)">
          <animate attributeName="opacity" values="0.3;1;0.3" dur="1.8s" repeatCount="indefinite" />
        </circle>

        <circle cx="94" cy="42" r="8" fill="url(#rg)" opacity="0.25" />
        <circle cx="94" cy="42" r="8" stroke="url(#rg)" strokeWidth="1.5" filter="url(#glow)">
          <animate attributeName="opacity" values="0.5;1;0.5" dur="1.8s" begin="0.3s" repeatCount="indefinite" />
        </circle>
        <circle cx="94" cy="42" r="3.5" fill="url(#rg)" filter="url(#glow)">
          <animate attributeName="opacity" values="0.3;1;0.3" dur="1.8s" begin="0.3s" repeatCount="indefinite" />
        </circle>

        {/* Mouth bar */}
        <rect x="62" y="58" width="36" height="5" rx="2.5" fill="url(#rg)" opacity="0.5" filter="url(#glow)">
          <animate attributeName="width" values="36;20;36" dur="2s" repeatCount="indefinite" />
          <animate attributeName="x" values="62;70;62" dur="2s" repeatCount="indefinite" />
        </rect>

        {/* Neck */}
        <rect x="70" y="70" width="20" height="10" rx="4" fill="url(#rg)" opacity="0.3" />
        <rect x="70" y="70" width="20" height="10" rx="4" stroke="url(#rg)" strokeWidth="1" />

        {/* Body */}
        <rect x="30" y="80" width="100" height="90" rx="14" fill="url(#rg)" opacity="0.12" />
        <rect x="30" y="80" width="100" height="90" rx="14" stroke="url(#rg)" strokeWidth="1.5" filter="url(#glow)">
          <animate attributeName="opacity" values="0.4;0.9;0.4" dur="2.2s" repeatCount="indefinite" />
        </rect>

        {/* Chest panel */}
        <rect x="52" y="96" width="56" height="36" rx="8" fill="url(#rg)" opacity="0.12" />
        <rect x="52" y="96" width="56" height="36" rx="8" stroke="url(#rg)" strokeWidth="1" opacity="0.6" />
        <rect x="60" y="104" width="16" height="4" rx="2" fill="url(#rg)" opacity="0.7" />
        <rect x="60" y="112" width="40" height="4" rx="2" fill="url(#rg)" opacity="0.5">
          <animate attributeName="width" values="40;20;40" dur="1.8s" repeatCount="indefinite" />
        </rect>
        <rect x="60" y="120" width="28" height="4" rx="2" fill="url(#rg)" opacity="0.4" />

        {/* Left arm */}
        <rect x="4" y="82" width="24" height="72" rx="10" fill="url(#rg)" opacity="0.12" />
        <rect x="4" y="82" width="24" height="72" rx="10" stroke="url(#rg)" strokeWidth="1.5" filter="url(#glow)">
          <animate attributeName="opacity" values="0.3;0.8;0.3" dur="2.4s" begin="0.4s" repeatCount="indefinite" />
        </rect>
        {/* Left hand */}
        <rect x="6" y="154" width="20" height="14" rx="7" fill="url(#rg)" opacity="0.18" />
        <rect x="6" y="154" width="20" height="14" rx="7" stroke="url(#rg)" strokeWidth="1.2" />

        {/* Right arm */}
        <rect x="132" y="82" width="24" height="72" rx="10" fill="url(#rg)" opacity="0.12" />
        <rect x="132" y="82" width="24" height="72" rx="10" stroke="url(#rg)" strokeWidth="1.5" filter="url(#glow)">
          <animate attributeName="opacity" values="0.3;0.8;0.3" dur="2.4s" begin="0.8s" repeatCount="indefinite" />
        </rect>
        {/* Right hand */}
        <rect x="134" y="154" width="20" height="14" rx="7" fill="url(#rg)" opacity="0.18" />
        <rect x="134" y="154" width="20" height="14" rx="7" stroke="url(#rg)" strokeWidth="1.2" />

        {/* Waist */}
        <rect x="40" y="170" width="80" height="12" rx="6" fill="url(#rg)" opacity="0.2" />
        <rect x="40" y="170" width="80" height="12" rx="6" stroke="url(#rg)" strokeWidth="1" opacity="0.5" />

        {/* Left leg */}
        <rect x="38" y="182" width="34" height="72" rx="12" fill="url(#rg)" opacity="0.12" />
        <rect x="38" y="182" width="34" height="72" rx="12" stroke="url(#rg)" strokeWidth="1.5" filter="url(#glow)">
          <animate attributeName="opacity" values="0.3;0.8;0.3" dur="2.2s" begin="0.2s" repeatCount="indefinite" />
        </rect>

        {/* Right leg */}
        <rect x="88" y="182" width="34" height="72" rx="12" fill="url(#rg)" opacity="0.12" />
        <rect x="88" y="182" width="34" height="72" rx="12" stroke="url(#rg)" strokeWidth="1.5" filter="url(#glow)">
          <animate attributeName="opacity" values="0.3;0.8;0.3" dur="2.2s" begin="0.6s" repeatCount="indefinite" />
        </rect>

        {/* Feet */}
        <rect x="32" y="246" width="44" height="14" rx="7" fill="url(#rg)" opacity="0.18" />
        <rect x="32" y="246" width="44" height="14" rx="7" stroke="url(#rg)" strokeWidth="1.2" />
        <rect x="84" y="246" width="44" height="14" rx="7" fill="url(#rg)" opacity="0.18" />
        <rect x="84" y="246" width="44" height="14" rx="7" stroke="url(#rg)" strokeWidth="1.2" />
      </svg>
    </div>
  )
}

export function SplineScene({ scene, className }: SplineSceneProps) {
  return (
    <Suspense fallback={<RobotSkeleton />}>
      <div className="w-full h-full [&_canvas]:!cursor-auto">
        <Spline
          scene={scene}
          className={className}
        />
      </div>
    </Suspense>
  )
}
