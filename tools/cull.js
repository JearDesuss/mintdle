#!/usr/bin/env node
// Culls the roster to collections a player could actually name. Read-only by
// default; --write rewrites roster.json.
//
// Two-part rule, because neither half works alone:
//
//   1. MARKET — CoinGecko market-cap rank <= RANK_MAX, with a floor and an
//      owner floor to catch things that rank on a stale cap. Rank is the "right
//      now" signal: it moves with the market, unlike an authored weight.
//
//   2. ICONIC — CoinGecko's NFT rank coverage has real holes. Nouns, Ringers,
//      Checks, Loot, CrypToadz, World of Women, goblintown, y00ts, Okay Bears
//      and Runestone all come back with market_cap_rank = null, and dropping
//      them would be the exact opposite of "only the famous ones". These are
//      kept on judgement, not data, and are listed explicitly so the call is
//      visible rather than buried in a threshold.
//
// Near-duplicates are also dropped: a board that can answer either "DeGods" or
// "DeGods (Solana)" is an unfair puzzle, not a richer one.
//
// DO NOT ADD A VOLUME FLOOR. It is the obvious filter and it is wrong here,
// measured rather than assumed: 25 of the 72 survivors trade under $500 in 24h,
// and Autoglyphs, Fidenza, Chromie Squiggle, Ringers, Nouns, Loot and CrypToadz
// all sit at exactly $0. Scarce blue-chip art barely trades BECAUSE it is
// scarce. A $2,000 volume floor deletes the most famous collections on the list.
// Volume is kept in .rank-cache.json as evidence, and used for nothing.
//
// Where rank and volume disagree, rank wins. Courtyard.io turns over $355k/24h
// — the most of anything here — on a $5 floor, because it is a wrapper around
// graded physical cards rather than a collection with an identity to guess.
// Cash Cats and BEARISH out-trade Hypurr, which is kept, but they rank 79 and
// 82 against its 5. The line is top-of-market significance, not turnover.
const fs = require('fs'), path = require('path');
const T = __dirname;
const roster = JSON.parse(fs.readFileSync(path.join(T, 'roster.json'), 'utf8'));
const base = JSON.parse(fs.readFileSync(path.join(T, '.cg-cache.json'), 'utf8'));
let fresh = {};
try { fresh = JSON.parse(fs.readFileSync(path.join(T, '.rank-cache.json'), 'utf8')); } catch {}
const D = id => ({ ...(base[id] || {}), ...(fresh[id] || {}) });

const RANK_MAX = +(process.env.RANK_MAX || 90);
const FLOOR_MIN = +(process.env.FLOOR_MIN || 50);
// NOT an owner threshold: CoinGecko's number_of_unique_addresses is unreliable
// — it reports 100 for CryptoPunks and 171 for Autoglyphs, both of which have
// thousands. Filtering on it dropped the two most famous collections on the
// list. Rank and floor carry the decision instead.

const ICONIC = new Set([
  'nouns', 'lil-nouns', 'world-of-women', 'gutter-cat-gang', 'vv-checks',
  'terraforms-by-mathcastles', 'ringers-by-dmitri-cherniak', 'hashmasks',
  'goblintown-wtf', 'loot', 'pixelmon', 'onchainmonkey', 'invisible-friends',
  'renga', 'cryptoadz', 'cryptodickbutts', '0n1force', 'kanpai-pandas',
  'chain-runners', 'okay-bears', 'runestone', 'bitcoin-frogs', 'ordinal-punks',
  'bitcoin-punks', 'aavegotchi-official-polygon', 'bored-ape-chemistry-club',
  'space-doodles', 'y00ts',
]);

// Kept out deliberately even though they would otherwise pass.
const VETO = new Map([
  ['degods-solana', 'duplicate of DeGods'],
  ['btc-degods', 'duplicate of DeGods'],
  ['y00ts-solana', 'duplicate of y00ts'],
  ['more-loot', 'duplicate of Loot'],
  ['world-of-women-galaxy', 'duplicate of World of Women'],
  ['courtyard-io', 'a tokenisation platform, not a collection anyone names'],
  ['veefriends-series-2', 'duplicate of VeeFriends'],
  ['azuki-elemental-beans', 'third Azuki derivative; Elementals and BEANZ stay'],
  ['moonbirds-oddities', 'derivative of a derivative'],
  ['gutter-dogs', 'Gutter Cat Gang stays; the two spin-offs do not'],
  ['gutter-pigeons', 'Gutter Cat Gang stays; the two spin-offs do not'],
  ['bearish', 'ranks on a thin 2025 Abstract market; 1 recorded owner'],
  ['cashcatss', 'Robinhood-chain 2026; no footprint outside that chain'],
  ['wealthy-hypio-babies', 'Base 2024; ranks locally, unknown outside Base'],
  ['gigaverse-roms', 'Abstract 2025 game asset, not a named collection'],
  ['ordinal-punks', 'no artwork available from any source; Blur mode needs one'],
  ['script-kiddies', 'Robinhood-chain 2026'],
  ['broker-punks', 'Robinhood-chain 2026'],
  ['robinhood-punks', 'Robinhood-chain 2026'],
]);

function verdict(id) {
  if (VETO.has(id)) return ['drop', VETO.get(id)];
  const d = D(id);
  if (ICONIC.has(id)) return ['keep', 'iconic' + (d.rank ? ` · rank ${d.rank}` : ' · untracked by CoinGecko')];
  if (!d.rank) return ['drop', 'untracked and not iconic'];
  if (d.rank > RANK_MAX) return ['drop', `rank ${d.rank} > ${RANK_MAX}`];
  if ((d.floorUsd || 0) < FLOOR_MIN) return ['drop', `rank ${d.rank} but $${Math.round(d.floorUsd || 0)} floor`];
  return ['keep', `rank ${d.rank}`];
}

const keep = [], drop = [];
for (const r of roster) {
  const [v, why] = verdict(r.id);
  const d = D(r.id);
  const rec = { ...r, name: d.name || r.id, rank: d.rank, floor: d.floorUsd, chain: d.chain, why };
  (v === 'keep' ? keep : drop).push(rec);
}
keep.sort((a, b) => (a.rank || 999) - (b.rank || 999));

console.log(`RANK_MAX=${RANK_MAX} FLOOR_MIN=$${FLOOR_MIN}`);
console.log(`\nKEEP ${keep.length}  ·  DROP ${drop.length}\n`);
for (const r of keep) console.log(`  ${String(r.rank || '—').padStart(4)}  $${String(Math.round(r.floor || 0)).padStart(7)}  ${(r.chain||'?').padEnd(12)} ${r.name.slice(0,34).padEnd(36)} ${r.why}`);

const cnt = a => a.reduce((m, r) => (m[r] = (m[r] || 0) + 1, m), {});
console.log('\nchains kept :', cnt(keep.map(r => r.chain)));
console.log('classes kept:', cnt(keep.map(r => r.g)));
console.log('years kept  :', cnt(keep.map(r => String(r.y))));

if (process.argv.includes('--drops')) { console.log('\nDROPPED:'); for (const r of drop) console.log(`  ${r.name.slice(0,34).padEnd(36)} ${r.why}`); }
if (process.argv.includes('--write')) {
  const ids = new Set(keep.map(r => r.id));
  const next = roster.filter(r => ids.has(r.id));
  fs.writeFileSync(path.join(T, 'roster.json'), '[\n' + next.map(r => JSON.stringify({ id: r.id, y: r.y, g: r.g })).join(',\n') + '\n]\n');
  console.log(`\nroster.json rewritten: ${roster.length} -> ${next.length}`);
}
