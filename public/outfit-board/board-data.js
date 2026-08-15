/* Outfit board data — hand-scored, single pass, August 2026 Vietnam.
 *
 * Scores are LLM judgement, not pipeline output. Climate is weighted heavily:
 * Hanoi 32.6C / 82.7% RH / rain 53% of days; Da Nang 33.9C / 77.4% / 37%;
 * HCMC 31.6C / ~82% / 65%. Source: IBST via Wikipedia (styling/climate.json).
 *
 * Radar metrics are 0-10. Matrix cells are 0-100.
 */
const DATA = {
  climate: {
    month: "August 2026",
    cities: [
      { name: "Hanoi",        high: 32.6, low: 26.1, rh: 82.7, rainPct: 53 },
      { name: "Da Nang",      high: 33.9, low: 25.6, rh: 77.4, rainPct: 37 },
      { name: "Ho Chi Minh",  high: 31.6, low: 23.9, rh: 82.0, rainPct: 65 }
    ],
    note: "Diurnal range is only 6.5–8.3 °C — nights do not cool off. Rain is the baseline condition, not an exception."
  },

  axes: ["Palette", "Breathability", "Quick-dry", "Versatility", "Flattery", "Wrinkle-proof"],

  tops: [
    { id:"t5",  name:"Rustic Button-down",      color:"#993D00", fabric:"cotton woven",  collar:"button-down", m:[10,7,5,9,8,6] },
    { id:"wpo", name:"Wine Polo",               color:"#5E2129", fabric:"cotton pique",  collar:"polo",        m:[9,8,6,9,8,8] },
    { id:"t11", name:"Striped Camp Collar",     color:"#F2F2F2", fabric:"slub open weave",collar:"camp",       m:[6,9,7,9,10,6], stripe:true },
    { id:"wst", name:"White LS / black stripes",color:"#F7F7F7", fabric:"linen blend",   collar:"point",       m:[6,9,7,8,8,5], stripe:true },
    { id:"nst", name:"Navy LS / white stripes", color:"#1B2A4A", fabric:"linen blend",   collar:"point",       m:[4,9,7,7,8,5], stripe:true },
    { id:"t13", name:"Navy Linen (Hamptons)",   color:"#16264A", fabric:"linen",         collar:"point",       m:[4,10,7,7,8,4] },
    { id:"t20", name:"Navy Oversized Shirt",    color:"#1A2748", fabric:"linen blend",   collar:"point",       m:[4,9,7,6,5,4] },
    { id:"t19", name:"Navy Striped (SS)",       color:"#1C2B4D", fabric:"cotton woven",  collar:"point",       m:[4,7,5,6,8,5], stripe:true },
    { id:"rcr", name:"Rust Crew-neck",          color:"#993D00", fabric:"cotton knit",   collar:"crew",        m:[10,7,5,8,4,7] },
    { id:"wcr", name:"Wine Crew-neck",          color:"#5E2129", fabric:"cotton knit",   collar:"crew",        m:[9,7,5,7,4,7] },
    { id:"t2",  name:"White Crew-neck",         color:"#FFFFFF", fabric:"cotton knit",   collar:"crew",        m:[5,7,5,7,4,7] },
    { id:"t10", name:"Black Crew-neck",         color:"#111111", fabric:"cotton knit",   collar:"crew",        m:[2,6,5,5,4,7] },
    { id:"t12", name:"Forest Corduroy",         color:"#013220", fabric:"corduroy",      collar:"point",       m:[8,1,2,3,7,8] },
    { id:"jag", name:"Jager Print Tee (osz)", color:"#FAFAFA", fabric:"cotton knit",   collar:"crew",        m:[5,7,5,5,4,7], print:true },
    { id:"wfm", name:"White Formal Shirt",      color:"#FFFFFF", fabric:"poplin",        collar:"point",       m:[5,5,4,2,7,3] }
  ],

  bottoms: [
    { id:"b2",  name:"Beige Linen Pants",  short:"Bge Linen", color:"#E8DCC0", fabric:"linen",       leg:"long",  m:[8,10,7,9,9,3] },
    { id:"bsh", name:"Beige Shorts",       short:"Bge Shorts",color:"#D6C7AE", fabric:"cotton",      leg:"short", m:[9,9,6,9,7,6] },
    { id:"nsh", name:"Navy Linen Shorts",  short:"Navy Shorts",color:"#16264A",fabric:"linen",       leg:"short", m:[4,10,7,8,7,4] },
    { id:"b5",  name:"Camel Chinos",       short:"Camel",     color:"#A96800", fabric:"cotton chino",leg:"long",  m:[10,6,4,8,8,6] },
    { id:"bch", name:"Dark Brown Chinos",  short:"Dk Brown",  color:"#4A3020", fabric:"cotton chino",leg:"long",  m:[10,6,4,8,8,6] },
    { id:"blsh",name:"Black Shorts",       short:"Blk Shorts",color:"#141414", fabric:"cotton",      leg:"short", m:[2,9,6,7,7,6] },
    { id:"b3",  name:"Light-blue Denim",   short:"Denim",     color:"#A8C6DE", fabric:"denim",       leg:"long",  m:[5,3,2,6,8,8] },
    { id:"blp", name:"Black Lounge Pants", short:"Lounge",    color:"#141414", fabric:"cotton knit", leg:"long",  m:[2,7,5,4,4,6] },
    { id:"b1",  name:"Black Pleated Wide", short:"Pleated",   color:"#111111", fabric:"poly-viscose",leg:"long",  m:[2,4,8,5,9,8] }
  ],

  shoes: [
    { id:"snd", name:"Cork Sandals (olive)", color:"#8A8B5C", fabric:"cork",    m:[9,10,9,8,6,10] },
    { id:"onz", name:"Onitsuka Mexico 66",   color:"#1A1A1A", fabric:"leather", m:[3,5,3,8,7,9] },
    { id:"smb", name:"Adidas Sambas",        color:"#1A1A1A", fabric:"suede",   m:[2,4,1,7,7,8] }
  ],

  /* tops x bottoms, 0-100. Order of values matches `bottoms` array. */
  matrix: {
    t5:  [89,87,78,74,79,70,68,58,84],
    wpo: [88,86,70,82,74,71,74,60,72],
    t11: [84,86,84,80,79,78,76,62,76],
    wst: [80,82,81,78,77,76,74,60,75],
    nst: [79,78,64,78,74,62,66,56,70],
    t13: [78,79,63,76,72,62,65,56,66],
    t20: [74,75,60,72,69,60,63,54,64],
    t19: [74,74,60,73,70,59,63,53,65],
    rcr: [77,78,74,66,72,68,72,56,62],
    wcr: [75,76,68,72,64,66,72,55,64],
    t2:  [64,68,70,68,66,66,74,52,63],
    t10: [58,58,52,60,54,42,66,38,48],
    t12: [46,44,42,44,40,38,32,34,40],
    jag: [60,70,72,64,62,70,76,54,56],
    wfm: [62,48,46,64,60,44,56,36,58]
  },

  /* bottoms x shoes, 0-100. Order matches `shoes`. */
  shoeMatrix: {
    b2:  [90,76,72],
    bsh: [92,78,74],
    nsh: [90,80,76],
    b5:  [84,78,74],
    bch: [86,76,72],
    blsh:[78,80,78],
    b3:  [76,82,80],
    blp: [74,72,70],
    b1:  [66,78,80]
  },

  /* Per-cell qualitative notes for the standouts and the traps. */
  notes: {
    "t5|b2":"Flagship. Rust on cream is the textbook warm-autumn pairing, and both pieces breathe. Nothing here beats it.",
    "t5|nsh":"Warm rust against cool navy is a tension the eye notices. Works, but it is the weakest link in an otherwise strong row.",
    "t11|bsh":"Camp collar is the single best neckline for a round face; slub weave is the best hot-weather fabric you own.",
    "t11|b1":"The black stripes tie into the black trouser — this is your sharpest night look without a real dress shoe.",
    "wpo|b2":"Wine and cream reads expensive. Pique holds shape in humidity better than a knit tee.",
    "wpo|nsh":"Wine and navy are both deep and both cool-leaning. Muddy. Score flatters it.",
    "t2|b3":"Your proven pair. Classic, and the denim's flare balances a tall frame — but denim is the hottest bottom you own.",
    "t10|b3":"The one place black crew earns its keep. Anywhere else it fights your colouring.",
    "t10|blsh":"Head-to-toe black at 33 °C in direct sun. Both a heat problem and a colour problem.",
    "t12|b3":"Corduroy plus denim in 82% humidity. This is the worst outfit available to you.",
    "wfm|bsh":"A stiff poplin dress shirt above bare knees is a register clash, not a look.",
    "rcr|b5":"Rust on camel — same hue family, almost the same lightness. Reads as a single flat block."
  },

  days: [
    { date:"16 Aug", label:"Arrival + transfer",     type:"transit", temple:false, rain:53 },
    { date:"17 Aug", label:"City walking, street food",type:"day",   temple:false, rain:53 },
    { date:"18 Aug", label:"Temples + old quarter",   type:"day",    temple:true,  rain:53 },
    { date:"19 Aug", label:"Day trip / boat / coast", type:"day",    temple:false, rain:37 },
    { date:"20 Aug", label:"Long transit",            type:"transit",temple:false, rain:50 },
    { date:"21 Aug", label:"Markets + cafes",         type:"day",    temple:false, rain:65 },
    { date:"22 Aug", label:"Temple / cultural site",  type:"day",    temple:true,  rain:65 },
    { date:"23 Aug", label:"Night out",               type:"night",  temple:false, rain:65 },
    { date:"24 Aug", label:"Last day + departure",    type:"day",    temple:false, rain:65 }
  ]
};
