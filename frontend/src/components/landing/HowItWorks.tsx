"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { SectionLabel } from "./SectionLabel";

const steps = [
  {
    num: "01",
    title: "Add your team",
    desc: "Names, wallet addresses, amounts in USD or ZEC. Set payout schedules per contributor.",
  },
  {
    num: "02",
    title: "Verify wallets",
    desc: "Automated test transaction confirms each address before any real funds are sent.",
  },
  {
    num: "03",
    title: "Preview batch",
    desc: "Review every payment, amount, and recipient. Full transparency before you sign anything.",
  },
  {
    num: "04",
    title: "Sign via Zodl",
    desc: "ZIP-321 URI generated. One signature from your non-custodial Zodl wallet approves the entire batch.",
  },
  {
    num: "05",
    title: "Team gets paid",
    desc: "ZEC lands in shielded wallets. Or USDC arrives on Solana, Ethereum, Base, or Arbitrum — their choice.",
  },
];

export function HowItWorks() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start center", "end center"],
  });

  const activeStepRaw = useTransform(scrollYProgress, [0, 0.2, 0.4, 0.6, 0.8, 1], [0, 1, 2, 3, 4, 5]);

  return (
    <section id="how-it-works" ref={sectionRef} className="pt-24 pb-20 px-6">
      <div className="max-w-[900px] mx-auto">
        {/* Header */}
        <div className="flex flex-col items-center gap-4 mb-16">
          <SectionLabel>How it works</SectionLabel>
          <h2
            className="font-headline font-bold text-white text-center"
            style={{ fontSize: 48, letterSpacing: "-0.03em", lineHeight: "56px" }}
          >
            Five steps. One signature.
          </h2>
        </div>

        {/* Stepper */}
        <div className="relative">
          {/* Vertical line background - centered in the 72px number column at 36px */}
          <div
            className="absolute"
            style={{
              left: 35,
              top: 0,
              bottom: 0,
              width: 2,
              background: "linear-gradient(180deg, rgba(5,150,105,0.4) 0%, rgba(5,150,105,0.08) 100%)",
            }}
          />
          {/* Animated fill line */}
          <motion.div
            className="absolute origin-top"
            style={{
              left: 35,
              top: 0,
              bottom: 0,
              width: 2,
              background: "linear-gradient(180deg, #059669 0%, #10B981 100%)",
              scaleY: scrollYProgress,
            }}
          />

          {steps.map((step, i) => (
            <StepItem
              key={step.num}
              step={step}
              index={i}
              activeStepRaw={activeStepRaw}
              isLast={i === steps.length - 1}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function StepItem({
  step,
  index,
  activeStepRaw,
  isLast,
}: {
  step: { num: string; title: string; desc: string };
  index: number;
  activeStepRaw: ReturnType<typeof useTransform<number, number>>;
  isLast: boolean;
}) {
  const numOpacity = useTransform(activeStepRaw, (v: number) => {
    if (Math.floor(v) === index) return 1;
    if (Math.floor(v) > index) return 0.6;
    return 0.35;
  });

  const numColor = useTransform(activeStepRaw, (v: number) =>
    Math.floor(v) >= index ? "#059669" : "rgba(5,150,105,0.35)"
  );

  const titleColor = useTransform(activeStepRaw, (v: number) => {
    if (Math.floor(v) === index) return "#FFFFFF";
    if (Math.floor(v) > index) return "rgba(255,255,255,0.7)";
    return "rgba(255,255,255,0.4)";
  });

  const descColor = useTransform(activeStepRaw, (v: number) => {
    if (Math.floor(v) === index) return "rgba(255,255,255,0.55)";
    if (Math.floor(v) > index) return "rgba(255,255,255,0.4)";
    return "rgba(255,255,255,0.2)";
  });

  return (
    <>
      <div
        className="flex items-start"
        style={{ paddingBlock: 32, gap: 40 }}
      >
        {/* Step number column - 72px wide, centered */}
        <div
          className="flex flex-col items-center shrink-0"
          style={{ width: 72 }}
        >
          <motion.span
            className="font-headline font-bold"
            style={{
              fontSize: 64,
              lineHeight: "64px",
              letterSpacing: "-0.02em",
              color: numColor,
              opacity: numOpacity,
            }}
          >
            {step.num}
          </motion.span>
        </div>

        {/* Content */}
        <div className="flex flex-col" style={{ gap: 8, paddingTop: 8 }}>
          <motion.h3
            className="font-headline"
            style={{
              fontSize: 24,
              fontWeight: 600,
              letterSpacing: "-0.01em",
              lineHeight: "30px",
              color: titleColor,
            }}
          >
            {step.title}
          </motion.h3>
          <motion.p
            style={{
              fontSize: 16,
              lineHeight: "26px",
              color: descColor,
              maxWidth: 660,
            }}
          >
            {step.desc}
          </motion.p>
        </div>
      </div>
      {/* Divider */}
      {!isLast && (
        <div
          style={{
            width: "100%",
            height: 1,
            background: "rgba(255,255,255,0.06)",
          }}
        />
      )}
    </>
  );
}
