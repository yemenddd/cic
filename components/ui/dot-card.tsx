'use client';

import React, { useState, useEffect } from 'react';

interface DotCardProps {
  target?:   number;
  duration?: number;
  label?:    string;
  suffix?:   string;
}

export default function DotCard({ target = 0, duration = 2000, label = '', suffix = '' }: DotCardProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = target;
    if (end <= 0) return;
    const increment = Math.ceil(end / (duration / 50));
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) { start = end; clearInterval(timer); }
      setCount(start);
    }, 50);
    return () => clearInterval(timer);
  }, [target, duration]);

  const display = count < 1000 ? count : `${Math.floor(count / 1000)}k`;

  return (
    <div className="dot-card-wrap">
      <div className="dot" />
      <div className="card">
        <div className="ray" />
        <div className="text">{suffix === '+' ? `+${display}` : `${display}${suffix}`}</div>
        <div className="label">{label}</div>
        <div className="line topl" />
        <div className="line leftl" />
        <div className="line bottoml" />
        <div className="line rightl" />
      </div>
    </div>
  );
}
