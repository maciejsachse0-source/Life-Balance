"use client";

import { useStore } from "@/lib/store";
import { Slider } from "@/components/Slider";
import { InlineInput } from "@/components/InlineInput";
import { PillarIcon } from "@/components/PillarIcon";
import { computeAllocation } from "@/lib/utils";
import { Plus, Trash2, AlertTriangle } from "lucide-react";

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
      <section className="bg-white border border-neutral-200 rounded-xl p-5">
        <header className="flex items-baseline justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold">Fizjologia</h2>
            <p className="text-sm text-neutral-500">
              Sen, jedzenie, higiena — to co konieczne dla ciała.
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{fizSum}h</div>
            <div className="text-xs text-neutral-500">/ tydzień</div>
          </div>
        </header>
        <div className="space-y-3">
          {layers.physiology.map((cat) => (
            <CategoryRow
              key={cat.id}
              cat={cat}
              max={84}
              onUpdate={(p) => updatePhys(cat.id, p)}
              onRemove={() => removePhys(cat.id)}
            />
          ))}
        </div>
        <button
          onClick={() => addPhys({ name: "Nowa kategoria", hoursPerWeek: 1 })}
          className="mt-3 inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700"
        >
          <Plus size={14} /> Dodaj kategorię
        </button>
      </section>

      <section className="bg-white border border-neutral-200 rounded-xl p-5">
        <header className="flex items-baseline justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold">Podatki życiowe</h2>
            <p className="text-sm text-neutral-500">
              Logistyka, bufor — czas pożerany przez życie.
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{taxSum}h</div>
            <div className="text-xs text-neutral-500">/ tydzień</div>
          </div>
        </header>
        <div className="space-y-3">
          {layers.lifeTaxes.map((cat) => (
            <CategoryRow
              key={cat.id}
              cat={cat}
              max={40}
              onUpdate={(p) => updateTax(cat.id, p)}
              onRemove={() => removeTax(cat.id)}
            />
          ))}
        </div>
        <button
          onClick={() => addTax({ name: "Nowa kategoria", hoursPerWeek: 1 })}
          className="mt-3 inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700"
        >
          <Plus size={14} /> Dodaj kategorię
        </button>
      </section>

      <section className="bg-white border border-neutral-200 rounded-xl p-5">
        <header className="flex items-baseline justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold">Filary</h2>
            <p className="text-sm text-neutral-500">
              Obszary życia. Wagi 1-10, dzielą pozostały czas.
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{allocation.pulaFilarowH.toFixed(1)}h</div>
            <div className="text-xs text-neutral-500">do podziału</div>
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
                    color={p.color}
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
        <section className="bg-neutral-900 text-white rounded-xl p-5">
          <h2 className="text-xl font-semibold mb-3">Wynik tygodniowy</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <Stat label="168h" value="cały tydzień" />
            <Stat label={`-${fizSum}h`} value="fizjologia" />
            <Stat label={`-${taxSum}h`} value="podatki" />
            <Stat
              label={`${allocation.pulaFilarowH.toFixed(1)}h`}
              value="pula filarów"
              highlight
            />
          </div>
          {allocation.pulaFilarowH < 0 ? (
            <div className="mt-4 text-xs bg-red-500/20 border border-red-400/30 rounded px-3 py-2 flex items-center gap-2">
              <AlertTriangle size={14} /> Suma fizjologii i podatków przekracza 168h — popraw
              warstwy.
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <div className={`text-3xl font-bold ${highlight ? "text-indigo-300" : ""}`}>{label}</div>
      <div className="text-xs text-neutral-400">{value}</div>
    </div>
  );
}

function CategoryRow({
  cat,
  max,
  onUpdate,
  onRemove,
}: {
  cat: { id: string; name: string; hoursPerWeek: number; healthyMin?: number };
  max: number;
  onUpdate: (p: Partial<{ name: string; hoursPerWeek: number }>) => void;
  onRemove: () => void;
}) {
  const tooLow = cat.healthyMin !== undefined && cat.hoursPerWeek < cat.healthyMin;
  return (
    <div>
      <div className="grid grid-cols-12 items-center gap-3">
        <div className="col-span-12 sm:col-span-4">
          <InlineInput
            value={cat.name}
            onChange={(name) => onUpdate({ name })}
            className="font-medium bg-transparent border-b border-transparent hover:border-neutral-300 focus:border-indigo-500 focus:outline-none px-1 w-full"
          />
        </div>
        <div className="col-span-9 sm:col-span-6">
          <Slider
            value={cat.hoursPerWeek}
            min={0}
            max={max}
            step={0.5}
            onChange={(v) => onUpdate({ hoursPerWeek: v })}
          />
        </div>
        <div className="col-span-2 sm:col-span-1 text-sm font-medium tabular-nums">
          {cat.hoursPerWeek}h
        </div>
        <button
          onClick={onRemove}
          className="col-span-1 text-neutral-400 hover:text-red-500 justify-self-end"
          aria-label="Usuń kategorię"
        >
          <Trash2 size={16} />
        </button>
      </div>
      {tooLow ? (
        <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1 mt-1.5 flex items-center gap-1">
          <AlertTriangle size={12} /> Poniżej zalecanego minimum {cat.healthyMin}h
        </div>
      ) : null}
    </div>
  );
}
