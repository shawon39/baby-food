/* ============================================================
   শিশুর খাবার — রেন্ডারিং লজিক
   প্রতিটি পেজ <body data-page="..."> দিয়ে নিজেকে চিহ্নিত করে।
   ============================================================ */

/* ---------- সহায়ক ---------- */
const qs = (k) => new URLSearchParams(location.search).get(k);
const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* সংখ্যা বাংলা অঙ্কে দেখানোর জন্য — বাকি সাইটের সাথে মিল রাখতে */
const bn = (n) => String(n).replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[d]);

/* ---------- দেশের পছন্দ (ব্রাউজারে সংরক্ষিত থাকে) ----------
   বাংলাদেশি ও ইতালিয়ান রেসিপি একসাথে না দেখিয়ে একবারে একটি দেশ দেখানো হয়।
   'both' চিহ্নিত রেসিপি দুই অবস্থাতেই দেখানো হয়, কারণ সেগুলো দুই দেশেই চলে। */
const PREF_KEY = 'shishur-khabar-desh';
const DEFAULT_PREF = 'bd';

function getPref() {
  try {
    const v = localStorage.getItem(PREF_KEY);
    return (v === 'bd' || v === 'it') ? v : DEFAULT_PREF;
  } catch (e) {
    return DEFAULT_PREF;   // প্রাইভেট মোডে localStorage বন্ধ থাকতে পারে
  }
}
function setPref(v) {
  try { localStorage.setItem(PREF_KEY, v); } catch (e) { /* সংরক্ষণ করা গেল না, তবু চলবে */ }
}

/* পছন্দ অনুযায়ী ফিল্টার */
const matchesPref = (c) => c === 'both' || c === getPref();
const visibleRecipes = (list = RECIPES) => list.filter(r => matchesPref(r.cuisine));
const visibleInCategory = (id) => visibleRecipes(recipesInCategory(id));
const visibleFoods = () => FOODS.filter(f => matchesPref(f.where));

/* ছবি: রেসিপিতে photo দেওয়া থাকলে সেটি, নয়তো আঁকা ছবি।
   নিজের তোলা ছবি ব্যবহার করতে data.js-এ ঐ রেসিপিতে যোগ করুন:
   photo: 'images/khichuri.jpg'                                   */
const imgFor = (r) => r.photo || `images/${r.id}.svg`;

const NAV = [
  { href: 'index.html',     label: 'হোম',            page: 'home' },
  { href: 'recipes.html',   label: 'সব রেসিপি',      page: 'recipes' },
  { href: 'meal-plan.html', label: 'সাপ্তাহিক তালিকা', page: 'plan' },
  { href: 'foods.html',     label: 'ফল ও সবজি',      page: 'foods' },
  { href: 'guide.html',     label: 'নির্দেশিকা',     page: 'guide' }
];

/* ---------- শেয়ার্ড হেডার ও ফুটার ---------- */
let rerenderPage = () => {};   // দেশ বদলালে চলতি পেজ আবার আঁকার জন্য

function renderChrome(page) {
  const pref = getPref();
  const cur = getCuisine(pref);

  document.body.prepend(el(`
    <header class="site-header">
      <div class="wrap">
        <a class="logo" href="index.html">
          <span class="logo-mark">🍲</span>
          <span>শিশুর খাবার</span>
        </a>
        <nav class="nav">
          ${NAV.map(n => `<a href="${n.href}" class="${n.page === page ? 'active' : ''}">${n.label}</a>`).join('')}
        </nav>
        <div class="settings">
          <button class="settings-btn" id="settings-btn" aria-haspopup="dialog" aria-expanded="false"
                  aria-label="সেটিংস — কোন দেশের রেসিপি দেখবেন">
            <span class="gear" aria-hidden="true">⚙️</span>
            <span class="settings-flag">${cur.flag}</span>
          </button>
          <div class="settings-panel" id="settings-panel" role="dialog" aria-label="সেটিংস" hidden>
            <h4>কোন দেশের রেসিপি দেখবেন?</h4>
            ${['bd', 'it'].map(id => {
              const c = getCuisine(id);
              return `<label class="settings-opt">
                        <input type="radio" name="desh" value="${id}" ${id === pref ? 'checked' : ''}>
                        <span>${c.flag} ${c.name}</span>
                      </label>`;
            }).join('')}
            <p class="settings-note">দুই দেশেই চলে এমন রেসিপি সবসময় দেখানো হয়। আপনার পছন্দ এই ব্রাউজারে সংরক্ষিত থাকবে।</p>
          </div>
        </div>
      </div>
    </header>`));

  const btn   = document.querySelector('#settings-btn');
  const panel = document.querySelector('#settings-panel');

  const close = () => { panel.hidden = true; btn.setAttribute('aria-expanded', 'false'); };
  const open  = () => { panel.hidden = false; btn.setAttribute('aria-expanded', 'true'); };

  btn.onclick = (e) => { e.stopPropagation(); panel.hidden ? open() : close(); };
  panel.onclick = (e) => e.stopPropagation();
  document.addEventListener('click', close);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

  panel.querySelectorAll('input[name="desh"]').forEach(input => {
    input.onchange = () => {
      setPref(input.value);
      document.querySelector('.settings-flag').textContent = getCuisine(input.value).flag;
      close();
      rerenderPage();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
  });

  document.body.append(el(`
    <footer class="site-footer">
      <div class="wrap">
        <p><strong>দ্রষ্টব্য:</strong> এই ওয়েবসাইটের তথ্য সাধারণ নির্দেশনার জন্য, কোনো চিকিৎসা পরামর্শ নয়।
           আপনার শিশুর খাদ্যতালিকা, অ্যালার্জি বা কোনো শারীরিক সমস্যা নিয়ে সবসময় শিশু বিশেষজ্ঞের পরামর্শ নিন।</p>
        <p>নতুন খাবার একবারে একটি করে দিন এবং ৩ দিন অপেক্ষা করে প্রতিক্রিয়া লক্ষ করুন।
           শ্বাসকষ্ট বা মুখ-ঠোঁট ফুলে গেলে দ্রুত জরুরি চিকিৎসা নিন।</p>
        <p class="muted">২ বছর বয়সী শিশুর জন্য — বাংলাদেশ ও ইতালি</p>
      </div>
    </footer>`));
}

/* ---------- রেসিপি কার্ড ---------- */
function recipeCard(r) {
  const cat = getCategory(r.category);
  const cui = getCuisine(r.cuisine);
  return `
    <a class="card" href="recipe.html?id=${r.id}">
      <div class="card-img"><img src="${imgFor(r)}" alt="${esc(r.title)}" loading="lazy"></div>
      <div class="card-body">
        <h3>${esc(r.title)}</h3>
        <p>${esc(r.intro)}</p>
        <div class="card-meta">
          <span class="tag tag-brand">${cui.flag} ${cui.name}</span>
          <span class="tag">${cat.name}</span>
          <span class="tag">⏱ ${r.time}</span>
        </div>
      </div>
    </a>`;
}

/* ============================================================
   হোম পেজ
   ============================================================ */
function renderHome() {
  document.querySelector('#categories').innerHTML = CATEGORIES.map(c => `
    <a class="card cat-card" href="recipes.html?category=${c.id}">
      <img src="images/cat-${c.id}.svg" alt="">
      <h3>${c.name}</h3>
      <div class="time">${c.time}</div>
      <p>${c.desc}</p>
      <div class="count">${bn(visibleInCategory(c.id).length)}টি রেসিপি</div>
    </a>`).join('');

  // প্রতিটি ক্যাটাগরি থেকে একটি করে — মোট ৫টি
  const featured = CATEGORIES.map(c => visibleInCategory(c.id)[0]).filter(Boolean);
  document.querySelector('#featured').innerHTML = featured.map(recipeCard).join('');

  document.querySelector('#guidelines').innerHTML = GUIDELINES.slice(0, 4).map(g => `
    <div class="card" style="padding:20px 22px">
      <h3>${g.title}</h3>
      <p style="margin:0">${g.text}</p>
    </div>`).join('');
}

/* ============================================================
   রেসিপির তালিকা
   ============================================================ */
function renderRecipes() {
  const state = { category: qs('category') || 'all', q: '' };

  const catBar  = document.querySelector('#cat-filters');
  const list    = document.querySelector('#list');
  const heading = document.querySelector('#list-heading');
  const search  = document.querySelector('#search');

  catBar.innerHTML =
    `<button class="chip" data-cat="all">সব</button>` +
    CATEGORIES.map(c => `<button class="chip" data-cat="${c.id}">${c.name}</button>`).join('');

  function draw() {
    catBar.querySelectorAll('[data-cat]').forEach(b => b.classList.toggle('on', b.dataset.cat === state.category));

    const q = state.q.trim();
    const found = visibleRecipes().filter(r =>
      (state.category === 'all' || r.category === state.category) &&
      (!q || r.title.includes(q) || r.intro.includes(q) || r.ingredients.some(i => i.includes(q)))
    );

    const cat = state.category === 'all' ? null : getCategory(state.category);
    heading.textContent = cat ? `${cat.name} — ${bn(found.length)}টি রেসিপি` : `সব রেসিপি — ${bn(found.length)}টি`;

    list.innerHTML = found.length
      ? found.map(recipeCard).join('')
      : `<div class="empty"><p>এই খোঁজে কোনো রেসিপি পাওয়া যায়নি।</p>
         <button class="btn btn-ghost" id="reset">সব রেসিপি দেখুন</button></div>`;

    const reset = document.querySelector('#reset');
    if (reset) reset.onclick = () => {
      state.category = 'all'; state.q = ''; search.value = ''; draw();
    };
  }

  catBar.onclick = e => { const b = e.target.closest('[data-cat]'); if (b) { state.category = b.dataset.cat; draw(); } };
  search.oninput = e => { state.q = e.target.value; draw(); };

  draw();
  return draw;   // দেশ বদলালে আবার আঁকা হবে
}

/* ============================================================
   রেসিপির বিস্তারিত
   ============================================================ */
function renderRecipe() {
  const root = document.querySelector('#recipe');
  const r = getRecipe(qs('id'));

  if (!r) {
    document.title = 'রেসিপি পাওয়া যায়নি — শিশুর খাবার';
    root.innerHTML = `
      <div class="empty">
        <h1>রেসিপিটি খুঁজে পাওয়া যায়নি</h1>
        <p>লিংকটি হয়তো ভুল, অথবা রেসিপিটি সরিয়ে ফেলা হয়েছে।</p>
        <a class="btn" href="recipes.html">সব রেসিপি দেখুন</a>
      </div>`;
    return;
  }

  const cat = getCategory(r.category);
  const cui = getCuisine(r.cuisine);
  document.title = `${r.title} — শিশুর খাবার`;

  root.innerHTML = `
    <a class="backlink" href="recipes.html?category=${r.category}">← ${cat.name}-এর সব রেসিপি</a>

    <div class="recipe-head">
      <img src="${imgFor(r)}" alt="${esc(r.title)}">
      <div>
        <h1>${esc(r.title)}</h1>
        <p class="muted">${esc(r.intro)}</p>
        <div class="badges">
          <span class="tag tag-brand">${cui.flag} ${cui.name}</span>
          <span class="tag">${cat.name} · ${cat.time}</span>
          <span class="tag">⏱ ${r.time}</span>
          <span class="tag">🍽 ${r.portion}</span>
        </div>
        <button class="btn btn-ghost no-print" onclick="window.print()">🖨 রেসিপিটি ছাপুন</button>
      </div>
    </div>

    <div class="two-col" style="margin-top:32px">
      <div class="panel">
        <h2>🥣 উপকরণ</h2>
        <ul>${r.ingredients.map(i => `<li>${esc(i)}</li>`).join('')}</ul>
      </div>
      <div class="panel">
        <h2>👩‍🍳 প্রস্তুত প্রণালী</h2>
        <ol>${r.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol>
      </div>
    </div>

    <div class="panel panel-good">
      <h2>💚 উপকারিতা</h2>
      <ul>${r.benefits.map(b => `<li>${esc(b)}</li>`).join('')}</ul>
    </div>

    <div class="panel panel-warn">
      <h2>⚠️ সতর্কতা ও সম্ভাব্য প্রতিক্রিয়া</h2>
      <ul>${r.warnings.map(w => `<li>${esc(w)}</li>`).join('')}</ul>
    </div>

    ${matchesPref(r.cuisine) ? '' : `
      <div class="notice" style="margin-top:26px">
        এই রেসিপিটি <strong>${cui.flag} ${cui.name}</strong> রান্নার,
        আর আপনি এখন <strong>${getCuisine(getPref()).name}</strong> রেসিপি দেখছেন।
        উপরের ⚙️ সেটিংস থেকে দেশ বদলে নিতে পারেন।
      </div>`}

    <h2 style="margin-top:38px">একই বেলার অন্যান্য রেসিপি</h2>
    <div class="grid grid-card">
      ${visibleInCategory(r.category).filter(x => x.id !== r.id).slice(0, 4).map(recipeCard).join('')}
    </div>`;
}

/* ============================================================
   সাপ্তাহিক তালিকা
   ============================================================ */
function renderPlan() {
  const out = document.querySelector('#plan-out');

  const cell = (id) => {
    const r = getRecipe(id);
    return r ? `<a href="recipe.html?id=${r.id}">${esc(r.title)}</a>` : '—';
  };

  function draw() {
    const pref = getPref();
    const plan = MEAL_PLANS.find(p => p.id === pref) || MEAL_PLANS[0];

    out.innerHTML = `
      <h2>${esc(plan.name)}</h2>
      <p class="muted">${esc(plan.note)}</p>
      <div class="table-scroll">
        <table class="plan">
          <thead>
            <tr>
              <th>দিন</th>
              ${CATEGORIES.map(c => `<th>${c.name}<br><span style="font-weight:400;font-size:.82rem">${c.time}</span></th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${plan.days.map(d => `
              <tr>
                <th>${d.day}</th>
                ${CATEGORIES.map(c => `<td>${cell(d[c.id])}</td>`).join('')}
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  }

  draw();
  return draw;
}

/* ============================================================
   ফল ও সবজি
   ============================================================ */
function renderFoods() {
  const bar = document.querySelector('#food-filters');
  const out = document.querySelector('#food-out');
  let type = 'all';

  const TYPES = [
    { id: 'all',   name: 'সব' },
    { id: 'fruit', name: '🍎 ফল' },
    { id: 'veg',   name: '🥕 সবজি' }
  ];
  bar.innerHTML = TYPES.map(t => `<button class="chip" data-type="${t.id}">${t.name}</button>`).join('');

  function draw() {
    bar.querySelectorAll('[data-type]').forEach(b => b.classList.toggle('on', b.dataset.type === type));
    const found = visibleFoods().filter(f => type === 'all' || f.type === type);

    out.innerHTML = found.map(f => {
      const where = f.where === 'bd' ? '🇧🇩' : f.where === 'it' ? '🇮🇹' : '🌏';
      return `
        <div class="card food-card">
          <div class="food-head">
            <img class="food-icon" src="images/food-${f.id}.svg" alt="" loading="lazy">
            <div>
              <h3>${esc(f.name)} <span class="food-where">${where}</span></h3>
              <div class="season">মৌসুম: ${esc(f.season)}</div>
            </div>
          </div>
          <dl>
            <dt>যেভাবে দেবেন</dt><dd>${esc(f.prep)}</dd>
            <dt>উপকারিতা</dt><dd>${esc(f.benefits)}</dd>
            <dt>সতর্কতা</dt><dd>${esc(f.caution)}</dd>
          </dl>
        </div>`;
    }).join('');
  }

  bar.onclick = e => { const b = e.target.closest('[data-type]'); if (b) { type = b.dataset.type; draw(); } };
  draw();
  return draw;
}

/* ============================================================
   নির্দেশিকা
   ============================================================ */
function renderGuide() {
  document.querySelector('#guide-out').innerHTML = GUIDELINES.map(g => `
    <div class="panel">
      <h2>${g.title}</h2>
      <p style="margin:0">${g.text}</p>
    </div>`).join('');
}

/* ============================================================
   বুটস্ট্র্যাপ
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.page;
  renderChrome(page);

  const render = {
    home:    renderHome,
    recipes: renderRecipes,
    recipe:  renderRecipe,
    plan:    renderPlan,
    foods:   renderFoods,
    guide:   renderGuide
  }[page] || (() => {});

  // কিছু পেজ নিজের draw() ফেরত দেয় — তাহলে ফিল্টার/সার্চের অবস্থা ধরে রেখে আবার আঁকা যায়
  const redraw = render();
  rerenderPage = typeof redraw === 'function' ? redraw : render;
});
