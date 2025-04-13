
import React from "react";
import UnifiedNavigation from "@/components/layout/UnifiedNavigation";
import HeroSection from "@/components/home/HeroSection";
import PartnersSection from "@/components/home/PartnersSection";
import FeatureSection from "@/components/home/FeatureSection";
import PressSection from "@/components/home/PressSection";
import StepsSection from "@/components/home/StepsSection";
import AdvisorSection from "@/components/home/AdvisorSection";
import FaqSection from "@/components/home/FaqSection";
import CtaSection from "@/components/home/CtaSection";
import HomeFooter from "@/components/home/HomeFooter";

const Index = () => {
  return (
    <div className="bg-white min-h-screen flex flex-col overflow-x-hidden font-['Inter']">
      <UnifiedNavigation />
      <div className="pt-[100px]">
        <HeroSection />
        <PartnersSection />
        <FeatureSection />
        <PressSection />
        <StepsSection />
        <AdvisorSection />
        <FaqSection />
        <CtaSection />
        <HomeFooter />
      </div>
    </div>
  );
};

export default Index;
