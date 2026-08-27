# Status — handoff

Last updated: 2026-08-27. Written to pick this up on another machine.

## Where it stands

**Playable and tested end to end.** 130 collections across 11 chains, all three
modes working, 11/11 end-to-end checks passing.

- **Repo**: https://github.com/JearDesuss/mintdle (public, `main`)
- **Vercel**: **not deployed yet** — see "Next step" below.

```
130 collections · zero missing lore · zero missing peak floor
chains   Ethereum 71 · Robinhood 15 · Solana 13 · Bitcoin 10 · Base 5 ·
         Abstract 4 · Berachain 3 · Polygon 3 · ApeChain 2 · Ronin 2 · HyperEVM 2
classes  PFP 52 · Derivative 22 · Meme 17 · Onchain 11 · Utility 9 · Art 7 ·
         Gaming 7 · Collectible 4 · Land 1
years    2017–2026, peaking at 2021 (44)
```

## Next step — the one thing left

Deploy to Vercel **under the jeardesuss account** (this was the chosen option;
the Vercel CLI on the Mac is logged in as `0xsharpy`, which is the wrong
account — Memedle is not on it).

1. Go to https://vercel.com/new
2. Import `JearDesuss/mintdle`
3. Framework preset: **Other**. Build command: none. Output dir: `.`
   (`vercel.json` already sets this; it should be picked up automatically.)
4. Deploy.

That gets Git integration, so every push to `main` auto-deploys — same setup as
Memedle.

### After it is live

- Set `SITE_URL` in `game.js` to the real hostname (currently
  `mintdle.vercel.app`) and the `og:url` / canonical in `index.html`.
  Then `node tools/bump-assets.js` and push.
- Fill in the two `SOCIAL` URLs in `game.js` (X and OpenSea). Empty renders a
  muted `soon` chip, which is what ships today.
- **Leaderboard** needs `BLOB_READ_WRITE_TOKEN` in Vercel env (Vercel Blob
  store). Without it the API answers 503 and `lb.js` now probes once and skips
  the handle gate entirely, so the game plays fine unconfigured — new visitors
  get "How to play" instead of a dead-end prompt. Add the token and the handle
  gate and daily board switch themselves on.

## Two things NOT done

**Trend research via agent-reach never happened.** The ask was to check trending
NFTs with agent-reach — the `agent-reach -> opencli` bridge in `~/Developer/lashaun`
that drives the logged-in Chrome for free X reads. That was misread as a
generic research subagent, which was spawned instead, and it died on an API
error without writing anything. So **no X/trend signal informed the roster**.
The 130 collections were curated from CoinGecko's own catalogue plus known
blue chips. Running the real bridge could still reshape the list toward what is
actually hot.

**Vercel git-author trap (from the memescout build, cost 7+ minutes there).**
Vercel attributes CLI deploys to the git commit author. Commits authored
`akbarfazar82@gmail.com` are rejected with `TEAM_ACCESS_REQUIRED` when the
Vercel account is `akbar@sharpbyte.xyz`, and the CLI then hangs on a build that
never starts. Every commit here is authored `akbarfazar82@gmail.com`. Importing
through vercel.com/new uses Git integration rather than CLI attribution, so this
should not bite — but if a deploy hangs past ~30s, this is the first thing to
check (`vercel deploy --debug`, look for `readyState: BLOCKED`), and the fix is
`git config user.email` to whatever the target Vercel account uses.

## Known gaps / possible next work

- `rare-sats` is the only roster entry that never made the deck — CoinGecko
  reports no supply for it, and `build-data.js` correctly refuses it.
- Artwork resolution is mixed: 512px where an OpenSea slug resolved (~50), 250px
  from CoinGecko otherwise. Blur mode draws at ~164px CSS, so the 250px ones are
  slightly soft on a 2x screen. `tools/.os-slugs.json` caches which slugs
  resolved; adding candidates to `candidates()` in `tools/fetch-art.js` would
  upgrade more.
- The deck is Ethereum-heavy (71/130). More Solana, Base and Ordinals entries
  would balance the Chain axis.
- No `docs/LEADERBOARD.md` — the `api/` folder came over from Memedle unchanged
  and its doc did not.
- Only the Classic path is covered by the test. Blur and Lore are verified by
  hand (screenshots) but not asserted.

## Rebuilding the data

```
node tools/fetch-collections.js     # resumable; CoinGecko rate-limits hard (~30 min full)
node tools/fetch-art.js --missing   # artwork + art.js, then normalises oversized files
node tools/build-data.js            # merges cache + roster.json + lore.json -> data.js
node tools/bump-assets.js           # ALWAYS before a deploy
node tools/schedule.js 14           # spoilers: what players will see
```

`tools/.cg-cache.json` and `tools/.os-slugs.json` are gitignored, so a fresh
clone re-fetches from scratch. If you want to skip the 30-minute refetch on the
other machine, copy those two files across.

## Testing

```
python3 -m http.server 8471
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new \
  --remote-debugging-port=9223 --user-data-dir=/tmp/cdp-mintdle http://localhost:8471/
node test/cdp-test.js
```

## Reading order for the design

`DESIGN.md` is the contract and is meant to be read before touching
`style.css`. The three deliberate breaks from Memedle's system are argued at the
top of it. `docs/ARCHITECTURE.md` covers the daily-pick algorithm and the
gotchas; `docs/DATA.md` covers the schema and where every field comes from.
