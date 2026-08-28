#!/usr/bin/env node
// Merges the three inputs into data.js:
//   roster.json      — the curated list, with the authored year and class
//   lore.json        — the authored one-line provenance
//   .cg-cache.json   — market data pulled by fetch-collections.js
// Anything missing from the cache is skipped with a warning rather than shipped
// with a hole in it: a collection with no floor cannot be graded.
const fs = require('fs'), path = require('path');
const T = path.join(__dirname);
const roster = JSON.parse(fs.readFileSync(path.join(T, 'roster.json'), 'utf8'));
const lore   = JSON.parse(fs.readFileSync(path.join(T, 'lore.json'), 'utf8'));
const cache  = JSON.parse(fs.readFileSync(path.join(T, '.cg-cache.json'), 'utf8'));

const CHAIN = {
  ethereum: 'Ethereum', solana: 'Solana', ordinals: 'Bitcoin', base: 'Base',
  robinhood: 'Robinhood', abstract: 'Abstract', berachain: 'Berachain',
  apechain: 'ApeChain', 'polygon-pos': 'Polygon', ronin: 'Ronin',
  hyperevm: 'HyperEVM', 'binance-smart-chain': 'BNB Chain', avalanche: 'Avalanche',
  blast: 'Blast', 'arbitrum-one': 'Arbitrum', 'optimistic-ethereum': 'Optimism'
};

// Fame, not age — see the note on fameWeight in game.js. A collection nobody
// can name is a bad puzzle no matter how recently it minted.
// The roster is culled to famous collections only (tools/cull.js), so an absent
// rank no longer means obscure — CoinGecko simply does not track Nouns, Ringers,
// Checks, Loot, CrypToadz or Runestone. Anything still on the list earned its
// place, so an untracked entry sits mid-table rather than last.
function fame(rank) {
  if (!rank) return 2.5;
  if (rank <= 30) return 4;
  if (rank <= 80) return 2.5;
  return 1.5;
}
const r2 = n => Math.round(n * 100) / 100;
const r4 = n => Math.round(n * 10000) / 10000;

const out = [], skipped = [];
for (const r of roster) {
  const d = cache[r.id];
  if (!d) { skipped.push(`${r.id} (not fetched)`); continue; }
  if (d.floor == null || d.floorUsd == null) { skipped.push(`${r.id} (no floor)`); continue; }
  if (!d.supply) { skipped.push(`${r.id} (no supply)`); continue; }
  const chain = CHAIN[d.chain];
  if (!chain) { skipped.push(`${r.id} (unmapped chain ${d.chain})`); continue; }
  out.push({
    n: d.name, k: r.id, c: chain, y: r.y, g: r.g,
    s: Math.round(d.supply),
    f: Math.round(d.floorUsd),
    fn: r4(d.floor),
    cs: d.cur || 'ETH',
    p: d.ath != null ? r4(d.ath) : null,
    w: fame(d.rank),
    l: lore[r.id] || ''
  });
}

const noLore = out.filter(c => !c.l).map(c => c.k);
const dupes = out.map(c => c.n).filter((n, i, a) => a.indexOf(n) !== i);

const body = out.map(c =>
  `  { n: ${JSON.stringify(c.n)}, k: ${JSON.stringify(c.k)}, c: ${JSON.stringify(c.c)}, y: ${c.y}, ` +
  `s: ${c.s}, f: ${c.f}, fn: ${c.fn}, cs: ${JSON.stringify(c.cs)}, p: ${c.p}, ` +
  `g: ${JSON.stringify(c.g)}, w: ${c.w}, l: ${JSON.stringify(c.l)} }`
).join(',\n');

const chains = [...new Set(out.map(c => c.c))];
// Yellow on the chain axis means "both EVM". Solana and Bitcoin are the only
// two in the list that are not, which is what makes the axis worth grading.
const evm = chains.filter(c => c !== 'Solana' && c !== 'Bitcoin');

const file = `// Mintdle dataset — ${out.length} collections.
// Market data: CoinGecko's free NFT API, snapshot ${new Date().toISOString().slice(0, 10)}
//   (tools/fetch-collections.js). Year, class and provenance are authored
//   (tools/roster.json, tools/lore.json). Rebuild with tools/build-data.js.
//
// n  = display name (unique)      k  = collection key, also img/<k>.webp
// c  = chain                      y  = mint year
// s  = total supply               g  = class
// f  = floor price in USD         fn = floor in its native currency
// cs = that currency's symbol     p  = all-time-high floor, native
// w  = rotation weight (fame)     l  = one-line provenance
//
// The game grades supply and floor by order-of-magnitude tier, never by exact
// value, which is what makes approximate market data safe to ship.

var CHAINS = ${JSON.stringify(chains)};
var EVM_FAMILY = { ${evm.map(c => JSON.stringify(c) + ': 1').join(', ')} };

var CATS = ["PFP", "Meme", "Derivative", "Art", "Onchain", "Gaming", "Land", "Utility", "Collectible"];
// Yellow on the class axis: the same kind of thing, differently executed.
var CAT_FAMILY = {
  "PFP": "avatar", "Meme": "avatar", "Derivative": "avatar",
  "Art": "art", "Onchain": "art",
  "Gaming": "world", "Land": "world",
  "Utility": "access", "Collectible": "access"
};

// Supply tiers. 10,000 is the format's default, so the top tier is the crowded
// one and the interesting information is below it.
// 1: <=100 · 2: 101-999 · 3: 1K-4,999 · 4: 5K-9,999 · 5: 10K+
function supplyTier(s) { if (s <= 100) return 1; if (s < 1000) return 2; if (s < 5000) return 3; if (s < 10000) return 4; return 5; }
var SUPPLY_LABELS = ["", "\\u2264100", "100+", "1K+", "5K+", "10K+"];

// Floor tiers, in USD. The dataset spans three native currencies, so a ladder
// denominated in ETH would grade 9 SOL and 9 ETH as the same rung.
// 1: <$100 · 2: $100-$999 · 3: $1K-$9,999 · 4: $10K-$99,999 · 5: $100K+
function floorTier(f) { if (f < 100) return 1; if (f < 1000) return 2; if (f < 10000) return 3; if (f < 100000) return 4; return 5; }
var FLOOR_LABELS = ["", "<$100", "$100+", "$1K+", "$10K+", "$100K+"];

var COLLECTIONS = [
${body}
];
`;
fs.writeFileSync(path.join(T, '..', 'data.js'), file);

console.log(`data.js written · ${out.length} collections`);
console.log(`chains: ${chains.join(', ')}`);
if (dupes.length) console.log(`!! duplicate names: ${dupes.join(', ')}`);
if (noLore.length) console.log(`!! no lore: ${noLore.join(', ')}`);
if (skipped.length) console.log(`skipped ${skipped.length}:\n  ${skipped.join('\n  ')}`);
