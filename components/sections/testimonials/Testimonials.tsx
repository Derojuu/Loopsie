import { TESTIMONIALS_HEADING } from "@/constants/testimonials";
import { TestimonialsCarousel } from "@/components/sections/testimonials/TestimonialsCarousel";

/** "Heard from the early ones." testimonials carousel section. */
export function Testimonials() {
  return (
    <section
      id="testimonials"
      className="testimonials relative z-2 overflow-x-clip py-section"
      aria-roledescription="carousel"
      aria-label="Testimonials"
    >
      <div className="container max-w-none px-cont">
        <h2 className="h2 testimonials_heading mx-auto max-w-900 text-center l:max-w-560 s:max-w-300">
          {TESTIMONIALS_HEADING}
        </h2>
      </div>
      <TestimonialsCarousel />
    </section>
  );
}
