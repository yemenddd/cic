'use client';

import React, { useState, useEffect } from 'react';

interface DotCardProps {
  target?: number;
  duration?: number;
  label?: string;
}

export default function DotCard({ target = 777000, duration = 2000, label = 'Views' }: DotCardProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = target;
    const range = end - start;
    if (range <= 0) return;
    const increment = Math.ceil(end / (duration / 50));
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        start = end;
        clearInterval(timer);
      }
      setCount(start);
    }, 50);
    return () => clearInterval(timer);
  }, [target, duration]);

  const display = count < 1000 ? count : `${Math.floor(count / 1000)}k`;

  return (
    <>
      <style>{`
        .dc-outer {
          position: relative;
          display: inline-flex;
          flex-direction: column;
          align-items: center;
        }
        .dc-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #06b6d4;
          position: absolute;
          top: -4px;
          left: 50%;
          transform: translateX(-50%);
          box-shadow: 0 0 10px 3px rgba(6,182,212,0.7), 0 0 20px 6px rgba(6,182,212,0.3);
          z-index: 10;
          animation: dc-pulse 2s ease-in-out infinite;
        }
        .dc-card {
          position: relative;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 14px;
          padding: 28px 36px 22px;
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          overflow: hidden;
          min-width: 150px;
          text-align: center;
        }
        .dc-ray {
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 1px;
          height: 55%;
          background: linear-gradient(to bottom, rgba(6,182,212,0.6), transparent);
          pointer-events: none;
        }
        .dc-text {
          font-size: 2.8rem;
          font-weight: 900;
          color: #ffffff;
          font-family: 'Outfit', sans-serif;
          line-height: 1;
          margin-bottom: 8px;
          letter-spacing: -0.02em;
        }
        .dc-label {
          font-size: 0.68rem;
          color: rgba(255,255,255,0.35);
          text-transform: uppercase;
          letter-spacing: 0.22em;
          font-weight: 600;
        }
        /* Corner accent lines */
        .dc-line {
          position: absolute;
          background: rgba(6,182,212,0.45);
        }
        .dc-topl    { top: 0;    left: 18%;  height: 1px; width: 28%; animation: dc-scan-h 3s ease-in-out infinite; }
        .dc-leftl   { left: 0;   top: 18%;   width: 1px;  height: 28%; }
        .dc-bottoml { bottom: 0; left: 18%;  height: 1px; width: 28%; animation: dc-scan-h 3s ease-in-out infinite reverse; }
        .dc-rightl  { right: 0;  top: 18%;   width: 1px;  height: 28%; }

        @keyframes dc-pulse {
          0%, 100% { box-shadow: 0 0 10px 3px rgba(6,182,212,0.7), 0 0 20px 6px rgba(6,182,212,0.3); }
          50%       { box-shadow: 0 0 16px 6px rgba(6,182,212,0.5), 0 0 30px 10px rgba(6,182,212,0.15); }
        }
        @keyframes dc-scan-h {
          0%   { left: 10%;  opacity: 1; }
          50%  { left: 62%;  opacity: 0.6; }
          100% { left: 10%;  opacity: 1; }
        }
      `}</style>

      <div className="dc-outer">
        <div className="dc-dot" />
        <div className="dc-card">
          <div className="dc-ray" />
          <div className="dc-text">{display}</div>
          <div className="dc-label">{label}</div>
          <div className="dc-line dc-topl" />
          <div className="dc-line dc-leftl" />
          <div className="dc-line dc-bottoml" />
          <div className="dc-line dc-rightl" />
        </div>
      </div>
    </>
  );
}
