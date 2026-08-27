# Mintdle — design contract

## North star

**The OpenSea Discover exchange turned into a daily collection-guessing desk.**

Mintdle is an NFT game, so the collection artwork is the marketplace inventory,
not background flavor. The interface stays near-black and information-dense. A
single electric blue marks live actions. Artwork is saturated, full-bleed, and
named wherever recognition matters.

The signature is the popular-collection field: real artwork already shipped in
`img/`—CryptoPunks, BAYC, Pudgy Penguins, Azuki, Milady, Doodles, Moonbirds,
DeGods, and generative-art collections—surrounds the game and forms the featured
market grid. Never replace it with generic “NFT-like” generated characters.

## Product job

The player must be able to:

1. Understand the daily format immediately.
2. Choose Classic, Blur, or Lore without hunting.
3. Search the collection deck and submit a guess quickly.
4. Read the result grid like market data.
5. Continue to another mode, archive, stats, or leaderboard.

Every visual choice serves one of those five jobs.

## Palette

| token | value | role |
|---|---:|---|
| Exchange void | `#04111d` | page and top navigation |
| Elevated 1 | `#0d1721` | cards, panels, modals |
| Elevated 2 | `#141f2a` | search, secondary controls |
| Elevated 3 | `#1b2730` | hover and selected support surfaces |
| Hairline | `#1f2937` | standard card/input border |
| Strong hairline | `#2c3a4d` | hover/focus edge |
| Paper white | `#f7faff` | primary text |
| Body | `#d4deed` | supporting text |
| Fog | `#94a7c1` | metadata |
| OpenSea blue | `#2081e2` | primary action and active mode |
| Ice signal | `#83c3ff` | linked/emphasized text |
| Correct | `#35d39a` | exact feedback |
| Close | `#f1b84b` | near feedback |
| Wrong | `#ef6178` | miss feedback and danger |

The page does not alternate light and dark sections. Depth comes from small
tonal steps and 1px rings. Artwork carries nearly all non-semantic color.

## Type

- **Inter**: wordmark, display, navigation, body, buttons, and card names.
- **Space Mono**: day/guess counters, labels, floors, chains, and other market
  metadata.

The working UI stays dense: 11–15px for most product text, 20–28px section
heads, and 42–58px only for the featured daily headline.

## Layout

- Top exchange navigation: 72px, full viewport width, sticky, hairline bottom
  edge. Brand, global jump-to-search, game navigation, help, and settings.
- Maximum content width: 1400px.
- Featured daily band: clear copy at left, real collection-card grid at right.
- Mode rail: three equal collection cards.
- Game area: fluid main panel and a 326px information rail.
- Collector hub: one full-width card below the live game.

At 820px the page becomes one column, the modes become a horizontal market
strip, and the side cards sit two-up. At 600px everything becomes a single
column and the top search collapses to its icon.

## Imagery

- Use only real local collection art from `img/` in the ambient wall and
  featured cards.
- Every prominent card names the collection; recognition is the point.
- Item art fills the media box edge-to-edge with `object-fit: cover`.
- Popular art may be pixelated if that is native to the collection.
- Missing artwork uses the dark generated fallback from `badgeURI()`.
- Decorative background images remain `aria-hidden`; the featured grid has
  useful alt text.

## Component grammar

### Asset and collection cards

`#0d1721`, 1px `#1f2937`, 10–12px radius. Artwork bleeds to the media edge.
Metadata occupies a compact strip. Hover lifts by 2px and strengthens the edge;
it never scales.

### Game panels

Solid elevated surfaces, not frosted glass. Header rows are slightly brighter
and separated with one hairline. The live puzzle is the largest panel because
it is the product, not supporting content.

### Search

The top search is a command that scrolls to and focuses the real guess input.
The `/` shortcut does the same. There are no dead marketplace controls.

### Status

Green, amber, and rose are reserved for exact, close, and wrong. Blue is never
a grade; it means active or actionable.

### Controls

Standard controls are 40–44px tall with an 8px radius. The prominent submit
button is blue. Secondary actions use Elevated 2 and a hairline. Pills are
allowed only where the content is truly categorical: search, filters, and
status metadata.

### Modals

Near-black, 16px radius, 1px strong hairline, restrained shadow. Mobile modals
dock near the bottom with safe viewport padding.

## Motion

- Popular collection cards drift vertically by at most 8px.
- Marketplace cards lift 2px on hover.
- The unknown collection card floats slowly.
- New grades flip in; missed collections slide down a few pixels.
- Modals fade and translate by less than 20px.
- No continuous scaling, bouncing panels, or decorative particle loops.

`prefers-reduced-motion` collapses all transitions and animations to 1ms.

## Accessibility and UX rules

- Keyboard focus uses a visible ice-blue 3px ring.
- `/` focuses the game search; Escape closes dialogs.
- Mobile hit targets stay at least 40px.
- The game board may scroll horizontally on narrow screens rather than crush
  the five grading columns.
- Interface copy names the action: “View all rules,” “Search collections and
  play,” “Post on X,” and “Erase my record.”
- No invented marketplace data and no fake wallet or trade controls.

## Do not

- Do not generate generic NFT lookalikes for the background.
- Do not copy the OpenSea logo or pretend Mintdle is affiliated with OpenSea.
- Do not add rainbow gradients to interface chrome.
- Do not blur the product surface into glass cards.
- Do not use a large marketing hero at the expense of the collection grid.
- Do not add non-functional Discover, Swap, wallet, or trading actions.
