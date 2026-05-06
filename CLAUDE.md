# CLAUDE.md — "Życie w równowadze"

Web app for time + goal management, ADHD-friendly. 3 dimensions: **time allocation** (gross/net calculator), **goals** (3 characters: project/routine/mixed), **weekly calendar** with suggestion engine.

## Core principles
1. Increases awareness, never blocks.
2. Everything editable (pillar count, layer names, defaults).
3. No hour logging — only binary slot completion (Yes/No).
4. Low entry barrier — optional fields don't block adding content.
5. Undo for all destructive actions (5s toast).

## Stack
React + TypeScript · Tailwind · localStorage (MVP) · @dnd-kit/core · recharts · lucide-react · date-fns · Zustand or Jotai · Vitest

## File layout
```
src/
├── components/{dashboard,calendar,pillar-detail,goal-detail,focus-modes,stats,thoughts,onboarding,calculator,shared}/
├── lib/{store,algorithms,templates,types}/
└── App.tsx
```

---

## 1. Onboarding & templates

First-run shows template picker. Each template: name, description, proposed pillars+weights, default physiology/life-tax values. After pick → calculator with prefilled values → dashboard.

**6 built-in templates** (all weights/hours are starting points, fully editable):
- **Classic 6-element**: Praca/Misja(4), Ciało(2), Umysł(1.5), Relacje(1.5), Ja(0.5), Finanse(0.5). Sen 56h, Jedzenie 12h, Higiena 5h, Logistyka 8h, Bufor 13h.
- **Founder**: Firma(5), Sprzedaż(3), Produkt(3), Ciało(2), Relacje(1), Ja(1). Sen 49h, Jedzenie 10h, Higiena 4h, Logistyka 6h, Bufor 10h.
- **Student**: Studia(4), Ciało(2), Relacje(2), Hobby(1.5), Ja(1), Finanse(0.5). Defaults like Classic.
- **Parent**: Praca(3), Rodzina(4), Ciało(1.5), Ja(1), Społeczność(0.5), Dom(1). Sen 56h, Jedzenie 14h, Higiena 5h, Logistyka 12h, Bufor 12h.
- **Minimal 4**: Praca(4), Zdrowie(3), Ludzie(2), Ja(1). Defaults like Classic.
- **Custom**: 0 pillars, user adds everything.

Reset/change template available from settings (with warning about config loss).

---

## 2. Gross/net calculator — 3 editable layers

**Layer A: Physiology** (CRUD categories: name, h/week, optional healthyMin, optional warning).
**Layer B: Life taxes** (CRUD; defaults: Logistyka, Bufor).
**Layer C: Pillars** (CRUD: name, description, lucide icon, hex color, weight 1-10).

### Allocation formula
```
fizjologia_h = sum(A)
podatki_h    = sum(B)
netto_h      = 168 - fizjologia_h
pula_h       = netto_h - podatki_h
filar_h      = (filar.weight / sum(weights)) × pula_h
```
Result shown in 3 units: h/week, h/day (avg), % of pula.

### Warnings, never blocks
Each category may carry `healthyMin`. Below it → text warning (warning color, ⚠ icon). Pillars may carry `healthyMin` for pula share.

### UI
3 sections (A/B/C) as cards. Each: header (name + sum), slider list, "+ Add category", inline-editable names, remove button. Bottom sticky "Result" table per pillar (h/week, h/day, %), live-updating.

---

## 3. Goal system — 3 characters

Character chosen at creation:

- **Project**: `deadline`. Hierarchy: goal → milestone[] → task[]. Each milestone has Kanban (Todo/InProgress/Done). Goal progress = avg milestone progress. Milestone progress = % done tasks.
- **Routine**: `frequency` (`daily` | `weekly:N` | `custom_days:[mon,wed,fri]`), `duration_minutes`, `workType`. No milestones/kanban. Progress = streak + heatmap (7×N grid).
- **Mixed**: `deadline`. Hierarchy: goal → milestone[]. Each milestone picks own character (Project or Routine). Goal progress = weighted avg.

### Goal attributes (all characters)
`id`, `pillarId`, `title`, `description?`, `vision?`, `character`, `weight?` (1-10; Project+Mixed only), `status` (Active|Paused|Done|Abandoned), `createdAt`, `updatedAt`, `completedAt?`, character-specific fields.

### Weights & status
Project/Mixed have weights (normalized within pillar). Routines have fixed reservation (e.g. "3 slots/week") — strict. Statuses: Active (suggested), Paused (kept, not suggested), Done (in stats), Abandoned (in stats).

### Task structure (no time estimate — confirmed)
```ts
type Task = {
  id, goalId, milestoneId, title;
  status: 'Todo' | 'InProgress' | 'Done';
  workType: 'deep'|'shallow'|'creative'|'admin';
  deadline?, notes?, subtasks?, createdAt, completedAt?;
};
```

### Milestone structure
```ts
type Milestone = {
  id, goalId, title, description?, deadline?, order;
  character?: 'Project'|'Routine'; // Mixed-only
  tasks?: Task[];                   // Project milestone
  routineConfig?: RoutineConfig;    // Routine milestone
};
```

### Three goal views (tabs at top, persisted per goal)
- **Tree** (default for Project/Mixed): hierarchical expand, progress bars, "+" at every level.
- **Kanban**: all goal tasks across 3 columns. Milestone tag (color) on cards. Filter: all/one/several. Drag changes status.
- **Roadmap**: horizontal timeline (today → latest deadline). Milestones as tiles with mini-progress. Click → details.

**Routine view**: 7×N heatmap, current+longest streak, this-week count vs target, long-term stats.
**Mixed view**: list of milestones, click opens that milestone's view.

---

## 4. Calendar — single tab, 3 views

Top toggle: **Month / Week / Day**. Last view persisted.

### Modes
- **Template**: repeating default week, generated from calculator. Slots in 30-min steps. Each slot: pillar, workType, optional task.
- **Override**: per-week edits. Don't break template. Each edit prompts: this week only / this+future / change template.

### workTypes
`deep`, `shallow`, `admin`, `creative`, `physical`, `social`, `reflective`, `routine`, `buffer`. One per slot. Generator assigns via time-of-day + pillar.

### Edit gestures
1. **Resize**: drag top/bottom edge. Snap 30 min (or 15 — implementation choice).
2. **Move**: drag center. Vertical (time) or horizontal (day). Length preserved.
3. **Drag task from sidebar/kanban → slot**: assigns task (overrides suggestion).

### Conflicts → modal with 4 options
- **Replace** — overwrite other slot
- **Push** (default) — push other slot later (domino)
- **Merge** — same pillar → join into one longer slot
- **Cancel**

### Live edit feedback (3 levels by % impact on pillar norm)
- `<5%`: delta only — `Praca -1h`
- `5-15%`: delta + balance — `Praca -3h · 87% → 78%`
- `>15%`: delta + warning + suggestion — `Praca -8h · Bilans 87%→62% ⚠ duży spadek · Sugestia: weekend ma 6h Bufora — przerzucić część?`

Commit behavior: small=instant; medium=instant + 5s undo toast; large=2s wait with visible Undo.

### Compensation suggestions (>15% drop)
Compute: buffer slots in remaining days, surplus pillar slots (>110%), least-planned days. Show **max 2 alternatives** + "Leave uncompensated" (default selected).

### Visual indicators on slots
- **Left bar (3-4px)**: solid pillar color = standard; gradient thin→thick = Buffer/Logistyka.
- **Top-right corner**: pulsing orange dot = slot helps catch up monthly deficit.
- **Edges**: hover → resize cursor. No permanent decoration.

### Multi-edit safeguard
Per-session change counter (resets when calendar closes/opens). After 5+ edits, gentle toast: *"Sporo zmian dziś — pokazać podsumowanie?"* [Show] [Not now]. Show → modal listing changes + aggregate balance impact + [Undo all] [Confirm].

---

## 5. Suggestion engine

### 4-step algorithm (project tasks)
1. **Filter by pillar**: `task.goal.pillarId === slot.pillarId` && `goal.status==='Active'` && `task.status in {Todo,InProgress}`.
2. **Filter by workType match**:
   - slot.deep → task.deep | creative
   - slot.shallow → task.shallow | admin
   - slot.admin → task.admin | shallow
   - slot.creative → task.creative | deep
   - slot.physical/social/reflective/routine → matching only
   - slot.buffer → all (low-priority)
3. **Score priority**:
   ```
   priority = goal.weight*10
            + deadlineProximity(0..30)   // ≤7d→30, ≤14d→20, ≤30d→10, else 5
            + (continuation ? 25 : 0)    // InProgress + lastWorkedOn today/yesterday
            + underrepresentation(0..20) // no slot in last 5d→20, last 3d→10
            - overrepresentation(0..30)  // >50% in last 3d→30, >35%→15
   ```
4. **Present**: #1 → main suggestion in slot. #2-5 → alternatives in day-column sidebar (Week view).

### Routines (separate algorithm)
```
required = freq_per_week; done = completions_this_week; remaining_days = days_left
if done >= required: skip
else need = required - done
     priority normal if need ≤ remaining_days
              high   if need == remaining_days
              warn   if need >  remaining_days  → "nie zdążysz"
auto-reserves first N matching slots in remaining days
```

### Manual override + learning
Each slot: main suggestion + "Inne sugestie ▾" (3-5 alternatives). Sidebar in Week view: full list per day column. Manual reassign counter on tasks: after 3 reassigns, `-5` to priority.

---

## 6. Norm & balance

### Monthly norm
```
norma_msc = (filar.weight / sum_weights) × pula_h × 4.33
```
Calendar-month basis (from day 1).

### Rolling balance
```
expected = norma_msc × (days_elapsed / days_in_month)
actual   = sum(completed_slots × duration)
balance  = actual - expected
percent  = actual / expected × 100
```

### 4 interaction levels (asymmetric: warnings only when edit *worsens* balance)
- **Calm 95-110%**: silent
- **Mild 85-95% / 110-115%**: small info icon on dashboard pillar tile
- **Medium 75-85% / 115-125%**: hint during edit
- **Strong <75% / >125%**: hint + compensation suggestion

### Overrun rules
- Generally lighter treatment.
- Toast once when crossing 110%, no compensation suggestion.
- Sleep / physiology: never warn on overrun.
- Ciało: at >130% show "Pamiętaj o regeneracji" only.

### Sunday ritual
If template has slot tagged "Reflective — Planowanie tygodnia" (e.g. Sun 16:30-18:30), focus screen shows: previous week balance (table), monthly balance + days left, correction suggestions (e.g. "Ciało potrzebuje +6h w 2 tygodniach"), bulk-shift buttons (e.g. "Swap 3 Buffer slots → Ciało"), quick-add to thoughts.

### Dashboard balance section
Per pillar bars: `Praca ████████░░░░ 87% (-12h)`. Click → pillar stats.

---

## 7. Calendar views

### Month
7×5/6 grid. Cell: day number (top-left), thin top bar = pillar proportions of planned slots, 1-3 mini-tags (top projects/routines), red dot=deadline / yellow=milestone, bottom bar = % planned. Pillar filter at top (persisted). Click day → Day view.

### Week (main work view)
Header (view toggle, week date, nav) · 7 day cols × 17 hour rows (7-23) · expandable panel BELOW calendar · right sidebar (on day-column click).

**30-min slot shows**: faint pillar-color background; left 3-4px bar (solid or gradient); name 11-12px; current milestone 9-10px opacity 0.7; status icon (lucide Square/Circle/CheckSquare).

**Interactions**:
- Click day header → right sidebar with day's suggestions/alternatives.
- Click slot → panel **below** (not beside): kanban of active milestone, quick edit, "Pokaż alternatywy", "Zacznij" (focus mode).
- Double-click or click elsewhere → close panel.
- Drag edge=resize · drag center=move · drag task→slot=assign.

**Sidebar**: header (date + filter "this pillar/matching workType/all"), slots list with 3-5 alternatives each (sorted by priority). Click alt → live update. Persists until same column re-clicked or Esc.

### Day
Sequential list, full day visible. Active slot highlighted (taller, accent border, distinct bg). Each block shows full hierarchy:

```
┌──────────────────────────────────────────────┐
│ 8:00-11:00 · 3h · Praca głęboka [deep]       │
├──────────────────────────────────────────────┤
│ 📚 Teza NOX                                  │
│ └─ Rozdział 3 (35% ukończone)                │
│    ├─ ✅ Przeczytać wywiad z Larsem          │
│    ├─ ◉  Sekcja S-line              [w toku] │
│    ├─ ☐  Powiązanie z gotykiem               │
│    └─ ☐  Wstawić ilustracje                  │
│ Główna sugestia: Sekcja S-line               │
│ [▶ Zacznij] [Inne sugestie ▾] [Zmień blok]   │
└──────────────────────────────────────────────┘
```

Active slot extras: live countdown, slot progress bar, accent frame. Bottom: "Dziś przemyślałem" quick-add (auto-tags pillar from context).

---

## 8. Focus modes (chosen by `slot.workType`)

Full-screen overlay (`position: fixed`).

- **Pomodoro** (deep, creative): 25/5 cycles to slot end. Big timer, task title, cycle counter, bell, Pause/Stop. Long break (15m) after 4 or at end.
- **Flowtime** (shallow, admin): plain stopwatch, no cycles, Pause/Stop.
- **Sport** (physical): stopwatch + optional intervals (4×4, tabata, custom). Stop only (manual breaks).
- **No timer** (social): full-screen "Bądź teraz tutaj", one button "Skończyłem". Deliberate — no time-measuring with people.
- **Quiet timer + journal** (reflective): left half = silent 15-30m timer (muted pulse near end); right half = empty textarea (placeholder "Co dziś zauważyłem?"). On finish → entry to thoughts (auto-tagged).
- **Check only** (routine physiology): no timer, just title + "Zrobione".
- **Free** (buffer): description + "Skończyłem". Doesn't count toward any pillar work.

### Common end flow
After Stop/Skończyłem → single question:

> **"Spędziłeś ten czas nad zadaniem które chciałeś?"** [Tak] [Nie]

- **Yes** → slot.completed=true; Project task: Todo→InProgress (or ask "Skończony task?" if InProgress→Done); Routine: heatmap tick + streak +1; updates milestone/goal/pillar progress; +1 in monthly balance.
- **No** → slot.completed=false, attempted=true; no progress changes; visible in "planned vs done" stats.

**No hour logging — binary trace only.**

### Skip
"Pomiń" button next to "Zacznij" → mark complete without focus mode (same Yes/No prompt).

---

## 9. Thoughts stream

```ts
type Thought = {
  id; text; createdAt;
  pillarId?; goalId?;
  source?: 'manual'|'reflective_focus'|'sunday_ritual';
};
```

Tab from dashboard. Chronological feed (newest top). Filters (pillar/goal/date). Text search. Card: text, relative date ("wczoraj"), pillar+goal tags (colored), Edit/Delete.

**Quick-add** in 3 places: dashboard (3 latest preview + add), Day view ("Dziś przemyślałem"), reflective focus (auto-saved on finish).

---

## 10. Stats (4 tabs)

1. **Weekly overview**: 12-week × N-pillars grid. Cell = mini progress bar (completed/target). Gradient: 0-50% red→yellow, 50-80% yellow→light-green, 80-110% green, 110-130% dark-green, >130% orange (overload).
2. **Goal lifecycle**: list all goals (Active+Done+Abandoned). Per goal: title, character, status, pillar, timeline bar (createdAt→completedAt|now), final %. Project: milestones+tasks count. Routine: avg+longest streak, total executions. Mixed: both. Filters: status/pillar/character.
3. **Consistency**: 12-month line chart, h/week per pillar (one line each). Below: 6 mini correlation charts (e.g. "Weeks with much vs little Ciało → effect on Praca"). Static built-in correlations, not ML.
4. **Monthly trace**: 12-month × N-pillars grid. Cell = monthly norm %. Colors: 90-110% green, 75-90% light-green, 60-75% yellow, <60% red, 110-130% dark-green, >130% dark-red. Hover tooltip with actual/target/balance.

---

## 11. Navigation map

```
ONBOARDING → template → calculator → DASHBOARD

DASHBOARD: header · pillar tiles (click→PILLAR DETAIL · "+"/edit modals)
         · monthly balance bars (click→PILLAR STATS)
         · Thoughts (3 latest + quick-add → THOUGHTS)
         · "Dziś" → CALENDAR (Day)
         · Footer: Calendar · Stats · Thoughts · Settings · Export

CALENDAR: Month/Week/Day toggle
  Month: 7×5/6 → click day → Day
  Week:  7×17 + panel + sidebar → "Zacznij" → FOCUS
  Day:   sequential list → "Zacznij" → FOCUS

FOCUS MODE: chosen by workType → Yes/No on finish → CALENDAR

PILLAR DETAIL: name/vision/mission (inline edit) · 4 metrics · goals list+detail · "+ Add goal"
GOAL DETAIL: header · Project/Mixed: Tree/Kanban/Roadmap toggle · Routine: heatmap+streak · Mixed: milestone list

THOUGHTS · STATS · SETTINGS (templates · layers→calculator · balanceMode · export/import · reset · about)
```

---

## 12. ADHD-friendly behaviors

- "Next action" prominently shown where it makes sense.
- Default views per character: Project→Tree, Routine→Heatmap, Mixed→milestone list.
- All vision/mission fields optional. Goal addable with title only.
- Undo (5s toast) for all destructive actions.
- No hard blocks.
- Sunday ritual built into calendar (if in template).
- All lists with 5+ items have search/filter.
- Inline editing everywhere (no modal for renaming a pillar). Click → input → enter.
- Persistence after every change (debounced 500ms localStorage).
- Empty states matter: "Brak celów. Dodaj pierwszy →".

---

## 13. Data model

```ts
type AppState = {
  user: User;
  layers: Layers;
  goals: Goal[];
  calendar: Calendar;
  slotCompletions: SlotCompletion[];
  thoughts: Thought[];
  statsCache?: StatsCache;
};

type Settings = {
  selectedTemplate?: string;
  balanceMode: 'calendar_month' | 'rolling_30';
  lastCalendarView: 'month' | 'week' | 'day';
  lastGoalViewPerGoalId: Record<string, 'tree'|'kanban'|'roadmap'>;
  changeCounter: number;
};

type Layers = { physiology: LayerCategory[]; lifeTaxes: LayerCategory[]; pillars: Pillar[]; };
type LayerCategory = { id; name; hoursPerWeek; healthyMin?; warning?; };
type Pillar = { id; name; description?; icon; color; weight; vision?; mission?; healthyMin?; };

type Goal = {
  id; pillarId; title; description?; vision?;
  character: 'Project'|'Routine'|'Mixed';
  status: 'Active'|'Paused'|'Done'|'Abandoned';
  weight?; deadline?;
  createdAt; updatedAt; completedAt?;
  milestones?: Milestone[];      // Project, Mixed
  routineConfig?: RoutineConfig; // Routine
};

type Milestone = {
  id; goalId; title; description?; deadline?; order;
  character?: 'Project'|'Routine';   // Mixed-only
  tasks?: Task[];                    // Project milestone
  routineConfig?: RoutineConfig;     // Routine milestone
};

type Task = {
  id; goalId; milestoneId; title;
  status: 'Todo'|'InProgress'|'Done';
  workType: WorkType;
  deadline?; notes?; subtasks?; createdAt; completedAt?;
  manualReassignCount: number;
};

type WorkType = 'deep'|'shallow'|'creative'|'admin'|'physical'|'social'|'reflective'|'routine'|'buffer';

type RoutineConfig = {
  frequency: 'daily'|'weekly'|'custom';
  timesPerWeek?; customDays?: ('mon'|'tue'|'wed'|'thu'|'fri'|'sat'|'sun')[];
  durationMinutes; workType: WorkType;
  completions: RoutineCompletion[];
};
type RoutineCompletion = { id; date; completed: boolean };

type Calendar = { template: WeekTemplate; weekOverrides: WeekOverride[]; };
type WeekTemplate = { slots: Slot[]; }; // 336 = 7 × 48 (30-min)
type Slot = {
  id; dayOfWeek: 0|1|2|3|4|5|6; // 0 = Sunday
  startMinute; durationMinutes;  // step 30
  pillarId; workType: WorkType;
  taskId?; goalId?; isFixed?;
};
type WeekOverride = { weekStartDate; slots: Slot[] };
type SlotCompletion = { id; slotId; weekStartDate; date; completed; attemptedAt };

type Thought = { id; text; createdAt; pillarId?; goalId?; source? };
```

---

## 14. Build order (MVP → polish)

**MVP**: 1) Onboarding+calculator · 2) Dashboard pillar tiles (static) · 3) Pillar/Goal detail (Project+Tree, add) · 4) Week calendar (grid+simple edit, no suggestions) · 5) Day view (no focus) · 6) localStorage persist.

**Intelligence**: 7) Suggestion engine · 8) Focus modes (Pomodoro+Flowtime+Yes/No) · 9) Routine+heatmap · 10) Monthly balance · 11) Live edit feedback.

**Full**: 12) Mixed character · 13) Kanban+Roadmap goal views · 14) Week alternatives sidebar · 15) Conflict modal · 16) All focus modes · 17) All 4 stats tabs · 18) Thoughts full view.

**Polish**: 19) Sunday ritual screen · 20) Multi-edit safeguard · 21) Animations · 22) Export · 23) Visual indicators (buffer gradient, deficit pulse).

---

## 15. Tech notes

- **Storage**: localStorage, separate keys per category, schema versioning, JSON export/import.
- **State**: Zustand or Jotai (or Context+useReducer for MVP).
- **Drag**: @dnd-kit/core+sortable, touch supported.
- **Dates**: date-fns + utility wrappers.
- **Style**: Tailwind 3.x; CSS variables for pillar colors (dynamic).
- **Tests**: Vitest+RTL. Unit tests for suggestion algorithm (deterministic) and balance math.
- **A11y**: focus traps in modals, keyboard nav (Tab/Esc/arrows in calendar), ARIA on custom controls.
- **Perf**: memoize pillar tiles (re-render only on balance change). Stats cache regenerated lazily.
- **Mobile**: Tailwind sm/md/lg. Week view → horizontal scroll or auto-switch to Day. Touch handlers for drag.

---

## 16. Out of scope (deliberately)

Push notifications (PWA), multi-device sync, Google/Apple Calendar integration, native mobile, multi-user goals, cloud backup, AI insights, interactive tutorials, PDF export.

---

## 17. Implementation reminders

1. TypeScript strict mode.
2. Suggestion algorithm has unit tests — central, must be deterministic.
3. Test every view with empty data.
4. ADHD-friendly = lots of visual structure, clear hierarchies, no hidden logic — *not* simplified.
5. App silence is a feature. When unsure whether to warn → don't.
6. Focus modes are full-screen `position: fixed` overlays — different behavior from rest of app.
7. 30-min slots are foundational. Don't change to 15/60 without deep refactor.
8. Everything editable is editable inline (click → input → enter), not via modal.
9. Persistence on every change (localStorage, 500ms debounce).
10. Empty states are critical: "Brak celów. Dodaj pierwszy →".
