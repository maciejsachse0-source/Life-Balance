import { v4 as uuidv4 } from "uuid";
import type { Layers, Pillar, WorkType } from "./types";

export const uid = () => uuidv4();

export const minutesToHours = (m: number) => m / 60;
export const hoursToMinutes = (h: number) => Math.round(h * 60);

export const sumHours = (cats: { hoursPerWeek: number }[]) =>
  cats.reduce((acc, c) => acc + c.hoursPerWeek, 0);

export type AllocationResult = {
  fizjologiaH: number;
  podatkiH: number;
  nettoH: number;
  pulaFilarowH: number;
  perPillar: Record<string, { hoursPerWeek: number; hoursPerDay: number; percent: number }>;
};

export const computeAllocation = (layers: Layers): AllocationResult => {
  const fizjologiaH = sumHours(layers.physiology);
  const podatkiH = sumHours(layers.lifeTaxes);
  const nettoH = 168 - fizjologiaH;
  const pulaFilarowH = Math.max(0, nettoH - podatkiH);
  const totalWeight = layers.pillars.reduce((acc, p) => acc + p.weight, 0) || 1;
  const perPillar: AllocationResult["perPillar"] = {};
  for (const p of layers.pillars) {
    const h = (p.weight / totalWeight) * pulaFilarowH;
    perPillar[p.id] = {
      hoursPerWeek: h,
      hoursPerDay: h / 7,
      percent: (h / Math.max(pulaFilarowH, 1)) * 100,
    };
  }
  return { fizjologiaH, podatkiH, nettoH, pulaFilarowH, perPillar };
};

// Suggest workType for a slot given pillar name and time of day
export const inferWorkType = (pillar: Pillar, hour: number): WorkType => {
  const name = pillar.name.toLowerCase();
  if (name.includes("ciało") || name.includes("zdrow") || name.includes("sport")) return "physical";
  if (name.includes("relacj") || name.includes("ludzie") || name.includes("rodzin") || name.includes("społ")) return "social";
  if (name.includes("ja") || name.includes("siebie")) return "reflective";
  // For Praca/Misja/Studia — workType depends on time of day
  if (hour >= 7 && hour < 12) return "deep";
  if (hour >= 12 && hour < 16) return "shallow";
  if (hour >= 16 && hour < 19) return "admin";
  return "shallow";
};

export const formatHours = (h: number) => {
  if (h < 1) return `${Math.round(h * 60)} min`;
  const whole = Math.floor(h);
  const minutes = Math.round((h - whole) * 60);
  return minutes > 0 ? `${whole}h ${minutes}min` : `${whole}h`;
};

export const minuteToTimeStr = (m: number) => {
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
};

export const DAY_NAMES = ["Niedz", "Pon", "Wt", "Śr", "Czw", "Pt", "Sob"] as const;
export const DAY_NAMES_LONG = [
  "Niedziela",
  "Poniedziałek",
  "Wtorek",
  "Środa",
  "Czwartek",
  "Piątek",
  "Sobota",
] as const;

export const cn = (...classes: (string | false | null | undefined)[]) =>
  classes.filter(Boolean).join(" ");
