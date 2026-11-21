import { cn } from "@/utils/cn";
import type { IntroOrbitItem as IntroOrbitItemData } from "@/constants/intro";

/** One coloured feature bubble (circle / rotated square) with its glyph. */
export function IntroOrbitItem({ item }: { item: IntroOrbitItemData }) {
  const { icon } = item;
  return (
    <div className={cn("intro-orbit_item absolute origin-center scale-0", item.className)}>
      <div className={cn("intro-orbit_shape w-full h-full", item.shapeClassName)} />
      <div className="intro-orbit_icon absolute inset-0 flex justify-center items-center text-black">
        <svg
          aria-hidden="true"
          className={cn("h-auto", icon.sizeClass)}
          xmlns="http://www.w3.org/2000/svg"
          viewBox={icon.viewBox}
          width={icon.width}
          height={icon.height}
        >
          <path d={icon.d} fill="currentColor" fillRule={icon.evenOdd ? "evenodd" : undefined} />
        </svg>
      </div>
    </div>
  );
}
