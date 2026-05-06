"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, X } from "lucide-react";

type Phase = "work" | "shortBreak" | "longBreak";

const WORK_MIN = 25;
const SHORT_MIN = 5;
const LONG_MIN = 15;

type Props = {
  title: string;
  totalSlotMinutes: number;
  onFinish: () => void;
  onAbort: () => void;
};

export function PomodoroMode({ title, totalSlotMinutes, onFinish, onAbort }: Props) {
  const [phase, setPhase] = useState<Phase>("work");
  const [secondsLeft, setSecondsLeft] = useState(WORK_MIN * 60);
  const [running, setRunning] = useState(true);
  const [cycle, setCycle] = useState(1);
  const totalCycles = Math.max(1, Math.floor(totalSlotMinutes / (WORK_MIN + SHORT_MIN)));
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!running) return;
    timer.current = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [running]);

  useEffect(() => {
    if (secondsLeft > 0) return;
    // phase transition
    if (phase === "work") {
      if (cycle >= totalCycles) {
        onFinish();
        return;
      }
      const isLongBreak = cycle % 4 === 0;
      setPhase(isLongBreak ? "longBreak" : "shortBreak");
      setSecondsLeft((isLongBreak ? LONG_MIN : SHORT_MIN) * 60);
    } else {
      setCycle((c) => c + 1);
      setPhase("work");
      setSecondsLeft(WORK_MIN * 60);
    }
  }, [secondsLeft, phase, cycle, totalCycles, onFinish]);

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  const phaseLabel =
    phase === "work" ? "Praca" : phase === "shortBreak" ? "Krótka przerwa" : "Długa przerwa";

  return (
    <div className="fixed inset-0 z-50 bg-neutral-900 text-white flex flex-col">
      <header className="flex items-center justify-between px-6 py-4">
        <button onClick={onAbort} className="text-neutral-400 hover:text-white" aria-label="Zamknij">
          <X size={20} />
        </button>
        <div className="text-sm text-neutral-400">
          Cykl {cycle} z {totalCycles} · {phaseLabel}
        </div>
        <button
          onClick={onFinish}
          className="text-sm text-neutral-400 hover:text-white"
        >
          Skończyłem
        </button>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="text-center mb-10">
          <p className="text-sm text-neutral-400 mb-2">Pracujesz nad</p>
          <h1 className="text-3xl sm:text-4xl font-semibold max-w-2xl px-6">{title}</h1>
        </div>
        <div
          className={`text-[100px] sm:text-[160px] font-mono font-bold leading-none tabular-nums ${
            phase === "work" ? "text-white" : "text-emerald-300"
          }`}
        >
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
