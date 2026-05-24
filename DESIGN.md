# DESIGN.md — "Życie w równowadze" design system

This document is **load-bearing**. Every new component, page, or visual change in this app MUST follow it. When in doubt, copy a primitive from `components/ui/` rather than inventing a new pattern.

The visual language is inspired by Apple's Weather / iOS lock-screen aesthetic: a soft sunset gradient backdrop with a floating white card containing oversized numerals, tiny small-caps labels, and minimal mini-visualizations. Calm, generous whitespace, ADHD-friendly hierarchy.

---

## 1. Page shell

**Every full page is wrapped in `<AppShell>`** (from `components/ui/AppShell.tsx`). This guarantees:

- Sunset gradient background (fixed, full viewport)
- Centered horizontal container that **uses the full width of a 16:9 monitor**
- Left padding for `SideNav` clearance (`pl-20 sm:pl-24`)
- Generous outer padding (`px-4 sm:px-6 py-6 sm:py-10`)
- Vertical rhythm between sections (`space-y-5`)

### Width tokens

The `width` prop sets the max-width — pick the smallest one that still lets the page breathe:

| Token | Max-width | When to use |
|---|---|---|
| `narrow` | `max-w-2xl` (672px) | Reading-focused / single-column forms (rare) |
| `default` | `max-w-screen-xl` (1280px) | Most pages — dashboard, pillar detail, settings, thoughts |
| `wide` | `max-w-screen-2xl` (1536px) | Grid-heavy pages — stats, calculator, goal detail, onboarding |
| `full` | `max-w-none` | Edge-to-edge — calendar week/month, focus mode |

```tsx
<AppShell>             {/* default — 1280px */}
  <StatCard>...</StatCard>
</AppShell>

<AppShell width="wide">  {/* 1536px — when content is grid-rich */}
  <StatCard>...</StatCard>
</AppShell>
```

**Rule:** never let a page render as a narrow strip on a 16:9 monitor. If sections naturally stack vertically and look like a phone column on a desktop, refactor them into a multi-column layout (see §7).

Do NOT set `bg-*`, `min-h-screen`, or your own `max-w-*` on the inner content — that's the shell's job.

## 2. The card

The card is the visual unit. Anything that would be a "section" elsewhere is a card here.

```tsx
<StatCard>
  <StatCardHeader label="Today's sunset" right="5/9/2024" />
  <StatHero label="Time" value="7:44" unit="pm" />
  <StatGrid>
    <Stat label="Time to destination" value="13 min" />
    <Stat label="Distance left" value="0.3 mi" />
    <Stat label="Sunset conditions" value="Subdued" viz={<MiniBar values={[3,5,8,4,2]} />} />
    <Stat label="Temperature" value="68°" viz={<MiniBar values={[2,4,6,9,5]} />} />
  </StatGrid>
</StatCard>
```

Visual tokens (already in `globals.css`):

- Background: `bg-white/85 backdrop-blur-xl`
- Radius: `rounded-3xl` (24px)
- Shadow: `shadow-[0_10px_40px_-10px_rgba(50,40,80,0.18)]`
- Padding: `p-6 sm:p-8`
- Border: `border border-white/60` (subtle inner-light edge)

**Rule**: cards are always white-on-gradient. Never put cards inside cards. If you need internal divisions, use `<StatDivider />` (a thin horizontal line) or whitespace.

## 3. Typography

### Hero value
For the single most important number on a card (e.g., the time, the main balance):
- `text-6xl sm:text-7xl font-bold tracking-tight text-neutral-900`
- Optional inline unit: smaller (`text-2xl text-neutral-500 font-medium`)

### Stat value
Standard "big number":
- `text-3xl font-bold tracking-tight text-neutral-900`

### Label (small caps)
The defining label style of this system:
- `text-[10px] sm:text-[11px] uppercase tracking-[0.18em] font-medium text-neutral-500`
- Optional leading dot (`<span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5" style={{background: color}} />`)

### Secondary text
For descriptions, prose, body copy:
- `text-sm text-neutral-600` for primary prose
- `text-xs text-neutral-500` for hints

### What NOT to do
- ❌ Don't use h1/h2/h3 for these — use `<StatHero>`, `<Stat>`, `<StatCardHeader>` primitives
- ❌ Don't use uppercase + bold + large — uppercase is for tiny labels only
- ❌ Don't mix `text-indigo-700` (legacy) with new design — use semantic tokens

## 4. Color philosophy

The gradient supplies all the warmth. **Cards stay neutral.** Color appears only:

1. **Mini-bar viz** — small accent bars in coral/peach/lavender tones
2. **Pillar dots/badges** — keep pillar's own color (set via inline style)
3. **Status hints** — amber for warning, red for over-limit, green for success — used sparingly

Active text color is always near-black (`text-neutral-900`). Labels are `neutral-500`. **No more "primary brand button color"** — buttons in this system are pill-shaped, neutral-900 background with white text. See §6.

## 5. Mini-bar visualization

The vertical-stacked mini bar (5 small bars of varying height) is the system's signature mini-viz. Use it whenever a Stat has a numeric value that has component breakdowns or a "shape" worth showing.

```tsx
<MiniBar values={[2, 4, 6, 9, 5]} />            // 5 bars, max value = 10
<MiniBar values={[2, 4, 6, 9, 5]} max={12} />   // explicit max
<MiniBar values={[…]} accent="coral" />          // coral|peach|lavender|neutral
```

Sizes: ~24px tall, ~4px wide each, gap-1, rendered to the right of the Stat value.

## 6. Buttons

Two button shapes:

### Primary (pill)
The main call-to-action.
- `inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800`

### Secondary (ghost)
- `inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/60 backdrop-blur text-neutral-900 text-sm font-medium border border-neutral-200 hover:bg-white`

### Tiny inline action
- `text-xs text-neutral-500 hover:text-neutral-900 underline-offset-2 hover:underline`

**No** `bg-indigo-600` style buttons anywhere in new code. The remapped slate values still render OK for legacy components, but new components must use pill-shape neutral-900.

### Liquid Glass (SideNav only)
The floating left-side navigation pill (`components/SideNav.tsx`) is the project's one Liquid Glass surface — translucent pill, refractive rim, bright top specular, and an elastic press-spring on icon tap. It's intentionally a one-of-a-kind element. Do NOT extend this look to ordinary buttons or cards — the effect loses meaning if it's reused. If a new floating navigation element is added later, match the SideNav's exact rim/specular recipe rather than inventing a variant.

## 7. Lists, dividers, grids

- **`<StatGrid>`** — 2-column responsive grid for Stats (default). 1 column on `<sm`.
- **`<StatDivider />`** — thin `border-t border-neutral-200` with `my-5` spacing.
- **List of items** (e.g., goals, thoughts): each item is a sub-row inside a card. Use `divide-y divide-neutral-100` on the wrapping `<ul>`.

### Multi-column page layouts

Cards never go inside other cards (§2), but **cards do go side-by-side in a grid on wide screens**. This is how pages exploit the 16:9 viewport instead of stacking into a narrow strip.

Two primitives in `components/ui/SplitGrid.tsx`:

```tsx
<SplitGrid cols={2}>          {/* symmetric 2-col on lg+, 1 col below */}
  <StatCard>...</StatCard>
  <StatCard>...</StatCard>
</SplitGrid>

<SplitGrid cols={3}>          {/* symmetric 3-col on lg+ */}
  <StatCard>...</StatCard>
  <StatCard>...</StatCard>
  <StatCard>...</StatCard>
</SplitGrid>
```

For **asymmetric splits** (e.g. a tall main column + sidebar) use the 12-col Tailwind grid directly, wrapping each column in `<Column>` to keep the `space-y-5` rhythm:

```tsx
<div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
  <Column className="lg:col-span-7">
    <StatCard>...</StatCard>
    <StatCard>...</StatCard>
  </Column>
  <Column className="lg:col-span-5">
    <StatCard>...</StatCard>
    <StatCard>...</StatCard>
  </Column>
</div>
```

**When to split:**
- If a page has 3+ cards and any of them are short/light, split.
- Group cards by purpose into columns (e.g., "philosophical/static" vs. "operational/interactive").
- Page headers (greeting, back-link, breadcrumb) stay full-width, above the grid.

**When not to split:**
- A single wide table, calendar, kanban, or stats chart that benefits from its own width.
- One dominant card (hero) followed by short metadata that wants to live beneath it.

The breakpoint is `lg` (1024px). Below that, everything stacks to a single column — that's the mobile/tablet view.

## 8. Forms & inputs

- Sliders: keep `<Slider>` component, but accent color comes from context (pillar / tile)
- Text inputs: `<InlineInput>` for inline-editable values; explicit form inputs use `bg-white/70 border border-neutral-200 rounded-xl px-3 py-2 focus:border-neutral-400 outline-none`

## 9. Calendar & complex grids

Calendar (week/month views) is the one exception to the "card stack" rule — it stays a wide grid for utility. Use `<AppShell width="full">` (or `wide`) so the grid gets the full viewport. The grid itself lives inside a single white `<StatCard>` on the gradient.

The **mind map** (`/mindmap`, `components/MindMap.tsx`) follows the same rule: a single tall `<StatCard>` inside `<AppShell width="full">`, with the SVG canvas filling the card. It is the project's only free-canvas (pan/zoom) surface — don't introduce a second one without a strong reason. Pillar color is used for node fill and connector strokes; neutrals carry labels. Weight is expressed through node radius and stroke width, not through new color tokens.

## 10. Mapping legacy → new

Old patterns being phased out:

| Old | New |
|---|---|
| `bg-neutral-50` / `bg-cream-50` | (drop) — handled by `<AppShell>` |
| `bg-white border border-neutral-200 rounded-xl p-5` | `<StatCard>` |
| `text-sm font-medium text-neutral-500 uppercase tracking-wide` | `<StatCardHeader label="…" />` |
| `text-2xl font-bold` | `<StatHero>` or `<Stat>` |
| `bg-indigo-600 text-white rounded-lg` | pill button (§6) |
| Separate "section" with header + bordered box | one `<StatCard>` |

## 11. Do / don't

### Do
- Wrap pages in `<AppShell>` always
- Reach for primitives in `components/ui/` first
- Keep labels short, in tiny small-caps
- Let the gradient breathe — generous padding
- **Use the full viewport** on a 16:9 monitor — split sections into columns (`SplitGrid` or 12-col grid) rather than stacking everything as a narrow strip
- Numbers are heroes — make them large and confident

### Don't
- Don't add a new color or font without updating this doc
- Don't put cards inside cards
- Don't use multiple shadows / borders on a single card
- Don't fight the gradient — never set a solid background color on a page wrapper
- Don't reintroduce bright "brand button" colors
- Don't force a page to stay narrow when content can naturally split into columns — the user has a wide monitor, use it

## 12. Pillar color exception

Pillars carry their user-defined color (rendered as a small dot or a colored slider track). This is the one place where saturated color is permitted inside a card. Always render the pillar color as a small visual cue, never as a large filled area.

---

When extending this system: add a primitive in `components/ui/`, document it here under §5 or §7 (whichever fits), update §10 if it replaces an old pattern. **Never let a new page diverge from the system without updating this doc first.**
