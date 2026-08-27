#!/usr/bin/env node
// Caps artwork weight. CoinGecko's /original/ is whatever the uploader gave it:
// mostly a 250px PNG, occasionally a 3.5MB animated GIF. Blur mode draws a
// static square at ~170px CSS, so anything past 512px or a few hundred KB is
// bytes the player waits on and never sees.
//
// Uses macOS `sips` rather than a native image dependency — this repo has no
// build step and is not going to grow one for a step that runs by hand. On a
// machine without sips the pass is skipped and the originals ship as-is.
const fs = require('fs'), path = require('path'), cp = require('child_process');
const IMG = path.join(__dirname, '..', 'img');
const MAX_BYTES = 260 * 1024;
const MAX_EDGE = 512;

let sips = true;
try { cp.execSync('command -v sips', { stdio: 'ignore' }); } catch { sips = false; }
if (!sips) { console.log('sips not available — skipping normalisation'); process.exit(0); }

let done = 0, saved = 0;
for (const f of fs.readdirSync(IMG).filter(f => f.endsWith('.img'))) {
  const p = path.join(IMG, f);
  const before = fs.statSync(p).size;
  if (before <= MAX_BYTES) continue;
  const tmp = p + '.tmp.jpg';
  try {
    // an animated GIF collapses to its first frame, which is what a static
    // square thumbnail wanted anyway
    cp.execSync(`sips -s format jpeg -s formatOptions 82 -Z ${MAX_EDGE} ${JSON.stringify(p)} --out ${JSON.stringify(tmp)}`, { stdio: 'ignore' });
    const after = fs.statSync(tmp).size;
    if (after > 0 && after < before) {
      fs.renameSync(tmp, p);
      console.log(`  ${f}: ${(before / 1024).toFixed(0)}kb -> ${(after / 1024).toFixed(0)}kb`);
      saved += before - after; done++;
    } else fs.unlinkSync(tmp);
  } catch (e) {
    try { fs.unlinkSync(tmp); } catch {}
    console.log(`  ! ${f} ${e.message.split('\n')[0]}`);
  }
}
console.log(`${done} normalised · ${(saved / 1048576).toFixed(1)}MB saved`);
