# শিশুর খাবার — Baby Food (Bangladesh + Italy)

A Bangla-language recipe site of age-appropriate meals for a two-year-old, covering both
Bangladeshi and Italian food cultures. Every recipe lists ingredients, steps, nutritional
benefits (উপকারিতা) and reactions to watch for (সতর্কতা).

Plain HTML/CSS/JS — no build step, no dependencies. Deploys as static files.

## Contents

- **৫৮টি রেসিপি** across five meal times: সকালের নাস্তা (১২), দুপুরের খাবার (১৬),
  বিকেলের নাস্তা (১২), রাতের খাবার (১১), ঘুমানোর আগে (৭)
- **দুটি সাপ্তাহিক তালিকা** — one for Bangladesh, one for Italy (7 days × 5 meals).
  The Bangladesh week deliberately includes লাল শাক twice and কলিজা once; the Italy week
  pairs legumes with grains — both target iron, the main deficiency risk at this age.
- **২৮টি ফল ও সবজি** with preparation notes, benefits and cautions
- **নির্দেশিকা** — salt, sugar, portions, milk, choking hazards, allergens

## Country setting

Bangladeshi and Italian recipes are never shown together — the ⚙️ button in the header
picks one country, and everything on the site follows it: category counts, the recipe
listing, the fruit and vegetable guide, related recipes, and which weekly meal plan is
displayed.

- Default is **বাংলাদেশি**.
- The choice is saved to `localStorage` under `shishur-khabar-desh`, so it persists across
  visits on that browser. If storage is unavailable (private mode), it falls back to the
  default rather than erroring.
- Recipes marked `cuisine: 'both'` (দুই দেশেই) appear under **either** setting — they are
  dishes that work in both countries, so they aren't part of the confusing mix.
- Opening a direct link to a recipe from the other country still shows it, with a note
  explaining the mismatch rather than hiding the page.

## The সুস্থতা যাচাই (health) tab

Four tools for answering "is he getting what he needs?", built deliberately around
**variety over a week** rather than nutrient counting. Every authority checked (NHS, AAP,
WHO) advises parents *not* to fixate on daily amounts — NHS: "Do not worry about what your
child eats in a day… It's more helpful to think about what they eat over a week." A
percentage-of-RDA dashboard would have been building the opposite of expert advice.

- **এই সপ্তাহে** — tap which of the 7 WHO food groups he ate; shows which group is missing
  over a rolling 7 days and links to matching recipes. No scores, no failure state.
- **বৃদ্ধি** — weight/height plotted on real WHO centile bands for boys 24–60 months.
  Deliberately low-frequency: NHS says no more than once every 3 months after age one.
- **ভিটামিন ডি** — country- and month-aware. The four authorities disagree on the dose
  (NHS 400 IU vs AAP/EFSA 600 IU), so they are listed separately rather than averaged.
- **ঠিক পথে আছি তো?** — reassuring signs, warning signs, and what not to do.

All tracking data is `localStorage` only (`shishur-khabar-variety`, `-growth`, `-dob`) —
nothing leaves the browser. Growth data source: WHO `tab_wfa_boys_p_0_5.xlsx` and
`tab_lhfa_boys_p_2_5.xlsx`, verified by recomputing all 370 percentiles from the published
LMS parameters. Note WHO's 0.7 cm length→height discontinuity at 24 months: do not extend
this chart below 24 months by prepending the length table.

## Printing a recipe

The 🖨 button on a recipe page prints **only that recipe**, on **one A4 page**. Related
recipes, the country-mismatch notice, navigation and footer are all excluded.

Print layout: image + title + badges across the top, then a 2×2 grid of
উপকরণ | প্রস্তুত প্রণালী over উপকারিতা | সতর্কতা, then a one-line footer carrying the
category, cuisine, time, portion and the medical disclaimer.

**One-page fit is measured, not assumed.** A harness renders every recipe at A4 content
width (186mm) with the print stylesheet applied and measures height against the 275mm
budget. Current numbers: all 58 fit; the tallest (`mach-jhol-bhat`) fills 84%, the shortest
59%. Body text is 12pt — deliberately large, because the leftover headroom is worth more as
legibility at arm's length in a kitchen than as blank paper.

If you add a much longer recipe, `PRINT_DENSE_ABOVE` in [js/app.js](js/app.js) drops it to a
10pt layout automatically. Measured limits: normal 12pt overflows above ~1590 characters
(counting intro + ingredients + steps + benefits + warnings), the 10pt fallback holds to
~2580. Beyond that it will spill to a second page — no stylesheet can fix that, the recipe
would need splitting.

## Structure

```
index.html        home — categories, featured recipes, key guidelines
recipes.html      listing, filtered by ?category= plus meal/cuisine chips and search
recipe.html       detail view, ?id=<recipe-id>
meal-plan.html    the two weekly plans
foods.html        fruits and vegetables guide
guide.html        full feeding guidelines
css/style.css     single stylesheet (light + dark, responsive, print styles)
js/data.js        ALL content lives here
js/app.js         rendering for every page
images/           one SVG per dish + category icons
```

## Adding a recipe

Add one object to the `RECIPES` array in `js/data.js`:

```js
{
  id: 'notun-recipe',          // must be unique; also the image filename
  title: 'নতুন রেসিপি',
  category: 'lunch',           // breakfast | lunch | snack | dinner | evening
  cuisine: 'bd',               // bd | it | both
  time: '২০ মিনিট',
  portion: '১ ছোট বাটি',
  intro: 'এক লাইনের পরিচিতি।',
  ingredients: ['...'],
  steps: ['...'],
  benefits: ['...'],
  warnings: ['...']
}
```

Then drop `images/notun-recipe.svg` in place. Nothing else needs editing — the home page,
listing, filters and search all pick it up automatically.

## Using your own photos

The illustrations are placeholders. To use a real photo of a dish, put the file in
`images/` and add a `photo` field to that recipe:

```js
photo: 'images/notun-recipe.jpg'
```

The SVG stays as the fallback for every recipe that doesn't have one yet.

## Running locally

```
node .claude/serve.js      # http://localhost:8811
```

Opening `index.html` directly from the filesystem also works — there is no `fetch()` anywhere.

## Checking the data

`node check.js` validates that every recipe has all required fields, that every meal-plan
reference resolves to a real recipe, and that no image is missing. Run it after editing
`js/data.js`.

---

**দ্রষ্টব্য:** এই ওয়েবসাইটের তথ্য সাধারণ নির্দেশনার জন্য, কোনো চিকিৎসা পরামর্শ নয়।
শিশুর খাদ্যতালিকা বা অ্যালার্জি নিয়ে সবসময় শিশু বিশেষজ্ঞের পরামর্শ নিন।
