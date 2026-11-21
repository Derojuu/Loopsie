import { NAV_COPYRIGHT, NAV_LEGAL_LINKS, NAV_SOCIALS } from "@/constants/navigation";
import { WeightHoverLink } from "./WeightHoverLink";

/** Socials + legal strip that slides in under the open nav card. */
export function NavLegal() {
  return (
    <div className="nav_legal pointer-events-auto absolute top-0 left-1/2 flex min-h-126 w-910 max-w-[calc(100vw-var(--spacing)*32)] -translate-x-1/2 items-center justify-between gap-20 rounded-20 bg-white px-30 py-30 text-copy leading-1.4 l:min-h-82 l:w-570 s:min-h-0 s:w-336 s:flex-col s:items-stretch s:gap-21.5 s:p-20 s:pt-21.5">
      <div className="flex flex-col items-start gap-[0.625em] s:items-stretch s:gap-21.5">
        <div className="nav_legal-socials flex gap-30 s:justify-between s:border-b s:border-black/20 s:pb-20">
          {NAV_SOCIALS.map((social) => (
            <WeightHoverLink
              key={social.href}
              href={social.href}
              target="_blank"
              rel="noopener"
              track={social.track}
              label={social.label}
            />
          ))}
        </div>
        <p>{NAV_COPYRIGHT}</p>
      </div>
      <div className="flex flex-col items-end gap-[0.625em] s:order-first s:flex-row s:justify-between">
        {NAV_LEGAL_LINKS.map((link) => (
          <WeightHoverLink key={link.href} href={link.href} track={link.track} className="go" label={link.label} />
        ))}
      </div>
    </div>
  );
}
