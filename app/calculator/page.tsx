"use client";

import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/hydration";
import { Spinner } from "@/components/Spinner";
import { LayersEditor } from "@/components/LayersEditor";
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

  return (
    <main className="min-h-screen px-4 sm:px-6 py-8 max-w-5xl mx-auto pb-32">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-1">Kalkulator brutto/netto</h1>
        <p className="text-neutral-600">
          Tydzień ma 168h. Odejmij fizjologię i podatki życiowe — to co zostanie, dzielisz między
          filary wagami.
        </p>
      </header>

      <LayersEditor />

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 px-4 py-3 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <button
            onClick={() => router.push("/onboarding")}
            className="text-sm text-neutral-500 hover:text-neutral-800"
          >
            ← Inny szablon
          </button>
          <button
            onClick={handleConfirm}
            disabled={layers.pillars.length === 0 || allocation.pulaFilarowH < 0}
            className="px-5 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:bg-neutral-300 disabled:cursor-not-allowed"
          >
            Zatwierdź i przejdź do dashboardu →
          </button>
        </div>
      </div>
    </main>
  );
}
