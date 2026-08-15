# Styling framework

Turns published styling frameworks into a reproducible scoring function, so
outfit decisions can be argued with rather than taken on faith.

## Where things live

| Path | What it is |
|---|---|
| `public/outfit-board/index.html` | The interactive board. In `public/` so Vercel serves it at **`/outfit-board/`** |
| `public/outfit-board/board-data.js` | Hand-judged scores (14 tops × 9 bottoms, 9 bottoms × 3 shoes) |
| `public/outfit-board/grades.json` | Your pick/veto verdicts + packing state |
| `styling/serve.js` | Local server: `node styling/serve.js` → http://127.0.0.1:8899/ — the only mode that can **write** `grades.json` |
| `styling/rank.py` | The computed scoring engine (interval gate + event rubric) |
| `styling/scoring-method.md` | How a score is derived, plus the audit log |

`rank.py` (computed) and `board-data.js` (hand-judged) are two deliberately
independent estimates of the same thing. Where they disagree, that is signal.

**Grading round-trip:** locally, every click autosaves into `grades.json`.
On Vercel the filesystem is read-only, so the hosted board keeps grades in
`localStorage` and the **Copy grades** button is how they get back into the repo.
The board only adopts `grades.json` when its `saved` timestamp is newer than the
device's, so a phone reload never silently discards phone grading.

Sections below describe the original v1 framework; some of it predates the
formality-interval model and the `framework.py` it mentions has been replaced
by `rank.py`.

```
styling/
  framework.py            # piece attributes + the 0-100 scoring function
  vietnam_plan.py         # trip planner: enumerate, assign days, rank purchases
  vietnam-2026-plan.md    # generated output
```

Run it:

```bash
cd styling && python3 vietnam_plan.py
```

No dependencies beyond the standard library. It reads
`backup/wardrobe-backup-2026-08-13.json` and never writes to it.

## Profile being scored against

Taken from `src/storageService.ts` → `DEFAULT_USER_PROFILE`, confirmed by the
wearer. The app only ever persists the profile to `localStorage`, so it is not
present in the exported backup.

| Trait | Value |
|---|---|
| Undertone / season | Warm · True-Warm **Autumn** |
| Contrast | Medium |
| Face | Round, soft / curved jawline, average neck |
| Height | 181 cm — tall |
| Body | Rectangle, midsection carry, square / broad shoulders |
| Aesthetic | Smart Casual, Minimalist, Old Money |

## Scoring inputs

An outfit is `(top, bottom, optional open overshirt)` scored 0–100 in a
`context`:

- **`hot`** — 30–34 °C, high humidity, outdoors. Breathability is weighted 2.8×.
- **`ac`** — flights, sleeper buses, restaurants, highland evenings.
  Breathability drops to 0.9×, which is what lets corduroy and denim earn a place.

| Component | Rule | Source |
|---|---|---|
| Breathability | "An open weave is paramount… natural materials are best. Synthetic materials rarely offer cooling properties." Linen > cotton > poplin > poly > denim > corduroy. | [Gentleman's Gazette — summer fabrics](https://www.gentlemansgazette.com/summer-fabrics-guide/) |
| Linen in humidity | Linen has a "high moisture absorbency rate, making it the ideal summer fabric for hot and humid climates". | [FashionBeans — linen guide](https://www.fashionbeans.com/article/expert-linen-guide/) |
| Autumn palette | "Your everyday neutrals are warm brown, camel, rust, olive and dark chocolate — not grey, not navy, not black." | [Color Allure](https://www.colorallure.com/alternatives-to-black.html), [seasonalcoloranalysis.net](https://seasonalcoloranalysis.net/autumn-color-season/) |
| Black penalty ladder | "The farther away [black] is [from the face], the less effect it will have." Black bottom −4, black at the face −12, head-to-toe black −20. | [Color Allure — alternatives to black](https://www.colorallure.com/alternatives-to-black.html) |
| Contrast | A medium-contrast man wants a moderate value break between top and bottom — neither tonal nor stark. Exempted when both garments are on-palette (rust + cream is textbook Autumn). | [Gentleman's Gazette — colour wheel](https://www.gentlemansgazette.com/how-to-use-the-color-wheel-to-assemble-superior-outfits/) |
| Collar vs round face | Camp collar "sits on the chest rather than around the neck, so it works across the board"; forward point "has a slimming visual effect". A crew neck mirrors the circle of a round face. | [FashionBeans — collar types](https://www.fashionbeans.com/article/shirt-collar-types/) (Steven Quin, Turnbull & Asser) |
| Midsection | "You could verticalise your look… by trying pleated pants." An open overshirt over a tee does the same job with two vertical edges. | [Gentleman's Gazette — body type](https://www.gentlemansgazette.com/modern-style-body-type/) |
| Tall men | "Avoid Skinny Fits" and "avoid wearing one colour head-to-toe". Straight, flared and wide legs add balancing sideways heft. | [FashionBeans — tall men](https://www.fashionbeans.com/article/tall-mens-clothing-tips/) |
| Temples | Shoulders and knees covered; shoes removed at the entrance. Shorts fail this. | [TripAdvisor — Bangkok customs](https://www.tripadvisor.com/Tourism-g293916-Bangkok-Vacations.html) |
| Capsule maths | Outfits = tops × bottoms, multiplied by each layering state. | [The Modest Man](https://www.themodestman.com/minimal-essential-wardrobe/) |

Two further inputs are local to this wardrobe rather than published rules:

- **Quick-dry weighting** for August monsoon in both countries — poly-viscose and
  nylon gain, denim and corduroy lose.
- **Wearer-proven pairings** (`PROVEN_PAIRS`) override the generic rules. The
  light-blue denim is a straight-fit H&M with a flared hem that the wearer
  reports works with the black and white crew necks, so those pairings get a
  bonus the colour rules alone would not give them.

## Fabric provenance

Most fabrics were confirmed directly by the wearer. One was verified externally:
`b1` "Black Pleated Pants" is the Uniqlo **Pleated Wide Pants** (E462197-000),
**67% polyester / 29% viscose / 4% elastane** — not cotton. That matters twice:
it scores poorly on breathability but is the best quick-drying bottom packed.

## Caveats

- Hex values for the Autumn palette are approximations; no authoritative
  published swatch table with hex codes was retrievable.
- The 60-30-10 proportion rule and the "French tuck" are widely repeated
  conventions rather than sourced rules, so neither is encoded in the score.
- Weights (2.8× heat, 1.8× palette, 1.1× collar) are calibrated judgement, not
  published constants. Change them in `framework.py` and re-run.
