# Mintdle — design contract

> Read this before changing `style.css`. Any literal hex or px inside a component
> rule is a bug: the value belongs in `:root` or it does not exist.
>
> This system is descended from Memedle's and keeps its physics — one hard
> zero-blur shadow, flat fills, tokens or nothing. It differs everywhere the
> subject differs, and the subject here is *art*.

## north_star

**A print show hung on museum board the morning of the opening.**

Cold north light through high windows. Every panel on this page is a mounted
plate: a hard graphite rule, a thin mat line set inside it, and it hangs off the
wall by a fixed amount. The artwork inside the frame is the only saturated thing
in the room. Everything else is board, rule and label.

When a decision is contested, ask what a framed plate would do — and then ask
whether the answer would draw attention away from the art. If it would, it is
wrong.

## why not just reskin Memedle

Memedle's north star is a die-cut vinyl sticker on a sunlit arcade cabinet:
warm, round, playful, and the coin logos are *ornaments* on it. Here the
collection artwork **is** the subject — Blur mode is nothing but the art — so the
UI has to get out of its way. Three deliberate breaks:

1. **Square, not round.** Memedle runs three radii topping out at 12px. This runs
   two, topping out at 2px. An NFT is a 1:1 crop; a rounded frame around a square
   artwork fights it, and a 6px radius on every control is what makes a page read
   as consumer-app rather than gallery.
2. **Cool board, not warm paper.** A cream page tints every thumbnail hung on it.
   Museum board is chosen to be the least opinionated ground a picture can sit on.
3. **One numeral face.** Memedle needs `--font-num` because Jersey 15's `6` reads
   as `8`, so it bans its label face from digits. Using a *monospace* as the label
   face dissolves that rule instead of policing it — Space Mono renders `0/6` and
   `10,000` correctly, so labels and numbers are one family with one job.

## theme

light · single theme · `body.cb` swaps only the two status hues for colourblind play

## description

One screen. A mode rail on the left, the live board in the middle, yesterday and
the rules on the right, a dark backing card at the bottom. It hangs on a
limestone gallery wall that is scenery, never chrome — the wall never borrows a
UI colour and the UI never borrows the wall's.

The whole system is one plate component with three roles and three sizes. If a
new element needs a look the plate cannot give it, the answer is almost always
that the element should not exist.

## colors

The neutral ramp is named. Hex-only palettes drift.

| hex | name | group | role — where it is allowed to appear |
|---|---|---|---|
| `#16181D` | Graphite | neutral | every frame rule, every hang shadow, body text. The only outline colour on the page. |
| `#4A4F5A` | Slate | neutral | secondary text: blurbs, captions, column heads, `.fine` |
| `#868D9B` | Fog | neutral | tertiary: placeholder, quiet marks, unplayed pips |
| `#B6BCC6` | Ash | neutral | inert fills — the unused guess pip — and tertiary text on the Night card, where Fog fails contrast. |
| `#D8DAD2` | Rule | neutral | the mat line *inside* a plate: recessed rows, quiet borders |
| `#E8E9E1` | Mat | neutral | recessed surface inside a plate: panel bars, quiet buttons, chips |
| `#F2F2EC` | Board | neutral | the plate face. The default surface of the whole system. |
| `#FBFBF7` | Lit | neutral | the one lit surface: text input, hover state |
| `#1B1F2E` | Night | neutral | the single dark backing card (`.more`) and the unsolved plate |
| `#2E4BF0` | **Cobalt** | **accent** | **the one live action in a view, and the wordmark. Nothing else.** |
| `#2E9E5B` | Bull | status | correct — guess tile, win flag, distribution bar, win verdict |
| `#E0A32B` | Amber | status | close — guess tile, revealed clue chip |
| `#DC3B3B` | Miss | status | wrong — guess tile, loss flag, loss verdict, danger button |

**Accent scarcity is the whole trick.** Cobalt is the only chromatic *control*
fill on the page. One per view: the submit button, or the active mode card, or
the primary button in a modal — never two at once, never as decoration.

Cobalt sits far from all three status hues on purpose. An accent that a player
could mistake for a grade is not an accent — it is a fourth status colour.

Status colours are allowed on tiles, flags, bars and verdicts. **A status colour
may never fill a button.** The one exception is `.btn-danger`, which is a status
*as* an action and is confined to the settings danger zone.

**Nothing in the UI is allowed to be more saturated than the artwork.** Every
neutral here is under 8% chroma. That is not a stylistic preference; it is the
reason a blurred Fidenza still reads as the loudest thing on the screen.

## surfaces

| hex | name | level | purpose |
|---|---|---|---|
| CSS gradient | Wall | 0 | the limestone gallery wall and its picture rail. Scenery. Never a UI surface. |
| `#F2F2EC` Board | Plate | 1 | every panel, modal, mode card, and pressable control |
| `#E8E9E1` Mat | Inset | 2 | a recess *within* level 1: panel bars, quiet buttons, chips |
| `#1B1F2E` Night | Backing | 3 | one element only — the footer card. Its contents invert to Board. |

## typography

Three families, three jobs, no overlap. A family with two jobs is a family too many.

| family | substitute | weights | role |
|---|---|---|---|
| Archivo Black | Arial Black, system-ui | 400 | **display only** — the wordmark and the reveal verdict. Banned from UI and body copy. |
| Space Mono | ui-monospace, monospace | 400 / 700 | **labels and every numeral** — mode names, button faces, section headings, floor prices, supply, counters, the day number |
| Space Grotesk | Segoe UI, system-ui | 400 / 500 / 700 | **everything else** — all body copy, blurbs, lore |

**The numeral face is the label face, and that is the point.** A monospace with
tabular figures by construction means counters and floors never reflow as they
tick, and there is no digit rule to remember or break. `font-feature-settings:
"tnum" 1` is still set on Space Grotesk for the few numerals that land in body
copy.

Faces are loaded with a full system fallback stack so the offline single-file
build still reads.

## type_scale

| role | family | size | weight | line-height | tracking |
|---|---|---|---|---|---|
| wordmark | Archivo Black | fluid | 400 | .95 | −0.03em |
| verdict | Archivo Black | 24px | 400 | 1.2 | −0.02em |
| label-lg | Space Mono | 15px | 700 | 1.1 | +0.06em |
| label-md | Space Mono | 12px | 700 | 1.15 | +0.09em |
| label-sm | Space Mono | 10px | 700 | 1.2 | +0.12em |
| body | Space Grotesk | 15px | 400 | 1.55 | 0 |
| body-sm | Space Grotesk | 13px | 400 | 1.5 | 0 |
| num | Space Mono | 22px | 700 | 1 | 0 |

All Space Mono labels are uppercase. Tracking rises as size falls — a 10px mono
at default tracking is a smudge.

White display text over the wall carries a 2px Graphite stroke (`--stroke`),
never a soft shadow. It is a cut edge, not a glow, and it is the only text effect
in the system.

## spacing

    base            4px — every gap is a multiple, no exceptions
    elementGap      8px
    cardPadding     14px
    sectionGap      24px
    pageMaxWidth    1180px

    radius
      control       0px    buttons, inputs, tiles, chips, thumbnails, icons
      card          2px    panels, modals, the backing card

**Two radii, and one of them is zero.** Memedle needed three because a sticker is
die-cut; a frame is mitred. `50%` is not a third radius — it is reserved for
things that are round *in the fiction*: the guess pip. No control is ever round,
and **no badge is ever a pill** — a pill in a square system is the single
loudest tell that a component was imported rather than designed.

    rule            3px  the frame line on anything that is its own plate
    rule-in         1px  the mat line set inside a plate — tile, chip, thumbnail

    hang            4px  small controls
    hang-card       6px  panels, modals, mode cards, the backing card

## elevation

**One philosophy: a plate hangs off the wall. Hard offset, zero blur, Graphite
only.**

`box-shadow: 0 var(--hang) 0 var(--graphite)`. Pressing translates the element
down by exactly the hang and zeroes the shadow, so the plate meets the wall.
Nothing else.

No blurred `rgba()` drop shadows anywhere in the UI. The 3px Graphite rule is
what separates a panel from the wall; a soft shadow beneath it does nothing
except make it look like a stock template. Blur survives in exactly two places,
both scenery: the wall's corner vignette and the modal backdrop scrim.

No inner shadows. No bevels. No `to bottom` gradient on any control. Fills are
flat. Gradients exist only in the wall.

## the mat

The one structural idea Memedle's sticker system does not have, and the reason a
thumbnail here reads as *mounted* rather than merely outlined.

Every artwork frame carries padding in Board between the picture and its
Graphite rule. That is a real mat — the image's own box is inset from the frame
— not a second border pretending to be one. It costs no colour, no shadow and
no image, and it is the whole of what makes the page say "gallery".

Three sizes, set by how much art there is to protect:

| where | mat |
|---|---|
| `.blur-frame`, `.item-card-art`, the hung plates | 4px |
| `.mode-ico` | 3px |
| `.item-art`, `.ac-art` — any frame under 32px | 2px |

**A mat goes around a picture, and only around a picture.** A panel of text with
a line set inside its frame is decoration wearing the mat's clothes; the panels
carry their Graphite rule alone. The one non-artwork exception is `.mystery`,
the unhung plate, which draws its mat as a `::after` because there is no image
inside it to pad — it is a frame with nothing in it yet, and the mat is what
says so.

## layout

Three columns at `1fr 1.65fr 1fr` with an 8px gutter, collapsing to `1fr 1.5fr`
at 1040px (right rail wraps full-width) and to a single column at 760px, where
the mode rail becomes a 3-up strip of name-and-flag chips.

Vertical rhythm inside a panel is 14px; between panels, 12px; between sections,
24px. The page is centred at 1180px and the wall bleeds past it on both sides —
the content column must never touch the viewport edge, because the hung
thumbnails need wall around them to read as a room rather than a border.

The footer backing card is deliberately narrower (620px) than the board above
it. It is the only element that steps in, and that step is what signals the game
is over.

## imagery

- **Collection artwork is the subject.** Always in a `rule-in` Graphite frame at
  `control` radius (so: square), `object-fit: cover`, never floating and never
  circular. A square crop reads as an artwork; a circle reads as an avatar, and
  an avatar is the one thing an NFT collection is *not* in this game.
- **The wall is scenery.** A CSS limestone gradient with a picture rail and a
  vignette. It never scrolls independently, never sits above the content, and
  never contributes a colour to a token.
- **The hung thumbnails are the crowd.** Real collection art from `img/`, dealt
  into two depth bands as small framed plates, dimmed and desaturated toward the
  back. They are decoration and are lazy-loaded below the fold; the game never
  reads them and a missing one leaves a blank frame, which is a gallery mid-hang
  and therefore still correct.
- Artwork ships at up to 512px so Blur mode out-resolves its frame at 2x.

## components

| name | role | description |
|---|---|---|
| `.btn` | the one button | Board fill, `rule` Graphite, square, `hang`. Space Mono uppercase. Everything pressable is this, at one of three sizes. |
| `.btn-primary` | the live action | The `.btn`, filled Cobalt. **One per view.** |
| `.btn-quiet` | peer options | The `.btn` with a Rule border and no hang — for sets of equals (stat tabs, archive rows) where nothing is primary. |
| `.btn-danger` | destructive | The `.btn`, filled Miss. Danger zone only. |
| `.ico-btn` | square icon | The `.btn` at 40px square. Topbar and social row use the identical element. |
| `.panel` | a plate | Board, `rule` Graphite, `card` radius, `hang-card`, mat line. Optional `.panel-bar` header in Mat with a `rule` Graphite line beneath. One bar treatment — colour-coded bars are decoration carrying no information. |
| `.mode-card` | rail entry | A pressable `.panel`: thumbnail, name, blurb, flag, progress track. The active one is **pressed flat** against the wall with a Cobalt spine down its left edge — selection is state, so it borrows the system's physics rather than a second Cobalt fill. |
| `.tile` | graded answer | `rule-in` Graphite, square, flat status fill. The only place status colour is large. |
| `.chip` | inline fact | Square, `rule-in`, Mat or Amber fill. Never pressable. |
| `.social-btn` | outbound link | The `.btn` at 40px tall with a 16px glyph. A missing URL renders it Mat-filled with a quiet `soon` tag. |
| `.flash` | acknowledgement | The `.btn` plate as a message, parked bottom-centre. It introduces no new *look*, only a new position — which is the only reason it is allowed to exist. **No status variant**: a toast is not a tile, so a failure gets the same Board flash with different words. |
| `.field` | text entry | `#guess-input` in a wrapper, so a prefix can sit inside the frame. Lit face, `rule` Graphite, square, and the same Cobalt focus ring the guess box uses. |
| `.more` | backing card | The one Night surface. Same rule, radius and hang as everything else — it is a plate that happens to be dark, not a foreign object. Graphite and Night are close, so this card re-points `--shadow` at pure black or every hang inside it vanishes. |

## motion

**A hung plate settles. It does not spring.**

This is the sharpest break from Memedle, and it is derived from the material
rather than from taste. A vinyl sticker peeled and slapped back down *overshoots*
— Memedle's `--ease-pop` is correct for it. A framed plate on a wall has mass and
a hook; it goes down fast and comes back **flat**, with no overshoot at all.
`--ease-settle` is a pure ease-out and there is no pop curve anywhere in this
system. If you find yourself reaching for one, you are designing a sticker.

`:active` carries `--press-in` (60ms) and the base rule carries `--press`
(180ms), both on `--ease-settle`.

**A press flashes the mat.** The one press effect in the system: the inner mat
line jumps from Rule to Cobalt and fades back over three steps. It is a
three-frame flash, not a ripple — a frame does not glow, and `outline-offset`
is never animated because moving the mat line changes what the frame *is*.

**No `scale()` on anything carrying a rule.** A 3px rule at `scale(.94)` is
2.82px, and a system with two rule widths cannot afford a third by the back
door. Every keyframe translates instead, including the modal entrance.

**Leaving is faster than arriving.** `--dur-close` (140ms) against the 220ms
entrance.

**Reduced motion collapses the tokens, not the states.** The media block sets
every `--dur-*` to 1ms in one line. A pressed plate must still visibly *be*
down; that is state, not animation.

**One line makes any of this exist on a phone.** iOS Safari does not apply
`:active` unless the document has a touch listener, so `game.js` registers an
empty passive `touchstart`. Without it the whole press system is dead on iPhone.

## dos

- **Write the north-star sentence before the CSS.** Generic UI is what happens
  when nobody did. Every rule here is derivable from the print-show sentence; if
  a new rule is not, it is probably wrong.
- **Spend the accent once per view.** If two things are Cobalt, neither is the
  action. Demote one to Board and the eye lands where it should.
- **Let the art be the colour.** The palette is deliberately drained so that a
  single 96px thumbnail can carry a whole panel. Adding a second hue to the UI
  spends the contrast the artwork needs.
- **Flat fills only.** A `to bottom` gradient on a control is the fastest way to
  make a hand-built page look machine-generated, because that is what every
  generator emits.
- **Match siblings exactly.** Four buttons in a row are four peers: same fill,
  same size, same weight. Differentiating them by hue invents a hierarchy that
  does not exist and destroys the one that does.
- **Reach for the ramp, not a new hex.** If Slate is too dark for a caption, the
  caption is at the wrong size — the ramp has nine stops and they are enough.
- **Graphite means spent.** A used guess pip, the rail's progress fill and the
  guess counter are all Graphite — they report consumption. Spending Cobalt on
  them would mean the accent no longer points at the live control.
- **Let the rule do the separating.** 3px of Graphite against limestone is more
  contrast than any shadow will buy, and it costs nothing on a busy wall.

## donts

- **No emoji as UI furniture.** ✦ flanking a title, 🖼 in a panel bar, 🎨 on a
  section header — pure filler, rendered at a different weight than the type
  beside it, and a sparkle-flanked heading is the most recognisable AI-slop tell
  on the web. The one sanctioned exception is 🔥 on the streak badge, where the
  emoji is the established convention for the thing itself.
- **No blurred shadow in the UI.** Ever. It is a second elevation system and it
  makes a flat room look like a template. Blur is for the wall and the modal
  scrim only.
- **No third radius, and no pills.** A one-off 8px corner is how a system becomes
  eleven radii. A pill badge in a square system reads as a component someone
  pasted in from a different app, because that is exactly what it looks like.
- **No border width outside `rule`/`rule-in`.** Ad-hoc widths make identical
  components look subtly mismatched at every zoom level.
- **No status colour on a button.** Green means correct, not clickable.
  Overloading it costs the player the one signal the game actually runs on.
- **No overshoot.** No `--ease-pop`, no bounce keyframes, no spring. Plates
  settle. This is the one rule most likely to be broken by muscle memory from
  Memedle's stylesheet.
- **No circular artwork.** Ever, anywhere, at any size. An NFT collection is a
  square, and the moment a thumbnail is round the page is about avatars.
- **No advisory or hedging copy.** "The blue chips make good openers", "think
  like a collector" are an assistant talking, not a game. State the rule, or say
  nothing.
- **Never go dark.** A black gallery was tried and cut: it is what every NFT
  marketplace already looks like, it makes the page indistinguishable from a
  dashboard, and it drops the artwork's contrast against its own frame. The show
  opens in daylight.
