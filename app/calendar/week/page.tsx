"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/hydration";
import { Spinner } from "@/components/Spinner";
import { SlotEditPanel } from "@/components/SlotEditPanel";
import { AddSlotModal } from "@/components/AddSlotModal";
import { ConflictModal } from "@/components/ConflictModal";
import type { AppState, Slot, DayOfWeek } from "@/lib/types";
import { DAY_NAMES, minuteToTimeStr } from "@/lib/utils";
import {
  findConflicts,
  pushConflictsLater,
  replaceConflicts,
  mergeWithConflicts,
  snapMinute,
  clampMinute,
} from "@/lib/slot-edit";
import { resolveSlotContext, type SlotContext } from "@/lib/slot-context";
import { startOfWeek, addDays, format } from "date-fns";
import { pl } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, Sparkles } from "lucide-react";

const HOUR_START = 7;
const HOUR_END = 24;
const HOURS = HOUR_END - HOUR_START;
const SLOT_HEIGHT = 40; // px per 30 min
const ROW_HEIGHT = SLOT_HEIGHT * 2;
const MIN_DURATION = 30;

type DragMode = "move" | "resize-top" | "resize-bottom";

type DragState = {
  slotId: string;
  mode: DragMode;
  pointerId: number;
  startY: number;
  startStartMinute: number;
  startDuration: number;
  startDay: DayOfWeek;
  draft: Slot;
};

export default function WeekCalendarPage() {
  const hydrated = useHydrated();
  const slots = useStore((s) => s.calendar.template.slots);
  const pillars = useStore((s) => s.layers.pillars);
  const physiology = useStore((s) => s.layers.physiology);
  const lifeTaxes = useStore((s) => s.layers.lifeTaxes);
  const goals = useStore((s) => s.goals);
  const slotCompletions = useStore((s) => s.slotCompletions);
  const updateSlot = useStore((s) => s.updateSlot);
  const replaceSlots = useStore((s) => s.replaceSlots);
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [addModal, setAddModal] = useState<{ day: DayOfWeek; start: number } | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const rafRef = useRef<number | null>(null);
  const [pendingResolve, setPendingResolve] = useState<{
    draft: Slot;
    conflicts: Slot[];
  } | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Cancel any pending animation frame on unmount.
  useEffect(() => () => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
  }, []);

  // Resolve goal/milestone/task labels per slot once per relevant data change —
  // NOT on every drag pointer move. This is the main perf win for resize/move.
  const slotContexts = useMemo<Map<string, SlotContext>>(() => {
    const fakeState = {
      goals,
      calendar: { template: { slots }, weekOverrides: [] },
      slotCompletions,
    } as unknown as AppState;
    const map = new Map<string, SlotContext>();
    for (const s of slots) map.set(s.id, resolveSlotContext(fakeState, s));
    return map;
  }, [goals, slots, slotCompletions]);

  // Memoize per-day slot bucket — re-runs only when slot list changes.
  const slotsByDay = useMemo<Record<DayOfWeek, Slot[]>>(() => {
    const buckets: Record<DayOfWeek, Slot[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
    for (const s of slots) {
      if (s.startMinute < HOUR_START * 60 || s.startMinute >= HOUR_END * 60) continue;
      buckets[s.dayOfWeek].push(s);
    }
    for (const k of Object.keys(buckets) as unknown as DayOfWeek[]) {
      buckets[k].sort((a, b) => a.startMinute - b.startMinute);
    }
    return buckets;
  }, [slots]);

  // Quick lookup sets for label/color resolution — O(1) instead of array scans.
  const pillarIds = useMemo(() => new Set(pillars.map((p) => p.id)), [pillars]);

  const lookups = useMemo(() => {
    const colorById = new Map<string, string>();
    const nameById = new Map<string, string>();
    for (const p of pillars) {
      colorById.set(p.id, p.color);
      nameById.set(p.id, p.name);
    }
    for (const c of physiology) {
      colorById.set(c.id, "#a3a3a3");
      nameById.set(c.id, c.name);
    }
    for (const c of lifeTaxes) {
      colorById.set(c.id, "#737373");
      nameById.set(c.id, c.name);
    }
    return { colorById, nameById };
  }, [pillars, physiology, lifeTaxes]);

  if (!hydrated) return <Spinner />;

  const baseMonday = startOfWeek(new Date(), { weekStartsOn: 1 });
  const monday = addDays(baseMonday, weekOffset * 7);
  const daysOrder: DayOfWeek[] = [1, 2, 3, 4, 5, 6, 0];

  const getColor = (slot: Slot): string => lookups.colorById.get(slot.pillarId) ?? "#737373";
  const getLabel = (slot: Slot): string => lookups.nameById.get(slot.pillarId) ?? "?";

  const slotsForDay = (day: DayOfWeek) => slotsByDay[day];

  const selectedSlot = selectedSlotId ? slots.find((s) => s.id === selectedSlotId) : null;

  // Determine target day at pointer X
  const dayAtPointerX = (clientX: number): DayOfWeek | null => {
    const el = document.elementFromPoint(clientX, gridRef.current?.getBoundingClientRect().top ?? 0);
    let cur: HTMLElement | null = el as HTMLElement;
    while (cur) {
      const d = cur.getAttribute?.("data-day-col");
      if (d != null) return Number(d) as DayOfWeek;
      cur = cur.parentElement;
    }
    return null;
  };

  const onSlotPointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    slot: Slot,
    mode: DragMode,
  ) => {
    if (slot.isFixed && mode !== "move") return;
    e.stopPropagation();
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const ds: DragState = {
      slotId: slot.id,
      mode,
      pointerId: e.pointerId,
      startY: e.clientY,
      startStartMinute: slot.startMinute,
      startDuration: slot.durationMinutes,
      startDay: slot.dayOfWeek,
      draft: { ...slot },
    };
    dragRef.current = ds;
    setDrag(ds);
  };

  const onSlotPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const ds = dragRef.current;
    if (!ds || ds.pointerId !== e.pointerId) return;
    // Capture pointer values now (event may be reused/pooled by React).
    const clientY = e.clientY;
    const clientX = e.clientX;
    // Coalesce moves to one update per animation frame.
    if (rafRef.current != null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const cur = dragRef.current;
      if (!cur) return;
      const dy = clientY - cur.startY;
      const minuteDelta = Math.round((dy / SLOT_HEIGHT) * 30);
      let draft: Slot = { ...cur.draft };
      if (cur.mode === "move") {
        const newStart = clampMinute(
          snapMinute(cur.startStartMinute + minuteDelta),
          0,
          24 * 60 - cur.startDuration,
        );
        const targetDay = dayAtPointerX(clientX);
        draft = {
          ...draft,
          startMinute: newStart,
          dayOfWeek: targetDay !== null ? targetDay : cur.startDay,
        };
      } else if (cur.mode === "resize-top") {
        const newStart = clampMinute(
          snapMinute(cur.startStartMinute + minuteDelta),
          0,
          cur.startStartMinute + cur.startDuration - MIN_DURATION,
        );
        const newDuration = cur.startStartMinute + cur.startDuration - newStart;
        draft = { ...draft, startMinute: newStart, durationMinutes: newDuration };
      } else {
        // resize-bottom
        const newDuration = Math.max(
          MIN_DURATION,
          snapMinute(cur.startDuration + minuteDelta),
        );
        const maxDuration = 24 * 60 - cur.startStartMinute;
        draft = { ...draft, durationMinutes: Math.min(newDuration, maxDuration) };
      }
      // Skip state update if nothing actually changed (avoids re-render on micro-pixel jitter within a 30-min snap).
      if (
        draft.startMinute === cur.draft.startMinute &&
        draft.durationMinutes === cur.draft.durationMinutes &&
        draft.dayOfWeek === cur.draft.dayOfWeek
      ) {
        return;
      }
      const next = { ...cur, draft };
      dragRef.current = next;
      setDrag(next);
    });
  };

  const onSlotPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const ds = dragRef.current;
    if (!ds || ds.pointerId !== e.pointerId) return;
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    const { draft } = ds;
    const conflicts = findConflicts(slots, draft);
    if (conflicts.length === 0) {
      // No conflict — commit if anything actually changed
      if (
        draft.startMinute !== ds.startStartMinute ||
        draft.durationMinutes !== ds.startDuration ||
        draft.dayOfWeek !== ds.startDay
      ) {
        updateSlot(ds.slotId, {
          startMinute: draft.startMinute,
          durationMinutes: draft.durationMinutes,
          dayOfWeek: draft.dayOfWeek,
        });
      }
    } else {
      setPendingResolve({ draft, conflicts });
    }

    dragRef.current = null;
    setDrag(null);
  };

  const handleResolve = (resolution: "replace" | "push" | "merge" | "cancel") => {
    if (!pendingResolve) return;
    const { draft, conflicts } = pendingResolve;
    if (resolution === "cancel") {
      setPendingResolve(null);
      return;
    }
    const baseSlots = slots.map((s) => (s.id === draft.id ? draft : s));
    if (resolution === "replace") {
      replaceSlots(replaceConflicts(baseSlots, conflicts));
    } else if (resolution === "push") {
      replaceSlots(pushConflictsLater(baseSlots, draft, conflicts));
    } else if (resolution === "merge") {
      const { merged, rest } = mergeWithConflicts(baseSlots, draft, conflicts);
      replaceSlots([...rest, merged]);
    }
    setPendingResolve(null);
  };

  const handleEmptyClick = (day: DayOfWeek, e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("[data-slot]")) return;
    if (dragRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const minutesFromStart = (y / ROW_HEIGHT) * 60;
    const startMinute = HOUR_START * 60 + Math.floor(minutesFromStart / 30) * 30;
    setAddModal({ day, start: Math.max(HOUR_START * 60, Math.min(23 * 60 + 30, startMinute)) });
  };

  // For visual feedback while dragging
  const dragLabel = drag
    ? (() => {
        const orig = slots.find((s) => s.id === drag.slotId);
        if (!orig) return null;
        const startDelta = drag.draft.startMinute - drag.startStartMinute;
        const durDelta = drag.draft.durationMinutes - drag.startDuration;
        const dayDelta = drag.draft.dayOfWeek !== drag.startDay;
        return {
          start: minuteToTimeStr(drag.draft.startMinute),
          end: minuteToTimeStr(drag.draft.startMinute + drag.draft.durationMinutes),
          duration: drag.draft.durationMinutes,
          deltaText:
            dayDelta || startDelta || durDelta
              ? `${dayDelta ? "→ inny dzień, " : ""}${
                  durDelta !== 0 ? `${durDelta > 0 ? "+" : ""}${durDelta} min trwania` : ""
                }${
                  startDelta !== 0 && durDelta === 0 ? `${startDelta > 0 ? "+" : ""}${startDelta} min` : ""
                }`
              : "",
        };
      })()
    : null;

  return (
    <main className="max-w-[1600px] mx-auto px-3 sm:px-6 py-5">
      <div className="flex items-center justify-between mb-4 px-2">
        <button
          onClick={() => setWeekOffset((o) => o - 1)}
          className="p-2 hover:bg-neutral-100 rounded"
          aria-label="Poprzedni tydzień"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="text-base font-medium">
          {format(monday, "d MMM", { locale: pl })} – {format(addDays(monday, 6), "d MMM yyyy", { locale: pl })}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekOffset((o) => o + 1)}
            className="p-2 hover:bg-neutral-100 rounded"
            aria-label="Następny tydzień"
          >
            <ChevronRight size={20} />
          </button>
          <button
            onClick={() => setAddModal({ day: 1, start: 9 * 60 })}
            className="ml-1 inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700"
          >
            <Plus size={14} /> Slot
          </button>
        </div>
      </div>

      <div
        className="bg-white border border-neutral-200 rounded-lg overflow-hidden"
        ref={gridRef}
      >
        <div className="grid grid-cols-[56px_repeat(7,1fr)] border-b border-neutral-200">
          <div className="bg-neutral-50" />
          {daysOrder.map((d, i) => {
            const date = addDays(monday, i);
            const isToday = format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
            return (
              <div
                key={d}
                className={`text-center py-3 text-sm border-l border-neutral-200 ${
                  isToday ? "bg-indigo-50 text-indigo-700 font-semibold" : "text-neutral-600"
                }`}
              >
                <div className="font-semibold">{DAY_NAMES[d]}</div>
                <div className="text-xs text-neutral-400 mt-0.5">{format(date, "d MMM", { locale: pl })}</div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-[56px_repeat(7,1fr)] relative">
          <div className="border-r border-neutral-200 bg-neutral-50">
            {Array.from({ length: HOURS }, (_, i) => HOUR_START + i).map((h) => (
              <div
                key={h}
                className="text-xs text-neutral-400 text-right pr-2 pt-1 border-b border-neutral-100"
                style={{ height: ROW_HEIGHT }}
              >
                {String(h).padStart(2, "0")}:00
              </div>
            ))}
          </div>

          {daysOrder.map((d) => (
            <div
              key={d}
              data-day-col={d}
              className="relative border-l border-neutral-200 cursor-cell hover:bg-neutral-50/50"
              style={{ height: HOURS * ROW_HEIGHT, touchAction: "none" }}
              onClick={(e) => handleEmptyClick(d, e)}
              title="Kliknij wolne miejsce, by dodać slot. Łap brzegi slotu, by zmienić rozmiar."
            >
              {Array.from({ length: HOURS }, (_, i) => i).map((i) => (
                <div
                  key={i}
                  className="absolute left-0 right-0 border-b border-neutral-100 pointer-events-none"
                  style={{ top: i * ROW_HEIGHT, height: ROW_HEIGHT }}
                />
              ))}
              {slotsForDay(d).map((s) => {
                const isDraggingThis = drag?.slotId === s.id;
                const eff = isDraggingThis ? drag.draft : s;
                if (eff.dayOfWeek !== d) return null; // moved to different day visually
                const top = ((eff.startMinute - HOUR_START * 60) / 30) * SLOT_HEIGHT;
                const height = (eff.durationMinutes / 30) * SLOT_HEIGHT;
                const color = getColor(s);
                const ctx = slotContexts.get(s.id) ?? { isSuggestion: false };
                const isPillarSlot = pillarIds.has(s.pillarId);
                return (
                  <div
                    key={s.id}
                    data-slot
                    className={`absolute left-1 right-1 rounded-md text-left overflow-hidden text-xs select-none ${
                      isDraggingThis ? "ring-2 ring-indigo-500 z-10 shadow-lg" : "hover:brightness-95"
                    }`}
                    style={
                      {
                        top,
                        height,
                        backgroundColor: `${color}${isDraggingThis ? "44" : "22"}`,
                        borderLeft: `4px solid ${color}`,
                        zIndex: isDraggingThis ? 20 : 1,
                        touchAction: "none",
                      } as React.CSSProperties
                    }
                    onPointerMove={onSlotPointerMove}
                    onPointerUp={onSlotPointerUp}
                    onPointerCancel={onSlotPointerUp}
                  >
                    {/* Top resize handle */}
                    {!s.isFixed ? (
                      <div
                        className="absolute top-0 left-0 right-0 h-2 cursor-ns-resize hover:bg-indigo-500/30"
                        onPointerDown={(e) => onSlotPointerDown(e, s, "resize-top")}
                      />
                    ) : null}
                    {/* Center body — move */}
                    <div
                      className="px-2 py-1 cursor-grab active:cursor-grabbing h-full w-full leading-snug"
                      onPointerDown={(e) => onSlotPointerDown(e, s, "move")}
                      onClick={(e) => {
                        if (drag) return;
                        e.stopPropagation();
                        setSelectedSlotId(s.id);
                      }}
                    >
                      <SlotContent
                        eff={eff}
                        color={color}
                        pillarLabel={getLabel(s)}
                        isPillarSlot={isPillarSlot}
                        ctx={ctx}
                      />
                    </div>
                    {/* Bottom resize handle */}
                    {!s.isFixed ? (
                      <div
                        className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize hover:bg-indigo-500/30"
                        onPointerDown={(e) => onSlotPointerDown(e, s, "resize-bottom")}
                      />
                    ) : null}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Live drag tooltip */}
      {drag && dragLabel ? (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-neutral-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg pointer-events-none z-30">
          <div className="font-medium">
            {dragLabel.start}–{dragLabel.end} ({dragLabel.duration} min)
          </div>
          {dragLabel.deltaText ? (
            <div className="text-neutral-300 text-[10px]">{dragLabel.deltaText}</div>
          ) : null}
        </div>
      ) : null}

      <p className="text-[11px] text-neutral-400 mt-2 px-2">
        Klik slotu — edycja. Łap środek — przeciągasz na inny dzień/godzinę. Łap brzeg — zmieniasz długość.
      </p>

      {selectedSlot && !drag ? (
        <SlotEditPanel slot={selectedSlot} onClose={() => setSelectedSlotId(null)} />
      ) : null}

      {addModal ? (
        <AddSlotModal
          open
          onClose={() => setAddModal(null)}
          defaultDay={addModal.day}
          defaultStartMinute={addModal.start}
        />
      ) : null}

      <ConflictModal
        open={!!pendingResolve}
        draft={pendingResolve?.draft ?? null}
        conflicts={pendingResolve?.conflicts ?? []}
        draftLabel={pendingResolve ? getLabel(pendingResolve.draft) : ""}
        conflictLabels={
          pendingResolve
            ? Object.fromEntries(pendingResolve.conflicts.map((c) => [c.id, getLabel(c)]))
            : {}
        }
        onResolve={handleResolve}
      />
    </main>
  );
}

const SlotContent = memo(function SlotContent({
  eff,
  color,
  pillarLabel,
  isPillarSlot,
  ctx,
}: {
  eff: Slot;
  color: string;
  pillarLabel: string;
  isPillarSlot: boolean;
  ctx: SlotContext;
}) {
  const dur = eff.durationMinutes;
  const time = `${minuteToTimeStr(eff.startMinute)}–${minuteToTimeStr(eff.startMinute + dur)}`;

  // Physiology / lifeTax slots: show only category + time (no goal context)
  if (!isPillarSlot) {
    return (
      <>
        <div className="font-medium text-sm truncate" style={{ color }}>
          {pillarLabel}
        </div>
        {dur >= 45 ? <div className="text-[11px] text-neutral-500 truncate mt-0.5">{time}</div> : null}
      </>
    );
  }

  const hasContext =
    !!ctx.goalTitle || !!ctx.taskTitle || !!ctx.routineProgress;

  // Primary line: task title if available, otherwise goal title, otherwise pillar label
  const primary = ctx.taskTitle ?? ctx.goalTitle ?? pillarLabel;

  // Secondary line: milestone (Project/Mixed) or routine progress, or pillar tag if no context
  let secondary: string | null = null;
  if (ctx.routineProgress) {
    secondary = `Rutyna · ${ctx.routineProgress.done}/${ctx.routineProgress.target} w tyg.`;
  } else if (ctx.milestoneTitle) {
    secondary = ctx.milestoneTitle;
  } else if (ctx.goalTitle && ctx.taskTitle) {
    secondary = ctx.goalTitle;
  }

  // Compact (30 min): single line — primary, with optional ✨ for suggestion
  if (dur < 60) {
    return (
      <div className="flex items-center gap-1 min-w-0">
        {ctx.isSuggestion && hasContext ? (
          <Sparkles size={11} className="text-amber-500 shrink-0" />
        ) : null}
        <span className="font-medium truncate" style={{ color }}>
          {primary}
        </span>
      </div>
    );
  }

  // Medium (60–89 min): pillar tag + primary + secondary if any
  if (dur < 90) {
    return (
      <>
        <div className="flex items-center gap-1 min-w-0">
          <span className="text-[10px] uppercase tracking-wide font-medium opacity-80 truncate" style={{ color }}>
            {pillarLabel}
          </span>
        </div>
        <div className="flex items-center gap-1 min-w-0 mt-0.5">
          {ctx.isSuggestion && hasContext ? (
            <Sparkles size={11} className="text-amber-500 shrink-0" />
          ) : null}
          <span className="font-semibold text-sm truncate text-neutral-800">{primary}</span>
        </div>
        {secondary ? (
          <div className="text-[11px] text-neutral-500 truncate mt-0.5">{secondary}</div>
        ) : null}
      </>
    );
  }

  // Spacious (90+ min): full hierarchy + time
  return (
    <>
      <div className="flex items-center justify-between gap-1 min-w-0">
        <span className="text-[10px] uppercase tracking-wide font-medium opacity-80 truncate" style={{ color }}>
          {pillarLabel}
        </span>
        <span className="text-[10px] text-neutral-400 shrink-0">{time}</span>
      </div>
      <div className="flex items-center gap-1 min-w-0 mt-1">
        {ctx.isSuggestion && hasContext ? (
          <Sparkles size={12} className="text-amber-500 shrink-0" />
        ) : null}
        <span className="font-semibold text-sm truncate text-neutral-800">{primary}</span>
      </div>
      {ctx.taskTitle && ctx.goalTitle ? (
        <div className="text-[11px] text-neutral-500 truncate mt-0.5">{ctx.goalTitle}</div>
      ) : null}
      {secondary ? (
        <div className="text-[11px] text-neutral-500 truncate">{secondary}</div>
      ) : null}
    </>
  );
});
