# Mintdle — design contract

> Every token below is lifted from `@opensea/ui-kit@3.0.153`, OpenSea's own
> published design system (`src/styles/theme.css`, `dist/components/Button`,
> `dist/components/Text`). This is not an impression of OpenSea. It is their
> vocabulary, applied to a game. When something here looks arbitrary, it is
> because it is theirs, and it is load-bearing.

## North star

**A trading desk at 3am, lit only by the artwork.**

Neutral charcoal — never navy. The room is grey and unlit; the only colour in it
is the NFT art and one blue that means *you can act on this*. Mintdle is an NFT
game, so the collection artwork is the inventory, not background flavour. The
interface stays dark and information-dense and gets out of the way.

The signature is the popular-collection field: real artwork already shipped in
`img/` — CryptoPunks, BAYC, Pudgy Penguins, Azuki, Milady, Doodles, Moonbirds,
DeGods, and generative-art collections — surrounds the game and forms the
featured market grid. Never replace it with generic "NFT-like" generated
characters.

## Product job

The player must be able to:

1. Understand the daily format immediately.
2. Choose Classic, Blur, or Lore without hunting.
3. Search the collection deck and submit a guess quickly.
4. Read the result grid like market data.
5. Continue to another mode, archive, stats, or leaderboard.

Every visual choice serves one of those five jobs.

## The three rules that were broken before

These are the rules the previous revision violated, and they are the reason it
read as generated. They outrank everything else in this document.

**1. Nothing is heavier than 500.** OpenSea's entire type system — display at
60px, headings, body, buttons — is capped at `font-medium`. There is no 600, no
700, no 800 anywhere in their kit. The previous Mintdle used `font-weight: 700`
thirty-one times and `800` three times. Same typeface, wrong weight, and that
alone is most of the "AI look".

**2. No gradient is ever a UI surface.** OpenSea's primary button is a flat fill
that swaps to another flat fill on hover. Gradients belong to artwork only. The
previous revision had 25 gradients, including a literal
`linear-gradient(cyan, blue, violet)`.

**3. Blue is never a grade and never decoration.** Blue means *actionable*.
Green, amber and red mean exact, close and wrong. A blue `6/6` counter is a bug.

## Palette

Neutral charcoal. The previous navy (`#04111d`) and blue-tinted body text
(`#d4deed`, `#94a7c1`) are what made the page read as generic-crypto-dark;
OpenSea's greys carry no hue at all.

### Surfaces

| token | value | level | purpose |
|---|---:|---:|---|
| `--app` | `#101011` | 0 | page ground |
| `--surface-1` | `#141415` | 1 | default panel, card, modal |
| `--surface-2` | `#17181a` | 1 | sparingly, where one panel must separate from another |
| `--raise-1` | `#1b1d1f` | 2 | component fill — inputs, secondary buttons |
| `--raise-2` | `#26272d` | 2 | hover fill |
| `--raise-3` | `#3c3d40` | 3 | pressed / selected fill |
| `--contrast-1` | `#898a8c` | 3 | high-contrast component fill |

### Borders

| token | value | role |
|---|---:|---|
| `--line-1` | `#26272d` | standard card and input edge |
| `--line-2` | `#34353c` | hover edge |
| `--line-3` | `#434447` | focus / selected edge |

### Text

| token | value | role |
|---|---:|---|
| `--text` | `#ffffff` | primary |
| `--text-2` | `#acadae` | supporting and metadata |
| `--text-3` | `#434447` | disabled, and hairline-weight labels |

### Blue — the only chromatic UI colour

| token | value | role |
|---|---:|---|
| `--blue-1` | `#83c3ff` | links, emphasised text |
| `--blue-2` | `#2092ff` | primary hover / focus / active fill |
| `--blue-3` | `#0786ff` | primary action fill |
| `--blue-5` | `#055eb3` | pressed edge |

### Grades — reserved, never decorative

| token | value | role |
|---|---:|---|
| `--exact` | `#0fbe39` | exact match |
| `--close` | `#ffcc00` | near match |
| `--wrong` | `#e24756` | miss, and destructive actions |

Grades render as OpenSea renders status: an 8–16% wash of the colour, a 1px
border in the colour, and the label in the colour. Not a solid candy fill, and
never a gradient.

`--legendary #ff8a00`, `--epic #d358ff`, `--rare #00a3ff`, `--common #898a8c`
exist for collection rarity only. They are not UI colours and never appear on
chrome.

The page does not alternate light and dark sections. Depth comes from small
tonal steps and 1px borders. Artwork carries every other colour on the page.

## Type

**Inter** — 400 and 500 only. Load exactly those two weights.
**Space Mono** — labels, counters, floors, chains, supply, and other market
metadata. Uppercase. Never display, never body copy, never a button.

Substitute for Inter: `-apple-system, "Segoe UI", system-ui, sans-serif`.

| role | size | weight | line-height |
|---|---:|---:|---|
| display-lg | 48px | 500 | 1.15 |
| display-md | 32px | 500 | 1.2 |
| heading-lg | 32px | 500 | 1.25 |
| heading-md | 24px | 500 | 1.25 |
| heading-sm | 20px | 500 | 1.25 |
| heading-xs | 18px | 500 | 1.25 |
| body-md | 16px | 400 | 1.5 |
| body-sm | 14px | 400 | 1.5 |
| body-xs | 12px | 400 | 1.5 |
| label | 10px | 400 | 1.25 · mono · uppercase · `.08em` |

Tracking tightens as size grows: `-0.02em` at 32px and above, `-0.01em` at
20–24px, normal below.

The working UI stays dense: 12–14px for most product text, 20–24px section
heads, and 48px only for the featured daily headline. The hero is 48px at
weight 500 — not 58px at weight 800.

## Layout

- Top exchange navigation: 72px, full viewport width, sticky, hairline bottom
  edge. Brand, global jump-to-search, game navigation, help, and settings.
- Maximum content width: 1400px.
- Featured daily band: clear copy at left, real collection-card grid at right.
- Mode rail: three equal collection cards.
- Game area: fluid main panel and a 326px information rail.
- Collector hub: one full-width card below the live game.

Spacing base 4px. Element gap 8px, card padding 20px, section gap 56px.

At 820px the page becomes one column, the modes become a horizontal market
strip, and the side cards sit two-up. At 600px everything becomes a single
column and the top search collapses to its icon.

### Section headings

A section gets a mono eyebrow **or** a heading, not both, and not six times down
one page. Reserve the eyebrow for the two places where the label carries real
information — the live puzzle's day counter and the featured drop. Everywhere
else, the heading stands alone. Repeating one template down a page is the most
legible sign that nobody chose anything.

## Imagery

- Use only real local collection art from `img/` in the ambient wall and
  featured cards.
- Every prominent card names the collection; recognition is the point.
- Item art fills the media box edge-to-edge with `object-fit: cover`.
- Popular art may be pixelated if that is native to the collection.
- Missing artwork uses the dark generated fallback from `badgeURI()`.
- Decorative background images remain `aria-hidden`; the featured grid has
  useful alt text.
- **Ambient artwork never sits behind text.** The drifting wall lives in the
  page margins and behind solid panels, never underneath a headline or a row of
  controls, where it turns both to mud.

## Component grammar

### Radii — three, total

`6px` controls (buttons, inputs, tiles) · `12px` cards and panels · `9999px`
pills. OpenSea's button is `rounded-md`, which is 6px. Anything else is a bug.

### Buttons

Height 40px, horizontal padding 20px, 14px text, weight 500, 6px radius. Large
variant 48px / 24px / 16px; small 32px / 12px / 14px.

- **Primary** — flat `--blue-3`, white text, no border. Hover, focus and active
  all swap to flat `--blue-2`. No gradient, no glow, no shadow.
- **Secondary** — `--surface-1` with a `--line-1` border; hover fills `--raise-2`.
- **Tertiary** — `--raise-1`, no border; hover `--raise-2`.
- **Destructive** — 8% `--wrong` wash, 1px `--wrong` border, `--wrong` text.

Transition `scale` and `colors` only, 200ms, ease-out. `active: scale(.97)`.
**No hover lift.** `translateY(-2px)` applied to every button on the page is a
tell, not a system.

### Asset and collection cards

`--surface-1`, 1px `--line-1`, 12px radius. Artwork bleeds to the media edge.
Metadata occupies a compact strip. Hover strengthens the edge to `--line-2` and
nothing else — it never lifts and never scales.

### Game panels

Solid surfaces, not frosted glass. Header rows are separated with one hairline.
The live puzzle is the largest panel because it is the product.

### Search

The top search is a command that scrolls to and focuses the real guess input.
The `/` shortcut does the same. There are no dead marketplace controls.

### Status and grade tiles

Wash + border + text in the grade colour, per the palette section. The
high-contrast setting swaps green/amber for blue/orange and is the only case
where blue appears on a grade.

### Modals

`--surface-1`, 12px radius, 1px `--line-1`, black 60% overlay. Mobile modals
dock near the bottom with safe viewport padding.

## Elevation philosophy

Hairline borders and flat surfaces. One shadow exists — `0 8px 24px rgba(0,0,0,.4)`
— and it belongs to modals and dropdowns, the only things that genuinely float.
Cards do not have shadows. Buttons do not have shadows. Nothing has a coloured
shadow, ever; a blue glow under a blue button is the single most generated-looking
thing a page can do.

## Motion

- Popular collection cards drift vertically by at most 8px.
- Cards change border colour on hover. They do not move.
- Buttons scale to .97 when pressed. They do not move on hover.
- New grades flip in; missed collections slide down a few pixels.
- Modals fade and translate by less than 20px.
- No continuous scaling, bouncing panels, or decorative particle loops.

Durations 200ms for colour, 450ms for layout, `--ease-out cubic-bezier(0,0,.58,1)`.
`prefers-reduced-motion` collapses all transitions and animations to 1ms.

## Accessibility and UX rules

- Keyboard focus uses a visible 2px `--blue-1` ring at 2px offset.
- `/` focuses the game search; Escape closes dialogs.
- Mobile hit targets stay at least 40px.
- The game board may scroll horizontally on narrow screens rather than crush
  the five grading columns.
- Interface copy names the action: "View all rules," "Search collections and
  play," "Post on X," and "Erase my record."
- Copy says what a thing is. "Today's game modes," not "Choose your signal."
- No invented marketplace data and no fake wallet or trade controls.

## Do

- **Cap every weight at 500** — it is the difference between OpenSea and a
  generated landing page, using the identical typeface.
- **Keep the ground neutral** — `#101011` has no hue; navy reads as stock crypto.
- **Spend blue once per view** — one primary action, and links. Everything else
  earns attention through contrast, weight and space.
- **Let artwork be the only saturated thing** — the punks and the Azuki red are
  the colour budget, and they are already paid for.
- **Use mono for data** — floors, supply, chains, day counters. It is doing a
  job there.
- **Separate panels with one hairline** — not a shadow, not a glow, not a rule
  plus a shadow.
- **Delete a decoration before adding one** — the page is a desk, and a desk
  earns its density from information.

## Do not

- Do not generate generic NFT lookalikes for the background.
- Do not copy the OpenSea logo or pretend Mintdle is affiliated with OpenSea.
- Do not use `font-weight` above 500 anywhere, including the wordmark.
- Do not put a gradient on a UI surface — button, card, tile, bar, or pill.
- Do not put a coloured shadow under anything.
- Do not lift an element on hover.
- Do not tint neutrals toward blue.
- Do not use blue as a grade, a progress fill, or a decorative accent.
- Do not stack a mono eyebrow above a heading more than twice per page.
- Do not float artwork behind live text.
- Do not blur the product surface into glass cards.
- Do not add non-functional Discover, Swap, wallet, or trading actions.
