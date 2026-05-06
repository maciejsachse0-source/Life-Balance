"use client";

import { AlertTriangle } from "lucide-react";
import type { Pillar } from "@/lib/types";
import type { PillarBalance } from "@/lib/balance";

export function BalanceBar({
  pillar,
  balance,
  period = "month",
}: {
  pillar: Pillar;
  balance: PillarBalance;
  period?: "week" | "month";
}) {
  const pct = Math.max(0, Math.min(150, balance.percent));
  const barWidth = (pct / 150) * 100;
  const showWarn = balance.level === "medium" || balance.level === "strong";

  return (
    <div className="grid grid-cols-12 items-center gap-3 text-sm">
      <div className="col-span-3 sm:col-span-2 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: pillar.color }} />
        <span className="font-medium truncate">{pillar.name}</span>
      </div>
      <div className="col-span-6 sm:col-span-7">
        <div className="relative h-3 rounded-full bg-neutral-100 overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all"
            style={{
              width: `${barWidth}%`,
              backgroundColor: pillar.color,
              opacity: balance.level === "calm" ? 1 : 0.7,
            }}
          />
          {/* 100% marker line */}
          <div
            className="absolute inset-y-0 w-px bg-neutral-400"
            style={{ left: `${(100 / 150) * 100}%` }}
          />
        </div>
      </div>
      <div className="col-span-3 text-right tabular-nums text-xs">
        <div className="font-medium">{Math.round(balance.percent)}%</div>
        <div className="text-neutral-500">
          {balance.balance >= 0 ? "+" : ""}
          {balance.balance.toFixed(1)}h
        </div>
      </div>
      {showWarn ? (
        <div className="col-span-12 -mt-1 text-xs text-amber-700 flex items-center gap-1">
          <AlertTriangle size={11} />
          <span>
            {balance.percent < 100 ? "Poniżej normy" : "Powyżej normy"} — bilans{" "}
            {period === "week" ? "tygodnia" : "miesiąca"}
          </span>
        </div>
      ) : null}
    </div>
  );
}
