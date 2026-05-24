"use client";

import { MindMap } from "@/components/MindMap";
import { SideNav } from "@/components/SideNav";
import { AppShell, StatCard, StatCardHeader } from "@/components/ui";
import { useHydrated } from "@/lib/hydration";
import { Spinner } from "@/components/Spinner";

export default function MindMapPage() {
  const hydrated = useHydrated();
  if (!hydrated) return <Spinner />;

  return (
    <>
      <AppShell width="full">
        <header className="px-2 mb-2">
          <div className="stat-label">Mapa myśli</div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900 mt-1 leading-tight">
            Filary i cele jednym spojrzeniem
          </h1>
          <p className="text-sm text-neutral-600 mt-1 max-w-2xl">
            Rozmiar węzła i grubość linii pokazują wagę. Filary układają się wokół
            środka proporcjonalnie do tego, ile czasu im oddajesz. Cele rozgałęziają
            się od swoich filarów — rutyny mają przerywane obwódki.
          </p>
        </header>

        <StatCard className="p-3 sm:p-4">
          <MindMap />
        </StatCard>
      </AppShell>
      <SideNav />
    </>
  );
}
