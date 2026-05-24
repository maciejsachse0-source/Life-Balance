"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/hydration";
import { Spinner } from "@/components/Spinner";
import { SideNav } from "@/components/SideNav";
import { AppShell, StatCard, StatCardHeader } from "@/components/ui";
import {
  computeWeeklyOverview,
  computeMonthlyTrace,
  computeConsistency,
  computeGoalLifecycle,
  colorForPercent,
} from "@/lib/stats";
import { computeAllocation } from "@/lib/utils";
import {
  format,
  formatDistanceToNow,
  startOfWeek,
  parseISO,
  isWithinInterval,
} from "date-fns";
import { pl } from "date-fns/locale";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, TrendingDown, Minus, Sparkles } from "lucide-react";

type Tab = "weekly" | "lifecycle" | "consistency" | "trace";

const TABS: Array<[Tab, string]> = [
  ["weekly", "Tygodniowy"],
  ["lifecycle", "Cykl celów"],
  ["consistency", "Konsystencja"],
  ["trace", "Ślad miesięczny"],
];

export default function StatsPage() {
  const hydrated = useHydrated();
  const state = useStore();
  const [tab, setTab] = useState<Tab>("weekly");

  if (!hydrated) return <Spinner />;

  return (
    <>
      <AppShell width="wide">
        <header className="px-2 mb-2">
          <div className="stat-label">Wgląd</div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900 mt-1 leading-tight">
            Statystyki
          </h1>
        </header>

        <nav className="flex flex-wrap gap-2 px-2">
          {TABS.map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`px-4 py-1.5 text-sm rounded-full transition-colors ${
                tab === id
                  ? "bg-neutral-900 text-white font-medium"
                  : "bg-white/60 backdrop-blur text-neutral-700 border border-neutral-200 hover:bg-white"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>

        {tab === "weekly" ? <WeeklyTab state={state} /> : null}
        {tab === "lifecycle" ? <LifecycleTab state={state} /> : null}
        {tab === "consistency" ? <ConsistencyTab state={state} /> : null}
        {tab === "trace" ? <TraceTab state={state} /> : null}
      </AppShell>
      <SideNav />
    </>
  );
}

/* ---------------- shared primitives ---------------- */

function SparkChips({
  values,
  highlightColor,
  width = 6,
  gap = 3,
  height = 36,
}: {
  values: number[];
  highlightColor?: string;
  width?: number;
  gap?: number;
  height?: number;
}) {
  const max = Math.max(100, ...values);
  const lastIdx = values.length - 1;
  return (
    <div className="flex items-end" style={{ height, gap }}>
      {values.map((v, i) => {
        const h = Math.max(18, Math.min(100, (v / max) * 100));
        const isLast = i === lastIdx;
        return (
          <span
            key={i}
            className="block rounded-full"
            style={{
              width,
              height: `${h}%`,
              backgroundColor: isLast
                ? highlightColor ?? "var(--color-accent-coral)"
                : "rgb(229 229 229)",
            }}
            title={`${Math.round(v)}%`}
          />
        );
      })}
    </div>
  );
}

function DeltaPill({ delta, suffix = "%" }: { delta: number; suffix?: string }) {
  const isUp = delta > 0.5;
  const isFlat = !isUp && delta > -0.5;
  const Icon = isUp ? TrendingUp : isFlat ? Minus : TrendingDown;
  return (
    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-neutral-900 text-white text-xs font-medium tabular-nums shrink-0">
      <Icon className="w-3 h-3" />
      {delta > 0 ? "+" : ""}
      {Math.round(delta)}
      {suffix}
    </span>
  );
}

function MetricRow({
  label,
  value,
  unit,
  subtitle,
  dotColor,
  spark,
  delta,
}: {
  label: string;
  value: React.ReactNode;
  unit?: string;
  subtitle?: string;
  dotColor?: string;
  spark: number[];
  delta?: number | null;
}) {
  return (
    <div className="stat-card p-5 sm:p-6">
      <div className="stat-label flex items-center mb-3">
        {dotColor ? (
          <span
            className="inline-block w-1.5 h-1.5 rounded-full mr-1.5"
            style={{ backgroundColor: dotColor }}
          />
        ) : null}
        {label}
      </div>
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div className="flex items-baseline gap-2 min-w-0">
          <span className="text-4xl sm:text-5xl font-bold tracking-tight text-neutral-900 leading-none">
            {value}
          </span>
          {unit ? (
            <span className="text-base text-neutral-500 font-medium">{unit}</span>
          ) : null}
          {subtitle ? (
            <span className="text-xs text-neutral-500 ml-2">{subtitle}</span>
          ) : null}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <SparkChips values={spark} highlightColor={dotColor} />
          {typeof delta === "number" ? <DeltaPill delta={delta} /> : null}
        </div>
      </div>
    </div>
  );
}

/* ---------------- WEEKLY TAB ---------------- */

function WeeklyTab({ state }: { state: ReturnType<typeof useStore.getState> }) {
  const weeks = computeWeeklyOverview(state, 12);
  const allocation = computeAllocation(state.layers);

  // Per-pillar minute totals THIS week (for donut + summary)
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  const slotsMap = new Map(state.calendar.template.slots.map((s) => [s.id, s]));

  const minutesByPillar: Record<string, number> = {};
  const minutesByDay: number[] = Array(7).fill(0);
  const plannedByDay: number[] = Array(7).fill(0);

  for (const slot of state.calendar.template.slots) {
    const idx = (slot.dayOfWeek + 6) % 7; // shift Sun=0 → Mon=0 layout
    plannedByDay[idx] += slot.durationMinutes;
  }

  for (const c of state.slotCompletions) {
    if (!c.completed) continue;
    const d = parseISO(c.date);
    if (!isWithinInterval(d, { start: weekStart, end: weekEnd })) continue;
    const slot = slotsMap.get(c.slotId);
    if (!slot) continue;
    minutesByPillar[slot.pillarId] =
      (minutesByPillar[slot.pillarId] ?? 0) + slot.durationMinutes;
    const jsDay = d.getDay(); // 0 Sun
    const idx = (jsDay + 6) % 7;
    minutesByDay[idx] += slot.durationMinutes;
  }

  const totalDoneH =
    Object.values(minutesByPillar).reduce((a, b) => a + b, 0) / 60;
  const totalPlannedH =
    state.calendar.template.slots.reduce((a, s) => a + s.durationMinutes, 0) / 60;

  // top pillar this week (by % of weekly target)
  const currentPercents = weeks[weeks.length - 1]?.pillarPercents ?? {};
  const topPillar = state.layers.pillars
    .slice()
    .sort((a, b) => (currentPercents[b.id] ?? 0) - (currentPercents[a.id] ?? 0))[0];

  if (state.layers.pillars.length === 0) {
    return (
      <StatCard>
        <p className="text-center text-sm text-neutral-500 py-8">
          Brak filarów do pokazania.
        </p>
      </StatCard>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* LEFT: per-pillar metric rows */}
      <div className="lg:col-span-2 space-y-4">
        {state.layers.pillars.map((p) => {
          const series = weeks.map((w) => w.pillarPercents[p.id] ?? 0);
          const current = series[series.length - 1] ?? 0;
          const previous = series[series.length - 2] ?? 0;
          const delta = current - previous;
          const targetH = allocation.perPillar[p.id]?.hoursPerWeek ?? 0;
          const actualH = (minutesByPillar[p.id] ?? 0) / 60;
          return (
            <MetricRow
              key={p.id}
              label={p.name}
              value={Math.round(current)}
              unit="%"
              subtitle={`${actualH.toFixed(1)}h / ${targetH.toFixed(1)}h`}
              dotColor={p.color}
              spark={series}
              delta={delta}
            />
          );
        })}
      </div>

      {/* RIGHT: donut + dark hero + daily activity */}
      <div className="space-y-4">
        <DonutCard state={state} minutesByPillar={minutesByPillar} totalH={totalDoneH} />
        <TopPillarCard topPillar={topPillar} percent={topPillar ? currentPercents[topPillar.id] ?? 0 : 0} />
        <ActivityCard minutesByDay={minutesByDay} plannedByDay={plannedByDay} doneH={totalDoneH} plannedH={totalPlannedH} />
      </div>
    </div>
  );
}

function DonutCard({
  state,
  minutesByPillar,
  totalH,
}: {
  state: ReturnType<typeof useStore.getState>;
  minutesByPillar: Record<string, number>;
  totalH: number;
}) {
  const data = state.layers.pillars
    .map((p) => ({
      name: p.name,
      color: p.color,
      value: (minutesByPillar[p.id] ?? 0) / 60,
    }))
    .filter((d) => d.value > 0);

  return (
    <StatCard className="p-5 sm:p-6">
      <StatCardHeader label="Udział filarów · ten tydz." />
      <div className="relative h-56">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-neutral-400">
            Brak ukończonych slotów.
          </div>
        ) : (
          <>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={data}
                  innerRadius={60}
                  outerRadius={92}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {data.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 12, border: "1px solid #e5e5e5" }}
                  formatter={(v: number) => `${v.toFixed(1)}h`}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-bold tracking-tight text-neutral-900 leading-none tabular-nums">
                {totalH.toFixed(1)}
              </span>
              <span className="text-xs text-neutral-500 mt-1">godzin</span>
            </div>
          </>
        )}
      </div>
      {data.length > 0 ? (
        <ul className="mt-3 space-y-1.5">
          {data.map((d) => (
            <li key={d.name} className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 min-w-0">
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: d.color }}
                />
                <span className="truncate text-neutral-700">{d.name}</span>
              </span>
              <span className="tabular-nums text-neutral-500 shrink-0">{d.value.toFixed(1)}h</span>
            </li>
          ))}
        </ul>
      ) : null}
    </StatCard>
  );
}

function TopPillarCard({
  topPillar,
  percent,
}: {
  topPillar: { id: string; name: string; color: string } | undefined;
  percent: number;
}) {
  if (!topPillar) return null;
  return (
    <section
      className="rounded-3xl p-5 sm:p-6 text-white relative overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, #1f1d2e 0%, #2a2538 55%, #3a2a3d 100%)",
        boxShadow:
          "0 1px 2px rgba(20, 18, 12, 0.04), 0 8px 24px -14px rgba(20, 18, 12, 0.18)",
      }}
    >
      <div
        className="absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-30 blur-2xl"
        style={{ background: topPillar.color }}
      />
      <div className="relative">
        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] font-medium text-white/60">
          <Sparkles className="w-3 h-3" />
          Lider tygodnia
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-4xl font-bold tracking-tight leading-none">
            {Math.round(percent)}
          </span>
          <span className="text-lg text-white/60 font-medium">%</span>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: topPillar.color }}
          />
          <span className="text-sm font-medium">{topPillar.name}</span>
        </div>
        <p className="text-xs text-white/60 mt-3 leading-relaxed">
          Najbliżej tygodniowej normy. Trzymaj tempo.
        </p>
      </div>
    </section>
  );
}

function ActivityCard({
  minutesByDay,
  plannedByDay,
  doneH,
  plannedH,
}: {
  minutesByDay: number[];
  plannedByDay: number[];
  doneH: number;
  plannedH: number;
}) {
  const labels = ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Ndz"];
  const data = labels.map((l, i) => ({
    day: l,
    planowane: +(plannedByDay[i] / 60).toFixed(1),
    zrobione: +(minutesByDay[i] / 60).toFixed(1),
  }));
  const ratio = plannedH > 0 ? Math.round((doneH / plannedH) * 100) : 0;
  return (
    <StatCard className="p-5 sm:p-6">
      <StatCardHeader
        label="Aktywność · ten tydz."
        right={<DeltaPill delta={ratio - 100} />}
      />
      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-3xl font-bold tracking-tight text-neutral-900 leading-none tabular-nums">
          {doneH.toFixed(1)}
        </span>
        <span className="text-xs text-neutral-500">
          z {plannedH.toFixed(1)}h
        </span>
      </div>
      <div className="h-32">
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 4, right: 0, left: -28, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#f1f1f0" />
            <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#a3a3a3" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#a3a3a3" }} axisLine={false} tickLine={false} width={28} />
            <Tooltip
              contentStyle={{ fontSize: 11, borderRadius: 10, border: "1px solid #e5e5e5" }}
              formatter={(v: number) => `${v}h`}
              cursor={{ fill: "rgba(0,0,0,0.03)" }}
            />
            <Bar dataKey="planowane" fill="#fdba74" radius={[4, 4, 0, 0]} maxBarSize={14} />
            <Bar dataKey="zrobione" fill="#1f1d2e" radius={[4, 4, 0, 0]} maxBarSize={14} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center gap-4 mt-2 text-[10px] text-neutral-500">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm bg-[#fdba74]" />
          planowane
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm bg-[#1f1d2e]" />
          zrobione
        </span>
      </div>
    </StatCard>
  );
}

/* ---------------- LIFECYCLE TAB ---------------- */

function LifecycleTab({ state }: { state: ReturnType<typeof useStore.getState> }) {
  const lifecycle = computeGoalLifecycle(state);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const filtered =
    statusFilter === "all" ? lifecycle : lifecycle.filter((g) => g.status === statusFilter);

  if (lifecycle.length === 0) {
    return (
      <StatCard>
        <p className="text-center text-sm text-neutral-500 py-8">
          Brak celów. Dodaj pierwszy cel w detalu filaru.
        </p>
      </StatCard>
    );
  }

  const counts = {
    all: lifecycle.length,
    Active: lifecycle.filter((g) => g.status === "Active").length,
    Done: lifecycle.filter((g) => g.status === "Done").length,
    Paused: lifecycle.filter((g) => g.status === "Paused").length,
    Abandoned: lifecycle.filter((g) => g.status === "Abandoned").length,
  };
  const avgProgress =
    lifecycle.reduce((a, g) => a + g.progress, 0) / Math.max(1, lifecycle.length);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2 space-y-4">
        <StatCard>
          <StatCardHeader
            label={`Cele · ${filtered.length}`}
            right={
              <div className="flex flex-wrap gap-1.5">
                {(["all", "Active", "Done", "Paused", "Abandoned"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] rounded-full transition-colors ${
                      statusFilter === s
                        ? "bg-neutral-900 text-white"
                        : "bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                    }`}
                  >
                    {s === "all" ? "Wszystkie" : s} · {counts[s]}
                  </button>
                ))}
              </div>
            }
          />
          <ul className="divide-y divide-neutral-100">
            {filtered.map((g) => (
              <li key={g.goalId} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <span
                  className="w-2 h-10 rounded-full shrink-0"
                  style={{ backgroundColor: g.pillarColor }}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate text-neutral-900">{g.title}</div>
                  <div className="text-xs text-neutral-500 mt-0.5">
                    {g.character} ·{" "}
                    <span
                      className={
                        g.status === "Done"
                          ? "text-emerald-600"
                          : g.status === "Active"
                          ? "text-neutral-900 font-medium"
                          : g.status === "Abandoned"
                          ? "text-red-600"
                          : "text-amber-600"
                      }
                    >
                      {g.status}
                    </span>{" "}
                    · od{" "}
                    {formatDistanceToNow(new Date(g.startedAt), {
                      addSuffix: false,
                      locale: pl,
                    })}
                  </div>
                </div>
                <div className="w-32 shrink-0">
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
        </StatCard>
      </div>

      <div className="space-y-4">
        <div className="stat-card p-5 sm:p-6">
          <div className="stat-label mb-3">Średni postęp</div>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-bold tracking-tight text-neutral-900 leading-none">
              {Math.round(avgProgress)}
            </span>
            <span className="text-lg text-neutral-500 font-medium">%</span>
          </div>
          <p className="text-xs text-neutral-500 mt-2">
            Przeciętna realizacja wszystkich celów
          </p>
        </div>

        <div className="stat-card p-5 sm:p-6">
          <div className="stat-label mb-3">Rozkład statusu</div>
          <ul className="space-y-2.5">
            {[
              ["Aktywne", counts.Active, "#171717"],
              ["Ukończone", counts.Done, "#10b981"],
              ["Wstrzymane", counts.Paused, "#f59e0b"],
              ["Porzucone", counts.Abandoned, "#ef4444"],
            ].map(([label, n, color]) => {
              const pct = lifecycle.length > 0 ? (Number(n) / lifecycle.length) * 100 : 0;
              return (
                <li key={String(label)}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-neutral-700">{label}</span>
                    <span className="tabular-nums text-neutral-500">{n}</span>
                  </div>
                  <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, backgroundColor: String(color) }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ---------------- CONSISTENCY TAB ---------------- */

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
      <StatCard>
        <p className="text-center text-sm text-neutral-500 py-8">Brak filarów do pokazania.</p>
      </StatCard>
    );
  }

  // per-pillar mini metrics
  const pillarSummaries = state.layers.pillars.map((p) => {
    const series = data.pillarSeries[p.id] ?? [];
    const last = series[series.length - 1] ?? 0;
    const prev = series[series.length - 2] ?? 0;
    const avg = series.length > 0 ? series.reduce((a, b) => a + b, 0) / series.length : 0;
    return { p, last, delta: last - prev, avg, series };
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2">
        <StatCard className="p-5 sm:p-6">
          <StatCardHeader label="Konsystencja · h/tydz · ostatnie 12 mies." />
          <div className="h-80">
            <ResponsiveContainer>
              <LineChart data={chartData} margin={{ top: 10, right: 12, left: -10, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#f1f1f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#a3a3a3" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#a3a3a3" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 12, border: "1px solid #e5e5e5" }}
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
        </StatCard>
      </div>

      <div className="space-y-4">
        {pillarSummaries.map(({ p, last, delta, avg, series }) => (
          <div key={p.id} className="stat-card p-4 sm:p-5">
            <div className="stat-label flex items-center mb-2">
              <span
                className="inline-block w-1.5 h-1.5 rounded-full mr-1.5"
                style={{ backgroundColor: p.color }}
              />
              {p.name}
            </div>
            <div className="flex items-end justify-between gap-3">
              <div className="flex items-baseline gap-1.5 min-w-0">
                <span className="text-2xl font-bold tracking-tight text-neutral-900 leading-none tabular-nums">
                  {last.toFixed(1)}
                </span>
                <span className="text-[11px] text-neutral-500">h/tydz</span>
              </div>
              <DeltaPill delta={delta} suffix="h" />
            </div>
            <div className="mt-3">
              <SparkChips values={series} highlightColor={p.color} height={24} />
            </div>
            <div className="text-[10px] text-neutral-400 mt-1.5 tabular-nums">
              śr. {avg.toFixed(1)}h/tydz
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- TRACE TAB ---------------- */

function TraceTab({ state }: { state: ReturnType<typeof useStore.getState> }) {
  const months = computeMonthlyTrace(state, 12);

  if (state.layers.pillars.length === 0) {
    return (
      <StatCard>
        <p className="text-center text-sm text-neutral-500 py-8">Brak filarów do pokazania.</p>
      </StatCard>
    );
  }

  // Per-pillar current month + 12-mo sparkline
  const currentMonth = months[months.length - 1];
  const previousMonth = months[months.length - 2];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {state.layers.pillars.map((p) => {
          const series = months.map((m) => m.pillarPercents[p.id] ?? 0);
          const last = currentMonth?.pillarPercents[p.id] ?? 0;
          const prev = previousMonth?.pillarPercents[p.id] ?? 0;
          const delta = last - prev;
          return (
            <MetricRow
              key={p.id}
              label={p.name}
              value={Math.round(last)}
              unit="%"
              dotColor={p.color}
              spark={series}
              delta={delta}
            />
          );
        })}
      </div>

      <StatCard className="p-5 sm:p-6">
        <StatCardHeader label="Mapa cieplna · 12 mies. × filary" />
        <p className="text-xs text-neutral-500 mb-4">
          Procent realizacji normy. Hover dla szczegółów.
        </p>
        <div className="overflow-x-auto">
          <table className="text-xs w-full">
            <thead>
              <tr>
                <th className="text-left pr-3 pb-2 text-neutral-400 font-normal sticky left-0 bg-white">
                  Miesiąc
                </th>
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
                  <td className="text-neutral-500 pr-3 py-1 whitespace-nowrap sticky left-0 bg-white">
                    {format(m.month, "LLL yyyy", { locale: pl })}
                  </td>
                  {state.layers.pillars.map((p) => {
                    const pct = m.pillarPercents[p.id] ?? 0;
                    const color = colorForPercent(pct);
                    return (
                      <td key={p.id} className="px-1 py-1">
                        <div
                          className="h-6 w-full rounded-md flex items-center justify-center text-[10px] tabular-nums text-white font-medium"
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
      </StatCard>
    </div>
  );
}
