import Image from "next/image";
import { cn } from "@/utils/cn";
import { TESTIMONIALS_OUTLINE_FALLBACK, type Testimonial } from "@/constants/testimonials";

interface LayerProps {
  testimonial: Testimonial;
  variant: "wire" | "paper";
}

/**
 * One of the two stacked card layers. The "wire" layer is the empty blueprint
 * shown outside the centre lens; the "paper" layer carries the photo and copy.
 */
function TestimonialLayer({ testimonial, variant }: LayerProps) {
  const isWire = variant === "wire";
  return (
    <div
      className={cn("testimonials_layer flex flex-col", `testimonials_layer--${variant}`)}
      aria-hidden={isWire || undefined}
    >
      <div className="testimonials_row flex flex-1">
        <div className="testimonials_side flex shrink-0 flex-col">
          <div className="testimonials_photo relative overflow-clip">
            {!isWire && (
              <Image
                className="testimonials_img absolute inset-0 size-full object-cover"
                src={testimonial.image}
                alt={testimonial.name}
                width={480}
                height={480}
                loading="eager"
                draggable={false}
              />
            )}
          </div>
          <div className="testimonials_plate testimonials_plate--side flex-1" />
        </div>
        <div className="testimonials_plate testimonials_plate--quote flex-1">
          <p className="testimonials_title">{testimonial.title}</p>
          <p className="testimonials_quote">{testimonial.quote}</p>
        </div>
      </div>
      <div className="testimonials_plate testimonials_plate--foot flex flex-col">
        <span className="testimonials_rule block" />
        <div className="testimonials_sign flex items-baseline justify-between">
          <span className="testimonials_name font-hand">{testimonial.name}</span>
          <span className="testimonials_role label">{testimonial.role}</span>
        </div>
      </div>
      <svg
        className="testimonials_outline pointer-events-none absolute inset-0 size-full overflow-visible"
        aria-hidden="true"
      >
        <path d={TESTIMONIALS_OUTLINE_FALLBACK} />
      </svg>
    </div>
  );
}

export interface TestimonialCardProps {
  testimonial: Testimonial;
}

/** Testimonial card: wireframe layer + paper layer stacked in the same grid cell. */
export function TestimonialCard({ testimonial }: TestimonialCardProps) {
  return (
    <div className="testimonials_card relative grid">
      <TestimonialLayer testimonial={testimonial} variant="wire" />
      <TestimonialLayer testimonial={testimonial} variant="paper" />
    </div>
  );
}
