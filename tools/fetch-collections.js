#!/usr/bin/env node
// Pulls per-collection market data from CoinGecko's free NFT API into a resumable
// cache. One request per collection — the bulk /nfts/markets endpoint is PRO-only.
// Rate limit on the free tier is ~10/min, so this is deliberately slow; the cache
// means a re-run only fetches what is missing.
const fs = require('fs'), path = require('path');
const DIR = path.join(__dirname, '..');
const CACHE = path.join(__dirname, '.cg-cache.json');
const roster = JSON.parse(fs.readFileSync(path.join(__dirname, 'roster.json'), 'utf8'));

let cache = {};
try { cache = JSON.parse(fs.readFileSync(CACHE, 'utf8')); } catch {}

const sleep = ms => new Promise(r => setTimeout(r, ms));
const save = () => fs.writeFileSync(CACHE, JSON.stringify(cache, null, 1));

// CoinGecko hands back the whole article as HTML; the game only wants a clean
// first paragraph to seed the Lore mode draft.
function plain(html) {
  if (!html) return '';
  return html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
             .replace(/&#39;|&rsquo;/g, "'").replace(/&quot;/g, '"')
             .replace(/\s+/g, ' ').trim();
}

function pick(d) {
  const fp = d.floor_price || {}, ath = d.ath || {}, mc = d.market_cap || {};
  return {
    name: d.name,
    chain: d.asset_platform_id,
    contract: d.contract_address,
    supply: d.total_supply,
    floor: fp.native_currency,
    floorUsd: fp.usd,
    cur: d.native_currency_symbol,
    ath: ath.native_currency,
    athDate: (d.ath_date || {}).native_currency,
    mcUsd: mc.usd,
    rank: d.market_cap_rank,
    owners: d.number_of_unique_addresses,
    img: (d.image || {}).small_2x || (d.image || {}).small,
    links: d.links || {},
    blurb: plain(d.description).slice(0, 900)
  };
}

(async () => {
  const todo = roster.filter(r => !cache[r.id]);
  console.log(`${roster.length} in roster · ${roster.length - todo.length} cached · ${todo.length} to fetch`);
  let ok = 0, fail = 0;
  for (let i = 0; i < todo.length; i++) {
    const { id } = todo[i];
    let tries = 0, done = false;
    while (tries < 4 && !done) {
      tries++;
      try {
        const res = await fetch(`https://api.coingecko.com/api/v3/nfts/${id}`, {
          headers: { accept: 'application/json' }
        });
        if (res.status === 429) { console.log(`  … 429, backing off ${20 * tries}s`); await sleep(20000 * tries); continue; }
        if (!res.ok) { console.log(`  ✗ ${id} HTTP ${res.status}`); fail++; done = true; break; }
        const d = await res.json();
        if (!d || !d.name) { console.log(`  ✗ ${id} empty`); fail++; done = true; break; }
        cache[id] = pick(d); save(); ok++; done = true;
        console.log(`  ✓ ${String(i + 1).padStart(3)}/${todo.length} ${d.name} · ${d.asset_platform_id} · floor ${(d.floor_price || {}).native_currency} ${d.native_currency_symbol} · supply ${d.total_supply}`);
      } catch (e) { console.log(`  ! ${id} ${e.message}`); await sleep(5000); }
    }
    if (!done) fail++;
    await sleep(6500);
  }
  console.log(`\ndone · ${ok} fetched · ${fail} failed · ${Object.keys(cache).length} total cached`);
})();
