// Developer tool: print the daily puzzle schedule (SPOILERS, obviously).
// Each mode has its own fixed seed, so this prints exactly what players get.
//
// Usage:
//   node tools/schedule.js              # next 7 days, all three modes
//   node tools/schedule.js 30           # next 30 days
//   node tools/schedule.js 14 classic   # one mode, with its full stat line
//   node tools/schedule.js --json 14    # machine-readable
const fs = require("fs");
const path = require("path");
eval(fs.readFileSync(path.join(__dirname, "..", "data.js"), "utf8"));

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    var t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// must match the MODES array in game.js
const SEEDS = { classic: 0x1177EDA1, blur: 0x0FF10012, lore: 0x3A17EDEF };
const EPOCH = new Date(2026, 7, 27); // must match game.js

// must match fameWeight() in game.js — the better-known collections sort to
// the front, because for NFTs it is fame and not age that makes a fair puzzle
function fameWeight(c) { return c.w || 1; }
const ORDER = {};
for (const [mode, seed] of Object.entries(SEEDS)) {
  const rnd = mulberry32(seed);
  // must match orderFor() in game.js: Efraimidis–Spirakis, key = u^(1/w) desc
  const keyed = COLLECTIONS.map((c, i) => ({ i, k: Math.pow(rnd(), 1 / fameWeight(c)) }));
  keyed.sort((a, b) => b.k - a.k || a.i - b.i);
  ORDER[mode] = keyed.map((e) => e.i);
}
const STRIDE = 61; // must match game.js
// must match dailyCoin() in game.js: fixed mode order, walk past collisions
const ALL = Object.keys(SEEDS);
function picksFor(d) {
  const used = {}, out = {};
  for (const m of ALL) {
    const o = ORDER[m], len = o.length;
    let chosen = null;
    for (let k = 0; k < len; k++) {
      const c = COLLECTIONS[o[((((d + k * STRIDE) % len) + len) % len)]];
      if (!used[c.k]) { chosen = c; break; }
    }
    if (!chosen) chosen = COLLECTIONS[o[(((d % len) + len) % len)]];
    used[chosen.k] = 1;
    out[m] = chosen;
  }
  return out;
}
const pick = (mode, d) => picksFor(d)[mode];

const args = process.argv.slice(2);
const asJson = args.includes("--json");
const only = args.find((a) => SEEDS[a]);
const modes = only ? [only] : Object.keys(SEEDS);
const days = parseInt(args.find((a) => /^\d+$/.test(a)), 10) || 7;

const today = new Date();
const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
const startDay = Math.round((start - EPOCH) / 86400000);

const rows = [];
for (let d = startDay; d < startDay + days; d++) {
  const date = new Date(EPOCH.getFullYear(), EPOCH.getMonth(), EPOCH.getDate() + d);
  const localISO = date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") +
    "-" + String(date.getDate()).padStart(2, "0");
  const row = { puzzle: d + 1, date: localISO };
  for (const m of modes) {
    const c = pick(m, d);
    row[m] = only
      ? { name: c.n, key: c.k, chain: c.c, year: c.y, supply: c.s, floorUsd: c.f, klass: c.g }
      : c.n;
  }
  rows.push(row);
}

if (asJson) {
  console.log(JSON.stringify(rows, null, 2));
} else {
  console.log("SPOILERS — daily schedule (" + COLLECTIONS.length + " collections, repeats after all are used)\n");
  if (only) {
    console.log("mode: " + only + "\n");
    for (const r of rows) {
      const c = r[only];
      console.log("#" + String(r.puzzle).padEnd(5) + r.date + "  " + String(c.name).padEnd(30) +
        String(c.chain).padEnd(11) + c.year + " · " + c.klass.padEnd(11) +
        String(c.supply).padStart(7) + " items · $" + c.floorUsd + " floor");
    }
  } else {
    console.log("#".padEnd(6) + "date".padEnd(13) + modes.map((m) => m.toUpperCase().padEnd(30)).join(""));
    for (const r of rows) {
      console.log("#" + String(r.puzzle).padEnd(5) + r.date.padEnd(13) +
        modes.map((m) => String(r[m]).padEnd(30)).join(""));
    }
  }
}
