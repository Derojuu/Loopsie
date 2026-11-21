import type { ComponentProps } from "react";

/** Animated feature visual "dictation" (driven by `featureIconAnimations`). */
export function DictationIcon(props: ComponentProps<"svg">) {
  return (
    <svg
      {...props}
      className="block h-auto w-full"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 150 120"
      width="150"
      height="120"
      aria-hidden="true"
      focusable="false"
    >
      <rect data-bar="0" x="0" y="42.50" width="22" height="35.00" rx="11" fill="currentColor" />
      <rect data-bar="1" x="32" y="16.13" width="22" height="87.74" rx="11" fill="currentColor" />
      <rect data-bar="2" x="64" y="18.41" width="22" height="83.19" rx="11" fill="currentColor" />
      <rect data-bar="3" x="96" y="48.05" width="22" height="23.90" rx="11" fill="currentColor" />
      <rect data-bar="4" x="128" y="46.67" width="22" height="26.66" rx="11" fill="currentColor" />
    </svg>
  );
}
