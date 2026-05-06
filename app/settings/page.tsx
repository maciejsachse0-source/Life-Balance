"use client";

import Link from "next/link";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/hydration";
import { Spinner } from "@/components/Spinner";
import { BottomNav } from "@/components/BottomNav";
import { useRouter } from "next/navigation";
import { seedDemoData } from "@/lib/seed";
import { Sparkles } from "lucide-react";

export default function SettingsPage() {
  const hydrated = useHydrated();
  const router = useRouter();
  const settings = useStore((s) => s.settings);
  const balanceMode = settings.balanceMode;
  const setBalanceMode = useStore((s) => s.setBalanceMode);
  const resetAll = useStore((s) => s.resetAll);
  const [seedResult, setSeedResult] = useState<{
    goalsAdded: number;
    completionsAdded: number;
    thoughtsAdded: number;
  } | null>(null);

  if (!hydrated) return <Spinner />;

  return (
    <main className="pb-24">
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <h1 className="text-lg font-semibold">Ustawienia</h1>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        <section className="bg-white border border-indigo-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={16} className="text-indigo-600" />
            <h2 className="font-semibold">Demo — pełny potencjał apki</h2>
          </div>
          <p className="text-sm text-neutral-500 mb-3">
            Wczyta przykładowe cele (projekty, rutyny, mieszane) dopasowane do Twoich filarów,
            historię rutyn z ostatnich 12 tygodni, kompletacje slotów z ostatnich 4 tygodni i
            kilka myśli — żeby zobaczyć jak wszystkie widoki wyglądają wypełnione.
          </p>
          <button
            onClick={() => {
              if (
                !confirm(
                  "Wczytać przykładowe dane? Cele i myśli zostaną dodane do istniejących (nic nie nadpisze).",
                )
              )
                return;
              const result = seedDemoData();
              setSeedResult(result);
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 inline-flex items-center gap-1.5"
          >
            <Sparkles size={14} /> Wczytaj demo
          </button>
          {seedResult ? (
            <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-800">
              Dodano <b>{seedResult.goalsAdded}</b> celów,{" "}
              <b>{seedResult.completionsAdded}</b> kompletacji slotów,{" "}
              <b>{seedResult.thoughtsAdded}</b> myśli. Sprawdź:{" "}
              <Link href="/dashboard" className="underline">
                Dashboard
              </Link>{" "}
              ·{" "}
              <Link href="/stats" className="underline">
                Statystyki
              </Link>{" "}
              ·{" "}
              <Link href="/calendar/day" className="underline">
                Kalendarz dziś
              </Link>
              .
            </div>
          ) : null}
        </section>

        <section className="bg-white border border-neutral-200 rounded-xl p-5">
          <h2 className="font-semibold mb-3">Warstwy i filary</h2>
          <p className="text-sm text-neutral-500 mb-3">
            Edytuj fizjologię, podatki życiowe i filary w kalkulatorze.
          </p>
          <Link
            href="/calculator"
            className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm"
          >
            Otwórz kalkulator
          </Link>
        </section>

        <section className="bg-white border border-neutral-200 rounded-xl p-5">
          <h2 className="font-semibold mb-3">Tryb bilansu</h2>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setBalanceMode("calendar_month")}
              className={`px-3 py-2 rounded-lg border text-sm ${
                balanceMode === "calendar_month"
                  ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                  : "border-neutral-200 hover:border-neutral-300"
              }`}
            >
              Miesiąc kalendarzowy
            </button>
            <button
              onClick={() => setBalanceMode("rolling_30")}
              className={`px-3 py-2 rounded-lg border text-sm ${
                balanceMode === "rolling_30"
                  ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                  : "border-neutral-200 hover:border-neutral-300"
              }`}
            >
              Kroczący 30 dni
            </button>
          </div>
        </section>

        <section className="bg-white border border-neutral-200 rounded-xl p-5">
          <h2 className="font-semibold mb-1">Szablon</h2>
          <p className="text-sm text-neutral-500 mb-3">
            Aktualny: {settings.selectedTemplate ?? "własny"}
          </p>
          <Link
            href="/onboarding"
            className="inline-block px-4 py-2 border border-neutral-200 rounded-lg text-sm hover:border-neutral-400"
          >
            Wybierz inny szablon
          </Link>
        </section>

        <section className="bg-white border border-red-200 rounded-xl p-5">
          <h2 className="font-semibold mb-1 text-red-700">Reset apki</h2>
          <p className="text-sm text-neutral-500 mb-3">
            Skasuje wszystkie dane i wróci do onboardingu.
          </p>
          <button
            onClick={() => {
              if (!confirm("Skasować wszystko i wrócić do onboardingu?")) return;
              resetAll();
              router.push("/onboarding");
            }}
            className="px-4 py-2 border border-red-300 text-red-700 rounded-lg text-sm hover:bg-red-50"
          >
            Reset
          </button>
        </section>
      </div>

      <BottomNav />
    </main>
  );
}
