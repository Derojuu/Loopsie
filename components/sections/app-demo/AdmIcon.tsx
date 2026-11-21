import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";

interface AdmIconProps {
  icon: IconSvgElement;
  size?: number;
  className?: string;
}

/**
 * Stock glyph used inside the demo. The original Lucide icons were rendered with
 * `strokeWidth: 1, absoluteStrokeWidth: true`, i.e. a 1px line at any size.
 */
export function AdmIcon({ icon, size = 16, className }: AdmIconProps) {
  return <HugeiconsIcon icon={icon} size={size} strokeWidth={1} absoluteStrokeWidth className={className} aria-hidden="true" />;
}
