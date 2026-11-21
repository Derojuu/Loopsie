import { OutroTitle } from "./OutroTitle";

/** "Shipped weekly, shaped by you" — the wavy closing line above the footer. */
export function Outro() {
  return (
    <section className="outro relative z-2 pb-100">
      <div className="container max-w-none px-cont">
        <h2 className="sr-only">Shipped weekly, shaped by you</h2>
        <OutroTitle />
      </div>
    </section>
  );
}
