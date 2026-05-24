"use client";

import { useStore } from "./store";
import { uid } from "./utils";
import type {
  Goal,
  Milestone,
  Pillar,
  RoutineCompletion,
  SlotCompletion,
  TaskStatus,
  WorkType,
} from "./types";
import { addDays, format, startOfWeek, subDays, subWeeks } from "date-fns";

type GoalSeed = {
  pillarId: string;
  title: string;
  description?: string;
  vision?: string;
  character: "Project" | "Routine" | "Mixed";
  weight?: number;
  deadlineDaysFromNow?: number;
  status?: Goal["status"];
  milestones?: Array<{
    title: string;
    deadlineDaysFromNow?: number;
    character?: "Project" | "Routine";
    tasks?: Array<{ title: string; status: TaskStatus; workType: WorkType }>;
    routineCompletionRate?: number;
  }>;
  routineConfig?: {
    frequency: "daily" | "weekly";
    timesPerWeek?: number;
    durationMinutes: number;
    workType: WorkType;
    historyWeeks?: number;
    completionRate?: number; // 0..1
  };
};

const findPillar = (pillars: Pillar[], keywords: string[]): Pillar | undefined =>
  pillars.find((p) => keywords.some((k) => p.name.toLowerCase().includes(k)));

const seededRandom = (seed: number) => {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
};

const generateRoutineCompletions = (
  cfg: {
    frequency: "daily" | "weekly";
    timesPerWeek?: number;
    historyWeeks: number;
    completionRate: number;
  },
  seed = 42,
): RoutineCompletion[] => {
  const rand = seededRandom(seed);
  const completions: RoutineCompletion[] = [];
  const today = new Date();
  if (cfg.frequency === "daily") {
    for (let d = 0; d < cfg.historyWeeks * 7; d++) {
      const date = subDays(today, d);
      // Skip future
      if (date > today) continue;
      const done = rand() < cfg.completionRate;
      // Add only completions, not misses (cleaner heatmap)
      if (done) {
        completions.push({
          id: uid(),
          date: format(date, "yyyy-MM-dd"),
          completed: true,
        });
      }
    }
  } else {
    const target = cfg.timesPerWeek ?? 1;
    for (let w = 0; w < cfg.historyWeeks; w++) {
      const monday = startOfWeek(subWeeks(today, w), { weekStartsOn: 1 });
      const hitsThisWeek = rand() < cfg.completionRate ? target : Math.max(0, target - 1);
      // Pick days within the week
      const dayIdxs = [0, 1, 2, 3, 4, 5, 6].sort(() => rand() - 0.5).slice(0, hitsThisWeek);
      for (const idx of dayIdxs) {
        const day = addDays(monday, idx);
        if (day > today) continue;
        completions.push({
          id: uid(),
          date: format(day, "yyyy-MM-dd"),
          completed: true,
        });
      }
    }
  }
  return completions;
};

export function seedDemoData() {
  const state = useStore.getState();
  const pillars = state.layers.pillars;
  if (pillars.length === 0) {
    alert("Najpierw wybierz szablon i dodaj filary w kalkulatorze.");
    return { goalsAdded: 0, completionsAdded: 0, thoughtsAdded: 0 };
  }

  // Detect pillars by keyword
  const work = findPillar(pillars, ["praca", "misja", "firma", "studia"]);
  const body = findPillar(pillars, ["ciał", "zdrow", "fitnes"]);
  const mind = findPillar(pillars, ["umysł", "rozwój", "wiedza"]);
  const socialP = findPillar(pillars, ["relacj", "ludzie", "rodzin", "społ"]);
  const self = findPillar(pillars, ["ja", "siebie"]);
  const finance = findPillar(pillars, ["finans", "pieniąd"]);
  const home = findPillar(pillars, ["dom", "gospodar"]);
  const product = findPillar(pillars, ["produkt"]);
  const sales = findPillar(pillars, ["sprzedaż", "biznes"]);

  const goalSeeds: GoalSeed[] = [];

  // === PROJECT goals ===
  if (work) {
    goalSeeds.push({
      pillarId: work.id,
      title: "Lądowanie nowej wersji aplikacji v2",
      description: "Pełny redesign + 3 nowe moduły + migracja użytkowników",
      vision: "Apka która działa szybciej, jest piękniejsza i zarabia 30% więcej",
      character: "Project",
      weight: 8,
      deadlineDaysFromNow: 45,
      milestones: [
        {
          title: "Research użytkowników",
          deadlineDaysFromNow: 7,
          tasks: [
            { title: "5 wywiadów z power-userami", status: "Done", workType: "social" },
            { title: "Analiza heatmap z Hotjara", status: "Done", workType: "shallow" },
            { title: "Dokument insights & priorytetów", status: "Done", workType: "deep" },
          ],
        },
        {
          title: "Wireframes i prototyp Figma",
          deadlineDaysFromNow: 18,
          tasks: [
            { title: "Wireframe — onboarding", status: "Done", workType: "creative" },
            { title: "Wireframe — dashboard", status: "InProgress", workType: "creative" },
            { title: "Wireframe — billing", status: "Todo", workType: "creative" },
            { title: "High-fi w Figmie", status: "Todo", workType: "creative" },
            { title: "Test prototypu z 3 osobami", status: "Todo", workType: "social" },
          ],
        },
        {
          title: "Implementacja frontendu",
          deadlineDaysFromNow: 35,
          tasks: [
            { title: "Setup nowego routingu", status: "InProgress", workType: "deep" },
            { title: "Komponenty design-system", status: "Todo", workType: "deep" },
            { title: "Strona dashboardu", status: "Todo", workType: "deep" },
            { title: "Strona ustawień", status: "Todo", workType: "deep" },
            { title: "Integracja z API", status: "Todo", workType: "deep" },
            { title: "E2E testy", status: "Todo", workType: "shallow" },
          ],
        },
        {
          title: "Migracja i go-live",
          deadlineDaysFromNow: 45,
          tasks: [
            { title: "Plan migracji z rollbackiem", status: "Todo", workType: "deep" },
            { title: "Komunikacja do użytkowników", status: "Todo", workType: "admin" },
            { title: "Monitoring po wdrożeniu", status: "Todo", workType: "shallow" },
          ],
        },
      ],
    });
    goalSeeds.push({
      pillarId: work.id,
      title: "Cotygodniowa retrospekcja",
      character: "Routine",
      routineConfig: {
        frequency: "weekly",
        timesPerWeek: 1,
        durationMinutes: 60,
        workType: "reflective",
        historyWeeks: 10,
        completionRate: 0.85,
      },
    });
  }

  // === Mixed goal example ===
  if (work) {
    goalSeeds.push({
      pillarId: work.id,
      title: "Otwarcie kanału na Linkedinie",
      description: "Projekt + rytuał publikowania",
      character: "Mixed",
      weight: 5,
      deadlineDaysFromNow: 90,
      milestones: [
        {
          title: "Przygotowanie kanału",
          character: "Project",
          tasks: [
            { title: "Brand design & banner", status: "Done", workType: "creative" },
            { title: "Pierwszy post", status: "Done", workType: "creative" },
            { title: "Lista 20 tematów", status: "InProgress", workType: "deep" },
          ],
        },
        {
          title: "Tygodniowy post",
          character: "Routine",
          routineCompletionRate: 0.7,
        },
      ],
    });
  }

  // === Body / health ===
  if (body) {
    goalSeeds.push({
      pillarId: body.id,
      title: "Trening siłowy 3×/tydz",
      character: "Routine",
      routineConfig: {
        frequency: "weekly",
        timesPerWeek: 3,
        durationMinutes: 75,
        workType: "physical",
        historyWeeks: 12,
        completionRate: 0.75,
      },
    });
    goalSeeds.push({
      pillarId: body.id,
      title: "Codzienny spacer 30 min",
      character: "Routine",
      routineConfig: {
        frequency: "daily",
        durationMinutes: 30,
        workType: "physical",
        historyWeeks: 8,
        completionRate: 0.65,
      },
    });
    goalSeeds.push({
      pillarId: body.id,
      title: "Półmaraton w czerwcu",
      character: "Project",
      weight: 6,
      deadlineDaysFromNow: 60,
      milestones: [
        {
          title: "Baza tlenowa (50 km/tydz)",
          deadlineDaysFromNow: 21,
          tasks: [
            { title: "Plan treningowy 12-tyg", status: "Done", workType: "shallow" },
            { title: "Buty na długie wybiegi", status: "Done", workType: "admin" },
            { title: "Pierwsza 15 km", status: "InProgress", workType: "physical" },
          ],
        },
        {
          title: "Tempo i interwały",
          deadlineDaysFromNow: 42,
          tasks: [
            { title: "Tempo 5×1 km", status: "Todo", workType: "physical" },
            { title: "Interwały na bieżni", status: "Todo", workType: "physical" },
          ],
        },
        {
          title: "Race day",
          deadlineDaysFromNow: 60,
          tasks: [
            { title: "Pakiet startowy", status: "Todo", workType: "admin" },
            { title: "Strategia tempa", status: "Todo", workType: "deep" },
          ],
        },
      ],
    });
  }

  // === Mind ===
  if (mind) {
    goalSeeds.push({
      pillarId: mind.id,
      title: "Atomic Habits — przeczytać",
      description: "Klasyk Cleara, czytanie + notatki",
      character: "Project",
      weight: 4,
      deadlineDaysFromNow: 30,
      milestones: [
        {
          title: "Część I (rozdziały 1-4)",
          tasks: [
            { title: "Rozdz. 1 + notatki", status: "Done", workType: "deep" },
            { title: "Rozdz. 2 + notatki", status: "Done", workType: "deep" },
            { title: "Rozdz. 3 + notatki", status: "InProgress", workType: "deep" },
            { title: "Rozdz. 4 + notatki", status: "Todo", workType: "deep" },
          ],
        },
        {
          title: "Część II (4 prawa zmian)",
          tasks: [
            { title: "Rozdz. 5-8", status: "Todo", workType: "deep" },
            { title: "Pomysły do wdrożenia", status: "Todo", workType: "creative" },
          ],
        },
        {
          title: "Część III + podsumowanie",
          tasks: [
            { title: "Pozostałe rozdziały", status: "Todo", workType: "deep" },
            { title: "Streszczenie 1-stronicowe", status: "Todo", workType: "creative" },
          ],
        },
      ],
    });
    goalSeeds.push({
      pillarId: mind.id,
      title: "20 min czytania dziennie",
      character: "Routine",
      routineConfig: {
        frequency: "daily",
        durationMinutes: 20,
        workType: "deep",
        historyWeeks: 6,
        completionRate: 0.55,
      },
    });
  }

  // === Relacje ===
  if (socialP) {
    goalSeeds.push({
      pillarId: socialP.id,
      title: "Sobotnia kolacja z bliskimi",
      character: "Routine",
      routineConfig: {
        frequency: "weekly",
        timesPerWeek: 1,
        durationMinutes: 180,
        workType: "social",
        historyWeeks: 12,
        completionRate: 0.85,
      },
    });
    goalSeeds.push({
      pillarId: socialP.id,
      title: "Telefon do mamy 2×/tydz",
      character: "Routine",
      routineConfig: {
        frequency: "weekly",
        timesPerWeek: 2,
        durationMinutes: 30,
        workType: "social",
        historyWeeks: 10,
        completionRate: 0.7,
      },
    });
  }

  // === Ja ===
  if (self) {
    goalSeeds.push({
      pillarId: self.id,
      title: "Codzienny journaling",
      description: "Wieczorem 10 min — co dziś zauważyłem, za co jestem wdzięczny",
      character: "Routine",
      routineConfig: {
        frequency: "daily",
        durationMinutes: 10,
        workType: "reflective",
        historyWeeks: 8,
        completionRate: 0.6,
      },
    });
    goalSeeds.push({
      pillarId: self.id,
      title: "Niedzielny rytuał planowania",
      character: "Routine",
      routineConfig: {
        frequency: "weekly",
        timesPerWeek: 1,
        durationMinutes: 90,
        workType: "reflective",
        historyWeeks: 12,
        completionRate: 0.9,
      },
    });
  }

  // === Finance ===
  if (finance) {
    goalSeeds.push({
      pillarId: finance.id,
      title: "Miesięczny przegląd finansów",
      character: "Routine",
      routineConfig: {
        frequency: "weekly",
        timesPerWeek: 1,
        durationMinutes: 60,
        workType: "admin",
        historyWeeks: 10,
        completionRate: 0.75,
      },
    });
    goalSeeds.push({
      pillarId: finance.id,
      title: "Poduszka bezpieczeństwa 6× wydatków",
      character: "Project",
      weight: 5,
      deadlineDaysFromNow: 180,
      milestones: [
        {
          title: "Kalkulacja celu",
          tasks: [
            { title: "Średnie miesięczne wydatki", status: "Done", workType: "admin" },
            { title: "Cel: 6× wydatki", status: "Done", workType: "admin" },
          ],
        },
        {
          title: "Plan oszczędzania",
          tasks: [
            { title: "Stały zlecony przelew", status: "InProgress", workType: "admin" },
            { title: "Tnij 2 niepotrzebne subskrypcje", status: "Todo", workType: "admin" },
          ],
        },
      ],
    });
  }

  // === Dom ===
  if (home) {
    goalSeeds.push({
      pillarId: home.id,
      title: "Sobotnie sprzątanie",
      character: "Routine",
      routineConfig: {
        frequency: "weekly",
        timesPerWeek: 1,
        durationMinutes: 90,
        workType: "routine",
        historyWeeks: 10,
        completionRate: 0.8,
      },
    });
  }

  // === Product / sales (founder template) ===
  if (product) {
    goalSeeds.push({
      pillarId: product.id,
      title: "Roadmap Q2 — 3 features",
      character: "Project",
      weight: 7,
      deadlineDaysFromNow: 75,
      milestones: [
        {
          title: "Feature A: notyfikacje",
          tasks: [
            { title: "Spec techniczny", status: "Done", workType: "deep" },
            { title: "Implementacja backendu", status: "InProgress", workType: "deep" },
            { title: "Implementacja frontendu", status: "Todo", workType: "deep" },
          ],
        },
        {
          title: "Feature B: integracja Slack",
          tasks: [
            { title: "Research API Slacka", status: "Todo", workType: "deep" },
            { title: "OAuth flow", status: "Todo", workType: "deep" },
          ],
        },
        {
          title: "Feature C: dashboard analityczny",
          tasks: [{ title: "Spec techniczny", status: "Todo", workType: "deep" }],
        },
      ],
    });
  }
  if (sales) {
    goalSeeds.push({
      pillarId: sales.id,
      title: "10 calli z prospectami / tydz",
      character: "Routine",
      routineConfig: {
        frequency: "weekly",
        timesPerWeek: 5,
        durationMinutes: 30,
        workType: "social",
        historyWeeks: 8,
        completionRate: 0.75,
      },
    });
  }

  // === Historical goals (Done / Abandoned / Paused) — for Lifecycle tab ===
  if (work) {
    goalSeeds.push({
      pillarId: work.id,
      title: "Migracja na nowy framework — Q1",
      character: "Project",
      status: "Done",
      weight: 6,
      milestones: [
        {
          title: "Audyt zależności",
          tasks: [
            { title: "Lista pakietów do wymiany", status: "Done", workType: "shallow" },
            { title: "POC migracji", status: "Done", workType: "deep" },
          ],
        },
        {
          title: "Wdrożenie",
          tasks: [
            { title: "Migracja modułów A-C", status: "Done", workType: "deep" },
            { title: "Testy regresji", status: "Done", workType: "shallow" },
            { title: "Deploy + monitoring", status: "Done", workType: "shallow" },
          ],
        },
      ],
    });
  }
  if (body) {
    goalSeeds.push({
      pillarId: body.id,
      title: "Crossfit — eksperyment 2-mies.",
      character: "Routine",
      status: "Abandoned",
      routineConfig: {
        frequency: "weekly",
        timesPerWeek: 3,
        durationMinutes: 60,
        workType: "physical",
        historyWeeks: 8,
        completionRate: 0.4,
      },
    });
  }
  if (mind) {
    goalSeeds.push({
      pillarId: mind.id,
      title: "Kurs SQL na Courserze",
      character: "Project",
      status: "Paused",
      weight: 3,
      milestones: [
        {
          title: "Moduł 1: podstawy",
          tasks: [
            { title: "Lekcje 1-5", status: "Done", workType: "deep" },
            { title: "Quiz 1", status: "Done", workType: "shallow" },
          ],
        },
        {
          title: "Moduł 2: joins",
          tasks: [
            { title: "Lekcje 6-10", status: "Todo", workType: "deep" },
            { title: "Projekt końcowy", status: "Todo", workType: "creative" },
          ],
        },
      ],
    });
  }

  // ----- Apply -----
  let goalsAdded = 0;
  for (let gi = 0; gi < goalSeeds.length; gi++) {
    const gs = goalSeeds[gi];
    const goalId = state.addGoal({
      pillarId: gs.pillarId,
      title: gs.title,
      description: gs.description,
      vision: gs.vision,
      character: gs.character,
      status: gs.status ?? "Active",
      weight: gs.weight,
      deadline: gs.deadlineDaysFromNow
        ? format(addDays(new Date(), gs.deadlineDaysFromNow), "yyyy-MM-dd")
        : undefined,
      milestones: gs.milestones ? [] : undefined,
      routineConfig: gs.routineConfig
        ? {
            frequency: gs.routineConfig.frequency,
            timesPerWeek: gs.routineConfig.timesPerWeek,
            durationMinutes: gs.routineConfig.durationMinutes,
            workType: gs.routineConfig.workType,
            completions: generateRoutineCompletions(
              {
                frequency: gs.routineConfig.frequency,
                timesPerWeek: gs.routineConfig.timesPerWeek,
                historyWeeks: gs.routineConfig.historyWeeks ?? 8,
                completionRate: gs.routineConfig.completionRate ?? 0.7,
              },
              gi + 1, // pseudo-seed per goal
            ),
          }
        : undefined,
    });

    // Milestones
    for (let mi = 0; mi < (gs.milestones?.length ?? 0); mi++) {
      const m = gs.milestones![mi];
      const milestoneInput: Omit<Milestone, "id" | "goalId"> = {
        title: m.title,
        order: mi,
        deadline: m.deadlineDaysFromNow
          ? format(addDays(new Date(), m.deadlineDaysFromNow), "yyyy-MM-dd")
          : undefined,
        character: gs.character === "Mixed" ? m.character : undefined,
        tasks:
          (gs.character !== "Mixed" || m.character === "Project") && m.tasks ? [] : undefined,
        routineConfig:
          gs.character === "Mixed" && m.character === "Routine"
            ? {
                frequency: "weekly",
                timesPerWeek: 1,
                durationMinutes: 60,
                workType: "creative",
                completions: generateRoutineCompletions(
                  {
                    frequency: "weekly",
                    timesPerWeek: 1,
                    historyWeeks: 10,
                    completionRate: m.routineCompletionRate ?? 0.7,
                  },
                  mi + 7,
                ),
              }
            : undefined,
      };
      const mid = state.addMilestone(goalId, milestoneInput);
      if (m.tasks && (gs.character !== "Mixed" || m.character === "Project")) {
        for (const t of m.tasks) {
          state.addTask(goalId, mid, {
            title: t.title,
            status: t.status,
            workType: t.workType,
            completedAt: t.status === "Done" ? new Date().toISOString() : undefined,
          });
        }
      }
    }
    goalsAdded++;
  }

  // ----- Slot completions for last 13 weeks with weekly variability -----
  // Pattern: 13 weeks of adherence multipliers — realistic ebb & flow
  const weeklyAdherence = [
    0.55, 0.60, 0.70, 0.80, 0.85, 0.90, 0.75, 0.65, 0.70, 0.85, 0.90, 0.80, 0.78,
  ]; // index 0 = oldest week, index 12 = current week
  const slots = state.calendar.template.slots;
  const newCompletions: SlotCompletion[] = [];
  const today = new Date();
  const rand = seededRandom(13);
  const totalDays = 13 * 7; // 91 days
  for (let d = 0; d < totalDays; d++) {
    const date = subDays(today, d);
    if (date > today) continue;
    const dow = date.getDay();
    const monday = startOfWeek(date, { weekStartsOn: 1 });
    const weekIdx = Math.min(12, Math.max(0, 12 - Math.floor(d / 7)));
    const baseRate = weeklyAdherence[weekIdx];
    const slotsForDay = slots.filter((s) => s.dayOfWeek === dow);
    for (const s of slotsForDay) {
      // Routine slots (sleep/hygiene) are auto-done; buffer skipped sometimes
      const typeMultiplier =
        s.workType === "routine"
          ? 1.15
          : s.workType === "buffer"
          ? 0.6
          : 1.0;
      const completionRate = Math.min(0.97, baseRate * typeMultiplier);
      if (rand() < completionRate) {
        newCompletions.push({
          id: uid(),
          slotId: s.id,
          weekStartDate: format(monday, "yyyy-MM-dd"),
          date: format(date, "yyyy-MM-dd"),
          // Of the attempted, ~88% genuinely completed (binary Yes/No)
          completed: rand() > 0.12,
          attemptedAt: date.toISOString(),
        });
      }
    }
  }

  // Append to store
  useStore.setState({
    slotCompletions: [...state.slotCompletions, ...newCompletions],
  });

  // ----- Thoughts -----
  const sampleThoughts = [
    {
      text: "Tydzień głębokiej pracy 4 dni z rzędu — czuję flow. Klucz: rano blok 8-11 bez powiadomień.",
      pillarId: work?.id,
    },
    {
      text: "Trening dziś trochę zbyt intensywny. Następnym razem lżej w środę po długim dniu kalls'ów.",
      pillarId: body?.id,
    },
    {
      text: "Zauważyłem, że gdy robię niedzielny rytuał, cały tydzień idzie spokojniej. Nie odpuszczać.",
      pillarId: self?.id,
    },
    {
      text: "Atomic Habits — koncepcja \"identity-based habits\" mocno mi rezonuje. Muszę przepisać 1 zdanie z rozdziału 2.",
      pillarId: mind?.id,
    },
    {
      text: "Kolacja z A. — pierwszy raz od miesięcy bez telefonu na stole. Powinienem to robić częściej.",
      pillarId: socialP?.id,
    },
    {
      text: "Bilans Ciała ostatnio rozjeżdża się w lewo. Dorzucić 1 spacer w środę?",
      pillarId: body?.id,
    },
    {
      text: "Idea: dashboard z 3 najpilniejszymi taskami z każdego filaru. Mniejszy paraliż wyboru rano.",
      pillarId: work?.id,
    },
    {
      text: "Wieczorny journaling po treningu działa lepiej niż przed snem — głowa już spokojniejsza.",
      pillarId: self?.id,
    },
  ];

  let thoughtsAdded = 0;
  // Add thoughts with various dates spread over last 14 days
  for (let i = 0; i < sampleThoughts.length; i++) {
    const t = sampleThoughts[i];
    if (!t.pillarId) continue;
    state.addThought({
      text: t.text,
      pillarId: t.pillarId,
      source: "manual",
    });
    thoughtsAdded++;
  }

  return { goalsAdded, completionsAdded: newCompletions.length, thoughtsAdded };
}
