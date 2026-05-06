"use client";

import { format, parseISO, isSameDay } from "date-fns";
import { pl } from "date-fns/locale";
import { buildHeatmapMatrix } from "@/lib/routine";
import type { RoutineCompletion } from "@/lib/types";

type Props = {
  completions: RoutineCompletion[];
  color: string;
  weeks?: number;
  onToggle?: (date: string, currentlyDone: boolean) => void;
};

export function Heatmap({ completions, color, weeks = 12, onToggle }: Props) {
  const matrix = buildHeatmapMatrix(completions, weeks);
  const today = new Date();

  const dayLabels = ["Pn", "Wt", "Śr", "Cz", "Pt", "Sb", "Nd"];

  return (
    <div className="overflow-x-auto">
      <div className="inline-flex flex-col gap-1">
        <div className="grid grid-cols-[24px_repeat(7,16px)] gap-1 text-[10px] text-neutral-400">
          <div />
          {dayLabels.map((d) => (
            <div key={d} className="text-center">
              {d}
            </div>
          ))}
        </div>
        {matrix.map((week, wi) => {
          const weekStartDate = week[0]?.date;
          const weekStart = weekStartDate ? format(parseISO(weekStartDate), "d MMM", { locale: pl }) : "";
          return (
            <div key={wi} className="grid grid-cols-[24px_repeat(7,16px)] gap-1 items-center">
              <div className="text-[9px] text-neutral-400 text-right pr-1">{weekStart}</div>
              {week.map((cell) => {
                const date = parseISO(cell.date);
                const isToday = isSameDay(date, today);
                const future = date > today;
                return (
                  <button
                    key={cell.date}
                    type="button"
                    disabled={future || !onToggle}
                    onClick={() => onToggle?.(cell.date, cell.done)}
                    className={`w-4 h-4 rounded-sm transition ${
                      future ? "opacity-30 cursor-default" : "hover:scale-110"
                    } ${isToday ? "ring-1 ring-neutral-900" : ""}`}
                    style={{
                      backgroundColor: cell.done ? color : "#f4f4f5",
                    }}
                    title={`${cell.date}${cell.done ? " — wykonane" : ""}`}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
