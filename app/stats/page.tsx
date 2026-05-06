"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/hydration";
import { Spinner } from "@/components/Spinner";
import { BottomNav } from "@/components/BottomNav";
import {
  computeWeeklyOverview,
  computeMonthlyTrace,
  computeConsistency,
  computeGoalLifecycle,
  colorForPercent,
} from "@/lib/stats";
import { format, formatDistanceToNow } from "date-fns";
import { pl } from "date-fns/locale";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type Tab = "weekly" | "lifecycle" | "consistency" | "trace";

export default function StatsPage() {
  const hydrated = useHydrated();
  const state = useStore();
  const [tab, setTab] = useState<Tab>("weekly");

  if (!hydrated) return <Spinner />;

  return (
    <main className="pb-24">
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <h1 className="text-lg font-semibold mb-2">Statystyki</h1>
          <nav className="flex gap-1 overflow-x-auto -mb-px">
            {(
              [
                ["weekly", "Tygodniowy"],
                ["lifecycle", "Cykl celów"],
                ["consistency", "Konsystencja"],
                ["trace", "Ślad miesięczny"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setTab(id as Tab)}
                className={`px-3 py-1.5 text-sm rounded-t-md transition-colors ${
                  tab === id
                    ? "bg-white text-indigo-600 font-medium border border-neutral-200 border-b-white"
                    : "text-neutral-500 hover:text-neutral-800"
                }`}
                style={tab === id ? { marginBottom: -1 } : undefined}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {tab === "weekly" ? <WeeklyTab state={state} /> : null}
        {tab === "lifecycle" ? <LifecycleTab state={state} /> : null}
        {tab === "consistency" ? <ConsistencyTab state={state} /> : null}
        {tab === "trace" ? <TraceTab state={state} /> : null}
      </div>

      <BottomNav />
    </main>
  );
}

function WeeklyTab({ state }: { state: ReturnType<typeof useStore.getState> }) {
  const weeks = computeWeeklyOverview(state, 12);
  return (
    <section className="bg-white border border-neutral-200 rounded-xl p-5">
      <h2 className="text-sm font-medium text-neutral-500 uppercase tracking-wide mb-3">
        Ostatnie 12 tygodni × filary
      </h2>
      <p className="text-xs text-neutral-500 mb-4">
        Procent zrealizowanej tygodniowej normy. Czerwony &lt; 60%, zielony ~100%, pomarańczowy &gt; 130%.
      </p>
      <div className="overflow-x-auto">
        <table className="text-xs">
          <thead>
            <tr>
              <th className="text-left pr-3 pb-2 text-neutral-400 font-normal">Tydzień</th>
              {state.layers.pillars.map((p) => (
                <th
                  key={p.id}
                  className="px-2 pb-2 text-neutral-700 font-medium"
                  title={p.name}
                >
                  <span className="inline-flex items-center gap-1">
                    <span
                      className="w-2 h-2 rounded-full inline-block"
                      style={{ backgroundColor: p.color }}
                    />
                    {p.name.length > 8 ? p.name.slice(0, 8) + "…" : p.name}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeks.map((w) => (
              <tr key={w.weekStart.toISOString()}>
                <td className="text-neutral-500 pr-3 py-1 whitespace-nowrap">
                  {format(w.weekStart, "d MMM", { locale: pl })}
                </td>
                {state.layers.pillars.map((p) => {
                  const pct = w.pillarPercents[p.id] ?? 0;
                  const color = colorForPercent(pct);
                  return (
                    <td key={p.id} className="px-1 py-1">
                      <div
                        className="h-5 w-full rounded-sm flex items-center justify-center text-[9px] tabular-nums text-white font-medium"
                        style={{ backgroundColor: color, minWidth: 36 }}
                        title={`${p.name}: ${Math.round(pct)}%`}
                      >
                        {pct > 0 ? Math.round(pct) : ""}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function LifecycleTab({ state }: { state: ReturnType<typeof useStore.getState> }) {
  const lifecycle = computeGoalLifecycle(state);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const filtered =
    statusFilter === "all" ? lifecycle : lifecycle.filter((g) => g.status === statusFilter);

  if (lifecycle.length === 0) {
    return (
      <div className="bg-white border border-neutral-200 rounded-xl p-8 text-center text-sm text-neutral-500">
        Brak celów. Dodaj pierwszy cel w detalu filaru.
      </div>
    );
  }

  return (
    <section className="bg-white border border-neutral-200 rounded-xl p-5">
      <header className="flex flex-wrap items-center justify-between mb-4 gap-2">
        <h2 className="text-sm font-medium text-neutral-500 uppercase tracking-wide">
          Cykl życia celów ({lifecycle.length})
        </h2>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-sm px-2 py-1 border border-neutral-200 rounded"
        >
          <option value="all">Wszystkie</option>
          <option value="Active">Aktywne</option>
          <option value="Paused">Wstrzymane</option>
          <option value="Done">Ukończone</option>
          <option value="Abandoned">Porzucone</option>
        </select>
      </header>
      <ul className="space-y-2">
        {filtered.map((g) => (
          <li
            key={g.goalId}
            className="flex items-center gap-3 p-3 border border-neutral-200 rounded-lg"
          >
            <span
              className="w-2 h-10 rounded-full shrink-0"
              style={{ backgroundColor: g.pillarColor }}
            />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">{g.title}</div>
              <div className="text-xs text-neutral-500">
                {g.character} ·{" "}
                <span
                  className={
                    g.status === "Done"
                      ? "text-emerald-600"
                      : g.status === "Active"
                      ? "text-indigo-600"
                      : g.status === "Abandoned"
                      ? "text-red-600"
                      : "text-amber-600"
                  }
                >
                  {g.status}
                </span>{" "}
                · od{" "}
                {formatDistanceToNow(new Date(g.startedAt), { addSuffix: false, locale: pl })}
              </div>
            </div>
            <div className="w-32">
              <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                <div
                  className="h-full"
                  style={{ width: `${g.progress}%`, backgroundColor: g.pillarColor }}
                />
              </div>
              <div className="text-[10px] text-neutral-400 text-right mt-0.5 tabular-nums">
                {Math.round(g.progress)}%
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ConsistencyTab({ state }: { state: ReturnType<typeof useStore.getState> }) {
  const data = computeConsistency(state, 12);
  const chartData = data.months.map((month, i) => {
    const row: Record<string, string | number> = {
      label: format(month, "LLL", { locale: pl }),
    };
    for (const p of state.layers.pillars) {
      row[p.name] = data.pillarSeries[p.id]?.[i] ?? 0;
    }
    return row;
  });

  if (state.layers.pillars.length === 0) {
    return (
      <div className="bg-white border border-neutral-200 rounded-xl p-8 text-center text-sm text-neutral-500">
        Brak filarów do pokazania.
      </div>
    );
  }

  return (
    <section className="bg-white border border-neutral-200 rounded-xl p-5">
      <h2 className="text-sm font-medium text-neutral-500 uppercase tracking-wide mb-4">
        Konsystencja w czasie (h/tydz · ostatnie 12 mies.)
      </h2>
      <div className="h-80">
        <ResponsiveContainer>
          <LineChart data={chartData} margin={{ top: 10, right: 12, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#a3a3a3" />
            <YAxis tick={{ fontSize: 11 }} stroke="#a3a3a3" />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e5e5" }}
              formatter={(v: number) => `${v}h/tydz`}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {state.layers.pillars.map((p) => (
              <Line
                key={p.id}
                type="monotone"
                dataKey={p.name}
                stroke={p.color}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function TraceTab({ state }: { state: ReturnType<typeof useStore.getState> }) {
  const months = computeMonthlyTrace(state, 12);
  return (
    <section className="bg-white border border-neutral-200 rounded-xl p-5">
      <h2 className="text-sm font-medium text-neutral-500 uppercase tracking-wide mb-3">
        Ślad miesięczny — ostatnie 12 mies. × filary
      </h2>
      <p className="text-xs text-neutral-500 mb-4">
        Procent realizacji normy w danym miesiącu. Hover — szczegóły.
      </p>
      <div className="overflow-x-auto">
        <table className="text-xs">
          <thead>
            <tr>
              <th className="text-left pr-3 pb-2 text-neutral-400 font-normal">Miesiąc</th>
              {state.layers.pillars.map((p) => (
                <th key={p.id} className="px-2 pb-2 text-neutral-700 font-medium">
                  <span className="inline-flex items-center gap-1">
                    <span
                      className="w-2 h-2 rounded-full inline-block"
                      style={{ backgroundColor: p.color }}
                    />
                    {p.name.length > 8 ? p.name.slice(0, 8) + "…" : p.name}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {months.map((m) => (
              <tr key={m.month.toISOString()}>
                <td className="text-neutral-500 pr-3 py-1 whitespace-nowrap">
                  {format(m.month, "LLL yyyy", { locale: pl })}
                </td>
                {state.layers.pillars.map((p) => {
                  const pct = m.pillarPercents[p.id] ?? 0;
                  const color = colorForPercent(pct);
                  return (
                    <td key={p.id} className="px-1 py-1">
                      <div
                        className="h-6 w-full rounded-sm flex items-center justify-center text-[10px] tabular-nums text-white font-medium"
                        style={{ backgroundColor: color, minWidth: 40 }}
                        title={`${p.name} ${format(m.month, "LLL yyyy", { locale: pl })}: ${Math.round(pct)}%`}
                      >
                        {pct > 0 ? `${Math.round(pct)}%` : ""}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
