"use client";

import React from "react";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { HeroSection } from "@/components/landing/HeroSection";
import { InteractiveTerminal } from "@/components/landing/InteractiveTerminal";
import { ComparisonSection } from "@/components/landing/ComparisonSection";
import { FeatureShowcase } from "@/components/landing/FeatureShowcase";
import { ArchitectureSection } from "@/components/landing/ArchitectureSection";
import { FooterSection } from "@/components/landing/FooterSection";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)] selection:bg-[var(--primary)]/20 selection:text-[var(--primary)]">
      {/* Header */}
      <LandingHeader />

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <HeroSection />

        {/* Live Interactive Terminal */}
        <InteractiveTerminal />

        {/* Traditional SaaS vs. OKF Comparison */}
        <ComparisonSection />

        {/* Feature Showcase */}
        <FeatureShowcase />

        {/* OKF Mappings & Architecture Section */}
        <ArchitectureSection />
      </main>

      {/* FAQ & Footer */}
      <FooterSection />
    </div>
  );
}
