"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  Maximize2,
  Move,
  Network,
  Plus,
  Repeat,
  RotateCcw,
  Target,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { computeAllocation } from "@/lib/utils";
import { computePillarBalancesWeekly, type PillarBalance } from "@/lib/balance";
import { PillarIcon } from "@/components/PillarIcon";
import type { AppState, Goal, Pillar } from "@/lib/types";

// ----- Layout constants (world units) -----
const HUB_RADIUS = 56;
const PILLAR_RING = 340;
const GOAL_RING = 580;
const MIN_ZOOM = 0.3;
const MAX_ZOOM = 2.4;
const DRAG_CLICK_THRESHOLD = 5; // px before pointer-up counts as a drag, not a click
const OFFSETS_KEY = "zwr-mindmap-offsets-v1";

type PillarNode = {
  pillar: Pillar;
  x: number;
  y: number;
  r: number;
  angle: number;
  wedgeAngle: number;
  hoursPerWeek: number;
  weightShare: number;
};

type GoalNode = {
  goal: Goal;
  pillarId: string;
  pillarColor: string;
  x: number;
  y: number;
  r: number;
  isRoutine: boolean;
  weightForLine: number;
};

type Offsets = Record<string, { dx: number; dy: number }>;

const lerp = (t: number, a: number, b: number) => a + (b - a) * t;
const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));

function weightToRadius(
  weight: number,
  minW: number,
  maxW: number,
  minR: number,
  maxR: number,
) {
  const t = clamp((weight - minW) / (maxW - minW), 0, 1);
  return lerp(t, minR, maxR);
}

function computeLayout(pillars: Pillar[], goals: Goal[]) {
  const totalWeight =
    pillars.reduce((s, p) => s + Math.max(p.weight, 0.1), 0) || 1;
  let cursor = -Math.PI / 2;
  const pillarNodes: PillarNode[] = [];
  const goalNodes: GoalNode[] = [];

  for (const p of pillars) {
    const w = Math.max(p.weight, 0.1);
    const share = w / totalWeight;
    const wedgeAngle = share * Math.PI * 2;
    const angle = cursor + wedgeAngle / 2;
    const r = weightToRadius(w, 0.5, 10, 30, 64);
    pillarNodes.push({
      pillar: p,
      x: Math.cos(angle) * PILLAR_RING,
      y: Math.sin(angle) * PILLAR_RING,
      r,
      angle,
      wedgeAngle,
      hoursPerWeek: 0,
      weightShare: share,
    });

    const pillarGoals = goals
      .filter((g) => g.pillarId === p.id && g.status !== "Abandoned")
      .sort((a, b) => (b.weight ?? 3) - (a.weight ?? 3));

    if (pillarGoals.length > 0) {
      const fanAngle = Math.min(wedgeAngle * 0.78, Math.PI * 0.55);
      const startAngle = angle - fanAngle / 2;
      const step =
        pillarGoals.length === 1 ? 0 : fanAngle / (pillarGoals.length - 1);
      pillarGoals.forEach((g, i) => {
        const ga = pillarGoals.length === 1 ? angle : startAngle + step * i;
        const isRoutine = g.character === "Routine";
        const weightForLine = g.weight ?? (isRoutine ? 3 : 4);
        const gr = isRoutine
          ? 22
          : weightToRadius(g.weight ?? 4, 1, 10, 18, 36);
        goalNodes.push({
          goal: g,
          pillarId: p.id,
          pillarColor: p.color,
          x: Math.cos(ga) * GOAL_RING,
          y: Math.sin(ga) * GOAL_RING,
          r: gr,
          isRoutine,
          weightForLine,
        });
      });
    }

    cursor += wedgeAngle;
  }

  return { pillars: pillarNodes, goals: goalNodes };
}

// SVG arc starting at -π/2 (top), sweeping clockwise by `sweep` radians.
function arcPath(cx: number, cy: number, r: number, sweep: number) {
  const startA = -Math.PI / 2;
  const endA = startA + sweep;
  const sx = cx + r * Math.cos(startA);
  const sy = cy + r * Math.sin(startA);
  const ex = cx + r * Math.cos(endA);
  const ey = cy + r * Math.sin(endA);
  const largeArc = sweep > Math.PI ? 1 : 0;
  return `M ${sx} ${sy} A ${r} ${r} 0 ${largeArc} 1 ${ex} ${ey}`;
}

function balanceColor(level: PillarBalance["level"], fallback: string) {
  switch (level) {
    case "calm":
      return fallback; // pillar color when on-track
    case "soft":
      return fallback;
    case "medium":
      return "#f59e0b";
    case "strong":
      return "#ef4444";
  }
}

export function MindMap() {
  const router = useRouter();
  const pillars = useStore((s) => s.layers?.pillars ?? []);
  const goalsAll = useStore((s) => s.goals);
  const layers = useStore((s) => s.layers);
  const calendar = useStore((s) => s.calendar);
  const slotCompletions = useStore((s) => s.slotCompletions);
  const personalMission = useStore((s) => s.settings.personalMission);

  const allocation = useMemo(() => computeAllocation(layers), [layers]);
  const balances = useMemo(() => {
    const stub = {
      layers,
      calendar,
      slotCompletions,
    } as unknown as AppState;
    return computePillarBalancesWeekly(stub);
  }, [layers, calendar, slotCompletions]);
  const balanceById = useMemo(
    () => new Map(balances.map((b) => [b.pillarId, b])),
    [balances],
  );

  const layout = useMemo(() => {
    const l = computeLayout(pillars, goalsAll);
    for (const pn of l.pillars) {
      pn.hoursPerWeek = allocation.perPillar[pn.pillar.id]?.hoursPerWeek ?? 0;
    }
    return l;
  }, [pillars, goalsAll, allocation]);

  // ----- View state -----
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 1200, h: 800 });
  const [zoom, setZoom] = useState(0.85);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState<
    | { kind: "pillar"; id: string }
    | { kind: "goal"; id: string }
    | null
  >(null);

  const zoomRef = useRef(zoom);
  const panRef = useRef(pan);
  zoomRef.current = zoom;
  panRef.current = pan;

  // ----- Node-drag offsets (persisted) -----
  const [offsets, setOffsets] = useState<Offsets>({});
  const offsetsHydrated = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(OFFSETS_KEY);
      if (raw) setOffsets(JSON.parse(raw));
    } catch {
      // ignore corrupt data
    }
    offsetsHydrated.current = true;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!offsetsHydrated.current) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(OFFSETS_KEY, JSON.stringify(offsets));
      } catch {
        // quota / disabled storage — silently skip
      }
    }, 200);
    return () => clearTimeout(t);
  }, [offsets]);

  const offsetFor = useCallback(
    (key: string) => offsets[key] ?? { dx: 0, dy: 0 },
    [offsets],
  );

  // ----- Background pan -----
  const bgDragRef = useRef<{
    x: number;
    y: number;
    panX: number;
    panY: number;
    moved: number;
  } | null>(null);
  const [bgDragging, setBgDragging] = useState(false);

  const onBgPointerDown = (e: React.PointerEvent) => {
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    bgDragRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: pan.x,
      panY: pan.y,
      moved: 0,
    };
    setBgDragging(true);
  };
  const onBgPointerMove = (e: React.PointerEvent) => {
    if (!bgDragRef.current) return;
    const dx = e.clientX - bgDragRef.current.x;
    const dy = e.clientY - bgDragRef.current.y;
    bgDragRef.current.moved = Math.max(
      bgDragRef.current.moved,
      Math.hypot(dx, dy),
    );
    setPan({ x: bgDragRef.current.panX + dx, y: bgDragRef.current.panY + dy });
  };
  const onBgPointerUp = (e: React.PointerEvent) => {
    (e.currentTarget as Element).releasePointerCapture?.(e.pointerId);
    bgDragRef.current = null;
    setBgDragging(false);
  };

  // ----- Node drag -----
  const nodeDragRef = useRef<{
    key: string;
    startX: number;
    startY: number;
    baseDx: number;
    baseDy: number;
    moved: number;
  } | null>(null);
  const [draggingNodeKey, setDraggingNodeKey] = useState<string | null>(null);

  const onNodePointerDown = (key: string, e: React.PointerEvent) => {
    e.stopPropagation();
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    const o = offsetFor(key);
    nodeDragRef.current = {
      key,
      startX: e.clientX,
      startY: e.clientY,
      baseDx: o.dx,
      baseDy: o.dy,
      moved: 0,
    };
    setDraggingNodeKey(key);
  };
  const onNodePointerMove = (e: React.PointerEvent) => {
    if (!nodeDragRef.current) return;
    const dxPx = e.clientX - nodeDragRef.current.startX;
    const dyPx = e.clientY - nodeDragRef.current.startY;
    nodeDragRef.current.moved = Math.max(
      nodeDragRef.current.moved,
      Math.hypot(dxPx, dyPx),
    );
    const z = zoomRef.current;
    const key = nodeDragRef.current.key;
    const baseDx = nodeDragRef.current.baseDx;
    const baseDy = nodeDragRef.current.baseDy;
    setOffsets((prev) => ({
      ...prev,
      [key]: { dx: baseDx + dxPx / z, dy: baseDy + dyPx / z },
    }));
  };
  const onNodePointerUp = (
    e: React.PointerEvent,
    navigate: () => void,
  ) => {
    (e.currentTarget as Element).releasePointerCapture?.(e.pointerId);
    const wasDrag =
      nodeDragRef.current && nodeDragRef.current.moved > DRAG_CLICK_THRESHOLD;
    nodeDragRef.current = null;
    setDraggingNodeKey(null);
    if (!wasDrag) navigate();
  };

  // ----- Container resize -----
  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const update = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ----- Wheel zoom (cursor-anchored) -----
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const z = zoomRef.current;
      const p = panRef.current;
      const sw = el.clientWidth;
      const sh = el.clientHeight;
      const worldX = (cx - sw / 2 - p.x) / z;
      const worldY = (cy - sh / 2 - p.y) / z;
      const factor = Math.exp(-e.deltaY * 0.0015);
      const newZoom = clamp(z * factor, MIN_ZOOM, MAX_ZOOM);
      setZoom(newZoom);
      setPan({
        x: cx - sw / 2 - worldX * newZoom,
        y: cy - sh / 2 - worldY * newZoom,
      });
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, []);

  const fitToView = useCallback(() => {
    setPan({ x: 0, y: 0 });
    const margin = 120;
    const target = (GOAL_RING + 80) * 2;
    const z = clamp(
      Math.min((size.w - margin) / target, (size.h - margin) / target, 1.2),
      MIN_ZOOM,
      MAX_ZOOM,
    );
    setZoom(z);
  }, [size.w, size.h]);

  const didInitialFit = useRef(false);
  useEffect(() => {
    if (didInitialFit.current) return;
    if (size.w === 0 || size.h === 0) return;
    didInitialFit.current = true;
    fitToView();
  }, [size.w, size.h, fitToView]);

  const zoomBy = (factor: number) => {
    setZoom((z) => clamp(z * factor, MIN_ZOOM, MAX_ZOOM));
  };
  const resetPositions = () => {
    if (Object.keys(offsets).length === 0) return;
    if (
      typeof window !== "undefined" &&
      !window.confirm("Przywrócić układ początkowy mapy?")
    )
      return;
    setOffsets({});
  };

  const groupTransform = `translate(${size.w / 2 + pan.x} ${size.h / 2 + pan.y}) scale(${zoom})`;

  // Position helpers (apply offsets to base layout)
  const pillarPos = (pn: PillarNode) => {
    const o = offsetFor(`pillar:${pn.pillar.id}`);
    return { x: pn.x + o.dx, y: pn.y + o.dy };
  };
  const goalPos = (gn: GoalNode) => {
    const o = offsetFor(`goal:${gn.goal.id}`);
    return { x: gn.x + o.dx, y: gn.y + o.dy };
  };
  const pillarPosById = (id: string) => {
    const pn = layout.pillars.find((p) => p.pillar.id === id);
    return pn ? pillarPos(pn) : { x: 0, y: 0 };
  };

  if (pillars.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center px-6">
        <div className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
          <Network size={24} className="text-neutral-400" />
        </div>
        <p className="text-base text-neutral-700 font-medium">
          Mapa wymaga filarów.
        </p>
        <p className="text-sm text-neutral-500 mt-1 max-w-xs">
          Dodaj pierwszy filar w kalkulatorze, a tu zobaczysz go w centrum mapy
          swojego życia.
        </p>
        <button
          onClick={() => router.push("/calculator")}
          className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 transition-colors"
        >
          <Plus size={14} /> Otwórz kalkulator
        </button>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[78vh] min-h-[520px] overflow-hidden rounded-2xl select-none"
      style={{
        background:
          "radial-gradient(ellipse at center, #ffffff 0%, #fafafa 55%, #f5f3ee 100%)",
        cursor: bgDragging
          ? "grabbing"
          : draggingNodeKey
            ? "grabbing"
            : "grab",
        touchAction: "none",
      }}
    >
      <svg
        width="100%"
        height="100%"
        style={{ display: "block", fontFamily: "var(--font-inter, system-ui)" }}
      >
        <rect
          x={0}
          y={0}
          width="100%"
          height="100%"
          fill="transparent"
          onPointerDown={onBgPointerDown}
          onPointerMove={onBgPointerMove}
          onPointerUp={onBgPointerUp}
          onPointerCancel={onBgPointerUp}
        />

        <g transform={groupTransform}>
          {/* Faint guide rings — only show when nothing is dragged out of place */}
          {Object.keys(offsets).length === 0 ? (
            <>
              <circle
                cx={0}
                cy={0}
                r={PILLAR_RING}
                fill="none"
                stroke="#e5e5e5"
                strokeDasharray="2 6"
                strokeWidth={1}
              />
              <circle
                cx={0}
                cy={0}
                r={GOAL_RING}
                fill="none"
                stroke="#ededed"
                strokeDasharray="2 8"
                strokeWidth={1}
              />
            </>
          ) : null}

          {/* Hub → Pillar lines */}
          {layout.pillars.map((pn) => {
            const isHl =
              hovered?.kind === "pillar" && hovered.id === pn.pillar.id;
            const pos = pillarPos(pn);
            const width = lerp(
              clamp((pn.pillar.weight - 0.5) / 9.5, 0, 1),
              2,
              8,
            );
            return (
              <line
                key={`hp-${pn.pillar.id}`}
                x1={0}
                y1={0}
                x2={pos.x}
                y2={pos.y}
                stroke={pn.pillar.color}
                strokeOpacity={isHl ? 0.7 : 0.35}
                strokeWidth={width}
                strokeLinecap="round"
              />
            );
          })}

          {/* Pillar → Goal lines */}
          {layout.goals.map((gn) => {
            const isHl =
              hovered?.kind === "goal" && hovered.id === gn.goal.id;
            const pPos = pillarPosById(gn.pillarId);
            const gPos = goalPos(gn);
            const width = lerp(
              clamp((gn.weightForLine - 1) / 9, 0, 1),
              1.2,
              3.6,
            );
            return (
              <line
                key={`pg-${gn.goal.id}`}
                x1={pPos.x}
                y1={pPos.y}
                x2={gPos.x}
                y2={gPos.y}
                stroke={gn.pillarColor}
                strokeOpacity={isHl ? 0.85 : 0.45}
                strokeWidth={width}
                strokeLinecap="round"
                strokeDasharray={gn.isRoutine ? "5 4" : undefined}
              />
            );
          })}

          {/* Hub */}
          <g>
            <circle cx={0} cy={0} r={HUB_RADIUS + 10} fill="#ffffff" opacity={0.95} />
            <circle
              cx={0}
              cy={0}
              r={HUB_RADIUS}
              fill="url(#hubGradient)"
              stroke="#ffffff"
              strokeWidth={3}
            />
            <text
              y={5}
              textAnchor="middle"
              fontSize={14}
              fontWeight={600}
              fill="#1a1a1a"
            >
              Moje życie
            </text>
            <text
              y={HUB_RADIUS + 24}
              textAnchor="middle"
              fontSize={11}
              fill="#737373"
            >
              {pillars.length}{" "}
              {pillars.length === 1
                ? "filar"
                : pillars.length < 5
                  ? "filary"
                  : "filarów"}
              {" · "}
              {goalsAll.filter((g) => g.status === "Active").length} aktywnych
              celów
            </text>
          </g>

          {/* Pillar nodes */}
          {layout.pillars.map((pn) => {
            const isHl =
              hovered?.kind === "pillar" && hovered.id === pn.pillar.id;
            const key = `pillar:${pn.pillar.id}`;
            const isDragging = draggingNodeKey === key;
            const pos = pillarPos(pn);
            const iconSize = Math.round(pn.r * 0.85);
            const bal = balanceById.get(pn.pillar.id);
            const hasBalance = !!bal && bal.expectedH > 0;
            const arcR = pn.r + 9;
            const sweepFrac = hasBalance ? clamp(bal!.percent / 100, 0, 1) : 0;
            const arcColor = hasBalance
              ? balanceColor(bal!.level, pn.pillar.color)
              : pn.pillar.color;

            return (
              <g
                key={`pn-${pn.pillar.id}`}
                transform={`translate(${pos.x} ${pos.y})`}
                style={{ cursor: isDragging ? "grabbing" : "grab" }}
                onPointerDown={(e) => onNodePointerDown(key, e)}
                onPointerMove={onNodePointerMove}
                onPointerUp={(e) =>
                  onNodePointerUp(e, () =>
                    router.push(`/pillar/${pn.pillar.id}`),
                  )
                }
                onPointerCancel={(e) => onNodePointerUp(e, () => {})}
                onPointerEnter={() =>
                  setHovered({ kind: "pillar", id: pn.pillar.id })
                }
                onPointerLeave={() => setHovered(null)}
              >
                {/* halo */}
                <circle
                  cx={0}
                  cy={0}
                  r={pn.r + (isHl ? 18 : 14)}
                  fill={pn.pillar.color}
                  opacity={isHl ? 0.22 : 0.13}
                />
                {/* balance arc — background ring + foreground sweep */}
                {hasBalance ? (
                  <>
                    <circle
                      cx={0}
                      cy={0}
                      r={arcR}
                      fill="none"
                      stroke="#e5e5e5"
                      strokeWidth={4}
                    />
                    {sweepFrac > 0.001 ? (
                      <path
                        d={arcPath(
                          0,
                          0,
                          arcR,
                          sweepFrac * Math.PI * 2 * 0.9999,
                        )}
                        fill="none"
                        stroke={arcColor}
                        strokeWidth={4}
                        strokeLinecap="round"
                      />
                    ) : null}
                  </>
                ) : null}
                {/* core */}
                <circle
                  cx={0}
                  cy={0}
                  r={pn.r}
                  fill={pn.pillar.color}
                  stroke="#ffffff"
                  strokeWidth={3}
                />
                <foreignObject
                  x={-iconSize / 2}
                  y={-iconSize / 2}
                  width={iconSize}
                  height={iconSize}
                  style={{ pointerEvents: "none" }}
                >
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                    }}
                  >
                    <PillarIcon
                      name={pn.pillar.icon}
                      color="white"
                      size={Math.round(iconSize * 0.7)}
                    />
                  </div>
                </foreignObject>
                {/* labels */}
                <text
                  y={pn.r + 28}
                  textAnchor="middle"
                  fontSize={14}
                  fontWeight={600}
                  fill="#1a1a1a"
                >
                  {pn.pillar.name}
                </text>
                <text
                  y={pn.r + 45}
                  textAnchor="middle"
                  fontSize={11}
                  fill="#737373"
                >
                  waga {pn.pillar.weight} · {pn.hoursPerWeek.toFixed(1)}h/tydz
                </text>
                {hasBalance ? (
                  <text
                    y={pn.r + 60}
                    textAnchor="middle"
                    fontSize={11}
                    fontWeight={600}
                    fill={arcColor}
                  >
                    {Math.round(bal!.percent)}% tygodnia
                    {bal!.balance !== 0 ? (
                      <tspan fill="#a3a3a3" fontWeight={400}>
                        {"  "}
                        ({bal!.balance > 0 ? "+" : ""}
                        {bal!.balance.toFixed(1)}h)
                      </tspan>
                    ) : null}
                  </text>
                ) : null}
              </g>
            );
          })}

          {/* Goal nodes */}
          {layout.goals.map((gn) => {
            const isHl =
              hovered?.kind === "goal" && hovered.id === gn.goal.id;
            const key = `goal:${gn.goal.id}`;
            const isDragging = draggingNodeKey === key;
            const pos = goalPos(gn);
            return (
              <g
                key={`gn-${gn.goal.id}`}
                transform={`translate(${pos.x} ${pos.y})`}
                style={{ cursor: isDragging ? "grabbing" : "grab" }}
                onPointerDown={(e) => onNodePointerDown(key, e)}
                onPointerMove={onNodePointerMove}
                onPointerUp={(e) =>
                  onNodePointerUp(e, () =>
                    router.push(`/goal/${gn.goal.id}`),
                  )
                }
                onPointerCancel={(e) => onNodePointerUp(e, () => {})}
                onPointerEnter={() =>
                  setHovered({ kind: "goal", id: gn.goal.id })
                }
                onPointerLeave={() => setHovered(null)}
              >
                <circle
                  cx={0}
                  cy={0}
                  r={gn.r + (isHl ? 8 : 5)}
                  fill={gn.pillarColor}
                  opacity={isHl ? 0.18 : 0.1}
                />
                <circle
                  cx={0}
                  cy={0}
                  r={gn.r}
                  fill="#ffffff"
                  stroke={gn.pillarColor}
                  strokeWidth={gn.isRoutine ? 2 : 3}
                  strokeDasharray={gn.isRoutine ? "4 3" : undefined}
                  opacity={gn.goal.status === "Paused" ? 0.55 : 1}
                />
                <foreignObject
                  x={-gn.r * 0.55}
                  y={-gn.r * 0.55}
                  width={gn.r * 1.1}
                  height={gn.r * 1.1}
                  style={{ pointerEvents: "none" }}
                >
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: gn.pillarColor,
                    }}
                  >
                    {gn.isRoutine ? (
                      <Repeat
                        size={Math.round(gn.r * 0.65)}
                        strokeWidth={2.2}
                      />
                    ) : (
                      <Target
                        size={Math.round(gn.r * 0.7)}
                        strokeWidth={2.2}
                      />
                    )}
                  </div>
                </foreignObject>
                <text
                  y={gn.r + 16}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight={500}
                  fill="#262626"
                >
                  {truncate(gn.goal.title, 22)}
                </text>
                {gn.goal.weight ? (
                  <text
                    y={gn.r + 30}
                    textAnchor="middle"
                    fontSize={10}
                    fill="#a3a3a3"
                  >
                    waga {gn.goal.weight}
                  </text>
                ) : null}
              </g>
            );
          })}
        </g>

        <defs>
          <radialGradient id="hubGradient" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f0e8e0" />
          </radialGradient>
        </defs>
      </svg>

      {/* Controls overlay */}
      <div className="absolute right-3 top-3 flex flex-col gap-1.5">
        <ControlButton onClick={() => zoomBy(1.2)} title="Przybliż">
          <ZoomIn size={15} />
        </ControlButton>
        <ControlButton onClick={() => zoomBy(1 / 1.2)} title="Oddal">
          <ZoomOut size={15} />
        </ControlButton>
        <ControlButton onClick={fitToView} title="Dopasuj do ekranu">
          <Maximize2 size={15} />
        </ControlButton>
        <ControlButton
          onClick={resetPositions}
          title="Przywróć układ początkowy"
          disabled={Object.keys(offsets).length === 0}
        >
          <RotateCcw size={15} />
        </ControlButton>
      </div>

      {/* Hint overlay (bottom-left) */}
      <div className="absolute left-3 bottom-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 backdrop-blur border border-neutral-200 text-[11px] text-neutral-500">
        <Move size={11} /> tło = przesuń · węzeł = przeciągnij · kółko = zoom
      </div>

      {/* Hover tooltip / mission preview (top-left) */}
      <div className="absolute left-3 top-3 max-w-xs">
        {hovered ? (
          <HoverCard
            hovered={hovered}
            pillars={layout.pillars}
            goals={layout.goals}
            goalsRaw={goalsAll}
            balanceById={balanceById}
          />
        ) : personalMission ? (
          <div className="px-3 py-2 rounded-xl bg-white/80 backdrop-blur border border-neutral-200 text-xs text-neutral-600 leading-snug">
            <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-400 font-medium mb-0.5">
              Moje dlaczego
            </div>
            <div className="text-neutral-800">
              {truncate(personalMission, 90)}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ControlButton({
  children,
  onClick,
  title,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      className="w-9 h-9 inline-flex items-center justify-center rounded-full bg-white/85 backdrop-blur border border-neutral-200 text-neutral-700 hover:bg-white hover:text-neutral-900 transition-colors shadow-sm disabled:opacity-40 disabled:hover:bg-white/85 disabled:hover:text-neutral-700 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  );
}

function HoverCard({
  hovered,
  pillars,
  goals,
  goalsRaw,
  balanceById,
}: {
  hovered: { kind: "pillar"; id: string } | { kind: "goal"; id: string };
  pillars: PillarNode[];
  goals: GoalNode[];
  goalsRaw: Goal[];
  balanceById: Map<string, PillarBalance>;
}) {
  if (hovered.kind === "pillar") {
    const pn = pillars.find((p) => p.pillar.id === hovered.id);
    if (!pn) return null;
    const goalCount = goalsRaw.filter(
      (g) => g.pillarId === pn.pillar.id && g.status === "Active",
    ).length;
    const bal = balanceById.get(pn.pillar.id);
    return (
      <div className="px-3 py-2.5 rounded-xl bg-white/90 backdrop-blur border border-neutral-200 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: pn.pillar.color }}
          />
          <span className="text-sm font-semibold text-neutral-900">
            {pn.pillar.name}
          </span>
        </div>
        <div className="text-xs text-neutral-600 tabular-nums">
          waga {pn.pillar.weight} · {Math.round(pn.weightShare * 100)}% puli ·{" "}
          {pn.hoursPerWeek.toFixed(1)}h/tydz · {goalCount}{" "}
          {goalCount === 1 ? "cel" : "celów"}
        </div>
        {bal && bal.expectedH > 0 ? (
          <div className="text-xs text-neutral-600 tabular-nums mt-1">
            Tydzień: <span className="font-medium">{Math.round(bal.percent)}%</span>
            {" · "}
            {bal.actualH.toFixed(1)}h z {bal.expectedH.toFixed(1)}h
            {bal.balance !== 0 ? (
              <span className="text-neutral-500">
                {" "}
                ({bal.balance > 0 ? "+" : ""}
                {bal.balance.toFixed(1)}h)
              </span>
            ) : null}
          </div>
        ) : null}
        {pn.pillar.description ? (
          <div className="text-xs text-neutral-500 mt-1 line-clamp-2">
            {pn.pillar.description}
          </div>
        ) : null}
      </div>
    );
  }
  const gn = goals.find((g) => g.goal.id === hovered.id);
  if (!gn) return null;
  return (
    <div className="px-3 py-2.5 rounded-xl bg-white/90 backdrop-blur border border-neutral-200 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ backgroundColor: gn.pillarColor }}
        />
        <span className="text-sm font-semibold text-neutral-900">
          {gn.goal.title}
        </span>
      </div>
      <div className="text-xs text-neutral-600">
        {gn.goal.character === "Project"
          ? "Projekt"
          : gn.goal.character === "Routine"
            ? "Rutyna"
            : "Mieszany"}
        {gn.goal.weight ? ` · waga ${gn.goal.weight}` : ""}
        {gn.goal.status !== "Active" ? ` · ${statusLabel(gn.goal.status)}` : ""}
      </div>
    </div>
  );
}

function statusLabel(s: Goal["status"]): string {
  switch (s) {
    case "Active":
      return "Aktywny";
    case "Paused":
      return "Wstrzymany";
    case "Done":
      return "Zakończony";
    case "Abandoned":
      return "Porzucony";
  }
}

function truncate(s: string, n: number) {
  if (s.length <= n) return s;
  return s.slice(0, n - 1).trimEnd() + "…";
}
