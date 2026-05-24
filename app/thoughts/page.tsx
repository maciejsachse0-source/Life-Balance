"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/hydration";
import { Spinner } from "@/components/Spinner";
import { SideNav } from "@/components/SideNav";
import { ThoughtsQuickAdd } from "@/components/ThoughtsQuickAdd";
import { AppShell, StatCard, StatCardHeader, Column } from "@/components/ui";
import { formatDistanceToNow } from "date-fns";
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
    <>
      <AppShell>
        <header className="px-2 mb-2">
          <div className="stat-label">Refleksje</div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900 mt-1 leading-tight">
            Strumień przemyśleń
          </h1>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <Column className="lg:col-span-5">
            <div className="lg:sticky lg:top-6">
              <StatCard>
                <StatCardHeader label="Złap myśl" />
                <ThoughtsQuickAdd />
              </StatCard>
            </div>
          </Column>

          <Column className="lg:col-span-7">
            <StatCard>
              <StatCardHeader label={`Lista · ${filtered.length} z ${thoughts.length}`} />

              <div className="flex gap-2 mb-4">
                <div className="flex-1 relative">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
                  />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Szukaj…"
                    className="w-full pl-8 pr-3 py-2 bg-white/70 border border-neutral-200 rounded-full text-sm focus:outline-none focus:border-neutral-400"
                  />
                </div>
                <select
                  value={filterPillar}
                  onChange={(e) => setFilterPillar(e.target.value)}
                  className="px-3 py-2 bg-white/70 border border-neutral-200 rounded-full text-sm focus:outline-none focus:border-neutral-400"
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
                <p className="text-center text-neutral-500 text-sm py-8">
                  {thoughts.length === 0
                    ? "Brak przemyśleń. Pierwsze właśnie dodajesz."
                    : "Brak wyników."}
                </p>
              ) : (
                <ul className="divide-y divide-neutral-200/60">
                  {filtered.map((t) => {
                    const pillar = t.pillarId ? pillars.find((p) => p.id === t.pillarId) : null;
                    return (
                      <li key={t.id} className="py-3 group">
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
                            <p className="text-sm whitespace-pre-wrap text-neutral-900">{t.text}</p>
                            <div className="text-xs text-neutral-500 mt-1">
                              {formatDistanceToNow(new Date(t.createdAt), {
                                addSuffix: true,
                                locale: pl,
                              })}
                              {pillar ? ` · ${pillar.name}` : ""}
                            </div>
                          </div>
                          <button
                            onClick={() => removeThought(t.id)}
                            className="opacity-0 group-hover:opacity-100 text-neutral-300 hover:text-red-500 transition-opacity"
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
            </StatCard>
          </Column>
        </div>
      </AppShell>
      <SideNav />
    </>
  );
}
