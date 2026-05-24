"use client";

import { useStore } from "@/lib/store";
import { Slider } from "@/components/Slider";
import { InlineInput } from "@/components/InlineInput";
import { PillarIcon } from "@/components/PillarIcon";
import { computeAllocation } from "@/lib/utils";
import {
  Plus,
  Trash2,
  AlertTriangle,
  Moon,
  Utensils,
  Droplets,
  Sparkles,
  Route,
  Hourglass,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type TileStyle = { fg: string; bg: string; Icon: LucideIcon; max: number };

const PHYS_STYLE: Record<string, TileStyle> = {
  "phys-sleep":   { fg: "#6366f1", bg: "#eef2ff", Icon: Moon,     max: 84 },
  "phys-food":    { fg: "#d97706", bg: "#fef3c7", Icon: Utensils, max: 30 },
  "phys-hygiene": { fg: "#0891b2", bg: "#ecfeff", Icon: Droplets, max: 20 },
};
const PHYS_DEFAULT: TileStyle = { fg: "#64748b", bg: "#f1f5f9", Icon: Sparkles, max: 40 };

const TAX_STYLE: Record<string, TileStyle> = {
  "tax-logistics": { fg: "#8b5cf6", bg: "#f5f3ff", Icon: Route,     max: 40 },
  "tax-buffer":    { fg: "#10b981", bg: "#ecfdf5", Icon: Hourglass, max: 40 },
};
const TAX_DEFAULT: TileStyle = { fg: "#64748b", bg: "#f1f5f9", Icon: Sparkles, max: 40 };

type Props = {
  showResultSection?: boolean;
};

export function LayersEditor({ showResultSection = true }: Props) {
  const layers = useStore((s) => s.layers);
  const updatePhys = useStore((s) => s.updatePhysiologyCategory);
  const addPhys = useStore((s) => s.addPhysiologyCategory);
  const removePhys = useStore((s) => s.removePhysiologyCategory);
  const updateTax = useStore((s) => s.updateTaxCategory);
  const addTax = useStore((s) => s.addTaxCategory);
  const removeTax = useStore((s) => s.removeTaxCategory);
  const updatePillar = useStore((s) => s.updatePillar);
  const addPillar = useStore((s) => s.addPillar);
  const removePillar = useStore((s) => s.removePillar);

  const allocation = computeAllocation(layers);
  const fizSum = allocation.fizjologiaH;
  const taxSum = allocation.podatkiH;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <section>
          <header className="flex items-baseline justify-between mb-3 px-1">
            <div>
              <h2 className="text-xl font-semibold">Fizjologia</h2>
              <p className="text-sm text-neutral-500">
                Sen, jedzenie, higiena — to co konieczne dla ciała.
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold tabular-nums">{fizSum}h</div>
              <div className="text-xs text-neutral-500">/ tydzień</div>
            </div>
          </header>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {layers.physiology.map((cat) => (
              <LayerTile
                key={cat.id}
                cat={cat}
                style={PHYS_STYLE[cat.id] ?? PHYS_DEFAULT}
                onUpdate={(p) => updatePhys(cat.id, p)}
                onRemove={() => removePhys(cat.id)}
              />
            ))}
            <button
              onClick={() => addPhys({ name: "Nowa kategoria", hoursPerWeek: 1 })}
              className="flex items-center justify-center gap-1.5 text-sm text-neutral-500 hover:text-indigo-600 hover:border-indigo-300 border border-dashed border-neutral-300 rounded-xl min-h-[110px] transition-colors"
            >
              <Plus size={14} /> Dodaj kategorię
            </button>
          </div>
        </section>

        <section>
          <header className="flex items-baseline justify-between mb-3 px-1">
            <div>
              <h2 className="text-xl font-semibold">Podatki życiowe</h2>
              <p className="text-sm text-neutral-500">
                Logistyka, bufor — czas pożerany przez życie.
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold tabular-nums">{taxSum}h</div>
              <div className="text-xs text-neutral-500">/ tydzień</div>
            </div>
          </header>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {layers.lifeTaxes.map((cat) => (
              <LayerTile
                key={cat.id}
                cat={cat}
                style={TAX_STYLE[cat.id] ?? TAX_DEFAULT}
                onUpdate={(p) => updateTax(cat.id, p)}
                onRemove={() => removeTax(cat.id)}
              />
            ))}
            <button
              onClick={() => addTax({ name: "Nowa kategoria", hoursPerWeek: 1 })}
              className="flex items-center justify-center gap-1.5 text-sm text-neutral-500 hover:text-indigo-600 hover:border-indigo-300 border border-dashed border-neutral-300 rounded-xl min-h-[110px] transition-colors"
            >
              <Plus size={14} /> Dodaj kategorię
            </button>
          </div>
        </section>
      </div>

      <section className="stat-card p-5 sm:p-6">
        <header className="flex items-baseline justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Filary</h2>
            <p className="text-sm text-neutral-600">
              Obszary życia. Wagi 1-10, dzielą pozostały czas.
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold tabular-nums">{allocation.pulaFilarowH.toFixed(1)}h</div>
            <div className="stat-label">do podziału</div>
          </div>
        </header>
        <div className="space-y-3">
          {layers.pillars.map((p) => {
            const alloc = allocation.perPillar[p.id];
            const tooLow = p.healthyMin && alloc && alloc.hoursPerWeek < p.healthyMin;
            return (
              <div key={p.id} className="grid grid-cols-12 items-center gap-3">
                <div className="col-span-12 sm:col-span-4 flex items-center gap-2">
                  <PillarIcon name={p.icon} color={p.color} size={18} />
                  <InlineInput
                    value={p.name}
                    onChange={(name) => updatePillar(p.id, { name })}
                    className="font-medium bg-transparent border-b border-transparent hover:border-neutral-300 focus:border-indigo-500 focus:outline-none px-1 flex-1 min-w-0"
                  />
                </div>
                <div className="col-span-12 sm:col-span-5">
                  <Slider
                    value={p.weight}
                    min={0.5}
                    max={10}
                    step={0.5}
                    onChange={(v) => updatePillar(p.id, { weight: v })}
                  />
                  <div className="text-xs text-neutral-500 mt-0.5">Waga {p.weight.toFixed(1)}</div>
                </div>
                <div className="col-span-9 sm:col-span-2 text-sm">
                  {alloc ? (
                    <>
                      <div className="font-medium">{alloc.hoursPerWeek.toFixed(1)}h/tydz</div>
                      <div className="text-xs text-neutral-500">
                        {alloc.hoursPerDay.toFixed(1)}h/dz · {alloc.percent.toFixed(0)}%
                      </div>
                    </>
                  ) : null}
                </div>
                <button
                  onClick={() => removePillar(p.id)}
                  className="col-span-3 sm:col-span-1 text-neutral-400 hover:text-red-500 justify-self-end"
                  aria-label="Usuń filar"
                >
                  <Trash2 size={16} />
                </button>
                {tooLow ? (
                  <div className="col-span-12 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1 flex items-center gap-1">
                    <AlertTriangle size={12} /> {p.name}: poniżej minimum {p.healthyMin}h/tydz
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
        <button
          onClick={() =>
            addPillar({
              name: "Nowy filar",
              icon: "Circle",
              color: "#a3a3a3",
              weight: 1,
            })
          }
          className="mt-3 inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700"
        >
          <Plus size={14} /> Dodaj filar
        </button>
      </section>

      {showResultSection ? (
        <section className="stat-card p-5 sm:p-6">
          <div className="stat-label mb-4">Wynik tygodniowy</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <ResultStat label="cały tydzień" value="168h" />
            <ResultStat label="fizjologia" value={`-${fizSum}h`} />
            <ResultStat label="podatki" value={`-${taxSum}h`} />
            <ResultStat
              label="pula filarów"
              value={`${allocation.pulaFilarowH.toFixed(1)}h`}
              highlight
            />
          </div>
          {allocation.pulaFilarowH < 0 ? (
            <div className="mt-4 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex items-center gap-2">
              <AlertTriangle size={14} /> Suma fizjologii i podatków przekracza 168h — popraw
              warstwy.
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

function ResultStat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <div className="stat-label mb-1">{label}</div>
      <div
        className={`text-2xl sm:text-3xl font-bold tracking-tight tabular-nums ${highlight ? "text-neutral-900" : "text-neutral-700"}`}
      >
        {value}
      </div>
    </div>
  );
}

function LayerTile({
  cat,
  style,
  onUpdate,
  onRemove,
}: {
  cat: { id: string; name: string; hoursPerWeek: number; healthyMin?: number };
  style: TileStyle;
  onUpdate: (p: Partial<{ name: string; hoursPerWeek: number }>) => void;
  onRemove: () => void;
}) {
  const { fg, bg, Icon, max } = style;
  const tooLow = cat.healthyMin !== undefined && cat.hoursPerWeek < cat.healthyMin;
  return (
    <div
      className="phys-tile rounded-xl p-3"
      style={{ ["--phys-fg" as string]: fg, ["--phys-bg" as string]: bg }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="phys-tile-icon w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
          <Icon size={16} />
        </span>
        <InlineInput
          value={cat.name}
          onChange={(name) => onUpdate({ name })}
          className="font-medium bg-transparent border-b border-transparent hover:border-black/15 focus:border-black/40 focus:outline-none px-0.5 flex-1 min-w-0"
        />
        <button
          onClick={onRemove}
          className="text-neutral-400 hover:text-red-500 shrink-0"
          aria-label="Usuń kategorię"
        >
          <Trash2 size={14} />
        </button>
      </div>
      <div className="flex items-baseline justify-between mb-1.5">
        <div className="text-xs text-neutral-600 leading-tight">
          <div>godziny / tydzień</div>
          <div className="text-neutral-500 tabular-nums">
            ≈ {(cat.hoursPerWeek / 7).toFixed(1)}h / dzień
          </div>
        </div>
        <span className="text-lg font-bold tabular-nums" style={{ color: fg }}>
          {cat.hoursPerWeek}h
        </span>
      </div>
      <Slider
        value={cat.hoursPerWeek}
        min={0}
        max={max}
        step={0.5}
        onChange={(v) => onUpdate({ hoursPerWeek: v })}
      />
      {tooLow ? (
        <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5 mt-2 flex items-center gap-1">
          <AlertTriangle size={11} /> Min. {cat.healthyMin}h
        </div>
      ) : null}
    </div>
  );
}
