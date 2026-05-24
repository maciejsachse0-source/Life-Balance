"use client";

import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/hydration";
import { Spinner } from "@/components/Spinner";
import { LayersEditor } from "@/components/LayersEditor";
import { AppShell, Button } from "@/components/ui";
import { computeAllocation } from "@/lib/utils";

export default function CalculatorPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const layers = useStore((s) => s.layers);
  const regenerateTemplate = useStore((s) => s.regenerateTemplate);
  const completeOnboarding = useStore((s) => s.completeOnboarding);

  if (!hydrated) return <Spinner />;

  const allocation = computeAllocation(layers);

  const handleConfirm = () => {
    regenerateTemplate();
    completeOnboarding();
    router.push("/dashboard");
  };

  const disabled = layers.pillars.length === 0 || allocation.pulaFilarowH < 0;

  return (
    <>
      <AppShell width="wide">
        <header className="px-2 mb-2">
          <div className="stat-label">Krok 2 / 2</div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900 mt-1 leading-tight">
            Kalkulator brutto/netto
          </h1>
          <p className="text-sm sm:text-base text-neutral-700 mt-2 max-w-2xl">
            Tydzień ma 168h. Odejmij fizjologię i podatki życiowe — to co zostanie, dzielisz między
            filary wagami.
          </p>
        </header>

        <LayersEditor />
      </AppShell>

      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-white/60 px-4 py-3 z-20">
        <div className="max-w-screen-2xl mx-auto flex items-center justify-between gap-3 pl-20 sm:pl-24">
          <button
            onClick={() => router.push("/onboarding")}
            className="text-sm text-neutral-500 hover:text-neutral-900"
          >
            ← Inny szablon
          </button>
          <Button onClick={handleConfirm} disabled={disabled} className="disabled:opacity-40 disabled:cursor-not-allowed">
            Zatwierdź i przejdź do dashboardu →
          </Button>
        </div>
      </div>
    </>
  );
}
