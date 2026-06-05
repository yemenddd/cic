'use client';

import React from 'react';
import { FinancialHero } from '@/components/ui/hero-section';

export default function AboutConference() {
  return (
    <FinancialHero
      titleLine1="Where minds"
      titleLine2White="meet "
      titleLine2Blue="machines."
      description="The 2026 Creativity & Innovation Conference arrives at a turning point for Yemeni youth — where individual ambition meets the collective need to build a more stable, prosperous future."
      description2="Innovation is no longer an extra skill. Research is no longer merely academic. Together they have become a national necessity — a tool to reshape reality."
      buttonText="Explore the program"
      buttonLink="/program"
      imageUrl1="/images/about/1.jpg"
      imageUrl2="/images/about/2.jpg"
    />
  );
}
