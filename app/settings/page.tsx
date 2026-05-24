"use client";

import Link from "next/link";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/hydration";
import { Spinner } from "@/components/Spinner";
import { SideNav } from "@/components/SideNav";
import {
  AppShell,
  StatCard,
  StatCardHeader,
  Button,
  LinkButton,
  SplitGrid,
} from "@/components/ui";
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
    <>
      <AppShell>
        <header className="px-2 mb-2">
          <div className="stat-label">Konfiguracja</div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900 mt-1 leading-tight">
            Ustawienia
          </h1>
        </header>

        <StatCard>
          <StatCardHeader label="Demo · pełny potencjał apki" />
          <p className="text-sm text-neutral-700 mb-4">
            Wczyta przykładowe cele (projekty, rutyny, mieszane) dopasowane do Twoich filarów,
            historię rutyn z ostatnich 12 tygodni, kompletacje slotów z ostatnich 4 tygodni i
            kilka myśli — żeby zobaczyć jak wszystkie widoki wyglądają wypełnione.
          </p>
          <Button
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
          >
            <Sparkles size={14} /> Wczytaj demo
          </Button>
          {seedResult ? (
            <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-800">
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
        </StatCard>

        <SplitGrid cols={2}>
          <StatCard>
            <StatCardHeader label="Warstwy i filary" />
            <p className="text-sm text-neutral-700 mb-4">
              Edytuj fizjologię, podatki życiowe i filary w kalkulatorze.
            </p>
            <LinkButton href="/calculator">Otwórz kalkulator</LinkButton>
          </StatCard>

          <StatCard>
            <StatCardHeader label="Tryb bilansu" />
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setBalanceMode("calendar_month")}
                className={`px-3 py-2 rounded-xl border text-sm transition-colors ${
                  balanceMode === "calendar_month"
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-200 bg-white/60 hover:border-neutral-400"
                }`}
              >
                Miesiąc kalendarzowy
              </button>
              <button
                onClick={() => setBalanceMode("rolling_30")}
                className={`px-3 py-2 rounded-xl border text-sm transition-colors ${
                  balanceMode === "rolling_30"
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-200 bg-white/60 hover:border-neutral-400"
                }`}
              >
                Kroczący 30 dni
              </button>
            </div>
          </StatCard>

          <StatCard>
            <StatCardHeader
              label="Szablon"
              right={`aktualny: ${settings.selectedTemplate ?? "własny"}`}
            />
            <LinkButton href="/onboarding" variant="secondary">
              Wybierz inny szablon
            </LinkButton>
          </StatCard>

          <StatCard className="border-red-200/60">
            <StatCardHeader label="Reset apki" />
            <p className="text-sm text-neutral-700 mb-4">
              Skasuje wszystkie dane i wróci do onboardingu.
            </p>
            <button
              onClick={() => {
                if (!confirm("Skasować wszystko i wrócić do onboardingu?")) return;
                resetAll();
                router.push("/onboarding");
              }}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full border border-red-300 text-red-700 text-sm font-medium hover:bg-red-50 transition-colors"
            >
              Reset
            </button>
          </StatCard>
        </SplitGrid>
      </AppShell>
      <SideNav />
    </>
  );
}
