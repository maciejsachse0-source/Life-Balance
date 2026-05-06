// Generate a default WeekTemplate (336 slots = 7 days × 48 half-hour slots)
// from layers (physiology + taxes + pillars allocations).
// Heuristic: assign 30-min slots in this order across the week:
//   - Sleep (Sen) at night (23:00-07:00 default)
//   - Food (Jedzenie) at fixed mealtimes
//   - Hygiene
//   - Pillars distributed proportionally across daytime weekday slots
//   - Buffer/Logistics fill leftovers

import type { Layers, Slot, WeekTemplate, DayOfWeek } from "./types";
import { uid, inferWorkType } from "./utils";
import { computeAllocation } from "./utils";

const SLOT_MIN = 30;
const SLOTS_PER_DAY = 48; // 24h * 2

// Reserved daily windows (default heuristic)
const SLEEP_START = 23 * 60; // 23:00
const SLEEP_END = 7 * 60; // next day 07:00
const BREAKFAST = [7 * 60, 7 * 60 + 30]; // 07:00-07:30
const LUNCH = [12 * 60 + 30, 13 * 60 + 30];
const DINNER = [19 * 60, 19 * 60 + 30];
const HYGIENE_MORNING = [7 * 60 + 30, 8 * 60]; // 07:30-08:00
const HYGIENE_EVENING = [22 * 60 + 30, 23 * 60];

const findCat = <T extends { name: string }>(cats: T[], keyword: string): T | undefined =>
  cats.find((c) => c.name.toLowerCase().includes(keyword));

export function generateWeekTemplate(layers: Layers): WeekTemplate {
  const slots: Slot[] = [];
  const sleepCat = findCat(layers.physiology, "sen");
  const foodCat = findCat(layers.physiology, "jedz");
  const hygieneCat = findCat(layers.physiology, "higien");
  const bufferCat = findCat(layers.lifeTaxes, "bufor");
  const logisticsCat = findCat(layers.lifeTaxes, "logist");

  // Helper to add a slot
  const add = (
    day: DayOfWeek,
    startMinute: number,
    durationMinutes: number,
    pillarId: string,
    workType: Slot["workType"],
    isFixed = false,
  ) => {
    if (startMinute < 0 || startMinute >= 24 * 60) return;
    slots.push({
      id: uid(),
      dayOfWeek: day,
      startMinute,
      durationMinutes,
      pillarId,
      workType,
      isFixed,
    });
  };

  for (let day = 0 as DayOfWeek; day < 7; day = ((day + 1) as DayOfWeek)) {
    const isWeekday = day >= 1 && day <= 5;

    // Sleep: 23:00-23:30 evening + 00:00-07:00 morning (split across day boundary)
    if (sleepCat) {
      // Morning sleep block (00:00 — 07:00)
      add(day, 0, 7 * 60, sleepCat.id, "routine", true);
      // Evening sleep block (23:00 — 23:59)
      add(day, 23 * 60, 60, sleepCat.id, "routine", true);
    }

    // Hygiene
    if (hygieneCat) {
      add(day, HYGIENE_MORNING[0], HYGIENE_MORNING[1] - HYGIENE_MORNING[0], hygieneCat.id, "routine", true);
      add(day, HYGIENE_EVENING[0], HYGIENE_EVENING[1] - HYGIENE_EVENING[0], hygieneCat.id, "routine", true);
    }

    // Food
    if (foodCat) {
      add(day, BREAKFAST[0], BREAKFAST[1] - BREAKFAST[0], foodCat.id, "routine", true);
      add(day, LUNCH[0], LUNCH[1] - LUNCH[0], foodCat.id, "routine", true);
      add(day, DINNER[0], DINNER[1] - DINNER[0], foodCat.id, "routine", true);
    }

    // Pillars: spread across 8:00-22:30 (working window)
    // Weekdays: deep work 8:00-12:00, shallow 13:30-16:00, admin 16:00-18:00, evening 20:00-22:30
    // Pillar selection rotates by weight (largest first)
    const allocation = computeAllocation(layers);
    const sortedPillars = [...layers.pillars].sort(
      (a, b) => (allocation.perPillar[b.id]?.hoursPerWeek ?? 0) - (allocation.perPillar[a.id]?.hoursPerWeek ?? 0),
    );

    if (isWeekday) {
      // Morning deep — 8:00-11:00 (3h, biggest pillar — usually Praca/Misja)
      const work = sortedPillars[0];
      if (work) {
        add(day, 8 * 60, 60, work.id, inferWorkType(work, 8));
        add(day, 9 * 60, 60, work.id, inferWorkType(work, 9));
        add(day, 10 * 60, 60, work.id, inferWorkType(work, 10));
      }
      // 11:00-12:30 — second pillar (e.g. Sprzedaż or Umysł)
      const second = sortedPillars[1] ?? sortedPillars[0];
      if (second) {
        add(day, 11 * 60, 60, second.id, inferWorkType(second, 11));
        add(day, 12 * 60, 30, second.id, inferWorkType(second, 12));
      }
      // 13:30-16:00 — work (shallow)
      if (work) {
        add(day, 13 * 60 + 30, 60, work.id, "shallow");
        add(day, 14 * 60 + 30, 60, work.id, "shallow");
        add(day, 15 * 60 + 30, 30, work.id, "shallow");
      }
      // 16:00-18:00 — admin / smaller pillars rotating
      const adminSlot = sortedPillars[2] ?? sortedPillars[0];
      if (adminSlot) {
        add(day, 16 * 60, 60, adminSlot.id, "admin");
        add(day, 17 * 60, 60, adminSlot.id, "admin");
      }
      // 18:00-19:00 — Ciało or first physical pillar
      const body =
        sortedPillars.find((p) => p.name.toLowerCase().includes("ciał") || p.name.toLowerCase().includes("zdrow")) ??
        sortedPillars[Math.min(2, sortedPillars.length - 1)];
      if (body) {
        add(day, 18 * 60, 60, body.id, "physical");
      }
      // 20:00-22:30 — evening (Relacje / Ja / hobby) rotating per day
      const eveningPillar =
        sortedPillars[(day + 1) % sortedPillars.length] ?? sortedPillars[0];
      if (eveningPillar) {
        add(day, 20 * 60, 60, eveningPillar.id, inferWorkType(eveningPillar, 20));
        add(day, 21 * 60, 60, eveningPillar.id, inferWorkType(eveningPillar, 21));
        add(day, 22 * 60, 30, eveningPillar.id, inferWorkType(eveningPillar, 22));
      }
    } else {
      // Weekend — looser. 9:00-13:00 + 14:30-18:00 + 19:30-22:30
      // Distribute remaining pillars proportionally
      const ordered = [...sortedPillars].slice(1).concat(sortedPillars[0] ? [sortedPillars[0]] : []);
      const blocks: Array<[number, number]> = [
        [9 * 60, 60],
        [10 * 60, 60],
        [11 * 60, 60],
        [12 * 60, 30],
        [14 * 60 + 30, 60],
        [15 * 60 + 30, 60],
        [16 * 60 + 30, 60],
        [17 * 60 + 30, 30],
        [19 * 60 + 30, 60],
        [20 * 60 + 30, 60],
        [21 * 60 + 30, 60],
      ];
      blocks.forEach(([start, dur], i) => {
        const p = ordered[i % Math.max(ordered.length, 1)];
        if (p) {
          const hour = Math.floor(start / 60);
          add(day, start, dur, p.id, inferWorkType(p, hour));
        }
      });
    }

    // Logistics — 18:30-19:00 weekdays, 13:00-14:30 weekends
    if (logisticsCat) {
      if (isWeekday) {
        add(day, 18 * 60 + 30, 30, logisticsCat.id, "buffer", true);
      } else {
        add(day, 13 * 60, 90, logisticsCat.id, "buffer", true);
      }
    }

    // Buffer — last slot before sleep (22:30-23:00) on most days
    if (bufferCat) {
      // already filled by pillar slot 22:00-22:30 on weekdays — buffer goes 22:30-23:00 only on certain days
      if (day === 0 || day === 6) {
        add(day, 22 * 60 + 30, 30, bufferCat.id, "buffer", true);
      }
    }

    if (day === 6) break; // exhaust loop manually
  }

  return { slots };
}
