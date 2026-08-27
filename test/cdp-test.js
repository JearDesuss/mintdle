#!/usr/bin/env node
/* Mintdle end-to-end test over CDP. No test dependencies; node 22+ for WebSocket.
 *
 *   python3 -m http.server 8471
 *   "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new \
 *     --remote-debugging-port=9223 --user-data-dir=/tmp/cdp-mintdle http://localhost:8471/
 *   node test/cdp-test.js
 *
 * It recomputes the day's answer from the page's own COLLECTIONS array using an
 * independent copy of the daily-pick algorithm, so a change to the seeds, the
 * stride or fameWeight fails here rather than silently rewriting the schedule.
 */
const http=require('http');
const get=u=>new Promise((res,rej)=>http.get(u,r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>res(JSON.parse(d)))}).on('error',rej));
(async()=>{
  const tabs=await get('http://localhost:9223/json/list');
  const ws=new WebSocket((tabs.find(t=>t.type==='page')||tabs[0]).webSocketDebuggerUrl);
  let id=0;const pend={};const errs=[];
  const send=(m,p={})=>new Promise(r=>{const i=++id;pend[i]=r;ws.send(JSON.stringify({id:i,method:m,params:p}))});
  ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&pend[m.id]){pend[m.id](m.result);delete pend[m.id];}
    if(m.method==='Runtime.exceptionThrown')errs.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);};
  await new Promise(r=>ws.onopen=r);
  await send('Network.enable');await send('Network.setCacheDisabled',{cacheDisabled:true});await send('Runtime.enable');await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride',{width:1280,height:1000,deviceScaleFactor:1,mobile:false});
  await send('Page.navigate',{url:'http://localhost:8471/'});
  await new Promise(r=>setTimeout(r,1200));
  await send('Runtime.evaluate',{expression:`localStorage.clear();localStorage.setItem('mt_seen','1');localStorage.setItem('mt_name','tester');localStorage.setItem('mt_cid','cid-test');`});
  await send('Page.navigate',{url:'http://localhost:8471/#/classic'});
  await new Promise(r=>setTimeout(r,2500));
  const ev=async ex=>(await send('Runtime.evaluate',{expression:ex,returnByValue:true,awaitPromise:true})).result?.value;

  const ok=[],bad=[];
  const t=(n,c)=>c?ok.push(n):bad.push(n);

  // reproduce the daily pick from the page's own data
  const answer = await ev(`(function(){
    function mul(a){return function(){a|=0;a=(a+0x6D2B79F5)|0;var t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296}}
    var EPOCH=new Date(2026,7,27),n=new Date(),today=new Date(n.getFullYear(),n.getMonth(),n.getDate());
    var day=Math.round((today-EPOCH)/86400000);
    var SEEDS={classic:0x1177EDA1,blur:0x0FF10012,lore:0x3A17EDEF},STRIDE=61,used={},out={};
    ['classic','blur','lore'].forEach(function(mid){
      var rnd=mul(SEEDS[mid]);
      var keyed=COLLECTIONS.map(function(c,i){return{i:i,k:Math.pow(rnd(),1/(c.w||1))}});
      keyed.sort(function(a,b){return b.k-a.k||a.i-b.i});
      var o=keyed.map(function(e){return e.i}),len=o.length,pick=null;
      for(var k=0;k<len;k++){var c=COLLECTIONS[o[((((day+k*STRIDE)%len)+len)%len)]];if(!used[c.k]){pick=c;break}}
      used[pick.k]=1;out[mid]=pick.n;
    });
    return JSON.stringify(out);
  })()`);
  const picks=JSON.parse(answer);
  console.log('today picks:',picks);
  t('three distinct daily picks', new Set(Object.values(picks)).size===3);

  // a deliberately wrong guess
  const wrong = await ev(`COLLECTIONS.find(function(c){return c.n!==${JSON.stringify(picks.classic)}}).n`);
  const type=async v=>{
    await ev(`(function(){var i=document.getElementById('guess-input');i.value=${JSON.stringify(v)};i.dispatchEvent(new Event('input',{bubbles:true}));return 1})()`);
    await new Promise(r=>setTimeout(r,300));
    await ev(`document.getElementById('btn-go').click()`);
    await new Promise(r=>setTimeout(r,900));
  };
  await type(wrong);
  const rows1=await ev(`document.querySelectorAll('.guess-row').length`);
  t('wrong guess renders a graded row', rows1===1);
  const tiles=await ev(`document.querySelectorAll('.guess-row .tile').length`);
  t('row has 5 graded tiles', tiles===5);
  const statuses=await ev(`JSON.stringify([].map.call(document.querySelectorAll('.guess-row .tile'),function(e){return e.className.match(/s-[gyx]/)[0]}))`);
  console.log('  tile grades:',statuses);
  t('every tile carries a status', JSON.parse(statuses).every(s=>['s-g','s-y','s-x'].includes(s)));
  const pips=await ev(`document.querySelectorAll('#pips .pip.used').length`);
  t('a pip is spent', pips===1);

  // the correct guess
  await type(picks.classic);
  // the reveal is opened on a timer after the winning row finishes flipping
  await new Promise(r=>setTimeout(r,1600));
  const revealed=await ev(`!document.getElementById('modal-reveal').classList.contains('hidden')`);
  t('correct guess opens the reveal', revealed===true);
  const verdict=await ev(`(document.querySelector('.reveal-verdict')||{}).textContent`);
  t('verdict reads Collected.', verdict==='Collected.');
  const allGreen=await ev(`(function(){var r=document.querySelectorAll('.guess-row');var last=r[r.length-1];return [].every.call(last.querySelectorAll('.tile'),function(e){return /s-g/.test(e.className)})})()`);
  t('winning row is all green', allGreen===true);
  const lore=await ev(`(document.querySelector('.item-card-lore')||{}).textContent||''`);
  t('reveal card carries provenance', (lore||'').length>30);
  const link=await ev(`(document.querySelector('.wiki-link')||{}).href||''`);
  t('reveal links to CoinGecko', /coingecko\.com\/en\/nft\//.test(link||''));

  // persistence
  await send('Page.navigate',{url:'http://localhost:8471/#/classic'});
  await new Promise(r=>setTimeout(r,2200));
  const rows2=await ev(`document.querySelectorAll('.guess-row').length`);
  t('progress survives a reload', rows2===2);

  console.log('\nPASS '+ok.length+':',ok.join(' · '));
  if(bad.length)console.log('FAIL '+bad.length+':',bad.join(' · '));
  if(errs.length)console.log('JS ERRORS:',errs.slice(0,3));
  process.exit(bad.length||errs.length?1:0);
})();
