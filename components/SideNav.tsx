"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  useVelocity,
  animate,
} from "motion/react";
import {
  Calendar,
  BarChart3,
  Lightbulb,
  Settings,
  LayoutDashboard,
  LayoutTemplate,
  Network,
  ListChecks,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/mindmap", label: "Mapa", icon: Network },
  { href: "/habits", label: "Rutyny", icon: ListChecks },
  { href: "/calendar", label: "Kalendarz", icon: Calendar },
  { href: "/stats", label: "Statystyki", icon: BarChart3 },
  { href: "/thoughts", label: "Myśli", icon: Lightbulb },
  { href: "/onboarding", label: "Szablon", icon: LayoutTemplate },
  { href: "/settings", label: "Ustawienia", icon: Settings },
];

const ITEM_SIZE = 48;
const ITEM_GAP = 6;
const PADDING = 8;

export function SideNav() {
  const pathname = usePathname();
  const filterId = useId();
  const activeIndex = items.findIndex(
    (it) => pathname === it.href || pathname.startsWith(it.href + "/"),
  );
  const hasActive = activeIndex >= 0;
  const thumbOffset = (hasActive ? activeIndex : 0) * (ITEM_SIZE + ITEM_GAP);

  const y = useMotionValue(thumbOffset);
  const opacity = useMotionValue(hasActive ? 1 : 0);
  const yVelocity = useVelocity(y);

  const stretchY = useTransform(yVelocity, (v) => {
    const stretch = Math.min(Math.abs(v) / 1600, 0.24);
    return 1 + stretch;
  });
  const squishX = useTransform(yVelocity, (v) => {
    const squish = Math.min(Math.abs(v) / 1600, 0.16);
    return 1 - squish;
  });

  useEffect(() => {
    const yAnim = animate(y, thumbOffset, {
      type: "spring",
      stiffness: 240,
      damping: 26,
      mass: 1.1,
      restDelta: 0.001,
    });
    const oAnim = animate(opacity, hasActive ? 1 : 0, {
      duration: 0.22,
      ease: [0.22, 1, 0.36, 1],
    });
    return () => {
      yAnim.stop();
      oAnim.stop();
    };
  }, [thumbOffset, hasActive, y, opacity]);

  return (
    <aside
      className="fixed left-3 sm:left-5 top-1/2 -translate-y-1/2 z-30"
      aria-label="Główna nawigacja"
    >
      <svg
        aria-hidden
        className="absolute -z-10 w-0 h-0 overflow-hidden"
        focusable={false}
      >
        <defs>
          <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.012 0.018"
              numOctaves="2"
              seed="7"
              result="noise"
            />
            <feGaussianBlur in="noise" stdDeviation="1.2" result="softNoise" />
            <feDisplacementMap
              in="SourceGraphic"
              in2="softNoise"
              scale="22"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      <nav
        className="liquid-pill relative flex flex-col rounded-full"
        style={{ padding: PADDING, gap: ITEM_GAP }}
      >
        <motion.span
          aria-hidden
          className="pointer-events-none absolute rounded-full z-[1]"
          style={{
            top: PADDING,
            left: PADDING,
            width: ITEM_SIZE,
            height: ITEM_SIZE,
            y,
            opacity,
            scaleX: squishX,
            scaleY: stretchY,
            transformOrigin: "center",
            willChange: "transform, opacity",
          }}
        >
          <span
            className="absolute inset-0 rounded-full overflow-hidden"
            style={{
              backdropFilter: `url(#${filterId}) blur(6px) saturate(200%) brightness(1.05)`,
              WebkitBackdropFilter: "blur(6px) saturate(200%) brightness(1.05)",
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.15) 60%, rgba(255,255,255,0.25) 100%)",
            }}
          />
          <span
            className="absolute inset-0 rounded-full"
            style={{
              boxShadow: [
                "inset 0 1.5px 1px rgba(255,255,255,0.95)",
                "inset 0 0 12px rgba(255,255,255,0.25)",
                "inset 0 -2px 3px rgba(255,255,255,0.18)",
                "0 6px 16px -4px rgba(20,18,12,0.22)",
                "0 2px 6px -2px rgba(20,18,12,0.14)",
              ].join(","),
              border: "1px solid rgba(255,255,255,0.6)",
            }}
          />
          <span
            className="absolute left-[18%] right-[18%] top-[8%] h-[28%] rounded-[50%] pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0) 70%)",
              filter: "blur(1.5px)",
            }}
          />
        </motion.span>

        {items.map((it, i) => {
          const active = i === activeIndex;
          const Icon = it.icon;
          return (
            <Link
              key={it.href}
              href={it.href}
              aria-label={it.label}
              aria-current={active ? "page" : undefined}
              className="group relative z-10 flex items-center justify-center"
              style={{ width: ITEM_SIZE, height: ITEM_SIZE }}
            >
              {/* Full-size pressable surface: this is what visibly squishes.
                  The tooltip sits outside so it doesn't scale with the press. */}
              <motion.span
                className={cn(
                  "absolute inset-0 flex items-center justify-center rounded-full",
                  "transition-colors duration-300 ease-out",
                  active
                    ? "text-neutral-900"
                    : "text-neutral-500 group-hover:text-neutral-900 group-hover:bg-white/40",
                )}
                whileHover={{ scale: 1.06 }}
                whileTap={{
                  // liquid squish: spreads slightly wider while compressing vertically
                  scaleX: 0.92,
                  scaleY: 0.78,
                }}
                transition={{
                  type: "spring",
                  stiffness: 360,
                  damping: 13,
                  mass: 0.55,
                  restDelta: 0.001,
                }}
              >
                <Icon size={19} strokeWidth={active ? 2.3 : 1.9} />
              </motion.span>
              <span
                className={cn(
                  "pointer-events-none absolute left-full ml-3 px-2.5 py-1.5 rounded-lg",
                  "bg-neutral-900/85 text-white text-xs font-medium whitespace-nowrap backdrop-blur",
                  "opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0",
                  "transition-all duration-150 shadow-md",
                )}
              >
                {it.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
