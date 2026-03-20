"use client";

export function Hero() {
  return (
    <section className="relative flex flex-col items-center pt-[140px] pb-8 px-6 overflow-hidden">
      {/* Aurora blobs */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: 600,
          height: 600,
          left: "10%",
          top: "0%",
          background: "radial-gradient(circle, rgba(5,150,105,0.15), transparent 70%)",
          animation: "auroraPulse 8s ease-in-out infinite",
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          width: 500,
          height: 500,
          right: "5%",
          top: "10%",
          background: "radial-gradient(circle, rgba(245,158,11,0.08), transparent 70%)",
          animation: "auroraPulse 8s ease-in-out infinite 2s",
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          width: 400,
          height: 400,
          left: "40%",
          top: "20%",
          background: "radial-gradient(circle, rgba(5,150,105,0.08), transparent 70%)",
          animation: "auroraPulse 8s ease-in-out infinite 4s",
        }}
      />

      {/* Headline */}
      <div className="relative z-10 flex items-baseline justify-center gap-3 flex-wrap">
        <span
          className="font-headline font-bold text-white text-4xl md:text-6xl lg:text-[76px] leading-tight lg:leading-[84px]"
          style={{ letterSpacing: "-0.03em", animation: "fadeSlideUp 0.5s ease both" }}
        >
          Pay via
        </span>
        <span
          className="font-headline font-bold text-4xl md:text-6xl lg:text-[76px] leading-tight lg:leading-[84px]"
          style={{ letterSpacing: "-0.03em", color: "#F59E0B", animation: "fadeSlideUp 0.5s ease both 0.1s" }}
        >
          $ZEC
        </span>
        <span
          className="font-headline font-bold text-white text-4xl md:text-6xl lg:text-[76px] leading-tight lg:leading-[84px]"
          style={{ letterSpacing: "-0.03em", animation: "fadeSlideUp 0.5s ease both 0.2s" }}
        >
          to the World
        </span>
      </div>

      {/* Subtitle */}
      <p
        className="relative z-10 text-center mt-8 max-w-[560px]"
        style={{
          fontSize: 17,
          lineHeight: "30px",
          color: "rgba(255,255,255,0.5)",
          animation: "fadeIn 0.5s ease both 0.5s",
        }}
      >
        Zwage makes global payroll easy for teams and freelancers,
        offering flexible payments in ZEC and stablecoins.
      </p>

      {/* CTA Buttons */}
      <div
        className="relative z-10 flex items-center gap-4 mt-10"
        style={{ animation: "fadeSlideUp 0.5s ease both 0.7s" }}
      >
        <a
          href="/sign-up"
          className="flex items-center justify-center font-semibold text-white rounded-full transition-all duration-200 hover:brightness-110"
          style={{
            backgroundColor: "#059669",
            width: 160,
            height: 48,
            fontSize: 15,
          }}
        >
          Start Free
        </a>
        <a
          href="#how-it-works"
          className="flex items-center justify-center font-medium text-white rounded-full transition-all duration-200 hover:bg-white/5"
          style={{
            border: "1px solid rgba(255,255,255,0.15)",
            width: 160,
            height: 48,
            fontSize: 15,
          }}
        >
          How it works
        </a>
      </div>
    </section>
  );
}
