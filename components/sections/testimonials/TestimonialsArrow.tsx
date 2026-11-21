import { cn } from "@/utils/cn";
import { TESTIMONIALS_ARROW_PATHS, TESTIMONIALS_ARROW_SWEEP } from "@/constants/testimonials";

export interface TestimonialsArrowProps {
  dir: "prev" | "next";
  onClick: () => void;
}

/** Oval nav button: colour-sweep layers + morphing arrow glyph (hover timeline lives in the stage). */
export function TestimonialsArrow({ dir, onClick }: TestimonialsArrowProps) {
  return (
    <button
      type="button"
      className="testimonials_arrow relative grid place-items-center"
      data-dir={dir}
      aria-label={dir === "prev" ? "Previous testimonial" : "Next testimonial"}
      data-track={`testimonials-${dir}`}
      onClick={onClick}
    >
      <span className="testimonials_oval absolute overflow-clip" aria-hidden="true">
        <span className="btn_bg-solid testimonials_oval-base absolute inset-0" />
        {TESTIMONIALS_ARROW_SWEEP.map((color) => (
          <span key={color} className={cn("btn_bg-item absolute inset-0", color)} />
        ))}
      </span>
      <span className="testimonials_glyph relative" aria-hidden="true">
        <svg className="block size-full text-black" viewBox="0 0 11 11" fill="none">
          <path d={TESTIMONIALS_ARROW_PATHS.default} fill="currentColor" />
        </svg>
        <svg className="absolute inset-0 size-full text-white" viewBox="0 0 11 11" fill="none">
          <path d={TESTIMONIALS_ARROW_PATHS.bottom} fill="currentColor" />
        </svg>
      </span>
    </button>
  );
}
