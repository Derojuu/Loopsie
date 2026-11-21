"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ADM_TOAST_MS, type AdmProjectId } from "@/constants/app-demo";

interface Toast {
  id: number;
  text: string;
}

interface Timer {
  running: boolean;
  startedAt: number;
  projectId: AdmProjectId | null;
}

interface WorkspaceState {
  timer: Timer;
  /** Elapsed timer seconds (ticks once a second while running). */
  elapsed: number;
  startTimer: (projectId: AdmProjectId | null) => void;
  stopTimer: () => void;
  toggleTimer: () => void;
  toast: Toast | null;
  /** Shows a short "works in the app" hint at the bottom of the canvas. */
  door: (text: string) => void;
}

const WorkspaceContext = createContext<WorkspaceState | null>(null);

export function useWorkspace(): WorkspaceState {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used inside <WorkspaceProvider>");
  return ctx;
}

/** Formats seconds as HH:MM:SS (the demo's timer format). */
export const formatClock = (seconds: number) => {
  const s = Math.max(0, Math.floor(seconds));
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
};

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [timer, setTimer] = useState<Timer>({ running: false, startedAt: 0, projectId: null });
  const [elapsed, setElapsed] = useState(0);
  const [toast, setToast] = useState<Toast | null>(null);
  const toastTimer = useRef<number>(0);

  useEffect(() => {
    if (!timer.running) return;
    const tick = () => setElapsed((Date.now() - timer.startedAt) / 1000);
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [timer]);

  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  const startTimer = useCallback((projectId: AdmProjectId | null) => {
    setElapsed(0);
    setTimer({ running: true, startedAt: Date.now(), projectId });
  }, []);
  const stopTimer = useCallback(() => setTimer((t) => ({ ...t, running: false })), []);
  const toggleTimer = useCallback(
    () => (timer.running ? stopTimer() : startTimer(null)),
    [timer.running, startTimer, stopTimer],
  );
  const door = useCallback((text: string) => {
    window.clearTimeout(toastTimer.current);
    setToast({ id: performance.now(), text });
    toastTimer.current = window.setTimeout(() => setToast(null), ADM_TOAST_MS);
  }, []);

  const value = useMemo(
    () => ({ timer, elapsed, startTimer, stopTimer, toggleTimer, toast, door }),
    [timer, elapsed, startTimer, stopTimer, toggleTimer, toast, door],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}
