"use client";

import Link from "next/link";
import type { Pillar } from "@/lib/types";
import { PillarIcon } from "./PillarIcon";
import { formatHours } from "@/lib/utils";

type Props = {
  pillar: Pillar;
  hoursPerWeek: number;
  activeGoals: number;
  href: string;
};

export function PillarTile({ pillar, hoursPerWeek, activeGoals, href }: Props) {
  return (
    <Link
      href={href}
      className="group bg-white border border-neutral-200 rounded-xl p-4 hover:shadow-md hover:border-neutral-300 transition-all block"
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${pillar.color}22` }}
        >
          <PillarIcon name={pillar.icon} color={pillar.color} size={22} />
        </div>
        <span
          className="text-xs px-2 py-0.5 rounded-full font-medium"
          style={{ backgroundColor: `${pillar.color}22`, color: pillar.color }}
        >
          {pillar.weight}
        </span>
      </div>
      <h3 className="font-semibold text-neutral-900 mb-0.5 group-hover:text-indigo-600">
        {pillar.name}
      </h3>
      <div className="text-xs text-neutral-500">
        {formatHours(hoursPerWeek)} / tydz · {activeGoals} {activeGoals === 1 ? "cel" : "cele"}
      </div>
    </Link>
  );
}
