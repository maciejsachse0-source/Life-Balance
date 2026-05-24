"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ListChecks, Network, Plus, Shuffle, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/hydration";
import { Spinner } from "@/components/Spinner";
import { ThoughtsQuickAdd } from "@/components/ThoughtsQuickAdd";
import { SideNav } from "@/components/SideNav";
import { InlineTextarea } from "@/components/InlineTextarea";
import { DashboardErrorBoundary } from "@/components/DashboardErrorBoundary";
import { PillarsSection } from "@/components/PillarsSection";
import { RoutinesTodayCard } from "@/components/RoutinesTodayCard";
import { ActivityMonitorCard } from "@/components/ActivityMonitorCard";
import { DayTodayCard } from "@/components/DayTodayCard";
import {
  AppShell,
  StatCard,
  StatCardHeader,
  StatDivider,
  LinkButton,
  Column,
} from "@/components/ui";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import type { PersonalValue } from "@/lib/types";

const VALUE_ACCENTS = [
  "#f0a191",
  "#fdba74",
  "#c4b5fd",
  "#fbbf24",
  "#86efac",
  "#fda4af",
  "#93c5fd",
  "#fcd34d",
  "#d8b4fe",
];

export default function DashboardPage() {
  return (
    <DashboardErrorBoundary>
      <DashboardInner />
    </DashboardErrorBoundary>
  );
}

function DashboardInner() {
  const hydrated = useHydrated();
  const settings = useStore((s) => s.settings);
  const thoughts = useStore((s) => s.thoughts);
  const pillars = useStore((s) => s.layers?.pillars ?? []);
  const setPersonalMission = useStore((s) => s.setPersonalMission);
  const setPersonalVision = useStore((s) => s.setPersonalVision);
  const addPersonalValue = useStore((s) => s.addPersonalValue);
  const updatePersonalValue = useStore((s) => s.updatePersonalValue);
  const removePersonalValue = useStore((s) => s.removePersonalValue);

  const [randomTick, setRandomTick] = useState(0);

  useEffect(() => {
    setRandomTick(Math.floor(Math.random() * 1000));
  }, []);

  if (!hydrated) return <Spinner />;

  const today = new Date();
  const greeting = getGreeting(today);
  const values = settings.personalValues ?? [];
  const safeThoughts = thoughts ?? [];
  const recentThoughts = safeThoughts.slice(0, 3);

  const pool = safeThoughts.length > 3 ? safeThoughts.slice(3) : safeThoughts;
  const randomThought = pool.length > 0 ? pool[randomTick % pool.length] : null;

  const shuffleRandom = () => {
    if (pool.length <= 1) return;
    let next = randomTick;
    while (next % pool.length === randomTick % pool.length) {
      next = Math.floor(Math.random() * 10000);
    }
    setRandomTick(next);
  };

  return (
    <>
      <AppShell width="wide">
        <header className="px-2 mb-2 flex items-end justify-between gap-4">
          <div className="min-w-0">
            <div className="stat-label">
              {format(today, "EEEE, d MMMM yyyy", { locale: pl })}
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-neutral-900 mt-1 leading-tight">
              {greeting}.
            </h1>
            <p className="text-sm text-neutral-600 mt-1">
              Twoja przestrzeń — co teraz nosisz w sobie?
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <LinkButton href="/mindmap" variant="secondary">
              <Network size={14} /> Mapa
            </LinkButton>
            <LinkButton href="/habits" variant="secondary">
              <ListChecks size={14} /> Rutyny
            </LinkButton>
            <LinkButton href="/calendar/day" variant="secondary">
              Dziś →
            </LinkButton>
          </div>
        </header>

        <ActivityMonitorCard />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <Column className="lg:col-span-4">
            <StatCard>
              <StatCardHeader label="Moje DLACZEGO" right="złoty krąg" />
              <p className="text-sm text-neutral-600 leading-relaxed mb-5">
                DLACZEGO to powód, dla którego robisz to, co robisz — głębszy niż cele i strategia.
                Nie wymyśla się go, tylko odkrywa: w historiach, w których byłeś najbardziej sobą.
                Składa się z dwóch części: <span className="text-neutral-900 font-medium">wkładu</span>, który wnosisz,
                i <span className="text-neutral-900 font-medium">efektu</span>, który dzięki niemu powstaje.
                Razem tworzą zdanie: „Aby ___, tak by ___.”
              </p>
              <ManifestField
                label="Mój wkład — co wnoszę"
                value={settings.personalMission ?? ""}
                onChange={setPersonalMission}
                placeholder="Aby... (np. pomagać ludziom dostrzegać to, czego sami nie widzą)"
                accent="#f0a191"
              />
              <StatDivider />
              <ManifestField
                label="Mój efekt — co dzięki temu się zmienia"
                value={settings.personalVision ?? ""}
                onChange={setPersonalVision}
                placeholder="...tak by (np. żyli pełniej i podejmowali odważniejsze decyzje)"
                accent="#c4b5fd"
              />
            </StatCard>

            <StatCard>
              <StatCardHeader
                label="Moje JAK"
                right={values.length > 0 ? `${values.length}` : "zasady w działaniu"}
              />
              <ValuesSection
                values={values}
                onAdd={(title) => addPersonalValue(title)}
                onUpdate={(id, patch) => updatePersonalValue(id, patch)}
                onRemove={removePersonalValue}
              />
            </StatCard>
          </Column>

          <Column className="lg:col-span-5">
            <DayTodayCard />

            <RoutinesTodayCard />
          </Column>

          <Column className="lg:col-span-3">
            <PillarsSection />

            {randomThought ? (
              <StatCard>
                <StatCardHeader
                  label="Z mojej historii"
                  right={
                    pool.length > 1 ? (
                      <button
                        onClick={shuffleRandom}
                        className="inline-flex items-center gap-1 text-neutral-500 hover:text-neutral-900 transition-colors"
                        aria-label="Wylosuj inną myśl"
                      >
                        <Shuffle size={11} />
                        <span>Inna</span>
                      </button>
                    ) : undefined
                  }
                />
                <RandomThought
                  text={randomThought.text}
                  date={randomThought.createdAt}
                  pillarColor={
                    randomThought.pillarId
                      ? pillars.find((p) => p.id === randomThought.pillarId)?.color
                      : undefined
                  }
                />
              </StatCard>
            ) : null}

            <StatCard>
              <StatCardHeader
                label="Przemyślenia"
                right={
                  <Link href="/thoughts" className="hover:text-neutral-900">
                    Wszystkie →
                  </Link>
                }
              />
              <ThoughtsQuickAdd />
              {recentThoughts.length > 0 ? (
                <ul className="mt-4 space-y-2">
                  {recentThoughts.map((t) => {
                    const pillar = t.pillarId
                      ? pillars.find((p) => p.id === t.pillarId)
                      : null;
                    return (
                      <li
                        key={t.id}
                        className="flex items-start gap-3 text-sm text-neutral-700"
                      >
                        <span
                          className="mt-1.5 w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: pillar?.color ?? "#d4d4d4" }}
                        />
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
            </StatCard>
          </Column>
        </div>
      </AppShell>
      <SideNav />
    </>
  );
}

function getGreeting(d: Date): string {
  const h = d.getHours();
  if (h < 5) return "Cicha noc";
  if (h < 12) return "Dzień dobry";
  if (h < 18) return "Dobre popołudnie";
  if (h < 22) return "Dobry wieczór";
  return "Spokojnej nocy";
}

function ManifestField({
  label,
  value,
  onChange,
  placeholder,
  accent,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  accent: string;
}) {
  return (
    <div className="py-1">
      <div className="stat-label mb-2 flex items-center">
        <span
          className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 shrink-0"
          style={{ backgroundColor: accent }}
        />
        <span>{label}</span>
      </div>
      <InlineTextarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        minRows={2}
        className="text-base sm:text-lg text-neutral-800 leading-relaxed"
      />
    </div>
  );
}

function RandomThought({
  text,
  date,
  pillarColor,
}: {
  text: string;
  date: string;
  pillarColor?: string;
}) {
  return (
    <figure>
      <span
        className="block text-5xl leading-none text-neutral-300 -mb-2"
        aria-hidden
      >
        “
      </span>
      <blockquote className="text-lg sm:text-xl font-medium text-neutral-800 leading-relaxed pl-1">
        {text}
      </blockquote>
      <figcaption className="mt-3 flex items-center gap-2 text-xs text-neutral-500">
        {pillarColor ? (
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ backgroundColor: pillarColor }}
          />
        ) : null}
        <span>{format(new Date(date), "d MMMM yyyy", { locale: pl })}</span>
      </figcaption>
    </figure>
  );
}

function ValuesSection({
  values,
  onAdd,
  onUpdate,
  onRemove,
}: {
  values: PersonalValue[];
  onAdd: (title: string) => void;
  onUpdate: (id: string, patch: { title?: string; description?: string }) => void;
  onRemove: (id: string) => void;
}) {
  const [draftTitle, setDraftTitle] = useState("");

  const submit = () => {
    const t = draftTitle.trim();
    if (!t) return;
    onAdd(t);
    setDraftTitle("");
  };

  return (
    <div>
      {values.length === 0 ? (
        <p className="text-sm text-neutral-500 leading-relaxed mb-4">
          JAK to Twoje wartości w działaniu — sposób, w jaki postępujesz, kiedy jesteś najbardziej sobą.
          Nie tylko „Uczciwość", ale <span className="text-neutral-700">„Mów prawdę, nawet gdy jest niewygodna"</span>.
          Czasowniki, nie etykiety. Każde JAK ma nazwę i krótki opis — Twoimi słowami.
        </p>
      ) : (
        <ul className="divide-y divide-neutral-100 mb-2">
          {values.map((v, i) => (
            <ValueEntry
              key={v.id}
              value={v}
              accent={VALUE_ACCENTS[i % VALUE_ACCENTS.length]}
              onUpdate={(patch) => onUpdate(v.id, patch)}
              onRemove={() => onRemove(v.id)}
            />
          ))}
        </ul>
      )}

      <div className="flex items-center gap-2 mt-3">
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: VALUE_ACCENTS[values.length % VALUE_ACCENTS.length] }}
        />
        <input
          value={draftTitle}
          onChange={(e) => setDraftTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          placeholder="Dodaj zasadę — np. Zawsze szukaj prostszej drogi"
          className="flex-1 bg-transparent outline-none border-b border-neutral-200 focus:border-neutral-400 transition-colors py-1 text-sm placeholder:text-neutral-400"
        />
        <button
          onClick={submit}
          disabled={!draftTitle.trim()}
          className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900 disabled:opacity-40 disabled:hover:text-neutral-500 transition-colors"
        >
          <Plus size={14} />
          <span>Dodaj</span>
        </button>
      </div>
    </div>
  );
}

function ValueEntry({
  value,
  accent,
  onUpdate,
  onRemove,
}: {
  value: PersonalValue;
  accent: string;
  onUpdate: (patch: { title?: string; description?: string }) => void;
  onRemove: () => void;
}) {
  return (
    <li className="group py-4 first:pt-1 flex items-start gap-3">
      <span
        className="mt-2 w-2 h-2 rounded-full shrink-0"
        style={{ backgroundColor: accent }}
      />
      <div className="flex-1 min-w-0">
        <ValueTitleInput
          value={value.title}
          onChange={(t) => onUpdate({ title: t })}
        />
        <InlineTextarea
          value={value.description ?? ""}
          onChange={(d) => onUpdate({ description: d })}
          placeholder="Kiedy ta zasada jest najmocniej obecna? Co dla Ciebie znaczy w praktyce…"
          minRows={1}
          className="text-sm text-neutral-600 leading-relaxed mt-1"
        />
      </div>
      <button
        onClick={onRemove}
        className="opacity-0 group-hover:opacity-100 text-neutral-300 hover:text-neutral-900 transition-all p-1 -m-1 shrink-0"
        aria-label="Usuń wartość"
      >
        <X size={14} />
      </button>
    </li>
  );
}

function ValueTitleInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [local, setLocal] = useState(value);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  return (
    <input
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => {
        if (local !== value) onChange(local);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        if (e.key === "Escape") {
          setLocal(value);
          (e.target as HTMLInputElement).blur();
        }
      }}
      placeholder="Nazwa wartości"
      className="w-full bg-transparent outline-none border-0 p-0 text-base sm:text-lg font-semibold text-neutral-900 placeholder:text-neutral-400 placeholder:font-normal"
    />
  );
}
