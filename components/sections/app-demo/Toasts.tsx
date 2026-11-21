"use client";

import { useWorkspace } from "@/components/sections/app-demo/workspace-context";

/** Bottom-centred hint shown when a demo control only "works in the app". */
export function Toasts() {
  const { toast } = useWorkspace();
  return (
    <div
      className="app:pointer-events-none app:absolute app:inset-x-0 app:bottom-24 app:z-[100] app:grid app:justify-items-center"
      aria-live="polite"
    >
      {toast && (
        <span key={toast.id} className="adm-toast">
          {toast.text}
        </span>
      )}
    </div>
  );
}
