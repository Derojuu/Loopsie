import { LoaderController } from "./LoaderController";

/** Frame corners, in the order the intro animation flies them in: TL, TR, BR, BL. */
const DOT_POSITIONS = [
  "-left-[0.5px] -top-[0.5px]",
  "-right-[0.5px] -top-[0.5px]",
  "-right-[0.5px] -bottom-[0.5px]",
  "-left-[0.5px] -bottom-[0.5px]",
] as const;

/**
 * First-visit page loader: lime sheet, a growing crosshair frame with a
 * counter, and the logo overlays that hand off into the hero. Rendered visible
 * on the server; `LoaderController` drives it. Mount at the top of <body>.
 */
export function Loader() {
  return (
    <>
      <div className="loader fixed inset-0 z-5" data-loader aria-hidden="true">
        <div className="loader_sheet absolute inset-0 bg-main" />
        <div className="loader_box absolute">
          <div className="loader_line loader_line-x absolute -left-[100vw] -right-[100vw] -top-px h-px" />
          <div className="loader_line loader_line-x absolute -left-[100vw] -right-[100vw] -bottom-px h-px" />
          <div className="loader_line loader_line-y absolute -top-[100vh] -bottom-[100vh] -left-px w-px" />
          <div className="loader_line loader_line-y absolute -top-[100vh] -bottom-[100vh] -right-px w-px" />
          <div className="loader_frame absolute -inset-px border border-black" />
          {DOT_POSITIONS.map((position) => (
            <div key={position} className={`loader_dot absolute size-8 bg-black s:size-6 ${position}`} />
          ))}
        </div>
        <div className="loader_counter absolute bottom-40 text-note font-hand">
          <span className="loader_counter-value">000</span> %
        </div>
      </div>
      <div className="loader_right pointer-events-none fixed z-20" aria-hidden="true" />
      <div className="loader_logo pointer-events-none fixed z-20" aria-hidden="true">
        <div className="loader_left absolute inset-0" />
      </div>
      <LoaderController />
    </>
  );
}
