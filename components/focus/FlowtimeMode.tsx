"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, X } from "lucide-react";

type Props = {
  title: string;
  onFinish: () => void;
  onAbort: () => void;
};

export function FlowtimeMode({ title, onFinish, onAbort }: Props) {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(true);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!running) return;
    timer.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [running]);

  const hh = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const mm = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <div className="fixed inset-0 z-50 bg-neutral-900 text-white flex flex-col">
      <header className="flex items-center justify-between px-6 py-4">
        <button onClick={onAbort} className="text-neutral-400 hover:text-white" aria-label="Zamknij">
          <X size={20} />
        </button>
        <div className="text-sm text-neutral-400">Flowtime — bez ciśnienia</div>
        <button
          onClick={onFinish}
          className="text-sm bg-emerald-600 px-4 py-1.5 rounded-md hover:bg-emerald-700"
        >
          Skończyłem
        </button>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="text-center mb-10">
          <p className="text-sm text-neutral-400 mb-2">Pracujesz nad</p>
          <h1 className="text-3xl sm:text-4xl font-semibold max-w-2xl px-6">{title}</h1>
        </div>
        <div className="text-[80px] sm:text-[140px] font-mono font-bold leading-none tabular-nums">
          {hh !== "00" ? `${hh}:` : ""}
          {mm}:{ss}
        </div>
        <button
          onClick={() => setRunning((r) => !r)}
          className="mt-12 inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-full"
        >
          {running ? <Pause size={18} /> : <Play size={18} />}
          {running ? "Pauza" : "Wznów"}
        </button>
      </div>
    </div>
  );
}
