/**
 * Port of the original infinite, snapping drag slider (fixed-width, horizontal
 * branch only). Positions are expressed in "slides": `target` follows input,
 * `current` is frame-rate independently damped towards it, and every item is
 * translated to its wrapped offset so the track loops seamlessly.
 */

/** Frame-rate independent damping (original `l`). */
const damp = (from: number, to: number, lambda: number, dt: number) => from + (to - from) * (1 - Math.exp(-lambda * dt));

/** Wraps `value` into `[-length/2, length/2]` (original `u`). */
const wrapCentered = (value: number, length: number) => {
  let r = value % length;
  if (Math.abs(r) > length / 2) r = r > 0 ? r - length : r + length;
  return r;
};

export interface TestimonialsSliderOptions {
  /** Damping time constant: `current` reaches `target` with rate 1/lerpFactor. */
  lerpFactor?: number;
  onSlideChange?: (index: number, previous: number) => void;
  onResize?: () => void;
}

const SNAP_STRENGTH = 0.1;
const WHEEL_MULTIPLIER = 0.5;
const FIREFOX_LINE_MULTIPLIER = 30;
const WHEEL_SENSITIVITY = 0.001;

export class TestimonialsSlider {
  readonly wrapper: HTMLElement;
  readonly items: HTMLElement[];
  current = 0;
  target = 0;
  isDragging = false;
  isVisible = false;
  itemWidth = 0;
  dragSensitivity = 0.005;
  parallaxValues: number[] = [];

  private readonly lerpFactor: number;
  private readonly onSlideChange?: TestimonialsSliderOptions["onSlideChange"];
  private readonly onResize?: TestimonialsSliderOptions["onResize"];
  private running = true;
  private lastTime = 0;
  private slide = 0;
  private dragStart = 0;
  private dragStartTarget = 0;
  private isTouching = false;
  private touchStartX = 0;
  private touchStartY = 0;
  private scrollDirection: "horizontal" | "vertical" | undefined;
  private resizeTimeout: ReturnType<typeof setTimeout> | undefined;
  private readonly resizeObserver: ResizeObserver;
  private readonly cleanups: (() => void)[] = [];

  constructor(wrapper: HTMLElement, options: TestimonialsSliderOptions = {}) {
    this.wrapper = wrapper;
    this.items = [...wrapper.children] as HTMLElement[];
    this.lerpFactor = options.lerpFactor ?? 0.3;
    this.onSlideChange = options.onSlideChange;
    this.onResize = options.onResize;
    this.wrapper.style.cursor = "grab";
    this.measure();
    this.resizeObserver = new ResizeObserver(() => {
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = setTimeout(() => this.resize(), 10);
    });
    this.resizeObserver.observe(wrapper);
    this.bind();
  }

  get currentSlide(): number {
    return this.slide;
  }

  private listen<K extends keyof WindowEventMap>(
    target: Window | HTMLElement,
    type: K,
    handler: (event: WindowEventMap[K]) => void,
    options?: AddEventListenerOptions,
  ) {
    target.addEventListener(type, handler as EventListener, options);
    this.cleanups.push(() => target.removeEventListener(type, handler as EventListener, options));
  }

  private measure() {
    this.itemWidth = this.items[0]?.getBoundingClientRect().width ?? 0;
    queueMicrotask(() => this.onResize?.());
  }

  private bind() {
    this.listen(this.wrapper, "mousedown", (e) => this.dragBegin(e.clientX));
    this.listen(window, "mousemove", (e) => this.dragMove(e.clientX));
    this.listen(window, "mouseup", () => this.dragEnd());
    this.listen(this.wrapper, "touchstart", (e) => {
      const touch = e.touches[0];
      this.touchStartX = touch.clientX;
      this.touchStartY = touch.clientY;
      this.scrollDirection = undefined;
      this.isTouching = true;
      this.dragBegin(touch.clientX);
    });
    this.listen(
      window,
      "touchmove",
      (e) => {
        if (!this.isTouching) return;
        const touch = e.touches[0];
        const dy = Math.abs(touch.clientY - this.touchStartY);
        const dx = Math.abs(touch.clientX - this.touchStartX);
        if (!this.scrollDirection && (dx > 5 || dy > 5)) {
          this.scrollDirection = dx > dy ? "horizontal" : "vertical";
        }
        if (this.scrollDirection === "horizontal") {
          e.preventDefault();
          this.dragMove(touch.clientX);
        }
      },
      { passive: false },
    );
    this.listen(window, "touchend", () => {
      this.isTouching = false;
      this.scrollDirection = undefined;
      this.dragEnd();
    });
    // Horizontal wheel / trackpad swipes nudge the target (virtual-scroll port).
    this.listen(
      this.wrapper,
      "wheel",
      (e) => {
        if (this.isDragging) return;
        let delta = -e.deltaX;
        if (e.deltaMode === 1) delta *= FIREFOX_LINE_MULTIPLIER;
        this.target += delta * WHEEL_MULTIPLIER * WHEEL_SENSITIVITY;
      },
      { passive: true },
    );
  }

  private dragBegin(x: number) {
    this.isDragging = true;
    this.dragStart = x;
    this.dragStartTarget = this.target;
    this.wrapper.style.cursor = "grabbing";
  }

  private dragMove(x: number) {
    if (!this.isDragging) return;
    this.target = this.dragStartTarget + (x - this.dragStart) * this.dragSensitivity;
  }

  private dragEnd() {
    if (!this.isDragging) return;
    this.isDragging = false;
    this.wrapper.style.cursor = "grab";
    this.target = Math.round(this.target);
  }

  update() {
    if (!this.isVisible || !this.running) return;
    const now = performance.now();
    const dt = (now - this.lastTime) / 1000;
    this.lastTime = now;
    if (!this.isDragging) this.target += (Math.round(this.target) - this.target) * SNAP_STRENGTH;
    this.current = damp(this.current, this.target, 1 / this.lerpFactor, dt);

    const count = this.items.length;
    const nearest = Math.round(-this.current);
    this.setSlide(((nearest % count) + count) % count);

    this.parallaxValues = this.items.map((item, i) => {
      const offset = wrapCentered(this.current + i, count);
      item.style.transform = `translateX(${(offset - i) * this.itemWidth}px)`;
      return offset;
    });
  }

  private setSlide(index: number) {
    if (index === this.slide) return;
    const previous = this.slide;
    this.slide = index;
    this.onSlideChange?.(index, previous);
  }

  goToNext() {
    this.target = Math.round(this.target - 1);
  }

  goToPrev() {
    this.target = Math.round(this.target + 1);
  }

  /** Starts (or restarts) the clock after sleeping. */
  init() {
    this.running = true;
    this.lastTime = performance.now();
  }

  resize() {
    this.measure();
    const { running, isVisible } = this;
    this.running = true;
    this.isVisible = true;
    this.update();
    this.running = running;
    this.isVisible = isVisible;
  }

  destroy() {
    this.running = false;
    clearTimeout(this.resizeTimeout);
    this.resizeObserver.disconnect();
    this.cleanups.forEach((fn) => fn());
    this.items.forEach((item) => (item.style.transform = ""));
    this.wrapper.style.cursor = "";
  }
}
