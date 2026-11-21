import { AppDemoShell } from "@/components/sections/app-demo/AppDemoShell";
import { Workspace } from "@/components/sections/app-demo/Workspace";
import { DashCta } from "@/components/sections/app-demo/DashCta";

/** Desktop (≥1024px) "That's why Loopsii exists" section with the interactive app demo. */
export function AppDemo() {
  return (
    <AppDemoShell
      heading={
        <>
          <span>That&apos;s why Loopsii</span> <span>exists</span>
        </>
      }
    >
      <div className="container max-w-none px-cont">
        <div className="app-demo_stage relative">
          <Workspace />
        </div>
        <div className="app-demo_cta relative">
          <DashCta inline />
        </div>
      </div>
    </AppDemoShell>
  );
}
