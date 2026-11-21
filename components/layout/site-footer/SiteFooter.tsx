import { FOOTER_VIDEO } from "@/constants/footer";

/**
 * Last full-screen spacer of the page. It is visually empty: `GlobalCanvas`
 * paints the dot-matrix video behind it, and the nav morphs into the footer
 * card (CTA + socials + legal) on top of it.
 */
export function SiteFooter() {
  return (
    <section
      className="relative min-h-(--screen-h)"
      data-footer-trigger=""
      data-footer-video={FOOTER_VIDEO}
      aria-hidden="true"
    />
  );
}
