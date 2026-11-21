"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CustomEase } from "gsap/CustomEase";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";
import { SplitText } from "gsap/SplitText";

let registered = false;

/** Registers the GSAP plugins used across the site exactly once (client only). */
export function registerGsap(): typeof gsap {
  if (!registered && typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger, CustomEase, DrawSVGPlugin, MorphSVGPlugin, SplitText);
    registered = true;
  }
  return gsap;
}

export { gsap, ScrollTrigger, CustomEase, DrawSVGPlugin, MorphSVGPlugin, SplitText };
