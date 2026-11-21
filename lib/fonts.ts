import localFont from "next/font/local";
import { Geist_Mono } from "next/font/google";

/** Saans variable — headings and body copy (`--font-title`). */
export const saans = localFont({
  src: "../assets/fonts/saans-vf.woff2",
  weight: "300 900",
  style: "normal",
  display: "swap",
  variable: "--font-saans",
  fallback: ["Arial", "sans-serif"],
});

/** Caveat variable — handwritten notes (`--font-hand`). */
export const caveat = localFont({
  src: "../assets/fonts/caveat-vf.woff2",
  weight: "400 700",
  style: "normal",
  display: "swap",
  variable: "--font-caveat",
  fallback: ["Arial", "sans-serif"],
});

/** Geist Mono — UI numerals and labels (`--font-mono`). */
export const geistMono = Geist_Mono({
  subsets: ["latin", "latin-ext"],
  weight: "variable",
  display: "swap",
  variable: "--font-geist-mono",
});

export const fontVariables = [saans.variable, caveat.variable, geistMono.variable].join(" ");
