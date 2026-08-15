#!/usr/bin/env node
/* Minimal-kit optimiser for the Aug 17-24 2026 Bangkok / Phu Quoc / Hanoi trip.
   Uses the board's hand-judged scores AND the wearer's pick/veto grades.
   A veto is treated as a hard exclusion; a pick gets a bonus, because the
   wearer's judgement outranks the model.                                     */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = eval('(' + fs.readFileSync(path.join(ROOT,'public/outfit-board/board-data.js'),'utf8')
  .replace(/^[\s\S]*?const DATA = /,'').replace(/;\s*$/,'') + ')');
const GR = JSON.parse(fs.readFileSync(path.join(ROOT,'public/outfit-board/grades.json'),'utf8')).grades;

const T = DATA.tops, B = DATA.bottoms, S = DATA.shoes;
const byId = id => [...T,...B,...S].find(p=>p.id===id);
const cell = (t,b) => DATA.matrix[t][B.findIndex(x=>x.id===b)];
const shoe = (b,s) => DATA.shoeMatrix[b][S.findIndex(x=>x.id===s)];
const PICK_BONUS = 12;

/* ---- the real itinerary, as outfit slots ----------------------------------
   long   : long trousers required (temple dress code / rooftop door policy)
   closed : closed shoes required (go-kart, shooting range, club door policy)
   water  : will get wet or sweat-soaked; needs quick-dry, low value at risk
   smart  : how dressed-up, 0 = beach, 2 = the strictest rooftop of the trip */
const SLOTS = [
  // Verified Aug 2026. long/closed are set ONLY where a source states the rule.
  // Lebua: "tailored shorts, loafers, or elegant sandals" allowed; only flip-flops,
  // beach slippers, sleeveless, swimwear and athletic wear are banned. lebua.com
  // Grand Palace: "short hot pants or short pants" and sleeveless prohibited -> long trousers.
  // EasyKart: closed shoes mandatory BUT rentable on site for 50 THB.
  { id:'17n', day:'Aug 17', label:'GOA-BOM-BKK, land 19:15 -> Tichuca',    long:true,  closed:false, water:false, smart:1, rain:50, legs:2 },
  { id:'18d', day:'Aug 18', label:'Grand Palace + Wat Arun -> go-kart',   long:true,  closed:false, water:false, smart:1, rain:50 },
  { id:'18n', day:'Aug 18', label:'Lebua Sky Bar -> ONYX nightclub',      long:false, closed:false, water:false, smart:2, rain:50 },
  { id:'19d', day:'Aug 19', label:'Shooting range -> MBK shopping',       long:false, closed:false, water:false, smart:1, rain:50 },
  { id:'19n', day:'Aug 19', label:'Street food -> Tribe / Aether',        long:false, closed:false, water:false, smart:2, rain:50 },
  { id:'20d', day:'Aug 20', label:'Checkout -> fly BKK-PQC',              long:true,  closed:false, water:false, smart:0, rain:60, legs:1 },
  { id:'20n', day:'Aug 20', label:'Sunset Town, Kiss of the Sea, market', long:false, closed:false, water:false, smart:1, rain:76 },
  { id:'21d', day:'Aug 21', label:'Beach / boat / water park',            long:false, closed:false, water:true,  smart:0, rain:76 },
  { id:'21n', day:'Aug 21', label:'OCSEN beach bar / villa dinner',       long:false, closed:false, water:false, smart:1, rain:76 },
  { id:'22d', day:'Aug 22', label:'Early flight PQC-HAN, Old Quarter',    long:true,  closed:false, water:false, smart:0, rain:53, legs:1 },
  { id:'22n', day:'Aug 22', label:'Grand World tour -> Ta Hien',          long:false, closed:false, water:false, smart:1, rain:53 },
  { id:'23d', day:'Aug 23', label:'Halong Bay cruise, kayak, swim',       long:false, closed:false, water:true,  smart:0, rain:53 },
  { id:'23n', day:'Aug 23', label:'Ta Hien, Saturday street closure',     long:false, closed:false, water:false, smart:1, rain:53 },
  { id:'24d', day:'Aug 24', label:'Old Quarter -> HAN-BOM-GOA fly home',  long:true,  closed:false, water:false, smart:0, rain:53, legs:2 },
];

/* formality reach of each bottom, reused from the interval model */
const SMART_OK = {
  b1:[1,2], b2:[0,1,2], b5:[0,1,2], bch:[0,1,2], b3:[0,1],
  blp:[0], bsh:[0,1], nsh:[0,1], blsh:[0,1],
};
/* tops that cannot carry a smart=2 rooftop */
const TOP_MAX_SMART = { blp:0, t12:2, wcr:1, rcr:1, t2:1, t10:1, wpo:2, t5:2,
                        t11:2, wst:2, nst:2, t13:2, t20:1, t19:1, wfm:2 };

const valid = (t,b,s,slot) => {
  const bb = byId(b), ss = byId(s);
  if (GR[t+'|'+b] === 'veto') return false;
  if (slot.long && bb.leg === 'short') return false;
  if (slot.closed && ss.id === 'snd') return false;
  if (slot.water && ss.id === 'smb') return false;          // suede in seawater, no
  if (slot.water && bb.leg !== 'short') return false;       // you are getting wet
  // an airport is its own occasion: a sharp trouser reads fine on a travel day
  // even though it would be overdressed on a beach day.
  const reach = slot.legs ? [...(SMART_OK[b]||[]), 0] : (SMART_OK[b]||[]);
  if (!reach.includes(slot.smart)) return false;
  if ((TOP_MAX_SMART[t] ?? 2) < slot.smart) return false;
  return true;
};
const score = (t,b,s,slot) => {
  let v = cell(t,b)*0.75 + shoe(b,s)*0.25;
  if (GR[t+'|'+b] === 'pick') v += PICK_BONUS;
  if (slot.water) v += (byId(t).m[2] + byId(b).m[2]) * 0.8;   // quick-dry matters
  if (slot.smart === 0) v += (byId(t).m[1] + byId(b).m[1]) * 0.4; // breathability
  if (s === 'smb') v -= slot.rain * 0.18;        // suede vs 50-76% daily rain odds
  v += (byId(t).m[2]) * (slot.rain / 100) * 1.2; // quick-dry pays off when it rains
  if (slot.legs) {                               // 6 flight legs across 4 days
    v += (byId(t).m[5] + byId(b).m[5]) * slot.legs * 0.9;  // creasing, sat down for hours
    v -= (10 - byId(t).m[1]) * 0.15;             // cabin is 22-24C, breathability is moot
  }
  return v;
};

/* Assign slots to a kit. Tops are limited by wear count: in 33C/80% humidity a
   top is one-and-done unless it is washed. `washes` = extra wears unlocked. */
function plan(kit, washes) {
  const { tops, bots, shoes } = kit;
  const capT = {}; tops.forEach(t => capT[t] = 1);
  let extra = washes;
  const used = new Set(); let prevBottom = null, total = 0; const rows = [];
  const wearB = {}; const wornToday = {};
  for (const slot of SLOTS) {
    let best = null;
    for (const t of tops) {
      if ((capT[t]||0) <= 0 && extra <= 0) continue;
      if (wornToday[slot.day]?.has(t)) continue;   // never the same top twice in one day
      for (const b of bots) for (const s of shoes) {
        if (!valid(t,b,s,slot)) continue;
        if (used.has(t+'|'+b)) continue;                    // no identical repeat
        if (b === prevBottom && (wearB[b]||0) >= 2) continue;
        let v = score(t,b,s,slot);
        if ((capT[t]||0) <= 0) v -= 6;                      // penalise re-wear
        if (!best || v > best.v) best = { t,b,s,v };
      }
    }
    if (!best) { rows.push({ slot, pick:null }); continue; }
    if ((capT[best.t]||0) > 0) capT[best.t]--; else extra--;
    used.add(best.t+'|'+best.b);
    (wornToday[slot.day] = wornToday[slot.day] || new Set()).add(best.t);
    wearB[best.b] = (wearB[best.b]||0)+1;
    prevBottom = best.b; total += best.v; rows.push({ slot, pick:best });
  }
  const covered = rows.filter(r=>r.pick).length;
  const worst = covered ? Math.min(...rows.filter(r=>r.pick).map(r=>r.pick.v)) : 0;
  return { rows, total, covered, worst };
}

/* local search over kits of a fixed item count */
function search(nT, nB, nS, washes, iters=4000) {
  const tIds = T.map(t=>t.id), bIds = B.map(b=>b.id), sIds = S.map(s=>s.id);
  const rnd = a => a[Math.floor(Math.random()*a.length)];
  const sample = (arr,n) => { const c=[...arr]; const o=[];
    while(o.length<n && c.length) o.push(...c.splice(Math.floor(Math.random()*c.length),1)); return o; };
  let best = null;
  for (let r=0; r<iters; r++) {
    let kit = { tops:sample(tIds,nT), bots:sample(bIds,nB), shoes:sample(sIds,nS) };
    let cur = plan(kit, washes);
    let improved = true;
    while (improved) {                                     // hill-climb by swaps
      improved = false;
      for (const key of ['tops','bots','shoes']) {
        const pool = key==='tops'?tIds:key==='bots'?bIds:sIds;
        for (let i=0;i<kit[key].length;i++) for (const cand of pool) {
          if (kit[key].includes(cand)) continue;
          const nk = { ...kit, [key]:kit[key].map((x,j)=>j===i?cand:x) };
          const np = plan(nk, washes);
          if (np.covered > cur.covered ||
             (np.covered === cur.covered && np.total > cur.total + 1e-9)) {
            kit = nk; cur = np; improved = true;
          }
        }
      }
    }
    if (!best || cur.covered > best.p.covered ||
       (cur.covered === best.p.covered && cur.total > best.p.total)) best = { kit, p:cur };
  }
  return best;
}

const NAME = id => byId(id).name;
export { DATA, T, B, S, SLOTS, GR, byId, cell, shoe, valid, score, plan, search, NAME };

const isMain = process.argv[1] &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
const args = isMain ? process.argv.slice(2) : ['noop'];
if (args[0] === 'noop') { /* imported as a module */ }
else if (args[0] === 'curve') {
  const washes = Number(args[1] ?? 2);
  console.log(`# marginal value of each extra item  (laundry: ${washes} extra wears)\n`);
  console.log('items  tops bot shoe  covered  total    worst  kit');
  let prev = 0;
  for (const [nT,nB,nS] of [[3,2,2],[4,2,2],[4,3,2],[5,3,2],[5,4,2],[6,3,2],[6,4,2],
                            [7,4,2],[7,4,3],[8,4,2],[8,5,2],[9,5,2],[10,5,3]]) {
    const r = search(nT,nB,nS,washes,140);
    const n = nT+nB+nS;
    console.log(`${String(n).padStart(4)}   ${nT}    ${nB}   ${nS}    ${String(r.p.covered).padStart(2)}/14   ` +
      `${r.p.total.toFixed(0).padStart(5)}  ${r.p.worst.toFixed(0).padStart(5)}  ` +
      `${r.kit.tops.map(NAME).join(', ')} | ${r.kit.bots.map(NAME).join(', ')} | ${r.kit.shoes.map(NAME).join(', ')}`);
    prev = r.p.total;
  }
} else {
  const [nT,nB,nS,washes] = [Number(args[0]||6),Number(args[1]||4),Number(args[2]||2),Number(args[3]??2)];
  const r = search(nT,nB,nS,washes,600);
  console.log(`KIT  ${nT} tops + ${nB} bottoms + ${nS} shoes = ${nT+nB+nS} items   (laundry: ${washes})`);
  console.log('  tops   :', r.kit.tops.map(NAME).join(', '));
  console.log('  bottoms:', r.kit.bots.map(NAME).join(', '));
  console.log('  shoes  :', r.kit.shoes.map(NAME).join(', '));
  console.log(`  covered ${r.p.covered}/14 slots, total ${r.p.total.toFixed(0)}, worst slot ${r.p.worst.toFixed(0)}\n`);
  for (const { slot, pick } of r.p.rows) {
    const tag = [slot.long?'long':'', slot.closed?'closed':'', slot.water?'water':''].filter(Boolean).join(',');
    console.log(`  ${slot.day}  ${slot.label.padEnd(38)} ${tag.padEnd(18)} ` +
      (pick ? `${NAME(pick.t)} + ${NAME(pick.b)} + ${NAME(pick.s)}  ${pick.v.toFixed(0)}`
            : 'NOTHING WORKS'));
  }
}
