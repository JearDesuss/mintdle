/* Mintdle — game engine. One dashboard, three modes, no dependencies.
   Descended from Memedle's engine; the shell is the same, the domain is not. */
(function () {
  "use strict";

  // ──────────────── constants ────────────────
  var EPOCH = new Date(2026, 7, 27);   // puzzle #1 = Aug 27 2026 (local time)
  var MAX_GUESSES = 6;
  var SITE_URL = "mintdle.vercel.app";

  // Leave a URL empty and the button renders as a dead "soon" chip instead of a
  // link, so nothing ever points at a 404.
  // Drop a URL in and the button goes live; leave it empty and it renders
  // as a printed-but-not-stuck sticker with a "soon" tag.
  var SOCIAL = [
    { id: "x",  label: "",         title: "Mintdle on X",      url: "" },
    { id: "os", label: "OpenSea",  title: "Mintdle on OpenSea", url: "" }
  ];

  // Each mode has its own fixed seed, which is what gives it a different
  // collection on the same day. Changing a seed rewrites that mode's whole
  // historical sequence — don't, once anyone has a streak.
  var MODES = [
    { id: "classic", name: "Classic", icon: "cryptopunks",            blurb: "Five clues on every guess.",  seed: 0x1177EDA1, kind: "grid"  },
    { id: "blur",    name: "Blur",    icon: "fidenza-by-tyler-hobbs", blurb: "The artwork, out of focus.",  seed: 0x0FF10012, kind: "stage" },
    { id: "lore",    name: "Lore",    icon: "milady-maker",           blurb: "One line, name blacked out.", seed: 0x3A17EDEF, kind: "stage" }
  ];
  var MODE_BY_ID = {};
  MODES.forEach(function (m) { MODE_BY_ID[m.id] = m; });

  var COL_NAMES = ["Chain", "Class", "Year", "Supply", "Floor"];
  var BLUR_STEPS = [26, 18, 12, 7.5, 4, 2];
  var ZOOM_STEPS = [1.55, 1.45, 1.36, 1.28, 1.2, 1.13];

  // ──────────────── rng ────────────────
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ──────────────── daily selection ────────────────
  function todayLocal() {
    var n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate());
  }
  function dayNumber() { return Math.round((todayLocal() - EPOCH) / 86400000); }

  // Memedle weights its rotation by *recency*, because a memecoin from 2021 is
  // trivia and one from this year is news. NFTs invert that: a 2021 CryptoPunk
  // is the most recognisable object in the whole dataset, and a collection that
  // minted last month on a new L2 is the obscure one. So the weight here is
  // FAME, not age — `w` is set in data.js from CoinGecko's market-cap rank
  // (top 30 -> 4, top 80 -> 2.5, top 200 -> 1.5, the tail -> 1).
  // Keep this in sync with tools/schedule.js and test/cdp-test.js.
  function fameWeight(c) { return c.w || 1; }
  var ORDERS = {};
  function orderFor(modeId) {
    if (ORDERS[modeId]) return ORDERS[modeId];
    var rnd = mulberry32(MODE_BY_ID[modeId].seed);
    // Efraimidis–Spirakis weighted shuffle: key = u^(1/w), sorted descending.
    // Still a permutation — every collection comes up exactly once per cycle — but a
    // heavier collection is far likelier to draw a key near 1 and sort to the front.
    // Ties break on index so node and the browser agree.
    var keyed = COLLECTIONS.map(function (c, i) {
      return { i: i, k: Math.pow(rnd(), 1 / fameWeight(c)) };
    });
    keyed.sort(function (a, b) { return b.k - a.k || a.i - b.i; });
    ORDERS[modeId] = keyed.map(function (e) { return e.i; });
    return ORDERS[modeId];
  }
  // Independent shuffles occasionally hand the same item to two modes on the
  // same day, which turns solving one into a free hint for the other. Assign in
  // a fixed mode order and walk past collisions — classic is first, so its
  // historical sequence is never touched. The stride must be coprime with the
  // list length so it walks the whole permutation; 61 is prime, so that holds
  // for any length that isn't a multiple of it. A big stride also keeps a
  // displaced pick far from that mode's neighbouring days (a +1 walk would land
  // on its own next day).
  var STRIDE = 61;
  var dayPicks = {};
  function picksFor(day) {
    if (dayPicks[day]) return dayPicks[day];
    var used = {}, out = {};
    MODES.forEach(function (m) {
      var o = orderFor(m.id), len = o.length, pick = null;
      for (var k = 0; k < len; k++) {
        var c = COLLECTIONS[o[((((day + k * STRIDE) % len) + len) % len)]];
        if (!used[c.k]) { pick = c; break; }
      }
      if (!pick) pick = COLLECTIONS[o[(((day % len) + len) % len)]];
      used[pick.k] = 1;
      out[m.id] = pick;
    });
    dayPicks[day] = out;
    return out;
  }
  function dailyItem(modeId, day) { return picksFor(day)[modeId]; }
  function randomItem(excludeName) {
    var c;
    do { c = COLLECTIONS[Math.floor(Math.random() * COLLECTIONS.length)]; }
    while (COLLECTIONS.length > 1 && c.n === excludeName);
    return c;
  }

  // ──────────────── grading (classic) ────────────────
  // Floors are graded and shown in USD. The dataset spans Ethereum, Solana and
  // Bitcoin, and a ladder denominated in ETH would grade a 9 SOL floor and a
  // 9 ETH floor as the same tier. The reveal card still prints the native
  // figure ("4.4 ETH"), because that is the number a collector actually quotes.
  function fmtFloor(usd) {
    if (usd >= 1e6) return "$" + (Math.round(usd / 1e5) / 10) + "M";
    if (usd >= 1e4) return "$" + Math.round(usd / 1e3) + "K";
    if (usd >= 1e3) return "$" + (Math.round(usd / 100) / 10) + "K";
    if (usd >= 1)   return "$" + Math.round(usd);
    return "<$1";
  }
  // the native quote, for the reveal card only
  function fmtNative(c) {
    if (c.fn == null) return "—";
    var v = c.fn >= 10 ? Math.round(c.fn * 10) / 10 : Math.round(c.fn * 1000) / 1000;
    return v + " " + (c.cs || "ETH");
  }
  function fmtSupply(n) {
    if (n >= 1000) return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return String(n);
  }
  function grade(guess, t) {
    var cells = [];
    var cs = guess.c === t.c ? "g" : (EVM_FAMILY[guess.c] && EVM_FAMILY[t.c] ? "y" : "x");
    cells.push({ v: guess.c, s: cs, d: null });
    var gs = guess.g === t.g ? "g" : (CAT_FAMILY[guess.g] === CAT_FAMILY[t.g] ? "y" : "x");
    cells.push({ v: guess.g, s: gs, d: null });
    var ys = guess.y === t.y ? "g" : (Math.abs(guess.y - t.y) <= 1 ? "y" : "x");
    cells.push({ v: String(guess.y), s: ys, d: ys === "g" ? null : (t.y > guess.y ? "up" : "down") });
    var gs2 = supplyTier(guess.s), ts2 = supplyTier(t.s);
    var ss = gs2 === ts2 ? "g" : (Math.abs(gs2 - ts2) === 1 ? "y" : "x");
    cells.push({ v: fmtSupply(guess.s), s: ss, d: ss === "g" ? null : (ts2 > gs2 ? "up" : "down") });
    var gf = floorTier(guess.f), tf = floorTier(t.f);
    var fs = gf === tf ? "g" : (Math.abs(gf - tf) === 1 ? "y" : "x");
    cells.push({ v: fmtFloor(guess.f), s: fs, d: fs === "g" ? null : (tf > gf ? "up" : "down") });
    return cells;
  }
  function squares() {
    return document.body.classList.contains("cb")
      ? { g: "🟦", y: "🟨", x: "🟧" }
      : { g: "🟩", y: "🟨", x: "🟥" };
  }

  var CLUES = [
    function (c) { return ["Chain", c.c]; },
    function (c) { return ["Year", String(c.y)]; },
    function (c) { return ["Class", c.g]; },
    function (c) { return ["Supply", SUPPLY_LABELS[supplyTier(c.s)]]; },
    function (c) { return ["Floor", FLOOR_LABELS[floorTier(c.f)]]; }
  ];

  // ──────────────── lore redaction ────────────────
  var STOP = { with: 1, that: 1, from: 1, into: 1, then: 1, this: 1, they: 1, them: 1,
               official: 1, collection: 1, nfts: 1, club: 1 };
  function reEsc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
  function loreParts(item) {
    var terms = [item.n];
    item.n.split(/[\s\-']+/).forEach(function (w) { if (w.length >= 4 && !STOP[w.toLowerCase()]) terms.push(w); });
    // the collection key carries the same words in slug form ("bored-ape-yacht-club"),
    // which catches a provenance line that spells the name differently to the title
    if (item.k) item.k.split("-").forEach(function (w) { if (w.length >= 4 && !STOP[w.toLowerCase()]) terms.push(w); });
    var seen = {}, uniq = [];
    terms.forEach(function (t) {
      var k = t.toLowerCase();
      if (t && !seen[k]) { seen[k] = 1; uniq.push(t); }
    });
    uniq.sort(function (a, b) { return b.length - a.length; });
    var re = new RegExp("(" + uniq.map(reEsc).join("|") + ")", "gi");
    return item.l.split(re);   // split keeps the group: pieces alternate plain / match
  }

  // ──────────────── state ────────────────
  var modeId = "classic";
  var unlimited = false;
  var playDay = 0;              // which puzzle number is on the board
  var target = null;
  var guesses = [];
  var done = false, won = false;
  var hintAxis = -1;
  var statsMode = "classic";

  function isArchive() { return !unlimited && playDay !== dayNumber(); }
  function statsKey(m) { return "mt_stats_v1_" + m; }
  var defaultStats = { played: 0, wins: 0, streak: 0, maxStreak: 0, lastWinDay: -2, lastPlayedDay: -2, dist: [0, 0, 0, 0, 0, 0] };

  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  function saveDaily() {
    if (unlimited) return;
    lsSet("mt_day_" + modeId + "_" + playDay, JSON.stringify({
      g: guesses.map(function (c) { return c.n; }), done: done, won: won, h: hintAxis
    }));
  }
  function loadDay(m, day) {
    try { return JSON.parse(lsGet("mt_day_" + m + "_" + day)); } catch (e) { return null; }
  }
  function loadStats(m) {
    try { return JSON.parse(lsGet(statsKey(m))) || null; } catch (e) { return null; }
  }
  function recordResult(win, n) {
    if (unlimited || isArchive()) return;   // archive runs never touch the streak
    var st = loadStats(modeId) || JSON.parse(JSON.stringify(defaultStats));
    var d = dayNumber();
    if (st.lastPlayedDay === d) return;
    st.played++; st.lastPlayedDay = d;
    if (win) {
      st.wins++;
      st.streak = (st.lastWinDay === d - 1) ? st.streak + 1 : 1;
      st.lastWinDay = d;
      if (st.streak > st.maxStreak) st.maxStreak = st.streak;
      st.dist[n - 1]++;
    } else { st.streak = 0; }
    lsSet(statsKey(modeId), JSON.stringify(st));
  }

  // one-time migration from the pre-Memedle single-mode storage
  // Memedle carries a migrate() here that imports its own pre-split records.
  // Mintdle has no predecessor: the only keys matching those names would belong
  // to a different game, so there is nothing to migrate and nothing to read.

  // ──────────────── dom helpers ────────────────
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function clear(node) { while (node && node.firstChild) node.removeChild(node.firstChild); }

  // ──────────────── artwork ────────────────
  // An empty frame, for a collection whose artwork did not download. Square and
  // drained on purpose: DESIGN.md calls a missing picture "a gallery mid-hang",
  // so the placeholder is a mounted blank, not a coloured tile with a letter in
  // it. The initial is the only thing that varies.
  function badgeURI(key) {
    var ch = (key || "?").charAt(0).toUpperCase();
    var svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
      '<rect width="64" height="64" rx="12" fill="#1b1d1f"/>' +
      '<rect x="5.5" y="5.5" width="53" height="53" rx="6" fill="none" stroke="#26272d"/>' +
      '<text x="32" y="42" text-anchor="middle" font-family="ui-monospace,monospace" ' +
      'font-weight="500" font-size="24" fill="#acadae">' + ch + "</text></svg>";
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }
  function artFile(key) { return (typeof ART !== "undefined" && ART[key]) || null; }
  function logoImg(item, cls) {
    var img = document.createElement("img");
    img.className = cls;
    img.alt = "";
    img.loading = "lazy";
    var real = artFile(item.k);
    img.src = real || badgeURI(item.k);
    if (real) img.onerror = function () { img.onerror = null; img.src = badgeURI(item.k); };
    return img;
  }
  function logoByTicker(key, cls) {
    var img = document.createElement("img");
    img.className = cls;
    img.alt = "";
    img.src = artFile(key) || badgeURI(key);
    return img;
  }

  // ──────────────── brand: the tab icon, at wordmark scale ────────────────
  // The mark is the favicon, verbatim — the same 64-unit rounded square and the
  // same white M path index.html carries in <link rel="icon"> — so the tab and
  // the topbar are one object instead of two logos for one product. Flat
  // --blue-3, no defs, no gradient, no navy inner tile.
  //
  // The wordmark is fill="currentColor", so it inherits colour from body and is
  // correct in light and dark with no second asset. textLength locks the word to
  // 138 units: against Inter's natural ~143 that lands near -0.02em, the tracking
  // DESIGN.md specifies at 32px and up, and it guarantees the word cannot outgrow
  // the viewBox before Inter has loaded.
  //
  // sfx is unused now — it only existed to keep the removed gradient's id unique.
  // Kept so the call site does not have to change.
  function brandSVG(sfx) {
    return '<svg viewBox="0 0 236 64" role="img" aria-label="Mintdle">' +
      '<rect width="64" height="64" rx="16" fill="#0786ff"/>' +
      '<path d="M17 43V20h6l9 12 9-12h6v23h-7V31l-8 10-8-10v12z" fill="#ffffff"/>' +
      '<text x="84" y="46.5" textLength="138" font-size="40" font-weight="500" ' +
      'font-family="Inter,-apple-system,Segoe UI,system-ui,sans-serif" ' +
      'fill="currentColor">mintdle</text></svg>';
  }

  // ──────────────── clouds: outlined pixel blocks ────────────────
  // Memedle drifts pixel clouds across its sky here. A gallery has a ceiling,
  // not weather, so the whole cloud system is gone rather than restyled.


  // ──────────────── the hang ────────────────
  // Decoration: real collection artwork dealt along the wall as small framed
  // plates. Every piece is square, so unlike Memedle's crowd there is no aspect
  // ratio to carry and no dimensions manifest — the key alone is enough.
  function artList() {
    if (typeof ART === "undefined") return [];
    var keys = Object.keys(ART);
    var popular = [
      "cryptopunks", "bored-ape-yacht-club", "pudgy-penguins", "azuki",
      "milady-maker", "doodles-official", "moonbirds", "degods", "clonex",
      "meebits", "world-of-women", "mfers", "sappy-seals",
      "redacted-remilio-babies", "chromie-squiggle-by-snowfro",
      "fidenza-by-tyler-hobbs"
    ].filter(function (key) { return !!ART[key]; });
    keys = keys.filter(function (key) { return popular.indexOf(key) === -1; });
    var rnd = mulberry32(0x120573);
    for (var i = keys.length - 1; i > 0; i--) {
      var j = Math.floor(rnd() * (i + 1));
      var t = keys[i]; keys[i] = keys[j]; keys[j] = t;
    }
    return popular.concat(keys);
  }
  function artImg(key, h) {
    var img = document.createElement("img");
    img.src = artFile(key) || badgeURI(key);
    img.alt = ""; img.loading = "lazy"; img.decoding = "async";
    // the frame and mat are 2px + 4px per side, so the picture is h - 12
    var inner = Math.max(8, h - 12);
    img.style.height = inner + "px";
    img.style.width = inner + "px";
    img.width = inner; img.height = inner;
    return img;
  }
  function buildCrowd() {
    var wrap = $("crowd");
    if (!wrap) return;
    var rows = wrap.querySelectorAll(".crowd-row");
    var keys = artList();
    if (!rows.length || !keys.length) return;
    var vw = window.innerWidth;
    // the art is real illustration now, not a 160px token icon, so it can be
    // shown at a size where you can actually tell who is standing there
    var HEIGHTS = vw <= 760 ? [42, 58, 76] : [58, 80, 106];
    var rnd = mulberry32(0x9F17E5);
    var at = 0;
    for (var b = 0; b < rows.length && b < HEIGHTS.length; b++) {
      var row = rows[b], bh = HEIGHTS[b];
      clear(row);
      // fill the viewport rather than a fixed count, or the crowd sits as a
      // small clump in the middle of a wide screen
      var n = Math.ceil(vw / (bh * 0.78)) + 2;
      for (var i = 0; i < n; i++) {
        var h = Math.round(bh * (0.82 + rnd() * 0.4));
        var img = artImg(keys[at % keys.length], h); at++;
        // framed pictures on a rail are spaced, never overlapped: a hang with
        // pieces covering each other is a storage room, not a show
        img.style.marginInline = Math.round(h * (0.05 + rnd() * 0.05)) + "px";
        row.appendChild(img);
      }
    }
  }
  // Memedle floats a few characters in its sky. Two 40px plates stranded in the
  // gutters read as debris rather than as a hang, so the wall stays empty and
  // the art all lives on the rail along the bottom.

  var decorTimer = null;
  function refreshDecor() {
    clearTimeout(decorTimer);
    decorTimer = setTimeout(buildCrowd, 220);
  }

  // ──────────────── mode rail ────────────────
  function dayStatusFor(m) {
    var s = loadDay(m, dayNumber());
    if (!s || !s.g) return null;
    return { done: !!s.done, won: !!s.won, n: s.g.length };
  }

  var railCards = null;
  function buildModeRail() {
    var list = $("mode-list");
    clear(list);
    railCards = MODES.map(function (m) {
      var a = document.createElement("a");
      a.className = "mode-card";
      a.href = "#/" + m.id;
      a.appendChild(logoByTicker(m.icon, "mode-ico"));

      var txt = el("div", "mode-text");
      txt.appendChild(el("span", "mode-name", m.name));
      txt.appendChild(el("span", "mode-blurb", m.blurb));
      a.appendChild(txt);

      var flag = el("span", "mode-flag");
      a.appendChild(flag);

      var prog = el("div", "mode-prog");
      var fill = el("i");
      prog.appendChild(fill);
      a.appendChild(prog);

      list.appendChild(a);
      return { id: m.id, node: a, flag: flag, fill: fill };
    });
  }
  function renderModeRail() {
    var list = $("mode-list");
    if (!railCards || !list.firstChild) buildModeRail();
    railCards.forEach(function (c) {
      c.node.classList.toggle("on", c.id === modeId);
      var st = dayStatusFor(c.id);
      c.flag.className = "mode-flag";
      if (st && st.done) {
        c.flag.classList.add(st.won ? "win" : "lost");
        c.flag.textContent = st.won ? st.n + "/" + MAX_GUESSES : "✕";
      } else {
        c.flag.textContent = ((st && st.n) || 0) + "/" + MAX_GUESSES;
      }
      var pct = st ? Math.round(100 * Math.min(st.n, MAX_GUESSES) / MAX_GUESSES) : 0;
      c.fill.style.width = (st && st.done && st.won ? 100 : pct) + "%";
    });
    Array.prototype.forEach.call(document.querySelectorAll(".exchange-nav [data-mode]"), function (link) {
      link.classList.toggle("on", link.getAttribute("data-mode") === modeId);
    });
  }

  // ──────────────── right rail: yesterday ────────────────
  function renderYesterday() {
    var box = $("yesterday-body");
    if (!box) return;
    clear(box);
    var d = dayNumber() - 1;
    if (d < 0) {
      box.appendChild(el("p", "lb-empty", "Nothing yet — today is puzzle #1."));
      return;
    }
    var item = dailyItem(modeId, d);
    var st = loadDay(modeId, d);
    var row = el("div", "yday");
    row.appendChild(logoImg(item, ""));
    var txt = el("div", "yday-text");
    txt.appendChild(el("span", "yday-label", MODE_BY_ID[modeId].name + " #" + (d + 1)));
    txt.appendChild(el("span", "yday-name", item.n));
    row.appendChild(txt);
    var flag = el("span", "yday-flag");
    if (st && st.done) {
      flag.classList.add(st.won ? "win" : "lost");
      flag.textContent = st.won ? "✓" : "✕";
    } else { flag.textContent = "–"; flag.title = "not played"; }
    row.appendChild(flag);
    box.appendChild(row);
  }

  // ──────────────── keep-playing pills ────────────────
  function renderPills() {
    var row = $("pill-row");
    if (!row) return;
    clear(row);
    MODES.forEach(function (m) {
      if (m.id === modeId) return;
      var a = document.createElement("a");
      a.className = "pill";
      a.href = "#/" + m.id;
      a.textContent = m.name;
      row.appendChild(a);
    });
    var endless = el("a", "pill", "Endless");
    endless.href = "#/" + modeId + "/unlimited";
    row.appendChild(endless);
    var arch = el("button", "pill", "Archive");
    arch.addEventListener("click", openArchive);
    row.appendChild(arch);
  }

  // ──────────────── panel chrome ────────────────
  function renderPanelChrome() {
    var m = MODE_BY_ID[modeId];
    var label = unlimited ? "Endless" : (isArchive() ? "Archive #" + (playDay + 1) : "Day #" + (playDay + 1));
    $("game-title").textContent = label + " · " + m.name;
    $("panel-badge").textContent = (MAX_GUESSES - guesses.length) + "/" + MAX_GUESSES;

    var meta = $("game-meta");
    if (unlimited) meta.textContent = "Random item. Nothing is recorded.";
    else if (isArchive()) meta.textContent = "Archive run. Nothing is recorded.";
    else meta.textContent = "";
  }

  var lastStreak = null;
  function renderStreak() {
    var pill = $("streak-pill");
    var st = loadStats(modeId);
    var d = dayNumber();
    if (st && st.streak > 0 && (st.lastWinDay === d || st.lastWinDay === d - 1)) {
      pill.textContent = "🔥 " + st.streak + " day streak";
      pill.classList.remove("hidden");
      if (lastStreak !== null && st.streak > lastStreak && !reducedMotion()) {
        pill.classList.remove("bump");
        void pill.offsetWidth;
        pill.classList.add("bump");
        setTimeout(function () { pill.classList.remove("bump"); }, 460);
      }
      lastStreak = st.streak;
    } else {
      pill.classList.add("hidden");
      lastStreak = st ? st.streak : 0;
    }
  }

  // ──────────────── stage ────────────────
  function wrongCount() {
    return guesses.filter(function (c) { return c.n !== target.n; }).length;
  }
  function revealLevel() {
    return done ? BLUR_STEPS.length - 1 : Math.min(wrongCount(), BLUR_STEPS.length - 1);
  }

  var lastBlur = null;
  function renderStage() {
    var stage = $("stage");
    clear(stage);
    stage.classList.remove("burst");
    var kind = MODE_BY_ID[modeId].kind;
    var lvl = revealLevel();

    if (kind === "grid") {
      // classic has no image to show, so the panel gets the mystery item
      stage.classList.add("burst");
      if (done) {
        var solved = logoImg(target, "stage-solved-art");
        stage.appendChild(solved);
        stage.appendChild(el("div", "stage-cap", won ? "Called it." : "It was " + target.n + "."));
      } else {
        var item = el("div", "mystery");
        item.appendChild(el("span", null, "?"));
        stage.appendChild(item);
        stage.appendChild(el("div", "stage-cap", "Today's collection"));
      }
      return;
    }

    if (modeId === "blur") {
      var img = logoImg(target, "blur-img");
      img.removeAttribute("loading");
      var to = done
        ? { f: "none", t: "scale(1)" }
        : { f: "blur(" + BLUR_STEPS[lvl] + "px)", t: "scale(" + ZOOM_STEPS[lvl] + ")" };
      // mount at the previous level so the sharpening actually transitions
      var from = (lastBlur !== null && lastBlur !== lvl && !reducedMotion())
        ? { f: "blur(" + BLUR_STEPS[lastBlur] + "px)", t: "scale(" + ZOOM_STEPS[lastBlur] + ")" }
        : to;
      img.style.filter = from.f;
      img.style.transform = from.t;
      if (from !== to) {
        requestAnimationFrame(function () {
          requestAnimationFrame(function () { img.style.filter = to.f; img.style.transform = to.t; });
        });
      }
      lastBlur = done ? null : lvl;
      var frame = el("div", "blur-frame");
      frame.appendChild(img);
      stage.appendChild(frame);
      stage.appendChild(el("div", "blur-note", done ? "There it is." : "Sharpens with every miss"));

    } else if (modeId === "lore") {
      var card = el("div", "lore-card");
      card.appendChild(el("span", "lore-mark", "“"));
      var q = el("p", "lore-quote");
      loreParts(target).forEach(function (piece, i) {
        if (!piece) return;
        if (i % 2 === 1 && !done) {
          var r = el("span", "redacted", piece);
          r.setAttribute("aria-label", "redacted");
          q.appendChild(r);
        } else {
          q.appendChild(document.createTextNode(piece));
        }
      });
      card.appendChild(q);
      stage.appendChild(card);
    }
  }

  function renderClues() {
    var strip = $("clue-strip");
    if (MODE_BY_ID[modeId].kind !== "stage" || done) { strip.classList.add("hidden"); clear(strip); return; }
    var n = Math.min(wrongCount(), CLUES.length);
    if (n === 0) { strip.classList.add("hidden"); clear(strip); return; }
    strip.classList.remove("hidden");
    clear(strip);
    for (var i = 0; i < n; i++) {
      var c = CLUES[i](target);
      var chip = el("span", "clue-chip");
      chip.appendChild(el("strong", null, c[0] + ":"));
      chip.appendChild(document.createTextNode(" " + c[1]));
      strip.appendChild(chip);
    }
  }

  // ──────────────── board ────────────────
  function renderBoard(animateLast) {
    var board = $("board"), head = $("col-head");
    var isGrid = MODE_BY_ID[modeId].kind === "grid";
    clear(board); clear(head);

    if (isGrid && guesses.length > 0) {
      head.classList.remove("hidden");
      head.appendChild(el("div", "item-label"));
      COL_NAMES.forEach(function (c) { head.appendChild(el("div", "col-name", c)); });
    } else {
      head.classList.add("hidden");
    }

    if (guesses.length === 0 && !done) {
      board.appendChild(el("div", "empty-note", isGrid
        ? COLLECTIONS.length + " collections in the deck."
        : "Each miss reveals a clue."));
    } else if (isGrid) {
      guesses.forEach(function (item, gi) {
        var row = el("div", "guess-row");
        var isLast = gi === guesses.length - 1;
        var label = el("div", "item-label");
        label.appendChild(logoImg(item, "item-art"));
        var nw = el("div", "item-label-text");
        nw.appendChild(el("span", "item-title", item.n));
        nw.appendChild(el("span", "item-sub", item.c));
        label.title = item.n + " · " + item.c;
        label.appendChild(nw);
        row.appendChild(label);
        grade(item, target).forEach(function (cell, ci) {
          var tile = el("div", "tile s-" + cell.s);
          tile.appendChild(el("span", "tile-val", cell.v));
          if (cell.d) tile.appendChild(el("span", "tile-dir", cell.d === "up" ? "▲" : "▼"));
          if (animateLast && isLast) {
            tile.classList.add("flip");
            tile.style.animationDelay = (ci * 0.18) + "s";
          }
          row.appendChild(tile);
        });
        board.appendChild(row);
      });
    } else {
      guesses.forEach(function (item) {
        if (item.n === target.n) return;   // the winning guess shows in the reveal
        var row = el("div", "miss-row");
        row.appendChild(logoImg(item, "item-art"));
        row.appendChild(el("span", "miss-name", item.n + " · " + item.c));
        row.appendChild(el("span", "miss-x", "✕"));
        board.appendChild(row);
      });
    }

    var pips = $("pips");
    clear(pips);
    for (var i = 0; i < MAX_GUESSES; i++) {
      var fresh = animateLast && i === guesses.length - 1;
      pips.appendChild(el("span", "pip" + (i < guesses.length ? " used" : "") + (fresh ? " fresh" : "")));
    }
    pips.setAttribute("aria-label", (MAX_GUESSES - guesses.length) + " guesses left");
  }

  // ──────────────── hint (classic daily only) ────────────────
  function renderHint() {
    var area = $("hint-area");
    clear(area);
    if (modeId !== "classic" || unlimited) return;
    if (hintAxis >= 0) {
      var v = [target.c, target.g, String(target.y),
               SUPPLY_LABELS[supplyTier(target.s)], FLOOR_LABELS[floorTier(target.f)]][hintAxis];
      var chip = el("div", "hint-chip");
      chip.appendChild(el("span", null, COL_NAMES[hintAxis] + ": " + v));
      area.appendChild(chip);
      return;
    }
    if (done || guesses.length < 1) return;
    var btn = el("button", "hint-btn", "Spend a hint");
    btn.addEventListener("click", function () {
      var solved = {};
      guesses.forEach(function (c) {
        grade(c, target).forEach(function (cell, i) { if (cell.s === "g") solved[i] = 1; });
      });
      var open = [0, 1, 2, 3, 4].filter(function (i) { return !solved[i]; });
      if (!open.length) open = [0, 1, 2, 3, 4];
      hintAxis = open[Math.floor(Math.random() * open.length)];
      saveDaily();
      renderHint();
    });
    area.appendChild(btn);
  }

  function renderAll(animateLast) {
    renderPanelChrome();
    renderModeRail();
    renderYesterday();
    renderPills();
    renderStage();
    renderBoard(animateLast);
    renderClues();
    renderHint();
    renderStreak();
  }

  // ──────────────── confetti ────────────────
  function reducedMotion() {
    return !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  }
  function confettiBurst() {
    try {
      if (reducedMotion()) return;
      var cv = $("confetti"), ctx = cv.getContext("2d");
      cv.width = window.innerWidth; cv.height = window.innerHeight;
      var colors = ["#0fbe39", "#ffcc00", "#e24756", "#0786ff", "#83c3ff"];
      var parts = [];
      for (var i = 0; i < 96; i++) {
        parts.push({
          x: Math.random() * cv.width, y: -30 - Math.random() * cv.height * 0.4,
          w: 6 + Math.random() * 5, h: 6 + Math.random() * 9,
          v: 2.6 + Math.random() * 4.2, r: Math.random() * Math.PI,
          vr: (Math.random() - 0.5) * 0.26,
          c: colors[Math.floor(Math.random() * colors.length)]
        });
      }
      var t0 = performance.now();
      (function tick(t) {
        ctx.clearRect(0, 0, cv.width, cv.height);
        if (t - t0 > 1800) return;
        parts.forEach(function (p) {
          p.y += p.v; p.r += p.vr;
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r);
          ctx.fillStyle = p.c;
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
          ctx.strokeStyle = "rgba(0, 0, 0, .35)"; ctx.lineWidth = 2;
          ctx.strokeRect(-p.w / 2, -p.h / 2, p.w, p.h);
          ctx.restore();
        });
        requestAnimationFrame(tick);
      })(t0);
    } catch (e) {}
  }

  // ──────────────── autocomplete ────────────────
  var acIndex = -1;
  function acMatches(q) {
    q = q.trim().toLowerCase();
    if (!q) return [];
    var guessed = {};
    guesses.forEach(function (c) { guessed[c.n] = 1; });
    var starts = [], contains = [];
    COLLECTIONS.forEach(function (c) {
      if (guessed[c.n]) return;
      // the key is the slug ("bored-ape-yacht-club"), so typing "bored ape"
      // or "boredape" both land — a collection name is long enough that
      // players will not type it the way the title does
      var name = c.n.toLowerCase();
      var slug = (c.k || "").replace(/-/g, " ");
      var flat = name.replace(/[^a-z0-9]/g, "");
      var qf = q.replace(/[^a-z0-9]/g, "");
      if (name.indexOf(q) === 0 || slug.indexOf(q) === 0 || (qf && flat.indexOf(qf) === 0)) starts.push(c);
      else if (name.indexOf(q) >= 0 || slug.indexOf(q) >= 0 || (qf && flat.indexOf(qf) >= 0)) contains.push(c);
    });
    return starts.concat(contains).slice(0, 8);
  }
  function renderAC() {
    var list = $("ac-list");
    var m = acMatches($("guess-input").value);
    clear(list);
    if (done || m.length === 0) { list.classList.add("hidden"); acIndex = -1; return; }
    list.classList.remove("hidden");
    m.forEach(function (c, i) {
      var item = el("div", "ac-item" + (i === acIndex ? " active" : ""));
      item.setAttribute("role", "option");
      item.appendChild(logoImg(c, "ac-art"));
      item.appendChild(el("span", "ac-name", c.n));
      item.appendChild(el("span", "ac-chain", c.c));
      item.addEventListener("mousedown", function (ev) { ev.preventDefault(); submitGuess(c); });
      list.appendChild(item);
    });
  }
  function submitTyped() {
    var m = acMatches($("guess-input").value);
    if (m.length) { submitGuess(m[acIndex >= 0 ? acIndex : 0]); return; }
    // a guess with nothing to match used to be completely silent
    var wrap = document.querySelector(".input-wrap");
    if (!wrap || !$("guess-input").value.trim()) return;
    wrap.classList.remove("reject");
    void wrap.offsetWidth;
    wrap.classList.add("reject");
    setTimeout(function () { wrap.classList.remove("reject"); }, 400);
  }

  // Enter and the autocomplete row both commit without the button ever
  // entering :active, so the press has to be fired by hand.
  function stamp(btn) {
    if (!btn || reducedMotion()) return;
    btn.classList.remove("sent");
    void btn.offsetWidth;
    btn.classList.add("sent");
    setTimeout(function () { btn.classList.remove("sent"); }, 400);
  }

  function submitGuess(item) {
    if (done || guesses.length >= MAX_GUESSES) return;
    guesses.push(item);
    stamp($("btn-go"));
    $("guess-input").value = "";
    acIndex = -1; renderAC();
    var win = item.n === target.n;
    if (win || guesses.length >= MAX_GUESSES) {
      done = true; won = win;
      recordResult(win, guesses.length);
    }
    saveDaily();
    renderAll(true);
    if (done) {
      $("guess-input").disabled = true;
      $("btn-go").disabled = true;
      var delay = MODE_BY_ID[modeId].kind === "grid" ? 5 * 180 + 420 : 500;
      if (won) setTimeout(confettiBurst, Math.max(0, delay - 360));
      setTimeout(openReveal, delay);
      if (typeof LB !== "undefined" && !unlimited && !isArchive()) {
        LB.report(modeId, won, guesses.length, dayNumber(), hintAxis >= 0);
      }
    } else {
      $("guess-input").focus();
    }
  }

  // ──────────────── share ────────────────
  function shareText() {
    var m = MODE_BY_ID[modeId];
    var score = (won ? guesses.length : "X") + "/" + MAX_GUESSES;
    var head = unlimited ? "Mintdle " + m.name + " · endless · " + score
      : "Mintdle " + m.name + " #" + (playDay + 1) + " · " + score;
    if (hintAxis >= 0 && modeId === "classic" && !unlimited) head += " · hint";
    var SQ = squares();
    var rows = m.kind === "grid"
      ? guesses.map(function (c) { return grade(c, target).map(function (cell) { return SQ[cell.s]; }).join(""); })
      : [guesses.map(function (c) { return c.n === target.n ? SQ.g : SQ.x; }).join("")];
    return head + "\n\n" + rows.join("\n") + "\n\n" + SITE_URL;
  }
  function copyShare() {
    var txt = shareText();
    function fallback() {
      var ta = document.createElement("textarea");
      ta.value = txt; document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch (e) {}
      document.body.removeChild(ta);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).catch(fallback);
    else fallback();
    flash("Grid copied.");
  }

  // The line that lands in the X composer. The card carries the grid, so the
  // caption does not narrate the image — it states the result and stops, and
  // the ~150 characters it leaves behind are the point: a short prefill invites
  // people to add their own line instead of deleting yours.
  function shareCaption() {
    var m = MODE_BY_ID[modeId];
    var score = (won ? guesses.length : "X") + "/" + MAX_GUESSES;
    var head = unlimited
      ? "Mintdle " + m.name + " endless — " + score
      : "Mintdle " + m.name + " #" + (playDay + 1) + " — " + score;
    if (hintAxis >= 0 && modeId === "classic" && !unlimited) head += " · hint";
    return head + ". https://" + SITE_URL;
  }

  // What the PNG needs. Deliberately not the answer: a result card that spoils
  // the item is a card nobody can post until their whole timeline has played.
  function cardState() {
    var m = MODE_BY_ID[modeId];
    var grid = m.kind === "grid";
    var rows;
    if (grid) {
      rows = guesses.map(function (c) {
        return grade(c, target).map(function (cell) { return cell.s; });
      });
    } else {
      var one = guesses.map(function (c) { return c.n === target.n ? "g" : "x"; });
      while (one.length < MAX_GUESSES) one.push(null);
      rows = [one];
    }
    var st = loadStats(modeId) || defaultStats;
    return {
      mode: modeId,
      modeName: m.name,
      blurb: m.blurb,
      day: playDay + 1,
      unlimited: unlimited,
      won: won,
      guesses: guesses.length,
      max: MAX_GUESSES,
      slots: grid ? MAX_GUESSES : 1,
      rows: rows,
      hint: hintAxis >= 0 && modeId === "classic" && !unlimited,
      streak: (!unlimited && !isArchive() && st.streak) || 0,
      url: SITE_URL,
      cb: document.body.classList.contains("cb")
    };
  }

  function postToX(btn) {
    if (typeof SHARE === "undefined") { copyShare(); return; }
    btn.disabled = true;
    SHARE.postToX(cardState(), shareCaption()).then(function (how) {
      btn.disabled = false;
      if (how === "clipboard") flash("Card copied — paste it into the post.");
      else if (how === "download") flash("Card saved — attach it to the post.");
      else if (how === "text") flash("Couldn't build the card. The words went over.");
    }, function () {
      btn.disabled = false;
      flash("X didn't open. Check your popup blocker.");
    });
  }

  // ──────────────── flash ────────────────
  function flash(msg) {
    var layer = $("flash-layer");
    if (!layer) return;
    while (layer.children.length > 2) layer.removeChild(layer.firstChild);
    var node = el("div", "flash", msg);
    layer.appendChild(node);
    // 1600ms dwell + 150ms exit; the CSS reads the same two tokens, so the
    // timer and the animation cannot drift apart.
    setTimeout(function () { if (node.parentNode) node.parentNode.removeChild(node); }, 1780);
  }

  // ──────────────── modals ────────────────
  function openModal(id) { $(id).classList.remove("hidden"); }
  function closeModal(node) {
    if (!node || node.classList.contains("hidden")) return;
    if (reducedMotion()) { node.classList.add("hidden"); return; }
    node.classList.add("closing");
    setTimeout(function () { node.classList.remove("closing"); node.classList.add("hidden"); }, 150);
  }
  function closeModals(force) {
    Array.prototype.forEach.call(document.querySelectorAll(".modal-backdrop"), function (m) {
      // the handle gate is a decision, not a dialog: it does not take a
      // backdrop click, an Escape, or a route change for an answer
      if (!force && m.hasAttribute("data-lock")) return;
      closeModal(m);
    });
    if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }
  }
  function countdownStr() {
    var now = new Date();
    var next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    var s = Math.max(0, Math.floor((next - now) / 1000));
    function p(x) { return (x < 10 ? "0" : "") + x; }
    return p(Math.floor(s / 3600)) + ":" + p(Math.floor((s % 3600) / 60)) + ":" + p(s % 60);
  }

  var countdownTimer = null;
  var pendingReveal = false;
  function gateOpen() {
    var g = $("modal-gate");
    return !!g && !g.classList.contains("hidden");
  }
  function maybeReveal() {
    if (gateOpen()) { pendingReveal = true; return; }
    openReveal();
  }
  function openReveal() {
    var box = $("reveal-body");
    clear(box);
    box.appendChild(el("div", "reveal-verdict " + (won ? "win" : "lose"), won ? "Collected." : "Floored."));
    box.appendChild(el("div", "reveal-sub", won
      ? "Got it in " + guesses.length + "/" + MAX_GUESSES + "."
      : "It stays unclaimed."));

    var card = el("div", "item-card");
    var title = el("div", "item-card-title");
    title.appendChild(logoImg(target, "item-card-art"));
    var tw = el("div", "item-card-title-text");
    tw.appendChild(el("span", "item-card-name", target.n));
    tw.appendChild(el("span", "item-card-sub", target.c + " \u00b7 " + target.g));
    title.appendChild(tw);
    card.appendChild(title);

    var facts = el("div", "item-card-facts");
    [String(target.y), fmtSupply(target.s) + " items", fmtFloor(target.f) + " floor",
     fmtNative(target)].forEach(function (f) {
      facts.appendChild(el("span", "fact-chip", f));
    });
    // Drawdown is measured in the collection's own currency, not USD. A floor
    // that held its ETH price through a 60% ETH drawdown did not fall, and
    // quoting it in dollars would say that it did.
    var hasPeak = target.p != null && target.p > 0 && target.fn != null;
    var dd = hasPeak ? Math.round((1 - target.fn / target.p) * 100) : 0;
    if (hasPeak) {
      facts.appendChild(dd >= 1
        ? el("span", "fact-chip chip-down", "\u2212" + dd + "% from " + fmtNative({ fn: target.p, cs: target.cs }) + " peak")
        : el("span", "fact-chip chip-peak", "at its all-time high"));
    }
    card.appendChild(facts);

    if (hasPeak) {
      var bar = el("div", "dd-bar");
      bar.title = "how much of the peak floor survives";
      var fill = el("div", "dd-fill");
      fill.style.width = "0%";
      bar.appendChild(fill);
      card.appendChild(bar);
      setTimeout(function () {
        fill.style.width = Math.max(0.8, Math.min(100, (target.fn / target.p) * 100)) + "%";
      }, 60);
    }

    card.appendChild(el("p", "item-card-lore", target.l));
    if (target.k) {
      var a = document.createElement("a");
      a.href = "https://www.coingecko.com/en/nft/" + target.k;
      a.target = "_blank"; a.rel = "noopener";
      a.className = "wiki-link";
      a.textContent = "floor, volume and holders \u2192";
      card.appendChild(a);
    }

    box.appendChild(card);

    var row = el("div", "btn-row");
    // The card is rendered now, not on the click. Safari only honours a
    // clipboard write and a popup inside the gesture that started them, and
    // awaiting a canvas first throws that gesture away.
    if (typeof SHARE !== "undefined") SHARE.prime(cardState());
    var xbtn = el("button", "btn btn-primary", "Post on X");
    xbtn.addEventListener("click", function () { postToX(xbtn); });
    row.appendChild(xbtn);
    var share = el("button", "btn", "Copy grid");
    share.addEventListener("click", function () { copyShare(); });
    row.appendChild(share);

    if (unlimited) {
      var again = el("button", "btn", "next item ↻");
      again.addEventListener("click", function () { closeModals(); startGame(); });
      row.appendChild(again);
      box.appendChild(row);
    } else {
      var next = null;
      for (var i = 0; i < MODES.length; i++) {
        var s = dayStatusFor(MODES[i].id);
        if (MODES[i].id !== modeId && !(s && s.done)) { next = MODES[i]; break; }
      }
      if (next) {
        var nm = el("button", "btn", "play " + next.name);
        nm.addEventListener("click", function () { closeModals(); location.hash = "#/" + next.id; });
        row.appendChild(nm);
      } else {
        var inf = el("button", "btn", "endless ∞");
        inf.addEventListener("click", function () { closeModals(); location.hash = "#/" + modeId + "/unlimited"; });
        row.appendChild(inf);
      }
      box.appendChild(row);
      if (!isArchive()) {
        box.appendChild(el("div", "countdown-label", "next daily in"));
        var cd = el("div", "countdown", countdownStr());
        box.appendChild(cd);
        if (countdownTimer) clearInterval(countdownTimer);
        countdownTimer = setInterval(function () { cd.textContent = countdownStr(); }, 1000);
      }
    }
    openModal("modal-reveal");
  }

  function renderStats() {
    var st = loadStats(statsMode) || defaultStats;
    $("st-played").textContent = st.played;
    $("st-winpct").textContent = st.played ? Math.round(100 * st.wins / st.played) + "%" : "—";
    $("st-streak").textContent = st.streak;
    $("st-max").textContent = st.maxStreak;
    var wrap = $("dist");
    clear(wrap);
    var max = Math.max.apply(null, st.dist.concat([1]));
    st.dist.forEach(function (n, i) {
      var row = el("div", "dist-row");
      row.appendChild(el("span", "dist-n", String(i + 1)));
      var bar = el("div", "dist-bar");
      bar.style.width = Math.max(9, Math.round(100 * n / max)) + "%";
      bar.appendChild(el("span", "dist-count", String(n)));
      row.appendChild(bar);
      wrap.appendChild(row);
    });
    var tabs = $("stat-tabs");
    clear(tabs);
    MODES.forEach(function (m) {
      var b = el("button", "stat-tab" + (m.id === statsMode ? " on" : ""), m.name);
      b.addEventListener("click", function () { statsMode = m.id; renderStats(); });
      tabs.appendChild(b);
    });
  }
  function openStats() { statsMode = modeId; renderStats(); openModal("modal-stats"); }

  function openArchive() {
    var box = $("archive-body");
    clear(box);
    var today = dayNumber();
    var rows = 0;
    for (var d = today - 1; d >= 0 && rows < 60; d--) {
      MODES.forEach(function (m) {
        var st = loadDay(m.id, d);
        var btn = el("button", "arch-row");
        btn.appendChild(el("span", "arch-day", "#" + (d + 1)));
        btn.appendChild(el("span", "arch-mode", m.name));
        btn.appendChild(el("span", "arch-state", st && st.done ? (st.won ? "✓ " + st.n + "/6" : "✕") : "play →"));
        btn.addEventListener("click", function () {
          closeModals();
          location.hash = "#/" + m.id + "/d" + d;
        });
        box.appendChild(btn);
      });
      rows++;
    }
    if (!rows) box.appendChild(el("p", "lb-empty", "No past puzzles yet — come back tomorrow."));
    openModal("modal-archive");
  }

  function renderHelpModes() {
    var box = $("help-modes");
    if (!box) return;
    clear(box);
    MODES.forEach(function (m) {
      var row = el("div", "help-mode");
      row.appendChild(logoByTicker(m.icon, "help-mode-ico"));
      row.appendChild(el("span", "help-mode-name", m.name));
      row.appendChild(el("span", "help-mode-desc", m.blurb));
      box.appendChild(row);
    });
  }

  // ──────────────── socials ────────────────
  var SOCIAL_ICON = {
    x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
    // two candles with wicks — drawn here rather than lifted, so it inherits
    // currentColor and sits on the same 24px grid as the X mark
    dex: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6 2h3v4h2v9H9v4H6v-4H4V6h2V2zm9 3h3v5h2v7h-2v5h-3v-5h-2v-7h2V5z"/></svg>'
  };
  function renderSocial() {
    var row = $("social-row");
    if (!row) return;
    clear(row);
    SOCIAL.forEach(function (s) {
      var live = !!s.url;
      var node = document.createElement(live ? "a" : "button");
      node.className = "social-btn" + (live ? "" : " soon");
      node.innerHTML = SOCIAL_ICON[s.id] || "";
      if (s.label) node.appendChild(el("span", "social-label", s.label));
      if (live) {
        node.href = s.url; node.target = "_blank"; node.rel = "noopener";
        node.title = s.title; node.setAttribute("aria-label", s.title);
      } else {
        node.type = "button";
        node.title = s.title + " — not up yet";
        node.setAttribute("aria-label", s.title + ", not up yet");
        node.appendChild(el("span", "soon-tag", "soon"));
        node.addEventListener("click", function () {
          node.classList.add("nudge");
          setTimeout(function () { node.classList.remove("nudge"); }, 400);
        });
      }
      row.appendChild(node);
    });
  }

  // ──────────────── start / route ────────────────
  function startGame() {
    var input = $("guess-input");
    guesses = []; done = false; won = false; hintAxis = -1; lastBlur = null;

    if (unlimited) {
      target = randomItem(target ? target.n : null);
    } else {
      target = dailyItem(modeId, playDay);
      var saved = loadDay(modeId, playDay);
      if (saved && Array.isArray(saved.g)) {
        var byName = {};
        COLLECTIONS.forEach(function (c) { byName[c.n] = c; });
        saved.g.forEach(function (n) { if (byName[n]) guesses.push(byName[n]); });
        done = !!saved.done; won = !!saved.won;
        if (typeof saved.h === "number") hintAxis = saved.h;
      }
    }

    input.disabled = done;
    $("btn-go").disabled = done;
    input.value = "";
    input.placeholder = done ? (unlimited ? "Next collection ↻" : "Come back tomorrow") : "Type a collection…";
    renderAll(false);
    if (done) setTimeout(maybeReveal, 320);
    else if (!("ontouchstart" in window) && !gateOpen()) input.focus();
  }

  function route() {
    var h = (location.hash || "").replace(/^#\/?/, "");
    var parts = h.split("/").filter(Boolean);
    modeId = MODE_BY_ID[parts[0]] ? parts[0] : "classic";
    unlimited = parts[1] === "unlimited";
    playDay = dayNumber();
    if (parts[1] && /^d\d+$/.test(parts[1])) {
      var d = parseInt(parts[1].slice(1), 10);
      if (d >= 0 && d <= dayNumber()) playDay = d;
    }
    closeModals();
    startGame();
    window.scrollTo(0, 0);
  }

  // ──────────────── wire up ────────────────
  function bindToggle(box, cls, key) {
    if (!box) return;
    box.checked = lsGet(key) === "1";
    document.body.classList.toggle(cls, box.checked);
    box.setAttribute("data-sync", key);
    box.addEventListener("change", function () {
      document.body.classList.toggle(cls, box.checked);
      lsSet(key, box.checked ? "1" : "0");
      Array.prototype.forEach.call(document.querySelectorAll('input[data-sync="' + key + '"]'), function (o) {
        if (o !== box) o.checked = box.checked;
      });
      renderAll(false);
    });
  }

  // ──────────────── theme ────────────────
  // The attribute lives on <html>, not <body>: the inline script in index.html
  // stamps it before first paint, so a dark load never flashes white. Dark is
  // the house theme AND the default — "system" is an explicit opt-in, because
  // prefers-color-scheme no longer reports "no-preference" and defaulting to it
  // would flip existing players to light unasked.
  var THEME_KEY = "mt_theme";
  var themeQuery = window.matchMedia ? matchMedia("(prefers-color-scheme: light)") : null;

  function themePref() {
    var t = lsGet(THEME_KEY);
    return (t === "light" || t === "system") ? t : "dark";
  }
  function applyTheme() {
    var pref = themePref();
    var dark = pref === "dark" || (pref === "system" && !(themeQuery && themeQuery.matches));
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", dark ? "#101011" : "#fafafa");
    Array.prototype.forEach.call(document.querySelectorAll("[data-theme-set]"), function (b) {
      var on = b.getAttribute("data-theme-set") === pref;
      b.classList.toggle("on", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }
  function bindTheme() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-theme-set]"), function (b) {
      b.addEventListener("click", function () {
        lsSet(THEME_KEY, b.getAttribute("data-theme-set"));
        applyTheme();
      });
    });
    if (themeQuery) {
      if (themeQuery.addEventListener) themeQuery.addEventListener("change", applyTheme);
      else if (themeQuery.addListener) themeQuery.addListener(applyTheme);  // Safari < 14
    }
    applyTheme();
  }

  function init() {
    $("brand-slot").innerHTML = brandSVG("a");
    renderHelpModes(); renderSocial();

    var input = $("guess-input");
    function jumpToSearch() {
      input.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "center" });
      setTimeout(function () { input.focus(); }, reducedMotion() ? 0 : 280);
    }
    var marketSearch = $("btn-market-search");
    if (marketSearch) marketSearch.addEventListener("click", jumpToSearch);
    input.addEventListener("input", function () { acIndex = -1; renderAC(); });
    input.addEventListener("keydown", function (ev) {
      var m = acMatches(input.value);
      if (ev.key === "ArrowDown") { ev.preventDefault(); if (m.length) { acIndex = (acIndex + 1) % m.length; renderAC(); } }
      else if (ev.key === "ArrowUp") { ev.preventDefault(); if (m.length) { acIndex = (acIndex - 1 + m.length) % m.length; renderAC(); } }
      else if (ev.key === "Enter") { ev.preventDefault(); submitTyped(); }
      else if (ev.key === "Escape") { input.value = ""; renderAC(); }
    });
    input.addEventListener("blur", function () {
      setTimeout(function () { $("ac-list").classList.add("hidden"); }, 150);
    });
    input.addEventListener("focus", renderAC);
    $("btn-go").addEventListener("click", function () { submitTyped(); input.focus(); });

    $("btn-help").addEventListener("click", function () { openModal("modal-help"); });
    $("btn-help-2").addEventListener("click", function () { openModal("modal-help"); });
    $("btn-settings").addEventListener("click", function () { openModal("modal-settings"); });

    Array.prototype.forEach.call(document.querySelectorAll("[data-go]"), function (b) {
      b.addEventListener("click", function () {
        var go = b.getAttribute("data-go");
        if (go === "stats") openStats();
        else if (go === "board" && typeof LB !== "undefined") LB.open(dayNumber(), modeId);
      });
    });
    Array.prototype.forEach.call(document.querySelectorAll("[data-close]"), function (b) {
      b.addEventListener("click", closeModals);
    });
    Array.prototype.forEach.call(document.querySelectorAll(".modal-backdrop"), function (m) {
      m.addEventListener("click", function (ev) { if (ev.target === m) closeModals(); });
    });
    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape") closeModals();
      if (ev.key === "/" && !/^(INPUT|TEXTAREA)$/.test(document.activeElement && document.activeElement.tagName)) {
        ev.preventDefault();
        jumpToSearch();
      }
    });

    bindToggle($("cb-toggle"), "cb", "mt_cb");
    bindToggle($("cb-toggle-2"), "cb", "mt_cb");
    bindTheme();

    $("btn-wipe").addEventListener("click", function () {
      var b = $("btn-wipe");
      if (b.getAttribute("data-armed") !== "1") {
        b.setAttribute("data-armed", "1");
        b.textContent = "tap again to confirm";
        setTimeout(function () { b.removeAttribute("data-armed"); b.textContent = "Erase my record"; }, 4000);
        return;
      }
      try {
        var keep = { mt_cid: 1, mt_name: 1, mt_x: 1, mt_theme: 1 };
        var kill = [];
        for (var i = 0; i < localStorage.length; i++) {
          var k = localStorage.key(i);
          if (k && !keep[k] && k.indexOf("mt_") === 0) kill.push(k);
        }
        kill.forEach(function (k) { localStorage.removeItem(k); });
      } catch (e) {}
      location.reload();
    });

    // Without a touch listener somewhere in the document, iOS Safari never
    // applies :active — which silently disables every press animation on the
    // page for every iPhone visitor.
    document.addEventListener("touchstart", function () {}, { passive: true });

    window.addEventListener("hashchange", route);

    // The hang is dealt from the viewport width, not a fixed count, or it sits
    // as a short clump in the middle of a wide wall. Rebuild it on resize.
    refreshDecor();
    window.addEventListener("resize", refreshDecor);

    route();

    // after route() — it clears open modals on every navigation, this one included
    function firstRun() {
      if (!lsGet("mt_seen")) {
        lsSet("mt_seen", "1");
        openModal("modal-help");
        return;
      }
      if (pendingReveal) { pendingReveal = false; openReveal(); }
    }
    if (typeof LB !== "undefined") LB.boot(firstRun);
    else firstRun();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
