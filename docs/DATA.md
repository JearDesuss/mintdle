# The item list

The item list is the product. Everything else is a commodity Wordle shell.

## Schema (`data.js`)

```js
{ n: "Pudgy Penguins",   // display name (unique)
  k: "pudgy-penguins",   // CoinGecko id — also the key for img/<k>.img
  c: "Ethereum",         // chain — one of CHAINS
  y: 2021,               // mint year (authored)
  s: 8888,               // total supply
  f: 12500,              // floor price in USD — the graded axis
  fn: 4.399,             // floor in its native currency
  cs: "ETH",             // that currency's symbol
  p: 22.5,               // all-time-high floor, native
  g: "PFP",              // class — one of CATS (authored)
  w: 4,                  // rotation weight, from market-cap rank
  l: "one-line provenance" }
```

## Where each field comes from

| field | source |
|---|---|
| `n` `c` `s` `f` `fn` `cs` `p` `w` | CoinGecko `/nfts/{id}`, via `tools/fetch-collections.js` |
| `y` `g` | authored in `tools/roster.json` |
| `l` | authored in `tools/lore.json` |

CoinGecko carries no mint date and no genre, which is why those two are hand-set.
It does carry `ath.native_currency`, which is what the reveal card's drawdown bar
measures against.

## Conventions

- **Tiers over precision.** Supply and floor are graded by order of magnitude, so
  a floor recorded at $4,200 when the truth is $4,050 changes nothing. Get the
  tier right; don't sweat the digit.
- **Floors are graded in USD, quoted in native.** See the note in README.
- **Drawdown is measured in native currency, not USD.** A floor that held its ETH
  price through a 60% ETH drawdown did not fall, and a dollar figure would say
  that it did.
- **Class is what the collection *is* to a collector.** A CC0 frog with no
  roadmap is `Meme`, not `PFP`. A companion airdrop is `Derivative` even when its
  art is better than the parent's. Fully onchain generative work is `Onchain`;
  Art Blocks-style curated output is `Art`.
- `f`, `fn` and `p` are a **snapshot**. Re-run the fetcher occasionally; the
  tiers mostly hold.

## Adding a collection

1. Find its CoinGecko id (`/api/v3/nfts/list` enumerates every one).
2. Append `{"id": "...", "y": 2024, "g": "PFP"}` to `tools/roster.json` —
   append, don't insert; smaller blast radius.
3. Write its line in `tools/lore.json`. One sentence, specific and factual. No
   hedging, no "this iconic collection".
4. `node tools/fetch-collections.js` (fetches only what is missing), then
   `node tools/fetch-art.js --missing`, then `node tools/build-data.js`.
5. `node tools/bump-assets.js` — data.js changed, so the cache stamp must move.
6. `node tools/schedule.js 7` — accept that future dailies just moved.

The builder refuses anything without a floor, a supply or a mapped chain, so a
half-fetched collection cannot reach the deck.
