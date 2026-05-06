"use client";

import { X } from "lucide-react";

type Props = {
  title: string;
  subtitle?: string;
  bg?: string;
  onFinish: () => void;
  onAbort: () => void;
};

// Used for: routine (fizjologia), buffer, social ("Bądź teraz tutaj")
export function SimpleMode({ title, subtitle, bg, onFinish, onAbort }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 text-white flex flex-col"
      style={{ background: bg ?? "linear-gradient(135deg,#1f2937,#111827)" }}
    >
      <header className="flex items-center justify-between px-6 py-4">
        <button onClick={onAbort} className="text-white/60 hover:text-white" aria-label="Zamknij">
          <X size={20} />
        </button>
        <div className="text-sm text-white/60" />
        <div />
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        {subtitle ? <p className="text-white/70 text-sm mb-3">{subtitle}</p> : null}
        <h1 className="text-4xl sm:text-5xl font-semibold mb-12 max-w-2xl">{title}</h1>
        <button
          onClick={onFinish}
          className="px-8 py-4 bg-white text-neutral-900 rounded-full font-medium text-lg hover:bg-neutral-100"
        >
          Skończyłem
        </button>
      </div>
    </div>
  );
}
