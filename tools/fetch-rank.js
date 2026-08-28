#!/usr/bin/env node
// Pulls the fields the roster cull needs — how big a collection is RIGHT NOW —
// which tools/fetch-collections.js never captured: 24h volume, market-cap rank,
// owner count, and the floor's recent direction. Resumable: re-running only
// fetches what is missing. Free tier is ~10-30 req/min, so this is paced.
const fs = require('fs'), path = require('path');
const CACHE = path.join(__dirname, '.rank-cache.json');
const roster = JSON.parse(fs.readFileSync(path.join(__dirname, 'roster.json'), 'utf8'));
let cache = {};
try { cache = JSON.parse(fs.readFileSync(CACHE, 'utf8')); } catch {}
const sleep = ms => new Promise(r => setTimeout(r, ms));
const save = () => fs.writeFileSync(CACHE, JSON.stringify(cache, null, 1));
const num = v => (typeof v === 'number' && isFinite(v)) ? v : null;

(async () => {
  const todo = roster.filter(r => !cache[r.id]);
  console.log(`${roster.length} in roster · ${roster.length - todo.length} cached · ${todo.length} to fetch`);
  let ok = 0, fail = 0;
  for (let i = 0; i < todo.length; i++) {
    const { id } = todo[i];
    let tries = 0, done = false;
    while (tries < 5 && !done) {
      tries++;
      try {
        const res = await fetch(`https://api.coingecko.com/api/v3/nfts/${id}`, { headers: { accept: 'application/json' } });
        if (res.status === 429) { await sleep(20000 * tries); continue; }
        if (res.status === 404) { cache[id] = { missing: true }; done = true; fail++; break; }
        if (!res.ok) { await sleep(4000 * tries); continue; }
        const d = await res.json();
        const fp = d.floor_price || {}, mc = d.market_cap || {}, v = d.volume_24h || {};
        cache[id] = {
          name: d.name,
          rank: num(d.market_cap_rank),
          mcUsd: num(mc.usd),
          volUsd: num(v.usd),
          volNative: num(v.native_currency),
          floorUsd: num(fp.usd),
          owners: num(d.number_of_unique_addresses),
          d7: num((d.floor_price_7d_percentage_change || {}).usd),
          d30: num((d.floor_price_30d_percentage_change || {}).usd),
          d1y: num((d.floor_price_1y_percentage_change || {}).usd),
        };
        done = true; ok++;
      } catch (e) { await sleep(4000 * tries); }
    }
    if (!done) { cache[id] = { failed: true }; fail++; }
    if (i % 5 === 0) save();
    process.stdout.write(`\r  ${i + 1}/${todo.length}  ok=${ok} fail=${fail}   `);
    await sleep(2600);
  }
  save();
  console.log(`\ndone · ${ok} ok · ${fail} failed · cache ${Object.keys(cache).length}`);
})();
