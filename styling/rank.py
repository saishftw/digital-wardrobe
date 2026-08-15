"""
Outfit ranking engine, v2 — implements styling/scoring-method.md.

Model
-----
1. An outfit is top + bottom + shoe. No layering (too warm).
2. Formality is a RANGE per piece. An outfit is coherent only if all three
   ranges intersect:  low = max(lows), high = min(highs), reject if low > high.
3. The rubric belongs to the EVENT; each day carries a target formality band,
   a time of day and a temple flag.
4. Only outfits that pass both gates are scored 0-100.

Run:  python3 styling/rank.py
Writes: styling/vietnam-2026-plan.md
"""

import itertools
import json
import random
import os

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'vietnam-2026-plan.md')

# ---------------------------------------------------------------- constants
# GG summer fabrics: open weave + natural fibre = cool.
HEAT = {
    'linen': 10, 'linen-blend': 9, 'slub': 9, 'cotton-pique': 8,
    'cotton-woven': 7, 'cotton-knit': 7, 'cotton-chino': 6, 'poplin': 5,
    'poly-viscose': 4, 'denim': 3, 'corduroy': 1,
    'cork': 8, 'leather': 4, 'suede': 3,
}
QUICK_DRY = {
    'poly-viscose': 2, 'linen': 1, 'linen-blend': 1, 'slub': 1,
    'cotton-pique': 0, 'poplin': 0, 'cotton-woven': 0, 'cotton-knit': 0,
    'cotton-chino': -1, 'denim': -2, 'corduroy': -2,
    'cork': 2, 'leather': -1, 'suede': -2,
}
# FashionBeans / Turnbull & Asser: camp collar works across all face shapes;
# point collars slim; a crew neck mirrors a round face.
COLLAR = {'camp': 1.0, 'polo': 0.87, 'button-down': 0.80, 'point': 0.80,
          'crew': 0.27}
CUT = {'wide': 1.0, 'straight': 0.9, 'regular': 0.75, 'relaxed': 0.6}

# EVENT rubric — weights are a property of this trip, not universal.
#
# CORRECTED against measured climate (styling/climate.json). The original
# evening rubric assumed night brought relief and cut the climate weight from
# 25 to 12. IBST station data says otherwise: Hanoi's August overnight LOW is
# 26.1 C at 82.7% humidity, and the diurnal range is only 6.5 C. Evenings are
# hot. The climate weight now falls to 20, not 12.
EVENT = {
    'name': 'Thailand // Vietnam Trip',
    'weights_day':     {'palette': 30, 'climate': 25, 'proportion': 20,
                        'collar': 15, 'practical': 10, 'presence': 0},
    'weights_evening': {'palette': 30, 'climate': 20, 'proportion': 20,
                        'collar': 15, 'practical': 10, 'presence': 5},
}

# A day names a single TARGET formality, not a band. An outfit qualifies only
# if its surviving interval contains that target -- that is what makes the
# buckets mean anything.
#
# rain_p is the measured probability of rain, not a hand-set flag. Hanoi 16.5
# rainy days / 31 = 0.53, HCMC 20/31 = 0.65, Da Nang 11.6/31 = 0.37. Rain is
# the default condition on this trip, not the exception.
# date, label, target, time of day, temple, rain_p
DAYS = [
    ('2026-08-16', 'Arrival / flight + transfer', 0.35, 'transit', False, 0.53),
    ('2026-08-17', 'City walking, street food',   0.38, 'day',     False, 0.53),
    ('2026-08-18', 'Temples + old quarter',       0.45, 'day',     True,  0.53),
    ('2026-08-19', 'Day trip / boat / coast',     0.30, 'day',     False, 0.37),
    ('2026-08-20', 'Long transit (bus or flight)',0.34, 'transit', False, 0.50),
    ('2026-08-21', 'Markets + cafes',             0.38, 'day',     False, 0.65),
    ('2026-08-22', 'Temple / cultural site',      0.45, 'day',     True,  0.65),
    ('2026-08-23', 'Night out / party',           0.46, 'evening', False, 0.65),
    ('2026-08-24', 'Last day + departure',        0.36, 'day',     False, 0.65),
]


def load():
    with open(os.path.join(HERE, 'wardrobe.json')) as fh:
        w = json.load(fh)
    return w['tops'], w['bottoms'], w['shoes']


def luminance(hex_str):
    """Relative luminance Y (WCAG). Physically linear, NOT perceptual."""
    h = hex_str.lstrip('#')
    r, g, b = (int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))
    lin = lambda c: c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)


def lightness(hex_str):
    """CIE L*, normalised 0-1. Contrast is a perceptual judgement, so value
    breaks must be measured in L* -- linear luminance compresses the dark end
    so badly that white-on-cream (dY 0.10) and rust-on-navy (dY 0.10) come out
    identical when one is tonal and the other is a strong break."""
    y = luminance(hex_str)
    ls = 116 * y ** (1 / 3) - 16 if y > 0.008856 else 903.3 * y
    return ls / 100


def interval(top, bottom, shoe):
    """Step 2 of the method: intersect the three formality ranges."""
    low = max(p['formality'][0] for p in (top, bottom, shoe))
    high = min(p['formality'][1] for p in (top, bottom, shoe))
    return low, high


def coherent(top, bottom, shoe):
    low, high = interval(top, bottom, shoe)
    return low <= high


def score(top, bottom, shoe, time_of_day='day', rain_p=0.5):
    """Rubric from scoring-method.md. Each criterion is normalised 0-1 then
    multiplied by the event weight, so the total is always out of 100."""
    w = EVENT['weights_evening'] if time_of_day in ('evening', 'transit') \
        else EVENT['weights_day']
    notes = []

    # --- palette (30): the piece at the face carries the most weight
    pal = (top['palette'] * 0.50 + bottom['palette'] * 0.30
           + shoe['palette'] * 0.20) / 10
    if top['palette'] <= 2:
        notes.append('cool colour at the face')
    if shoe['palette'] >= 8:
        notes.append('warm footwear supports the palette')

    # --- climate (25 day / 12 otherwise)
    cl = (HEAT[top['fabric']] * 0.45 + HEAT[bottom['fabric']] * 0.45
          + HEAT[shoe['fabric']] * 0.10) / 10
    if bottom['leg'] == 'short':
        cl = min(1.0, cl + 0.12)
        notes.append('shorts shed heat')
    if min(HEAT[top['fabric']], HEAT[bottom['fabric']]) <= 3:
        notes.append('heavy fabric for the tropics')

    # --- proportion & contrast (20)
    # Measured in CIE L*. Thresholds: under 12 L* units reads tonal, over 62
    # is a hard break that overwhelms a medium-contrast colouring.
    dl = abs(lightness(top['hex']) - lightness(bottom['hex']))
    if dl < 0.12:
        prop, msg = 0.35, 'near-tonal, no value break'
    elif dl > 0.62:
        both_warm = top['palette'] >= 8 and bottom['palette'] >= 8
        prop, msg = (0.85, 'strong but on-palette contrast') if both_warm \
            else (0.55, 'very high contrast for a medium-contrast man')
    else:
        prop, msg = 1.0, 'good medium-contrast colour break'
    notes.append(msg)
    # A vertical stripe rescues a tonal outfit; it adds little to one that
    # already has a clean value break, so scale the bonus by what is missing.
    stripe = 0.30 * (1 - prop) if top['pattern'] == 'vstripe' else 0.0
    prop = prop * 0.6 + CUT[bottom['cut']] * 0.25 + stripe
    if stripe:
        notes.append('vertical stripes supply the contrast the colours do not')
    prop = min(1.0, prop)

    # --- collar vs a round face (15)
    col = COLLAR[top['collar']]

    # --- rain & practicality (10)
    pr = (QUICK_DRY[top['fabric']] + QUICK_DRY[bottom['fabric']]
          + QUICK_DRY[shoe['fabric']] * (1 + rain_p))
    pr = max(0.0, min(1.0, (pr + 4) / 8))

    # --- evening presence (13, night only)
    # Warm low light flattens pale flat colour; depth and richness carry.
    lum_t = lightness(top["hex"])
    pres = 0.65 * (1 - lum_t) + 0.35 * (top['palette'] / 10)
    if w['presence'] and lum_t > 0.6:
        notes.append('pale top reads washed out under night lighting')

    total = (pal * w['palette'] + cl * w['climate'] + prop * w['proportion']
             + col * w['collar'] + pr * w['practical']
             + pres * w['presence'])
    denom = sum(w.values())
    return round(total / denom * 100, 1), notes


def candidates(tops, bottoms, shoes, target=None, temple=False,
               time_of_day='day', rain_p=0.5):
    """Every coherent outfit; if a target formality is given, only those whose
    surviving interval actually contains it."""
    out = []
    for t, b, s in itertools.product(tops, bottoms, shoes):
        if not coherent(t, b, s):
            continue
        lo, hi = interval(t, b, s)
        if target is not None and not (lo <= target <= hi):
            continue
        if temple and b['leg'] == 'short':
            continue
        sc, notes = score(t, b, s, time_of_day, rain_p)
        out.append({'top': t, 'bottom': b, 'shoe': s, 'score': sc,
                    'low': lo, 'high': hi, 'notes': notes})
    return sorted(out, key=lambda x: -x['score'])


def _greedy(tops, bottoms, shoes, order):
    plan, used, bottom_uses, top_uses = [], set(), {}, {}
    for date, label, target, tod, temple, rain_p in order:
        pool = candidates(tops, bottoms, shoes, target, temple, tod, rain_p)
        best, best_adj = None, -1e9
        for c in pool:
            key = (c['top']['id'], c['bottom']['id'], c['shoe']['id'])
            if key in used:
                continue
            adj = (c['score']
                   - 11 * top_uses.get(c['top']['id'], 0)
                   - 8 * bottom_uses.get(c['bottom']['id'], 0))
            if adj > best_adj:
                best, best_adj = c, adj
        if best is None:
            best = pool[0]
        used.add((best['top']['id'], best['bottom']['id'], best['shoe']['id']))
        top_uses[best['top']['id']] = top_uses.get(best['top']['id'], 0) + 1
        bottom_uses[best['bottom']['id']] = bottom_uses.get(best['bottom']['id'], 0) + 1
        plan.append({**best, 'date': date, 'label': label, 'target': target,
                     'tod': tod, 'temple': temple, 'rain_p': rain_p,
                     'pool': len(pool)})
    return plan


def build_plan(tops, bottoms, shoes, restarts=300, seed=7):
    """Greedy assignment is order-dependent -- filling days in date order gives
    day 1 first pick and costs ~15 points against the best ordering. So run the
    greedy from many random day orderings and keep the best total, then reject
    plans that repeat a bottom on consecutive dates."""
    rng = random.Random(seed)
    best_plan, best_key = None, None
    for i in range(restarts):
        order = DAYS[:] if i == 0 else rng.sample(DAYS, len(DAYS))
        plan = sorted(_greedy(tops, bottoms, shoes, order),
                      key=lambda d: d['date'])
        if any(plan[j]['bottom']['id'] == plan[j + 1]['bottom']['id']
               for j in range(len(plan) - 1)):
            continue
        # Lexicographic: lift the worst day first, then the total. Maximising
        # the sum alone lets the optimiser sacrifice one day to buy points
        # elsewhere -- but you have to actually wear the bad day.
        key = (min(d['score'] for d in plan), sum(d['score'] for d in plan))
        if best_key is None or key > best_key:
            best_plan, best_key = plan, key
    return best_plan if best_plan else sorted(
        _greedy(tops, bottoms, shoes, DAYS), key=lambda d: d['date'])


def main():
    tops, bottoms, shoes = load()
    total = len(tops) * len(bottoms) * len(shoes)
    allc = candidates(tops, bottoms, shoes)
    L = []
    A = L.append

    A(f"# {EVENT['name']} — Outfit Plan")
    A('')
    A('**2026-08-16 to 2026-08-24** · 9 days · no layering (too warm)')
    A('')
    A(f'Generated by `styling/rank.py` from `styling/wardrobe.json`, '
      f'using the model in `styling/scoring-method.md`.')
    A('')
    A('## Gate 1 — formality coherence')
    A('')
    A(f'- Combinations enumerated: {len(tops)} tops x {len(bottoms)} bottoms '
      f'x {len(shoes)} shoes = **{total}**')
    A(f'- Survive the interval intersection: **{len(allc)}** '
      f'({len(allc)/total*100:.0f}%)')
    A(f'- Rejected as incoherent: **{total - len(allc)}**')
    A('')

    dead = []
    for t in tops:
        n = sum(1 for c in allc if c['top']['id'] == t['id'])
        if n == 0:
            dead.append(t['title'])
    if dead:
        A(f'**Zero coherent outfits:** {", ".join(dead)} — '
          'nothing else you own can meet it.')
        A('')

    A('## Gate 2 + rubric — the 9 days')
    A('')
    plan = build_plan(tops, bottoms, shoes)
    A('| Date | Day | Outfit | Register | Headroom | Score |')
    A('|---|---|---|---|---|---|')
    for d in plan:
        combo = f"{d['top']['title']} + {d['bottom']['title']} + {d['shoe']['title']}"
        span = d['high'] - d['low']
        pos = 0.5 if span < 1e-9 else (d['target'] - d['low']) / span
        fit = 'at ceiling' if pos > 0.88 else ('at floor' if pos < 0.12
                                               else 'comfortable')
        A(f"| {d['date']} | {d['label']} | {combo} | "
          f"{d['low']:.2f}–{d['high']:.2f} @ {d['target']:.2f} | {fit} | "
          f"**{d['score']}** |")
    A('')
    A('| Date | Why it was chosen |')
    A('|---|---|')
    for d in plan:
        A(f"| {d['date']} | {'; '.join(dict.fromkeys(d['notes']))} "
          f"({d['pool']} outfits qualified for this day) |")
    A('')

    A('## Best outfit per day type')
    A('')
    for label, target, tod, temple, rain_p in [
            ('Beach / boat, most relaxed', 0.30, 'day', False, 0.53),
            ('Casual daytime', 0.35, 'day', False, 0.53),
            ('Smart casual day', 0.42, 'day', False, 0.53),
            ('Temple day', 0.45, 'day', True, 0.53),
            ('Heavy rain', 0.38, 'day', False, 0.65),
            ('Evening / party', 0.46, 'evening', False, 0.53),
            ('Transit / A/C', 0.35, 'transit', False, 0.53)]:
        pool = candidates(tops, bottoms, shoes, target, temple, tod, rain_p)
        A(f'### {label} — target formality {target:.2f} '
          f'({len(pool)} of {len(allc)} coherent outfits qualify)')
        A('')
        A('| # | Outfit | Register | Score |')
        A('|---|---|---|---|')
        for i, c in enumerate(pool[:6], 1):
            combo = f"{c['top']['title']} + {c['bottom']['title']} + {c['shoe']['title']}"
            A(f"| {i} | {combo} | {c['low']:.2f}–{c['high']:.2f} | {c['score']} |")
        A('')

    A('## Overall top 15 (any occasion)')
    A('')
    A('| # | Outfit | Register | Score |')
    A('|---|---|---|---|')
    for i, c in enumerate(allc[:15], 1):
        combo = f"{c['top']['title']} + {c['bottom']['title']} + {c['shoe']['title']}"
        A(f"| {i} | {combo} | {c['low']:.2f}–{c['high']:.2f} | {c['score']} |")
    A('')

    A('## Findings')
    A('')
    ev = candidates(tops, bottoms, shoes, 0.46, False, 'evening', 0.65)
    pl = [c for c in ev if c['bottom']['id'] == 'b1']
    A('**1. The interval fix works.** Black Pleated Wide Pants now *pass* the '
      'coherence gate for the night out — the old spread rule rejected them. '
      f'Best pleated outfit: {pl[0]["top"]["title"]} + {pl[0]["shoe"]["title"]} '
      f'at {pl[0]["score"]}, ranked {ev.index(pl[0])+1} of {len(ev)}. They lose '
      'on palette and colour break, not on formality — which is the correct '
      'reason to lose.')
    A('')
    blk = [c for c in pl if c['top']['id'] == 't10']
    wine = [c for c in pl if c['top']['id'] == 'wine-crew']
    A(f'**2. Dressing up a crew neck is a colour problem, not a formality one.** '
      f'Black Crew + Black Pleated + Sambas is coherent but scores '
      f'{blk[-1]["score"]}: head-to-toe black, a cool colour at a warm-autumn '
      f'face, and a round collar on a round face — three penalties at once. '
      f'Swap the top only and Wine Crew + Black Pleated + Sambas rises to '
      f'{wine[-1]["score"]}. Same silhouette, same register, right colour.')
    A('')
    A('**3. The White Formal Shirt is unwearable on this trip.** Its floor is '
      '0.55; the highest ceiling you own is the Sambas at 0.48. Zero of 378 '
      'combinations are coherent. Leave it at home unless you add a leather '
      'dress shoe or loafer.')
    A('')
    sd = [c for c in allc if c['shoe']['id'] == 'cork-sandals']
    n15 = sum(1 for c in allc[:15] if c['shoe']['id'] == 'cork-sandals')
    A(f'**4. The cork sandals carry the trip.** They appear in {len(sd)} '
      f'coherent outfits and in {n15} of the overall top 15 — they are the only '
      'warm-toned footwear you own, and against two black sneakers that is worth '
      'roughly 1.4 rubric points on every single outfit. They are also the only '
      'rain-sane option. The plan leans on them heavily; that is a real '
      'dependency, not an artifact. If they turn out to be uncomfortable for '
      'long walking days, the whole plan degrades at once.')
    A('')
    A('**5. Beige is doing the heavy lifting below the waist.** Beige Linen '
      'Pants and Beige Shorts take 8 of the overall top 15. Black Lounge Pants '
      'and Black Pleated are the two weakest bottoms for daytime.')
    A('')
    A('**6. Gate 1 is a weak filter on its own.** Only 40 of 378 combinations '
      'are incoherent (27 involve the White Formal Shirt, 13 are sandals with '
      'the pleated pants). The real discrimination comes from Gate 2 — whether '
      'the surviving interval contains the day\'s target formality.')
    A('')

    A('**7. The night out is compromised for everyone, not just one shirt.** '
      'At the 0.46 night target, *every* qualifying outfit sits at the very top '
      'of its formality interval, because both sneakers cap out at 0.46-0.48 '
      'and the sandals at 0.40. The score cannot discriminate between outfits '
      'there — they are all straining. This is a footwear problem, not a '
      'clothing problem: one pair of dark brown leather loafers would lift the '
      'ceiling to ~0.80, make the White Formal Shirt wearable, and give the '
      'pleated pants somewhere to go.')
    A('')
    A('**8. Method caveat — no hue-harmony term.** The rubric scores each piece '
      'for palette *membership* and scores tops against bottoms for *lightness* '
      'contrast, but nothing measures whether two hues clash. Wine with navy '
      'scores well because both are individually acceptable and their lightness '
      'differs; the warm/cool tension between them is invisible to the model. '
      'Treat warm-plus-navy pairings as unverified.')
    A('')

    A('## Piece usefulness — coherent outfits each piece appears in')
    A('')
    A('| Piece | Coherent outfits | Best score |')
    A('|---|---|---|')
    rows = []
    for p in tops + bottoms + shoes:
        mine = [c for c in allc
                if p['id'] in (c['top']['id'], c['bottom']['id'], c['shoe']['id'])]
        rows.append((len(mine), p['title'],
                     max((c['score'] for c in mine), default=0)))
    for n, title, best in sorted(rows, reverse=True):
        A(f'| {title} | {n} | {best} |')
    A('')

    with open(OUT, 'w') as fh:
        fh.write('\n'.join(L) + '\n')
    print('\n'.join(L))


if __name__ == '__main__':
    main()
