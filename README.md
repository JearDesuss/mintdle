# Mintdle

**Guess the NFT collection of the day — three ways, on one screen.**

Blue chips from CryptoPunks in 2017 to whatever minted on Robinhood Chain this
summer. Six tries each, a fresh collection per mode every day, and a
spoiler-free share grid at the end.

| mode | the puzzle |
|------|-----------|
| **Classic** | Five-axis feedback on every guess — chain, class, year, supply, floor |
| **Blur** | The collection's artwork, heavily blurred. Every miss sharpens it |
| **Lore** | One line of provenance, with the collection's name redacted out |

Market data comes from CoinGecko's free NFT API — floor price, all-time-high
floor, supply and chain, per collection. Mint year, class and the provenance
line are authored. Artwork is pulled from OpenSea at 512px where a slug
resolves, and from CoinGecko otherwise.

Not financial advice; a good number of these are down 95%.

## Features

- One dashboard: mode rail, live board, yesterday's answer and the rules
- Three daily puzzles, one per mode, deterministic with no server
- Archive: replay any past puzzle without risking your streak
- Six tries each; misses hand you clues (chain → year → class → supply → floor)
- One hint per Classic daily, flagged in your share
- Real collection artwork with a blank-frame fallback
- Per-mode streaks, stats and guess distribution
- Unlimited mode for every puzzle type
- Colourblind mode (blue/orange), record wipe, OS reduced-motion respected
- Reveal card with provenance, the drawdown from peak floor, and a data link
- **Post on X**: the result is drawn to a 1200x675 PNG and routed to the
  composer the best way the browser allows. The card never shows the answer
- **Handles** and **a daily board per mode**, ranked wins → fewest guesses →
  no hint → earliest

## The five axes

| axis | green | yellow |
|------|-------|--------|
| Chain | exact | both EVM |
| Class | exact | same family (avatar / art / world / access) |
| Year | exact | within one year, ▲▼ toward the answer |
| Supply | same tier | adjacent tier, ▲▼ |
| Floor | same tier | adjacent tier, ▲▼ |

Supply and floor are graded by order-of-magnitude tier, never by exact value,
which is what makes approximate market data safe to ship. Floors are graded in
**USD** — the deck spans ETH, SOL and BTC, and a ladder denominated in ETH would
grade a 9 SOL floor and a 9 ETH floor as the same rung. The reveal card still
prints the native quote, because that is the number a collector actually says.

## The daily pick

Every client agrees on each mode's collection with no server: an epoch date, one
fixed seed per mode, and a weighted shuffle that is still a permutation.

The weight is **fame, not recency** — and that is the one substantive rule this
game inverts from Memedle. Memedle weights recent memecoins up, because a coin
from 2021 is trivia and one from this year is news. NFTs run the other way: a
2021 CryptoPunk is the most recognisable object in the dataset and a collection
that minted last month on a new L2 is the obscure one. `w` in `data.js` comes
from CoinGecko's market-cap rank.

## Run it

Static folder, no build, no dependencies. `python3 -m http.server`, open the URL.

## Develop

- **Docs**: [DESIGN.md](DESIGN.md) — the design contract; read it before
  touching `style.css` · [docs/DATA.md](docs/DATA.md)
- **Daily schedule (spoilers)**: `node tools/schedule.js 30`
- **Rebuild the dataset**:
  1. `node tools/fetch-collections.js` — one CoinGecko call per collection into
     a resumable cache. The free tier rate-limits hard, so this takes ~30
     minutes for a full roster and is safe to re-run.
  2. `node tools/fetch-art.js --missing` — artwork into `img/`, plus `art.js`.
  3. `node tools/build-data.js` — merges the cache with `tools/roster.json`
     (curated list + authored year and class) and `tools/lore.json` into
     `data.js`. Anything missing a floor, a supply or a known chain is skipped
     with a warning rather than shipped with a hole in it.
- **Test** (node 22+, Chrome): serve on :8471, run Chrome with
  `--remote-debugging-port=9223`, then `node test/cdp-test.js`. It recomputes
  the day's answer independently, so touching the seeds, the stride or
  `fameWeight` fails the test rather than silently rewriting the schedule.
- **Before every deploy**: `node tools/bump-assets.js` — restamps the `?v=` on
  every local asset from a hash of its contents. Without a fresh stamp a
  returning visitor can pair new markup with a cached `game.js` and get a dead
  page.

Adding a collection: append its CoinGecko id to `tools/roster.json` with a year
and a class, write its line in `tools/lore.json`, then run the three tools
above. Appending changes future dailies — re-run `node tools/schedule.js` after.

## Design

The design contract is [DESIGN.md](DESIGN.md). North star: **a print show hung
on museum board the morning of the opening.** Square geometry, two radii (one of
them zero), one accent, one hard zero-blur shadow, and a palette deliberately
drained so that the artwork is the only saturated thing on the page.

It descends from Memedle's sticker system and keeps its physics, but breaks with
it in three places on purpose — square instead of round, cool board instead of
warm paper, and a monospace label face so the numeral rule dissolves instead of
being policed. Those three, and why, are argued at the top of DESIGN.md.

## Credit

The engine, the design discipline and the three-mode structure are lifted from
[Memedle](https://github.com/JearDesuss/memecoindle) and rebuilt for a different
subject. The item list is the product; the format is a commodity.
