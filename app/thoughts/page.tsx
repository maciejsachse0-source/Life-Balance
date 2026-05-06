"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/hydration";
import { Spinner } from "@/components/Spinner";
import { BottomNav } from "@/components/BottomNav";
import { ThoughtsQuickAdd } from "@/components/ThoughtsQuickAdd";
import { format, formatDistanceToNow } from "date-fns";
import { pl } from "date-fns/locale";
import { Trash2, Search } from "lucide-react";

export default function ThoughtsPage() {
  const hydrated = useHydrated();
  const thoughts = useStore((s) => s.thoughts);
  const pillars = useStore((s) => s.layers.pillars);
  const removeThought = useStore((s) => s.removeThought);
  const [filterPillar, setFilterPillar] = useState<string>("all");
  const [query, setQuery] = useState("");

  if (!hydrated) return <Spinner />;

  const filtered = thoughts.filter((t) => {
    if (filterPillar !== "all" && t.pillarId !== filterPillar) return false;
    if (query && !t.text.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  return (
    <main className="pb-24">
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <h1 className="text-lg font-semibold">Strumień przemyśleń</h1>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">
        <ThoughtsQuickAdd />

        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Szukaj…"
              className="w-full pl-7 pr-3 py-1.5 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>
          <select
            value={filterPillar}
            onChange={(e) => setFilterPillar(e.target.value)}
            className="px-3 py-1.5 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
          >
            <option value="all">Wszystkie filary</option>
            {pillars.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {filtered.length === 0 ? (
          <p className="text-center text-neutral-400 text-sm py-8">
            {thoughts.length === 0 ? "Brak przemyśleń. Pierwsze właśnie dodajesz." : "Brak wyników."}
          </p>
        ) : (
          <ul className="space-y-2">
            {filtered.map((t) => {
              const pillar = t.pillarId ? pillars.find((p) => p.id === t.pillarId) : null;
              return (
                <li
                  key={t.id}
                  className="bg-white border border-neutral-200 rounded-lg p-3 group"
                >
                  <div className="flex items-start gap-3">
                    {pillar ? (
                      <span
                        className="mt-1.5 w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: pillar.color }}
                      />
                    ) : (
                      <span className="mt-1.5 w-2 h-2 rounded-full shrink-0 bg-neutral-300" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm whitespace-pre-wrap">{t.text}</p>
                      <div className="text-xs text-neutral-400 mt-1">
                        {formatDistanceToNow(new Date(t.createdAt), { addSuffix: true, locale: pl })}
                        {pillar ? ` · ${pillar.name}` : ""}
                      </div>
                    </div>
                    <button
                      onClick={() => removeThought(t.id)}
                      className="opacity-0 group-hover:opacity-100 text-neutral-300 hover:text-red-500"
                      aria-label="Usuń myśl"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <BottomNav />
    </main>
  );
}
