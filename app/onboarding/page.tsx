"use client";

import { useRouter } from "next/navigation";
import { useStore, TEMPLATES_LIST } from "@/lib/store";
import { useHydrated } from "@/lib/hydration";
import { Spinner } from "@/components/Spinner";
import { PillarIcon } from "@/components/PillarIcon";
import { BottomNav } from "@/components/BottomNav";
import { LayersEditor } from "@/components/LayersEditor";

export default function OnboardingPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const applyTemplate = useStore((s) => s.applyTemplate);
  const regenerateTemplate = useStore((s) => s.regenerateTemplate);
  const selectedTemplate = useStore((s) => s.settings.selectedTemplate);
  const onboardingCompleted = useStore((s) => s.settings.onboardingCompleted);

  if (!hydrated) return <Spinner />;

  const choose = (templateId: string, requireConfirm: boolean) => {
    if (
      requireConfirm &&
      !confirm(
        "Zmiana szablonu nadpisze filary, warstwy i szablon tygodnia. Cele i myśli zostaną. Kontynuować?",
      )
    ) {
      return;
    }
    applyTemplate(templateId);
    if (!onboardingCompleted) {
      router.push("/calculator");
    }
  };

  const current = selectedTemplate
    ? TEMPLATES_LIST.find((t) => t.id === selectedTemplate)
    : undefined;
  const others = current ? TEMPLATES_LIST.filter((t) => t.id !== current.id) : TEMPLATES_LIST;

  if (!current) {
    return (
      <main className="min-h-screen px-6 py-12 max-w-6xl mx-auto">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-neutral-900 mb-3">Życie w równowadze</h1>
          <p className="text-neutral-600 text-lg max-w-2xl mx-auto">
            Wybierz punkt startu — szablon dopasujesz później. Każdy wybór można zmienić w
            ustawieniach, nic nie jest na stałe.
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {TEMPLATES_LIST.map((t) => (
            <TemplateCard key={t.id} t={t} onClick={() => choose(t.id, false)} />
          ))}
        </div>

        <p className="text-center text-xs text-neutral-400 mt-10">
          Apka działa lokalnie — Twoje dane nie wychodzą poza tę przeglądarkę.
        </p>
      </main>
    );
  }

  return (
    <main className="pb-24">
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-baseline justify-between gap-3">
          <h1 className="text-lg font-semibold">Szablon</h1>
          <div className="text-xs text-neutral-500 truncate">
            Aktualny: <span className="font-medium text-indigo-600">{current.name}</span>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-8">
        <section>
          <div className="flex items-baseline justify-between mb-3 gap-3">
            <div>
              <div className="text-xs uppercase tracking-wide text-neutral-500">
                Edycja aktualnego szablonu
              </div>
              <h2 className="text-2xl font-bold text-indigo-700">{current.name}</h2>
              <p className="text-sm text-neutral-600">{current.description}</p>
            </div>
            <button
              onClick={() => {
                regenerateTemplate();
                router.push("/dashboard");
              }}
              className="shrink-0 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
            >
              Zregeneruj tydzień →
            </button>
          </div>
          <LayersEditor />
          <p className="text-xs text-neutral-500 mt-3">
            Zmiany zapisują się automatycznie. „Zregeneruj tydzień" nadpisze szablon kalendarza
            wynikiem.
          </p>
        </section>

        <section>
          <div className="text-xs uppercase tracking-wide text-neutral-500 mb-2">
            Zmień szablon
          </div>
          <p className="text-sm text-neutral-500 mb-4">
            Wybór nadpisze filary, warstwy i szablon tygodnia. Cele i myśli zostaną.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {others.map((t) => (
              <TemplateCard key={t.id} t={t} onClick={() => choose(t.id, true)} />
            ))}
          </div>
        </section>
      </div>

      <BottomNav />
    </main>
  );
}

function TemplateCard({
  t,
  onClick,
}: {
  t: (typeof TEMPLATES_LIST)[number];
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="text-left bg-white border border-neutral-200 rounded-xl p-5 hover:border-neutral-400 hover:shadow-md transition-all group"
    >
      <h2 className="font-semibold text-lg mb-2 group-hover:text-indigo-600">{t.name}</h2>
      <p className="text-sm text-neutral-600 mb-4 min-h-[3em]">{t.description}</p>
      <div className="flex flex-wrap gap-1.5">
        {t.layers.pillars.length === 0 ? (
          <span className="text-xs text-neutral-400 italic">Bez filarów na start</span>
        ) : (
          t.layers.pillars.map((p, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full"
              style={{ backgroundColor: `${p.color}22`, color: p.color }}
            >
              <PillarIcon name={p.icon} size={12} />
              {p.name}
            </span>
          ))
        )}
      </div>
      <div className="mt-3 text-xs text-neutral-400">
        {t.layers.pillars.length} {t.layers.pillars.length === 1 ? "filar" : "filary"} · suma wag{" "}
        {t.layers.pillars.reduce((s, p) => s + p.weight, 0).toFixed(1)}
      </div>
    </button>
  );
}
