"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

type Props = {
  title: string;
  pillarId?: string;
  goalId?: string;
  defaultMinutes?: number;
  onFinishWithThought: (text: string) => void;
  onAbort: () => void;
};

export function ReflectiveMode({
  title,
  defaultMinutes = 20,
  onFinishWithThought,
  onAbort,
}: Props) {
  const [secondsLeft, setSecondsLeft] = useState(defaultMinutes * 60);
  const [text, setText] = useState("");
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timer.current = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");
  const lowTime = secondsLeft < 60;

  return (
    <div className="fixed inset-0 z-50 bg-neutral-900 text-white flex flex-col">
      <header className="flex items-center justify-between px-6 py-4">
        <button onClick={onAbort} className="text-neutral-400 hover:text-white" aria-label="Zamknij">
          <X size={20} />
        </button>
        <div className="text-sm text-neutral-400">Refleksja</div>
        <button
          onClick={() => onFinishWithThought(text)}
          className="text-sm bg-emerald-600 px-4 py-1.5 rounded-md hover:bg-emerald-700"
        >
          Skończyłem
        </button>
      </header>
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
        {/* Quiet timer */}
        <div className="flex flex-col items-center justify-center">
          <p className="text-sm text-neutral-400 mb-2">Pracujesz nad</p>
          <h1 className="text-2xl font-semibold mb-8 text-center max-w-md">{title}</h1>
          <div
            className={`text-[100px] font-mono leading-none tabular-nums ${
              lowTime ? "text-amber-300 animate-pulse" : "text-neutral-100"
            }`}
          >
            {mm}:{ss}
          </div>
        </div>
        {/* Journal */}
        <div className="flex flex-col">
          <label className="text-sm text-neutral-400 mb-2">Co dziś zauważyłem?</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Wpisz cokolwiek, co przyjdzie do głowy. Po skończeniu trafia do strumienia myśli."
            className="flex-1 bg-neutral-800 text-white placeholder-neutral-500 rounded-lg p-4 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[300px]"
          />
        </div>
      </div>
    </div>
  );
}
