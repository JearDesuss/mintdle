# Architecture

Zero-dependency static site. No build step, no framework, no bundler. Five
scripts loaded in order.

```
index.html      the whole dashboard + modals (help/settings/stats/archive/reveal/board)
style.css       the whole design system (tokens up top in :root)
data.js         the item list — collections + enums + tier functions
art.js          generated manifest: collection key -> img/<key>.img
lb.js           handles, X links and the board (talks to api/)
share.js        draws the result-card PNG and routes it to X
game.js         the engine (IIFE, no globals except what data/lb/share expose)
img/            collection artwork, up to 512px
api/            four Vercel functions on a Blob store
tools/          the data pipeline + the schedule spoiler + the asset stamper
test/           CDP end-to-end test
```

`img/` files carry a neutral `.img` extension. The sources mix PNG, JPEG, WebP
and the odd GIF; browsers sniff content for `<img>` regardless, and one
extension is better than a filename that lies about its contents.

## Layout

One screen: a three-column dashboard on a gallery wall. Left rail switches mode,
centre is the live board, right rail carries Yesterday and the rules. Below it
sits "Keep playing" on the one dark card. At 1040px the right rail drops to a
full-width row; at 760px everything stacks with the board ordered first.

The wall, its picture rail and the floor are pure CSS. The art hung along the
floor is real collection artwork from `img/`, dealt by `buildCrowd()` into three
depth bands sized from `window.innerWidth` — a fixed count clumps in the middle
of a wide screen — and rebuilt on a debounced resize.

## Routing

A hash router, so static hosting needs no rewrite rules:

| hash | board |
|------|-------|
| `#/` (or empty, or anything unknown) | classic, today |
| `#/<mode>` | that mode, today |
| `#/<mode>/unlimited` | that mode, endless random collections |
| `#/<mode>/d<N>` | that mode, archived puzzle N |

Archive runs write their own `mt_day_<mode>_<N>` progress but `recordResult()`
skips them, so replaying an old puzzle can never inflate or break a streak.

## The daily pick

Every client must agree on each mode's collection with no server:

- `EPOCH = 2026-08-27` (local time). Day number = whole days since epoch.
- Each mode has its own fixed seed; a mulberry32 weighted shuffle of the
  indices gives that mode one canonical permutation, identical everywhere.
- Daily collection = `ORDER[mode][day % length]`.

The shuffle is **weighted by fame**, via `fameWeight()` reading `w` from
data.js. This is the one rule inverted from Memedle, which weights by recency —
see the note in game.js and the README. `orderFor()` sorts by the
Efraimidis–Spirakis key `u^(1/w)` descending, which is still a permutation:
every collection comes up exactly once per cycle, but heavier ones land near the
front of it. Ties break on index so node and the browser cannot disagree.

Independent shuffles occasionally hand the same collection to two modes on the
same day, which turns solving one into a free hint for the other. `picksFor()`
assigns modes in a fixed order and, on a collision, walks that mode's
permutation forward by `STRIDE = 61` until it finds a free one. The stride is
large on purpose: a `+1` walk lands on that mode's next day, producing a
same-collection-twice-in-a-row repeat. It must be coprime with the list length
to visit every index; 61 is prime, so that holds for any length that is not a
multiple of it.

`tools/schedule.js` and `test/cdp-test.js` each reimplement this — keep the
three copies in sync if you touch the seeds, the stride, the mode order or
`fameWeight()`.

Consequences: changing the **order or count** in `data.js` reshuffles future
dailies in every mode. Editing a collection's fields in place is always safe.

## Grading (Classic)

| axis   | green      | yellow                        | arrow |
|--------|------------|-------------------------------|-------|
| Chain  | exact      | both EVM                      | —     |
| Class  | exact      | same family                   | —     |
| Year   | exact      | ±1 year                       | ▲▼    |
| Supply | same tier  | adjacent tier                 | ▲▼    |
| Floor  | same tier  | adjacent tier                 | ▲▼    |

Supply and floor tiers are order-of-magnitude bands (`supplyTier` / `floorTier`
in data.js), which is what makes approximate market data safe to ship. Floor is
graded in USD; see docs/DATA.md for why.

## Lore redaction

`loreParts()` splits the provenance sentence on a case-insensitive alternation
of the collection's name, its name words ≥4 chars, and its key's slug words,
longest first. Odd-indexed pieces are the matches and render as
`<span class="redacted">`. Text nodes are built with `createTextNode`, never
`innerHTML`.

## State

All localStorage, versioned keys, all prefixed `mt_`:

- `mt_day_<mode>_<day>` — `{g: [names], done, won, h: hintAxis}`
- `mt_stats_v1_<mode>` — played/wins/streak/maxStreak/dist
- `mt_cb` (colourblind), `mt_seen`
- `mt_name`, `mt_cid`, `mt_x`, `mt_queue` — leaderboard client

Memedle carries a `migrate()` that imports its own pre-split records. Mintdle
has no predecessor, so it has none: the only keys matching those names would
belong to a different game.

## Design system

**[DESIGN.md](../DESIGN.md) at the repo root is the contract — read it before
touching style.css.** Tokens live in `:root` and nowhere else; a literal hex or
px inside a component rule is a bug. Two radii (`--r-1` at 0, `--r-2` at 2px),
two rule widths, two hangs, one accent, three status hues, a named neutral ramp.
Elevation is one hard offset shadow with zero blur. Fills are flat; gradients
exist only in the wall.

Motion has **no overshoot** — `--ease-pop` is aliased to `--ease-settle` so a
rule imported from Memedle's stylesheet cannot smuggle a spring back in. A
framed plate has mass and a hook; it settles.

## Cache busting

`index.html` carries a manual `?v=` stamp on each local asset, derived from a
hash of their contents. `node tools/bump-assets.js` restamps them; run it before
any deploy that touches a local asset. `--check` exits non-zero when the stamp
no longer matches, so it can gate a deploy. This is not cosmetic: `index.html`
and `game.js` change together, and a visitor holding a stale `game.js` against
fresh markup gets a `TypeError` on the first renamed `getElementById` and a
blank page.

## Testing

`test/cdp-test.js` drives a real headless Chrome over CDP (no test deps; node
22+ for native WebSocket). It recomputes the day's answer from the page's own
`COLLECTIONS` array using an independent copy of the daily-pick algorithm, then
plays a losing guess and a winning one and asserts the grid, the pips, the
reveal, the provenance, the data link and reload persistence.

Navigation carries a cache-buster. Without it Chrome will happily serve a
stylesheet from memory across runs and the suite measures the previous build —
which it did, silently, until it was caught.
