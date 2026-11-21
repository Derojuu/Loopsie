# Loopsii — Next.js

A component-based Next.js rebuild of the Loopsii landing page (original capture lives in `HTML_source/`).

## Stack

- Next.js 16 (App Router), React 19, TypeScript
- Tailwind CSS 4 (theme mirrors the original fluid design system)
- GSAP 3 (ScrollTrigger, SplitText, MorphSVG, DrawSVG, CustomEase) + Lenis smooth scroll
- `@hugeicons/react` + `@hugeicons/core-free-icons` for stock UI icons
- pnpm

## Scripts

```bash
pnpm install
pnpm dev      # http://localhost:3000
pnpm build
pnpm start
pnpm lint
```

## Structure

```
app/                  # layout, page, global Tailwind entry (globals.css), icon
components/
  layout/             # navigation, site footer / global canvas, cookie banner
  sections/<name>/    # one folder per page section (Hero, Intro, …, Faq, Outro)
  ui/                 # shared primitives (Button, RevealText, …)
  providers/          # SmoothScroll (Lenis ↔ ScrollTrigger)
constants/            # copy, data arrays, links, motion tokens
hooks/                # useGsap, useMediaQuery, useWeightHover, …
lib/                  # fonts, gsap registration, structured data
styles/               # original component CSS split per section
  app-demo/           # the embedded app mock's own (prefixed `app:`) stylesheet
utils/                # cn()
assets/fonts/         # Saans + Caveat variable fonts (next/font/local)
public/               # images, SVG art, lotties, footer video
```

## Design system notes

- `--spacing` is fluid: `1` unit = `container / 1920 × 16 / 16` px (with tablet/phone ideals), so
  numeric utilities such as `w-910`, `rounded-20`, `border-2`, `px-cont`, `py-section` scale with the viewport exactly like the original.
- Responsive variants: `l:` (≤1023px), `s:` (≤479px), `pc:` (≥1024px).
