"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  AppState,
  Goal,
  Layers,
  LayerCategory,
  Pillar,
  Slot,
  Thought,
  Settings,
  WeekTemplate,
  Milestone,
  Task,
  GoalCharacter,
} from "./types";
import { uid } from "./utils";
import { TEMPLATES, getTemplate } from "./templates";
import { generateWeekTemplate } from "./generate-template";

const SCHEMA_VERSION = 1;
const STORAGE_KEY = "zwr-app-state-v1";

const initialSettings: Settings = {
  balanceMode: "calendar_month",
  lastCalendarView: "week",
  lastGoalViewPerGoalId: {},
  changeCounter: 0,
  onboardingCompleted: false,
};

const emptyLayers: Layers = {
  physiology: [],
  lifeTaxes: [],
  pillars: [],
};

type StoreActions = {
  // Onboarding
  applyTemplate: (templateId: string) => void;
  completeOnboarding: () => void;
  resetAll: () => void;

  // Layers / pillars
  setLayers: (layers: Layers) => void;
  updatePhysiologyCategory: (id: string, patch: Partial<LayerCategory>) => void;
  addPhysiologyCategory: (cat: Omit<LayerCategory, "id">) => void;
  removePhysiologyCategory: (id: string) => void;
  updateTaxCategory: (id: string, patch: Partial<LayerCategory>) => void;
  addTaxCategory: (cat: Omit<LayerCategory, "id">) => void;
  removeTaxCategory: (id: string) => void;
  updatePillar: (id: string, patch: Partial<Pillar>) => void;
  addPillar: (p: Omit<Pillar, "id">) => void;
  removePillar: (id: string) => void;

  // Calendar
  regenerateTemplate: () => void;
  updateSlot: (slotId: string, patch: Partial<Slot>) => void;
  replaceSlots: (slots: Slot[]) => void;
  removeSlot: (slotId: string) => void;
  addSlot: (slot: Omit<Slot, "id">) => void;
  toggleSlotCompletion: (slotId: string, weekStartDate: string, date: string, completed: boolean) => void;

  // Goals
  addGoal: (g: Omit<Goal, "id" | "createdAt" | "updatedAt">) => string;
  updateGoal: (id: string, patch: Partial<Goal>) => void;
  removeGoal: (id: string) => void;
  addMilestone: (goalId: string, m: Omit<Milestone, "id" | "goalId">) => string;
  updateMilestone: (goalId: string, milestoneId: string, patch: Partial<Milestone>) => void;
  removeMilestone: (goalId: string, milestoneId: string) => void;
  addTask: (goalId: string, milestoneId: string, t: Omit<Task, "id" | "goalId" | "milestoneId" | "createdAt" | "manualReassignCount">) => string;
  updateTask: (goalId: string, milestoneId: string, taskId: string, patch: Partial<Task>) => void;
  removeTask: (goalId: string, milestoneId: string, taskId: string) => void;

  // Routine completions
  toggleRoutineCompletion: (goalId: string, date: string, completed: boolean) => void;
  setRoutineConfig: (goalId: string, config: Goal["routineConfig"]) => void;

  // Thoughts
  addThought: (t: Omit<Thought, "id" | "createdAt">) => void;
  removeThought: (id: string) => void;

  // Settings
  setBalanceMode: (mode: Settings["balanceMode"]) => void;
  setLastCalendarView: (view: Settings["lastCalendarView"]) => void;
  setLastGoalView: (goalId: string, view: Settings["lastGoalViewPerGoalId"][string]) => void;
};

type Store = AppState & StoreActions;

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      schemaVersion: SCHEMA_VERSION,
      settings: initialSettings,
      layers: emptyLayers,
      goals: [],
      calendar: { template: { slots: [] }, weekOverrides: [] },
      slotCompletions: [],
      thoughts: [],

      applyTemplate: (templateId) => {
        const tpl = getTemplate(templateId);
        if (!tpl) return;
        const pillars: Pillar[] = tpl.layers.pillars.map((p) => ({ ...p, id: uid() }));
        const layers: Layers = {
          physiology: tpl.layers.physiology.map((c) => ({ ...c })),
          lifeTaxes: tpl.layers.lifeTaxes.map((c) => ({ ...c })),
          pillars,
        };
        const template: WeekTemplate = generateWeekTemplate(layers);
        set({
          layers,
          calendar: { template, weekOverrides: [] },
          settings: { ...get().settings, selectedTemplate: templateId },
        });
      },

      completeOnboarding: () => set({ settings: { ...get().settings, onboardingCompleted: true } }),

      resetAll: () =>
        set({
          schemaVersion: SCHEMA_VERSION,
          settings: initialSettings,
          layers: emptyLayers,
          goals: [],
          calendar: { template: { slots: [] }, weekOverrides: [] },
          slotCompletions: [],
          thoughts: [],
        }),

      setLayers: (layers) => set({ layers }),

      updatePhysiologyCategory: (id, patch) =>
        set({
          layers: {
            ...get().layers,
            physiology: get().layers.physiology.map((c) => (c.id === id ? { ...c, ...patch } : c)),
          },
        }),

      addPhysiologyCategory: (cat) =>
        set({
          layers: {
            ...get().layers,
            physiology: [...get().layers.physiology, { ...cat, id: uid() }],
          },
        }),

      removePhysiologyCategory: (id) =>
        set({
          layers: {
            ...get().layers,
            physiology: get().layers.physiology.filter((c) => c.id !== id),
          },
        }),

      updateTaxCategory: (id, patch) =>
        set({
          layers: {
            ...get().layers,
            lifeTaxes: get().layers.lifeTaxes.map((c) => (c.id === id ? { ...c, ...patch } : c)),
          },
        }),

      addTaxCategory: (cat) =>
        set({
          layers: {
            ...get().layers,
            lifeTaxes: [...get().layers.lifeTaxes, { ...cat, id: uid() }],
          },
        }),

      removeTaxCategory: (id) =>
        set({
          layers: {
            ...get().layers,
            lifeTaxes: get().layers.lifeTaxes.filter((c) => c.id !== id),
          },
        }),

      updatePillar: (id, patch) =>
        set({
          layers: {
            ...get().layers,
            pillars: get().layers.pillars.map((p) => (p.id === id ? { ...p, ...patch } : p)),
          },
        }),

      addPillar: (p) =>
        set({
          layers: {
            ...get().layers,
            pillars: [...get().layers.pillars, { ...p, id: uid() }],
          },
        }),

      removePillar: (id) =>
        set({
          layers: {
            ...get().layers,
            pillars: get().layers.pillars.filter((p) => p.id !== id),
          },
          goals: get().goals.filter((g) => g.pillarId !== id),
        }),

      regenerateTemplate: () => {
        const template = generateWeekTemplate(get().layers);
        set({ calendar: { template, weekOverrides: get().calendar.weekOverrides } });
      },

      updateSlot: (slotId, patch) =>
        set({
          calendar: {
            ...get().calendar,
            template: {
              slots: get().calendar.template.slots.map((s) => (s.id === slotId ? { ...s, ...patch } : s)),
            },
          },
        }),

      replaceSlots: (slots) =>
        set({
          calendar: {
            ...get().calendar,
            template: { slots },
          },
        }),

      removeSlot: (slotId) =>
        set({
          calendar: {
            ...get().calendar,
            template: { slots: get().calendar.template.slots.filter((s) => s.id !== slotId) },
          },
        }),

      addSlot: (slot) =>
        set({
          calendar: {
            ...get().calendar,
            template: { slots: [...get().calendar.template.slots, { ...slot, id: uid() }] },
          },
        }),

      toggleSlotCompletion: (slotId, weekStartDate, date, completed) => {
        const existing = get().slotCompletions.find(
          (c) => c.slotId === slotId && c.date === date,
        );
        if (existing) {
          set({
            slotCompletions: get().slotCompletions.map((c) =>
              c.id === existing.id ? { ...c, completed, attemptedAt: new Date().toISOString() } : c,
            ),
          });
        } else {
          set({
            slotCompletions: [
              ...get().slotCompletions,
              {
                id: uid(),
                slotId,
                weekStartDate,
                date,
                completed,
                attemptedAt: new Date().toISOString(),
              },
            ],
          });
        }
      },

      addGoal: (g) => {
        const id = uid();
        const now = new Date().toISOString();
        const newGoal: Goal = { ...g, id, createdAt: now, updatedAt: now };
        set({ goals: [...get().goals, newGoal] });
        return id;
      },

      updateGoal: (id, patch) =>
        set({
          goals: get().goals.map((g) =>
            g.id === id ? { ...g, ...patch, updatedAt: new Date().toISOString() } : g,
          ),
        }),

      removeGoal: (id) => set({ goals: get().goals.filter((g) => g.id !== id) }),

      addMilestone: (goalId, m) => {
        const id = uid();
        set({
          goals: get().goals.map((g) =>
            g.id === goalId
              ? {
                  ...g,
                  milestones: [...(g.milestones ?? []), { ...m, id, goalId }],
                  updatedAt: new Date().toISOString(),
                }
              : g,
          ),
        });
        return id;
      },

      updateMilestone: (goalId, milestoneId, patch) =>
        set({
          goals: get().goals.map((g) =>
            g.id === goalId
              ? {
                  ...g,
                  milestones: (g.milestones ?? []).map((m) =>
                    m.id === milestoneId ? { ...m, ...patch } : m,
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : g,
          ),
        }),

      removeMilestone: (goalId, milestoneId) =>
        set({
          goals: get().goals.map((g) =>
            g.id === goalId
              ? {
                  ...g,
                  milestones: (g.milestones ?? []).filter((m) => m.id !== milestoneId),
                  updatedAt: new Date().toISOString(),
                }
              : g,
          ),
        }),

      addTask: (goalId, milestoneId, t) => {
        const id = uid();
        const now = new Date().toISOString();
        const newTask: Task = {
          ...t,
          id,
          goalId,
          milestoneId,
          createdAt: now,
          manualReassignCount: 0,
        };
        set({
          goals: get().goals.map((g) =>
            g.id === goalId
              ? {
                  ...g,
                  milestones: (g.milestones ?? []).map((m) =>
                    m.id === milestoneId
                      ? { ...m, tasks: [...(m.tasks ?? []), newTask] }
                      : m,
                  ),
                  updatedAt: now,
                }
              : g,
          ),
        });
        return id;
      },

      updateTask: (goalId, milestoneId, taskId, patch) =>
        set({
          goals: get().goals.map((g) =>
            g.id === goalId
              ? {
                  ...g,
                  milestones: (g.milestones ?? []).map((m) =>
                    m.id === milestoneId
                      ? {
                          ...m,
                          tasks: (m.tasks ?? []).map((t) =>
                            t.id === taskId ? { ...t, ...patch } : t,
                          ),
                        }
                      : m,
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : g,
          ),
        }),

      removeTask: (goalId, milestoneId, taskId) =>
        set({
          goals: get().goals.map((g) =>
            g.id === goalId
              ? {
                  ...g,
                  milestones: (g.milestones ?? []).map((m) =>
                    m.id === milestoneId
                      ? { ...m, tasks: (m.tasks ?? []).filter((t) => t.id !== taskId) }
                      : m,
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : g,
          ),
        }),

      toggleRoutineCompletion: (goalId, date, completed) =>
        set({
          goals: get().goals.map((g) => {
            if (g.id !== goalId || !g.routineConfig) return g;
            const existing = g.routineConfig.completions.find((c) => c.date === date);
            const completions = existing
              ? g.routineConfig.completions.map((c) =>
                  c.date === date ? { ...c, completed } : c,
                )
              : [...g.routineConfig.completions, { id: uid(), date, completed }];
            return {
              ...g,
              routineConfig: { ...g.routineConfig, completions },
              updatedAt: new Date().toISOString(),
            };
          }),
        }),

      setRoutineConfig: (goalId, config) =>
        set({
          goals: get().goals.map((g) =>
            g.id === goalId ? { ...g, routineConfig: config, updatedAt: new Date().toISOString() } : g,
          ),
        }),

      addThought: (t) =>
        set({
          thoughts: [
            { ...t, id: uid(), createdAt: new Date().toISOString() },
            ...get().thoughts,
          ],
        }),

      removeThought: (id) => set({ thoughts: get().thoughts.filter((t) => t.id !== id) }),

      setBalanceMode: (mode) => set({ settings: { ...get().settings, balanceMode: mode } }),
      setLastCalendarView: (view) => set({ settings: { ...get().settings, lastCalendarView: view } }),
      setLastGoalView: (goalId, view) =>
        set({
          settings: {
            ...get().settings,
            lastGoalViewPerGoalId: { ...get().settings.lastGoalViewPerGoalId, [goalId]: view },
          },
        }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      version: SCHEMA_VERSION,
    },
  ),
);

export const TEMPLATES_LIST = TEMPLATES;
