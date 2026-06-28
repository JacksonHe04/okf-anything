'use client';

import React, { useEffect } from 'react';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { HeroSection } from '@/components/landing/HeroSection';
import { NewspaperSection } from '@/components/landing/NewspaperSection';

export default function HomePage() {
  useEffect(() => {
    document.title = 'MOONLESS — Local OKF Knowledge System';
  }, []);

  const handleScrollToNewspaper = () => {
    const el = document.getElementById('newspaper-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-paperCream text-paperDark font-sans flex flex-col selection:bg-brandRed/10 selection:text-brandRed">
      {/* Navigation Header */}
      <LandingHeader onScrollToNewspaper={handleScrollToNewspaper} />

      {/* Main content wrapper */}
      <main className="flex-1">
        {/* Hero Section */}
        <HeroSection />

        {/* Vintage Newspaper Section */}
        <NewspaperSection />
      </main>

      {/* Fine print footer */}
      <footer className="w-full bg-paperCream border-t border-paperGray py-8 select-none font-sans text-center">
        <div className="max-w-[1440px] mx-auto px-[60px] flex flex-col md:flex-row justify-between items-center text-[10px] text-paperDark/50 tracking-wider uppercase font-semibold">
          <span>© 2026 MOONLESS. ALL RIGHTS RESERVED.</span>
          <span className="mt-2 md:mt-0 font-mono">
            aim for the moon, then escape.
          </span>
        </div>
      </footer>
    </div>
  );
}