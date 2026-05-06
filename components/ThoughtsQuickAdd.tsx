"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";

export function ThoughtsQuickAdd({ pillarId, goalId }: { pillarId?: string; goalId?: string }) {
  const [text, setText] = useState("");
  const addThought = useStore((s) => s.addThought);

  const submit = () => {
    const t = text.trim();
    if (!t) return;
    addThought({ text: t, pillarId, goalId, source: "manual" });
    setText("");
  };

  return (
    <div className="flex gap-2 items-stretch">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
        }}
        placeholder="Co dziś przemyślałem?"
        className="flex-1 px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
      />
      <button
        onClick={submit}
        disabled={!text.trim()}
        className="px-4 py-2 bg-neutral-900 text-white rounded-lg text-sm font-medium disabled:bg-neutral-300"
      >
        Dodaj
      </button>
    </div>
  );
}
