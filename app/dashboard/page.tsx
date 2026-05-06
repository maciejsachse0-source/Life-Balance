"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/hydration";
import { Spinner } from "@/components/Spinner";
import { PillarTile } from "@/components/PillarTile";
import { BalanceBar } from "@/components/BalanceBar";
import { ThoughtsQuickAdd } from "@/components/ThoughtsQuickAdd";
import { BottomNav } from "@/components/BottomNav";
import { computePillarBalances, computePillarBalancesWeekly } from "@/lib/balance";
import { computeAllocation } from "@/lib/utils";
import { addDays, format, startOfWeek } from "date-fns";
import { pl } from "date-fns/locale";
import { ArrowRight } from "lucide-react";

export default function DashboardPage() {
  const hydrated = useHydrated();
  const state = useStore();
  if (!hydrated) return <Spinner />;

  if (!state.settings.onboardingCompleted) {
    if (typeof window !== "undefined") window.location.href = "/onboarding";
    return <Spinner />;
  }

  const today = new Date();
  const allocation = computeAllocation(state.layers);
  const balances = computePillarBalances(state, today);
  const weeklyBalances = computePillarBalancesWeekly(state, today);
  const balanceMap = new Map(balances.map((b) => [b.pillarId, b]));
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = addDays(weekStart, 6);

  const goalsPerPillar = (pillarId: string) =>
    state.goals.filter((g) => g.pillarId === pillarId && g.status === "Active").length;

  const recentThoughts = state.thoughts.slice(0, 3);

  return (
    <main className="min-h-screen pb-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <header className="flex items-baseline justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Życie w równowadze</h1>
            <p className="text-sm text-neutral-500">
              {format(today, "EEEE, d MMMM yyyy", { locale: pl })}
            </p>
          </div>
          <Link
            href="/calendar/day"
            className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
          >
            Dziś <ArrowRight size={14} />
          </Link>
        </header>

        {/* Pillar tiles */}
        <section className="mb-8">
          <h2 className="text-sm font-medium text-neutral-500 uppercase tracking-wide mb-3">Filary</h2>
          {state.layers.pillars.length === 0 ? (
            <div className="bg-white border border-dashed border-neutral-300 rounded-xl p-6 text-center">
              <p className="text-neutral-500 mb-3">Brak filarów. Dodaj pierwszy w kalkulatorze.</p>
              <Link
                href="/calculator"
                className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm"
              >
                Otwórz kalkulator
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {state.layers.pillars.map((p) => (
                <PillarTile
                  key={p.id}
                  pillar={p}
                  hoursPerWeek={allocation.perPillar[p.id]?.hoursPerWeek ?? 0}
                  activeGoals={goalsPerPillar(p.id)}
                  href={`/pillar/${p.id}`}
                />
              ))}
            </div>
          )}
        </section>

        {/* Weekly balance */}
        {state.layers.pillars.length > 0 ? (
          <section className="mb-8 bg-white border border-neutral-200 rounded-xl p-5">
            <header className="flex items-baseline justify-between mb-4">
              <h2 className="text-sm font-medium text-neutral-500 uppercase tracking-wide">
                Bilans tygodnia
              </h2>
              <span className="text-xs text-neutral-400">
                {format(weekStart, "d MMM", { locale: pl })} –{" "}
                {format(weekEnd, "d MMM", { locale: pl })}
              </span>
            </header>
            <div className="space-y-3">
              {weeklyBalances.map((b) => {
                const pillar = state.layers.pillars.find((p) => p.id === b.pillarId);
                if (!pillar) return null;
                return (
                  <BalanceBar key={b.pillarId} pillar={pillar} balance={b} period="week" />
                );
              })}
            </div>
          </section>
        ) : null}

        {/* Monthly balance */}
        {state.layers.pillars.length > 0 ? (
          <section className="mb-8 bg-white border border-neutral-200 rounded-xl p-5">
            <header className="flex items-baseline justify-between mb-4">
              <h2 className="text-sm font-medium text-neutral-500 uppercase tracking-wide">
                Bilans {format(today, "LLLL yyyy", { locale: pl })}
              </h2>
            </header>
            <div className="space-y-3">
              {balances.map((b) => {
                const pillar = state.layers.pillars.find((p) => p.id === b.pillarId);
                if (!pillar) return null;
                return <BalanceBar key={b.pillarId} pillar={pillar} balance={b} />;
              })}
            </div>
          </section>
        ) : null}

        {/* Thoughts */}
        <section className="mb-8 bg-white border border-neutral-200 rounded-xl p-5">
          <header className="flex items-baseline justify-between mb-3">
            <h2 className="text-sm font-medium text-neutral-500 uppercase tracking-wide">
              Przemyślenia
            </h2>
            <Link href="/thoughts" className="text-xs text-indigo-600 hover:text-indigo-700">
              Wszystkie →
            </Link>
          </header>
          <ThoughtsQuickAdd />
          {recentThoughts.length > 0 ? (
            <ul className="mt-4 space-y-2">
              {recentThoughts.map((t) => {
                const pillar = t.pillarId
                  ? state.layers.pillars.find((p) => p.id === t.pillarId)
                  : null;
                return (
                  <li key={t.id} className="flex items-start gap-3 text-sm text-neutral-700">
                    {pillar ? (
                      <span
                        className="mt-1 w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: pillar.color }}
                      />
                    ) : (
                      <span className="mt-1 w-2 h-2 rounded-full shrink-0 bg-neutral-300" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="line-clamp-2">{t.text}</p>
                      <span className="text-xs text-neutral-400">
                        {format(new Date(t.createdAt), "d MMM, HH:mm", { locale: pl })}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </section>
      </div>

      <BottomNav />
    </main>
  );
}
