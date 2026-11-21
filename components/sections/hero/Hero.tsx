import { HeroContent } from "@/components/sections/hero/HeroContent";

/**
 * Page header: "One app for your <rotating word>" headline, subtitle and the
 * animated grid of geometric shapes framed by crosshair lines and labels.
 * Place it as the first child of `<main className="relative z-2">`.
 */
export function Hero() {
  return (
    <header>
      <div className="container max-w-none px-cont">
        <HeroContent />
      </div>
    </header>
  );
}
