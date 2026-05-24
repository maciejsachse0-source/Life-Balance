"use client";

import { useRouter } from "next/navigation";
import { useStore, TEMPLATES_LIST } from "@/lib/store";
import { useHydrated } from "@/lib/hydration";
import { Spinner } from "@/components/Spinner";
import { PillarIcon } from "@/components/PillarIcon";
import { SideNav } from "@/components/SideNav";
import { LayersEditor } from "@/components/LayersEditor";
import {
  AppShell,
  StatCard,
  StatCardHeader,
  Button,
} from "@/components/ui";

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
      <AppShell width="wide">
        <header className="px-2 mb-2 text-center">
          <div className="stat-label">Witaj</div>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-neutral-900 mt-2 leading-tight">
            Życie w równowadze
          </h1>
          <p className="text-sm sm:text-base text-neutral-700 mt-3 max-w-2xl mx-auto">
            Wybierz punkt startu — szablon dopasujesz później. Każdy wybór można zmienić w
            ustawieniach, nic nie jest na stałe.
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TEMPLATES_LIST.map((t) => (
            <TemplateCard key={t.id} t={t} onClick={() => choose(t.id, false)} />
          ))}
        </div>

        <p className="text-center text-xs text-neutral-500 mt-6">
          Apka działa lokalnie — Twoje dane nie wychodzą poza tę przeglądarkę.
        </p>
      </AppShell>
    );
  }

  return (
    <>
      <AppShell width="wide">
        <header className="px-2 mb-2 flex items-end justify-between gap-4">
          <div className="min-w-0">
            <div className="stat-label">Szablon</div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900 mt-1 leading-tight truncate">
              {current.name}
            </h1>
            <p className="text-sm text-neutral-700 mt-1">{current.description}</p>
          </div>
          <Button
            onClick={() => {
              regenerateTemplate();
              router.push("/dashboard");
            }}
            className="shrink-0"
          >
            Zregeneruj tydzień →
          </Button>
        </header>

        <LayersEditor />
        <p className="text-xs text-neutral-600 px-2">
          Zmiany zapisują się automatycznie. „Zregeneruj tydzień" nadpisze szablon kalendarza
          wynikiem.
        </p>

        <StatCard>
          <StatCardHeader label="Zmień szablon" />
          <p className="text-sm text-neutral-600 mb-4">
            Wybór nadpisze filary, warstwy i szablon tygodnia. Cele i myśli zostaną.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {others.map((t) => (
              <TemplateCard key={t.id} t={t} onClick={() => choose(t.id, true)} embedded />
            ))}
          </div>
        </StatCard>
      </AppShell>
      <SideNav />
    </>
  );
}

function TemplateCard({
  t,
  onClick,
  embedded,
}: {
  t: (typeof TEMPLATES_LIST)[number];
  onClick: () => void;
  embedded?: boolean;
}) {
  const physH = t.layers.physiology.reduce((s, c) => s + c.hoursPerWeek, 0);
  const taxH = t.layers.lifeTaxes.reduce((s, c) => s + c.hoursPerWeek, 0);
  const pulaH = Math.max(0, 168 - physH - taxH);
  return (
    <button
      onClick={onClick}
      className={
        embedded
          ? "text-left bg-white/60 backdrop-blur-sm border border-neutral-200 rounded-2xl p-5 hover:bg-white hover:border-neutral-300 transition-all group"
          : "text-left stat-card p-5 hover:shadow-[0_20px_50px_-12px_rgba(50,40,80,0.25)] hover:-translate-y-0.5 transition-all group"
      }
    >
      <div className="stat-label">Szablon</div>
      <h2 className="text-xl font-bold text-neutral-900 tracking-tight mt-1">{t.name}</h2>
      <p className="text-sm font-medium text-neutral-700 mt-1">{t.tagline}</p>
      <p className="text-sm text-neutral-600 mt-2 min-h-[3em]">{t.description}</p>
      <div className="flex flex-wrap gap-1.5 mt-3">
        {t.layers.pillars.length === 0 ? (
          <span className="text-xs text-neutral-500 italic">Bez filarów na start</span>
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
      <div className="mt-4 pt-3 border-t border-neutral-200/70 flex items-center justify-between gap-2">
        <span className="stat-label">
          {t.layers.pillars.length} {t.layers.pillars.length === 1 ? "filar" : "filary"}
        </span>
        <span className="text-sm font-semibold tabular-nums text-neutral-900">
          ≈ {pulaH}h <span className="text-xs text-neutral-500 font-normal">/ tydz</span>
        </span>
      </div>
    </button>
  );
}
