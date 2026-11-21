/**
 * Tiny typed event bus between the page loader, the hero and the navigation.
 * Mirrors the original app events (`revealed`, `loaded`) plus the direct
 * `nav.reveal(rate)` call, all as window CustomEvents.
 */
export const LOADER_EVENTS = {
  /** Hero cells are about to pop in: shapes / title rotation may start. */
  revealed: "loopsii:revealed",
  /** Loader finished (or was skipped); everything is released. */
  loaded: "loopsii:loaded",
  /** Slide the navigation in (detail: `{ rate }` timeline speed). */
  navReveal: "loopsii:nav-reveal",
} as const;

export interface NavRevealDetail {
  rate: number;
}

const state = { revealed: false, navRevealed: false };

/** True while a loader exists in the DOM and the hero has not been revealed yet. */
export function isLoaderHeld(): boolean {
  return typeof document !== "undefined" && !state.revealed && !!document.querySelector("[data-loader]:not([hidden])");
}

/** True while the navigation must stay off-screen. */
export function isNavHeld(): boolean {
  return typeof document !== "undefined" && !state.navRevealed && !!document.querySelector("[data-loader]:not([hidden])");
}

export function emitRevealed(): void {
  state.revealed = true;
  window.dispatchEvent(new CustomEvent(LOADER_EVENTS.revealed));
}

export function emitLoaded(): void {
  state.revealed = true;
  window.dispatchEvent(new CustomEvent(LOADER_EVENTS.loaded));
}

export function emitNavReveal(rate = 1): void {
  state.navRevealed = true;
  window.dispatchEvent(new CustomEvent<NavRevealDetail>(LOADER_EVENTS.navReveal, { detail: { rate } }));
}

/** Runs `callback` once when the hero is revealed (or the loader finished). Returns an unsubscribe. */
export function onLoaderRevealed(callback: () => void): () => void {
  const handler = () => {
    off();
    callback();
  };
  const off = () => {
    window.removeEventListener(LOADER_EVENTS.revealed, handler);
    window.removeEventListener(LOADER_EVENTS.loaded, handler);
  };
  window.addEventListener(LOADER_EVENTS.revealed, handler);
  window.addEventListener(LOADER_EVENTS.loaded, handler);
  return off;
}

/** Runs `callback` once when the navigation should slide in. Returns an unsubscribe. */
export function onNavReveal(callback: (rate: number) => void): () => void {
  const handler = (event: Event) => {
    off();
    callback((event as CustomEvent<NavRevealDetail>).detail?.rate ?? 1);
  };
  const off = () => window.removeEventListener(LOADER_EVENTS.navReveal, handler);
  window.addEventListener(LOADER_EVENTS.navReveal, handler);
  return off;
}
