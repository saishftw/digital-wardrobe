#!/usr/bin/env node
/* Evaluate a FIXED kit (rather than searching for one) and run ablations.
   Used to test the wearer's own proposed kit against the optimiser's.

   node styling/testkit.js                 -> compare proposed vs optimiser
   node styling/testkit.js ablate <washes> -> per-item contribution
*/
import { SLOTS, plan, NAME, byId, GR, B } from './pack.js';

/* The wearer prefers long trousers on flight days. Aug 17 is the inbound
   flight, 20d/22d/24d are the internal + outbound flights. */
const TRAVEL = ['17n','20d','22d','24d'];
export function setTravelLong(on) {
  for (const s of SLOTS) if (TRAVEL.includes(s.id)) s.long = on;
}

const KITS = {
  proposed: {
    tops: ['wpo','t11','wst','nst','t13','t19','t2','t10','t12'],
    bots: ['b2','b5','b1','bsh','nsh','blsh'],
    shoes:['snd','smb'],
  },
  optimiser: {
    tops: ['t13','wpo','t19','wst','t2','t5','nst','t11'],
    bots: ['b2','bsh','nsh','b5'],
    shoes:['snd','onz'],
  },
};

const show = (title, kit, washes) => {
  const p = plan(kit, washes);
  const n = kit.tops.length + kit.bots.length + kit.shoes.length;
  console.log(`\n=== ${title}  (${n} items, laundry ${washes}) ===`);
  console.log(`  covered ${p.covered}/14   total ${p.total.toFixed(0)}   worst ${p.worst.toFixed(0)}`);
  for (const { slot, pick } of p.rows) {
    const tag = [slot.long?'long':'', slot.water?'water':''].filter(Boolean).join(',');
    console.log(`  ${slot.day} ${slot.id.padEnd(4)} ${tag.padEnd(11)} ` +
      (pick ? `${NAME(pick.t)} + ${NAME(pick.b)} + ${NAME(pick.s)}`.padEnd(62) + pick.v.toFixed(0)
            : '*** NOTHING WORKS ***'));
  }
  return p;
};

const args = process.argv.slice(2);
const washes = Number(args[1] ?? 6);

if (args[0] === 'ablate') {
  /* remove one item at a time from the proposed kit; report the damage */
  setTravelLong(true);
  const base = plan(KITS.proposed, washes);
  console.log(`# proposed kit, travel days long: ${base.covered}/14  total ${base.total.toFixed(0)}\n`);
  console.log('dropped item              covered   total   delta   worst');
  const rows = [];
  for (const key of ['tops','bots','shoes']) {
    for (const id of KITS.proposed[key]) {
      const nk = { ...KITS.proposed, [key]: KITS.proposed[key].filter(x=>x!==id) };
      const p = plan(nk, washes);
      rows.push({ id, covered:p.covered, total:p.total, d:p.total-base.total, worst:p.worst });
    }
  }
  rows.sort((a,b)=>a.d-b.d);
  for (const r of rows)
    console.log(`  ${NAME(r.id).padEnd(24)} ${String(r.covered).padStart(2)}/14  ` +
      `${r.total.toFixed(0).padStart(6)}  ${r.d.toFixed(0).padStart(6)}  ${r.worst.toFixed(0).padStart(6)}`);
} else if (args[0] === 'grades') {
  /* what does the wearer's own grading say about each bottom? */
  for (const b of B) {
    const picks=[], vetoes=[];
    for (const [k,v] of Object.entries(GR)) {
      if (!k.includes('|')) continue;
      const [t,bb] = k.split('|'); if (bb !== b.id) continue;
      (v==='pick'?picks:v==='veto'?vetoes:[]).push(NAME(t));
    }
    console.log(`${b.name.padEnd(20)} +${String(picks.length).padStart(2)} -${String(vetoes.length).padStart(2)}   ` +
      `picks: ${picks.join(', ') || '-'}   vetoes: ${vetoes.join(', ') || '-'}`);
  }
} else {
  setTravelLong(false);
  show('proposed kit, shorts allowed on flights', KITS.proposed, washes);
  setTravelLong(true);
  show('proposed kit, LONG on flights', KITS.proposed, washes);
  show('optimiser kit, LONG on flights', KITS.optimiser, washes);
}
