import { Navigation } from "@/components/layout/navigation";
import { GlobalCanvas, SiteFooter } from "@/components/layout/site-footer";
import { CookieBanner } from "@/components/layout/cookie-banner";
import { Hero } from "@/components/sections/hero";
import { Intro } from "@/components/sections/intro";
import { Distraction } from "@/components/sections/distraction";
import { AppDemo } from "@/components/sections/app-demo";
import { Dashboard } from "@/components/sections/dashboard";
import { Stack } from "@/components/sections/stack";
import { Highlights } from "@/components/sections/highlights";
import { Folders } from "@/components/sections/folders";
import { Features } from "@/components/sections/features";
import { Testimonials } from "@/components/sections/testimonials";
import { Pricing } from "@/components/sections/pricing";
import { Roadmap } from "@/components/sections/roadmap";
import { Waitlist } from "@/components/sections/waitlist";
import { Faq } from "@/components/sections/faq";
import { Outro } from "@/components/sections/outro";

export default function HomePage() {
  return (
    <>
      <Navigation />
      {/* The loader reveals <main> via inline visibility before/after hydration. */}
      <main className="relative z-2" suppressHydrationWarning>
        <Hero />
        <Intro />
        <Distraction />
        <AppDemo />
        <Dashboard />
        <Stack />
        <Highlights />
        <Folders />
        <Features />
        <Testimonials />
        <Pricing />
        <Roadmap />
        <Waitlist />
        <Faq />
        <Outro />
        <SiteFooter />
      </main>
      <GlobalCanvas />
      <CookieBanner />
    </>
  );
}
