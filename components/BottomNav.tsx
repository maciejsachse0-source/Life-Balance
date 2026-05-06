"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  BarChart3,
  Lightbulb,
  Settings,
  LayoutDashboard,
  LayoutTemplate,
} from "lucide-react";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/calendar", label: "Kalendarz", icon: Calendar },
  { href: "/stats", label: "Statystyki", icon: BarChart3 },
  { href: "/thoughts", label: "Myśli", icon: Lightbulb },
  { href: "/onboarding", label: "Szablon", icon: LayoutTemplate },
  { href: "/settings", label: "Ustawienia", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 z-20">
      <div className="max-w-5xl mx-auto grid grid-cols-6">
        {items.map((it) => {
          const active = pathname === it.href || pathname.startsWith(it.href + "/");
          const Icon = it.icon;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`flex flex-col items-center justify-center py-2.5 text-xs gap-1 transition-colors ${
                active ? "text-indigo-600 font-medium" : "text-neutral-500 hover:text-neutral-800"
              }`}
            >
              <Icon size={18} />
              <span>{it.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
