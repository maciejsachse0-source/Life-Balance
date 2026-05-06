"use client";

import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Props = {
  name: string;
  size?: number;
  className?: string;
  color?: string;
};

export function PillarIcon({ name, size = 20, className, color }: Props) {
  const Icon = (Icons as unknown as Record<string, LucideIcon>)[name] ?? Icons.Circle;
  return <Icon size={size} className={className} color={color} />;
}
