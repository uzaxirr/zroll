"use client";

import { Navbar } from "./Navbar";
import { Hero } from "./Hero";
import { GlobalNetwork } from "./GlobalNetwork";
import { BentoFeatures } from "./BentoFeatures";
import { AutopilotPayroll } from "./AutopilotPayroll";
import { HowItWorks } from "./HowItWorks";
import { SignWithZodl } from "./SignWithZodl";
import { TrustStrip } from "./TrustStrip";
import { FinalCTA } from "./FinalCTA";
import { Footer } from "./Footer";

export function LandingPage() {

  return (
    <div
      className="min-h-screen text-white overflow-x-hidden"
      style={{ backgroundColor: "#050505" }}
    >
      <Navbar />
      <Hero />
      <GlobalNetwork />
      <BentoFeatures />
      <AutopilotPayroll />
      <HowItWorks />
      <SignWithZodl />
      <TrustStrip />
      <FinalCTA />
      <Footer />
    </div>
  );
}
