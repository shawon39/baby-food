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
