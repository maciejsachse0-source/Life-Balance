"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { Modal } from "./Modal";
import type { DayOfWeek, WorkType } from "@/lib/types";
import { DAY_NAMES_LONG, minuteToTimeStr, inferWorkType } from "@/lib/utils";

type Props = {
  open: boolean;
  onClose: () => void;
  defaultDay?: DayOfWeek;
  defaultStartMinute?: number;
};

export function AddSlotModal({ open, onClose, defaultDay = 1, defaultStartMinute = 9 * 60 }: Props) {
  const pillars = useStore((s) => s.layers.pillars);
  const addSlot = useStore((s) => s.addSlot);

  const [pillarId, setPillarId] = useState(pillars[0]?.id ?? "");
  const [day, setDay] = useState<DayOfWeek>(defaultDay);
  const [start, setStart] = useState(defaultStartMinute);
  const [duration, setDuration] = useState(60);

  const submit = () => {
    if (!pillarId) return;
    const pillar = pillars.find((p) => p.id === pillarId);
    if (!pillar) return;
    const wt: WorkType = inferWorkType(pillar, Math.floor(start / 60));
    addSlot({
      dayOfWeek: day,
      startMinute: start,
      durationMinutes: duration,
      pillarId,
      workType: wt,
    });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Nowy slot">
      <div className="space-y-4">
        <div>
          <label className="block text-xs text-neutral-500 mb-1">Filar</label>
          <select
            value={pillarId}
            onChange={(e) => setPillarId(e.target.value)}
            className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm"
          >
            {pillars.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-neutral-500 mb-1">Dzień</label>
          <select
            value={day}
            onChange={(e) => setDay(Number(e.target.value) as DayOfWeek)}
            className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm"
          >
            {[1, 2, 3, 4, 5, 6, 0].map((d) => (
              <option key={d} value={d}>
                {DAY_NAMES_LONG[d]}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Start</label>
            <select
              value={start}
              onChange={(e) => setStart(Number(e.target.value))}
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm"
            >
              {Array.from({ length: 48 }, (_, i) => i * 30).map((m) => (
                <option key={m} value={m}>
                  {minuteToTimeStr(m)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Czas trwania</label>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm"
            >
              {[30, 60, 90, 120, 150, 180, 240].map((m) => (
                <option key={m} value={m}>
                  {m >= 60 ? `${Math.floor(m / 60)}h ${m % 60 > 0 ? `${m % 60}min` : ""}` : `${m} min`}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-neutral-200 rounded-lg text-sm hover:border-neutral-400"
          >
            Anuluj
          </button>
          <button
            onClick={submit}
            disabled={!pillarId}
            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium disabled:bg-neutral-300"
          >
            Dodaj
          </button>
        </div>
      </div>
    </Modal>
  );
}
