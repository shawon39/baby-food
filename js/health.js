/* ============================================================
   সুস্থতা পাতা — বৈচিত্র্য, বৃদ্ধি, ভিটামিন ডি ও নির্ভরযোগ্য লক্ষণ
   সব তথ্য এই ব্রাউজারেই থাকে, কোথাও পাঠানো হয় না।
   ============================================================ */

const VARIETY_KEY = 'shishur-khabar-variety';
const GROWTH_KEY  = 'shishur-khabar-growth';
const DOB_KEY     = 'shishur-khabar-dob';

/* ---------- সংরক্ষণ ---------- */
function loadJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch (e) { return fallback; }
}
function saveJSON(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* উপেক্ষা */ }
}

/* ---------- তারিখ ---------- */
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const DAY_SHORT = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি'];

function lastNDays(n) {
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() - i);
    out.push(d);
  }
  return out;
}

/* বয়স মাসে */
function ageInMonths(dobStr, onStr) {
  if (!dobStr) return null;
  const a = new Date(dobStr), b = new Date(onStr);
  if (isNaN(a) || isNaN(b)) return null;
  let m = (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
  if (b.getDate() < a.getDate()) m--;
  return m;
}

/* ============================================================
   ট্যাব কাঠামো
   ============================================================ */
const HEALTH_TABS = [
  { id: 'week',    name: 'এই সপ্তাহে' },
  { id: 'growth',  name: 'বৃদ্ধি' },
  { id: 'vitd',    name: 'ভিটামিন ডি' },
  { id: 'signs',   name: 'ঠিক পথে আছি তো?' }
];

function renderHealth() {
  const tabs = document.querySelector('#health-tabs');
  const out  = document.querySelector('#health-out');
  let active = (location.hash || '').replace('#', '') || 'week';
  if (!HEALTH_TABS.some(t => t.id === active)) active = 'week';

  tabs.innerHTML = HEALTH_TABS.map(t =>
    `<button class="chip" data-tab="${t.id}">${t.name}</button>`).join('');

  function draw() {
    tabs.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('on', b.dataset.tab === active));
    ({ week: drawWeek, growth: drawGrowth, vitd: drawVitD, signs: drawSigns }[active])(out);
  }

  tabs.onclick = e => {
    const b = e.target.closest('[data-tab]');
    if (b && b.dataset.tab !== active) {
      active = b.dataset.tab;
      history.pushState(null, '', '#' + active);   // পেছনে যাওয়ার বোতাম যেন কাজ করে
      draw();
    }
  };

  /* ঠিকানার হ্যাশ বদলালে (বুকমার্ক, শেয়ার করা লিংক, পেছনে/সামনে বোতাম) সেই ট্যাব খুলবে */
  window.addEventListener('hashchange', () => {
    const want = (location.hash || '').replace('#', '') || 'week';
    if (HEALTH_TABS.some(t => t.id === want) && want !== active) { active = want; draw(); }
  });

  draw();
  return draw;
}

/* ============================================================
   ১. এই সপ্তাহে — খাবারের বৈচিত্র্য
   ============================================================ */
function drawWeek(out) {
  const log = loadJSON(VARIETY_KEY, {});
  const days = lastNDays(7);
  let selected = iso(days[6]);   // ডিফল্ট: আজ

  function paint() {
    const todays = log[selected] || [];

    /* সপ্তাহজুড়ে কোন কোন দল অন্তত একবার এসেছে */
    const weekGroups = new Set();
    days.forEach(d => (log[iso(d)] || []).forEach(g => weekGroups.add(g)));
    const missing = FOOD_GROUPS.filter(g => !weekGroups.has(g.id));

    out.innerHTML = `
      <div class="notice" style="margin-bottom:24px">
        <strong>কীভাবে দেখবেন:</strong> এটি কোনো পরীক্ষা নয়, নম্বরও নয়।
        NHS-এর পরামর্শ — “এক দিনে কী খেল তা নিয়ে দুশ্চিন্তা করবেন না, বরং সপ্তাহজুড়ে কী খাচ্ছে সেটি ভাবুন।”
        নিচে শুধু দেখে নিন সপ্তাহে কোন দলটি বাদ পড়ে যাচ্ছে।
      </div>

      <div class="day-strip">
        ${days.map(d => {
          const key = iso(d);
          const n = (log[key] || []).length;
          return `<button class="day-pill ${key === selected ? 'on' : ''}" data-day="${key}">
                    <span class="day-name">${DAY_SHORT[d.getDay()]}</span>
                    <span class="day-num">${bn(d.getDate())}</span>
                    <span class="day-dots">${n ? '●'.repeat(Math.min(n, 7)) : '·'}</span>
                  </button>`;
        }).join('')}
      </div>

      <h2 style="margin-top:26px">${selected === iso(days[6]) ? 'আজ' : bn(new Date(selected).getDate()) + ' তারিখে'} কী কী দিয়েছেন?</h2>
      <p class="muted">যেগুলো দিয়েছেন সেগুলোতে চাপ দিন। পরে যোগ করলেও চলবে।</p>

      <div class="group-grid">
        ${FOOD_GROUPS.map(g => `
          <button class="group-btn ${todays.includes(g.id) ? 'on' : ''}" data-group="${g.id}">
            <span class="group-icon">${g.icon}</span>
            <span class="group-name">${g.name}</span>
            <span class="group-eg">${g.examples}</span>
          </button>`).join('')}
      </div>

      <div class="panel ${missing.length ? 'panel-warn' : 'panel-good'}" style="margin-top:28px">
        <h2>${missing.length ? '🍽 এই সপ্তাহে এখনো আসেনি' : '💚 সব দল এসেছে'}</h2>
        ${missing.length ? `
          <p>গত ৭ দিনে নিচের দলগুলো একবারও পড়েনি। আগামী কয়েক দিনে রাখার চেষ্টা করুন —</p>
          ${missing.map(g => `
            <div class="gap-row">
              <div><strong>${g.icon} ${g.name}</strong><br><span class="muted">${g.why}</span></div>
              <div class="gap-links">
                ${g.recipes.map(id => { const r = getRecipe(id); return r
                  ? `<a class="tag tag-brand" href="recipe.html?id=${r.id}">${esc(r.title)}</a>` : ''; }).join('')}
              </div>
            </div>`).join('')}
        ` : `<p>গত ৭ দিনে সাতটি দলের সবগুলোই অন্তত একবার এসেছে। এটাই লক্ষ্য — প্রতিদিন সব কিছু নয়, সপ্তাহজুড়ে বৈচিত্র্য।</p>`}
      </div>

      <p class="muted" style="margin-top:20px;font-size:.85rem">
        দিনে অন্তত ${bn(GROUPS_PER_DAY_TARGET)}টি দল থাকলে ভালো, তবে কোনো দিন কম হলে চিন্তার কিছু নেই —
        শিশুরা দিনে দিনে নিজেরাই ভারসাম্য করে নেয়।
      </p>`;

    out.querySelector('.day-strip').onclick = e => {
      const b = e.target.closest('[data-day]');
      if (b) { selected = b.dataset.day; paint(); }
    };
    out.querySelector('.group-grid').onclick = e => {
      const b = e.target.closest('[data-group]');
      if (!b) return;
      const id = b.dataset.group;
      const list = new Set(log[selected] || []);
      list.has(id) ? list.delete(id) : list.add(id);
      log[selected] = [...list];
      if (!log[selected].length) delete log[selected];
      saveJSON(VARIETY_KEY, log);
      paint();
    };
  }

  paint();
}

/* ============================================================
   ২. বৃদ্ধি
   ============================================================ */
function drawGrowth(out) {
  const entries = loadJSON(GROWTH_KEY, []);
  const dob = (() => { try { return localStorage.getItem(DOB_KEY) || ''; } catch (e) { return ''; } })();
  const haveCharts = typeof GROWTH_BOYS !== 'undefined';

  entries.sort((a, b) => a.date.localeCompare(b.date));
  const last = entries[entries.length - 1];
  const lastAge = last ? ageInMonths(dob, last.date) : null;

  out.innerHTML = `
    <div class="notice" style="margin-bottom:24px">
      <strong>কত ঘনঘন মাপবেন:</strong> NHS বলে এক বছরের পর <strong>তিন মাসে একবারের বেশি</strong> ওজন মাপার দরকার নেই।
      বেশি ঘনঘন মাপলে অকারণ দুশ্চিন্তা বাড়ে। একটি সংখ্যা নয় — <strong>ধারা</strong>টাই আসল।
    </div>

    <div class="panel">
      <h2>📏 নতুন মাপ যোগ করুন</h2>
      <div class="form-row">
        <label>জন্ম তারিখ
          <input type="date" id="g-dob" value="${dob}">
        </label>
        <label>মাপের তারিখ
          <input type="date" id="g-date" value="${iso(new Date())}">
        </label>
        <label>ওজন (কেজি)
          <input type="number" id="g-weight" step="0.1" min="5" max="35" placeholder="১২.৫">
        </label>
        <label>উচ্চতা (সেমি)
          <input type="number" id="g-height" step="0.5" min="60" max="130" placeholder="৮৭">
        </label>
      </div>
      <button class="btn" id="g-add">যোগ করুন</button>
      ${!dob ? '<p class="muted" style="margin:12px 0 0">বৃদ্ধির রেখা দেখতে জন্ম তারিখ দিতে হবে।</p>' : ''}
    </div>

    ${last && lastAge !== null && haveCharts ? growthSummary(last, lastAge) : ''}
    ${entries.length && dob && haveCharts ? growthCharts(entries, dob) : ''}
    ${!haveCharts ? '<div class="notice">বৃদ্ধির রেখার তথ্য এখনো যোগ করা হয়নি।</div>' : ''}

    ${entries.length ? `
      <div class="panel">
        <h2>📋 আগের মাপগুলো</h2>
        <div class="table-scroll">
          <table class="plan">
            <thead><tr><th>তারিখ</th><th>বয়স</th><th>ওজন</th><th>উচ্চতা</th><th></th></tr></thead>
            <tbody>
              ${entries.slice().reverse().map(e => {
                const m = ageInMonths(dob, e.date);
                return `<tr>
                  <td>${bn(e.date)}</td>
                  <td>${m !== null ? bn(m) + ' মাস' : '—'}</td>
                  <td>${e.weight ? bn(e.weight) + ' কেজি' : '—'}</td>
                  <td>${e.height ? bn(e.height) + ' সেমি' : '—'}</td>
                  <td><button class="linklike" data-del="${e.date}">মুছুন</button></td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>` : ''}

    <div class="panel panel-warn">
      <h2>⚠️ কখন ডাক্তার দেখাবেন</h2>
      <p>NICE-এর নির্দেশনা অনুযায়ী উদ্বেগের কারণ হলো <strong>রেখা ধরে নিচে নেমে যাওয়া</strong> — কোন রেখায় আছে তা নয়:</p>
      <ul>
        <li>ওজনের রেখা ধারাবাহিকভাবে <strong>দুই বা তিন ধাপ</strong> নিচে নেমে গেলে।</li>
        <li>ওজন সবচেয়ে নিচের রেখারও নিচে চলে গেলে।</li>
        <li>ওজন বাড়া কয়েক মাস ধরে থেমে থাকলে।</li>
      </ul>
      <p class="muted" style="margin:0">অসুস্থতার পর সাময়িকভাবে ওজন কমা স্বাভাবিক — সাধারণত ২–৩ সপ্তাহে ফিরে আসে।</p>
    </div>`;

  /* যোগ করা */
  out.querySelector('#g-add').onclick = () => {
    const d  = out.querySelector('#g-date').value;
    const w  = parseFloat(out.querySelector('#g-weight').value);
    const h  = parseFloat(out.querySelector('#g-height').value);
    const db = out.querySelector('#g-dob').value;
    if (db) { try { localStorage.setItem(DOB_KEY, db); } catch (e) {} }
    if (!d || (!w && !h)) { alert('তারিখ এবং ওজন বা উচ্চতার অন্তত একটি দিন।'); return; }
    const list = loadJSON(GROWTH_KEY, []).filter(e => e.date !== d);
    list.push({ date: d, weight: w || null, height: h || null });
    saveJSON(GROWTH_KEY, list);
    drawGrowth(out);
  };

  out.onclick = (e) => {
    const b = e.target.closest('[data-del]');
    if (!b) return;
    saveJSON(GROWTH_KEY, loadJSON(GROWTH_KEY, []).filter(x => x.date !== b.dataset.del));
    drawGrowth(out);
  };
}

/* কোন ব্যান্ডে আছে */
function bandFor(value, cuts) {
  if (value < cuts[0]) return { label: 'সবচেয়ে নিচের রেখার নিচে', tone: 'warn' };
  if (value < cuts[1]) return { label: '৩য়–১৫তম শতকের মধ্যে', tone: 'ok' };
  if (value < cuts[2]) return { label: '১৫তম–৫০তম শতকের মধ্যে', tone: 'ok' };
  if (value < cuts[3]) return { label: '৫০তম–৮৫তম শতকের মধ্যে', tone: 'ok' };
  if (value < cuts[4]) return { label: '৮৫তম–৯৭তম শতকের মধ্যে', tone: 'ok' };
  return { label: 'সবচেয়ে উপরের রেখার উপরে', tone: 'warn' };
}

function growthSummary(last, age) {
  const w = GROWTH_BOYS.weightForAge[age];
  const h = GROWTH_BOYS.heightForAge[age];
  if (!w && !h) return `<div class="notice">${bn(age)} মাস বয়সের জন্য রেখার তথ্য নেই (২৪–৬০ মাস পর্যন্ত আছে)।</div>`;

  const rows = [];
  if (last.weight && w) rows.push(['ওজন', bn(last.weight) + ' কেজি', bandFor(last.weight, w)]);
  if (last.height && h) rows.push(['উচ্চতা', bn(last.height) + ' সেমি', bandFor(last.height, h)]);

  return `
    <div class="panel">
      <h2>📍 সর্বশেষ মাপ — ${bn(age)} মাস বয়সে</h2>
      ${rows.map(([k, v, b]) => `
        <p style="margin:0 0 8px"><strong>${k}:</strong> ${v} — ${b.label}</p>`).join('')}
      <p class="muted" style="margin:12px 0 0;font-size:.88rem">
        রেখার ভেতরে যেকোনো জায়গায় থাকা স্বাভাবিক। ৩য় শতক মানে ১০০ জন সমবয়সী ছেলের মধ্যে সে ৩ নম্বরে —
        এটি নিজে থেকে সমস্যার লক্ষণ নয়। গুরুত্বপূর্ণ হলো সে নিজের ধারা ধরে রাখছে কি না।
      </p>
    </div>`;
}

/* সরল SVG চার্ট */
function growthCharts(entries, dob) {
  const charts = [
    { key: 'weight', table: 'weightForAge', title: 'ওজন (কেজি)', unit: 'কেজি' },
    { key: 'height', table: 'heightForAge', title: 'উচ্চতা (সেমি)', unit: 'সেমি' }
  ];

  return charts.map(c => {
    const pts = entries
      .map(e => ({ age: ageInMonths(dob, e.date), v: e[c.key] }))
      .filter(p => p.v && p.age !== null && p.age >= 24 && p.age <= 60);
    if (!pts.length) return '';

    const ages = Object.keys(GROWTH_BOYS[c.table]).map(Number).sort((a, b) => a - b);
    const W = 640, H = 300, PL = 44, PR = 12, PT = 14, PB = 30;
    const x = (m) => PL + ((m - 24) / 36) * (W - PL - PR);

    const all = ages.flatMap(a => GROWTH_BOYS[c.table][a]);
    const lo = Math.floor(Math.min(...all, ...pts.map(p => p.v)) - 1);
    const hi = Math.ceil(Math.max(...all, ...pts.map(p => p.v)) + 1);
    const y = (v) => PT + (1 - (v - lo) / (hi - lo)) * (H - PT - PB);

    const line = (i) => ages.map(a => `${x(a).toFixed(1)},${y(GROWTH_BOYS[c.table][a][i]).toFixed(1)}`).join(' ');
    const band = (i, j) =>
      `${ages.map(a => `${x(a).toFixed(1)},${y(GROWTH_BOYS[c.table][a][i]).toFixed(1)}`).join(' ')} ` +
      `${ages.slice().reverse().map(a => `${x(a).toFixed(1)},${y(GROWTH_BOYS[c.table][a][j]).toFixed(1)}`).join(' ')}`;

    const ticks = [24, 30, 36, 42, 48, 54, 60];

    return `
      <div class="panel">
        <h2>📈 ${c.title}</h2>
        <div class="table-scroll">
          <svg class="growth-svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img"
               aria-label="${c.title} বৃদ্ধির রেখা">
            <polygon points="${band(0, 4)}" fill="var(--brand-soft)" opacity=".55"/>
            <polygon points="${band(1, 3)}" fill="var(--brand-soft)"/>
            ${[0, 1, 3, 4].map(i => `<polyline points="${line(i)}" fill="none" stroke="var(--line)" stroke-width="1.5"/>`).join('')}
            <polyline points="${line(2)}" fill="none" stroke="var(--brand)" stroke-width="2" stroke-dasharray="5 4"/>
            ${ticks.map(t => `
              <line x1="${x(t)}" y1="${PT}" x2="${x(t)}" y2="${H - PB}" stroke="var(--line)" stroke-width="1" opacity=".5"/>
              <text x="${x(t)}" y="${H - 10}" text-anchor="middle" font-size="11" fill="var(--text-soft)">${bn(t)}</text>`).join('')}
            ${[lo, Math.round((lo + hi) / 2), hi].map(v => `
              <text x="${PL - 8}" y="${y(v) + 4}" text-anchor="end" font-size="11" fill="var(--text-soft)">${bn(v)}</text>`).join('')}
            <polyline points="${pts.map(p => `${x(p.age).toFixed(1)},${y(p.v).toFixed(1)}`).join(' ')}"
                      fill="none" stroke="var(--green)" stroke-width="2.5"/>
            ${pts.map(p => `<circle cx="${x(p.age).toFixed(1)}" cy="${y(p.v).toFixed(1)}" r="5" fill="var(--green)"/>`).join('')}
          </svg>
        </div>
        <p class="muted" style="margin:8px 0 0;font-size:.85rem">
          অনুভূমিক অক্ষে বয়স (মাস), উল্লম্ব অক্ষে ${esc(c.unit)}।
          ছায়া দেওয়া অংশ = ৩য় থেকে ৯৭তম শতক (WHO মানদণ্ড, ছেলে)। কাটা কমলা রেখা = ৫০তম শতক।
          সবুজ রেখা আপনার শিশুর মাপ।
        </p>
      </div>`;
  }).join('');
}

/* ============================================================
   ৩. ভিটামিন ডি
   ============================================================ */
function drawVitD(out) {
  let country = getPref();   // সাইটের দেশ পছন্দ অনুসরণ করে

  function paint() {
    const v = VITAMIN_D[country];
    const thisMonth = new Date().getMonth();

    out.innerHTML = `
      <div class="filters">
        <span class="filter-label">দেশ:</span>
        ${Object.keys(VITAMIN_D).map(k =>
          `<button class="chip ${k === country ? 'on' : ''}" data-c="${k}">${VITAMIN_D[k].flag} ${VITAMIN_D[k].country}</button>`).join('')}
      </div>

      <div class="panel">
        <h2>☀️ ${v.flag} ${v.country} — ${esc(v.headline)}</h2>
        <div class="month-strip">
          ${v.sun.map((lvl, i) => `
            <div class="month-cell lvl-${lvl} ${i === thisMonth ? 'now' : ''}" title="${MONTHS_BN[i]}">
              <span>${MONTHS_BN[i].slice(0, 3)}</span>
            </div>`).join('')}
        </div>
        <div class="legend">
          <span><i class="sw lvl-2"></i> রোদে তৈরি হয়</span>
          <span><i class="sw lvl-1"></i> দুর্বল</span>
          <span><i class="sw lvl-0"></i> হয় না</span>
        </div>
        <ul style="margin-top:16px">${v.points.map(p => `<li>${esc(p)}</li>`).join('')}</ul>
        <div class="notice" style="margin-top:6px"><strong>করণীয়:</strong> ${esc(v.advice)}</div>
      </div>

      <div class="panel">
        <h2>💊 কতটুকু — কর্তৃপক্ষভেদে আলাদা</h2>
        <p class="muted">এখানে সংখ্যাগুলো মিলিয়ে একটি গড় দেওয়া হয়নি, কারণ সংস্থাগুলো সত্যিই একমত নয়।
           আপনার শিশুর জন্য কোনটি প্রযোজ্য তা শিশু বিশেষজ্ঞই ঠিক করবেন।</p>
        <div class="table-scroll">
          <table class="plan">
            <thead><tr><th>কর্তৃপক্ষ</th><th>পরিমাণ</th><th>মন্তব্য</th></tr></thead>
            <tbody>${VITAMIN_D_DOSES.map(d =>
              `<tr><th>${esc(d.who)}</th><td>${esc(d.amount)}</td><td>${esc(d.note)}</td></tr>`).join('')}</tbody>
          </table>
        </div>
        <p style="margin:14px 0 0"><strong>এছাড়া:</strong> NHS ৬ মাস থেকে ৫ বছর বয়সী সব শিশুকে প্রতিদিন
           ভিটামিন <strong>এ, সি ও ডি</strong> — তিনটিই দিতে বলে।</p>
      </div>

      <div class="panel">
        <h2>🧴 রোদে নেওয়ার নিরাপদ নিয়ম</h2>
        <p>${esc(SUN_SAFETY.intro)}</p>
        <div class="two-col">
          <div>
            <h3 style="color:var(--green)">যা করবেন</h3>
            <ul>${SUN_SAFETY.dos.map(s => `<li>${esc(s)}</li>`).join('')}</ul>
          </div>
          <div>
            <h3 style="color:var(--amber)">যা করবেন না</h3>
            <ul>${SUN_SAFETY.donts.map(s => `<li>${esc(s)}</li>`).join('')}</ul>
          </div>
        </div>
      </div>

      <div class="panel">
        <h2>🍽 খাবার থেকে কতটা পাওয়া যায়</h2>
        <p style="margin:0">${esc(SUN_SAFETY.diet)}</p>
      </div>`;

    out.querySelector('.filters').onclick = e => {
      const b = e.target.closest('[data-c]');
      if (b) { country = b.dataset.c; paint(); }
    };
  }

  paint();
}

/* ============================================================
   ৪. ঠিক পথে আছি তো?
   ============================================================ */
function drawSigns(out) {
  out.innerHTML = `
    <div class="panel panel-good">
      <h2>💚 যেসব লক্ষণ দেখলে নিশ্চিন্ত থাকতে পারেন</h2>
      <ul>${REASSURING_SIGNS.map(s => `<li>${esc(s)}</li>`).join('')}</ul>
      <p style="margin:12px 0 0"><strong>NHS-এর সহজ মাপকাঠি:</strong>
         “শিশু যদি সক্রিয় থাকে, ওজন বাড়ে আর সুস্থ মনে হয় — তাহলে সে যথেষ্ট খাচ্ছে।”</p>
    </div>

    <div class="panel">
      <h2>🗓 এক দিন নয়, সপ্তাহ ধরে ভাবুন</h2>
      <p>দুই বছর বয়সে খাওয়ার পরিমাণ দিনে দিনে ওঠানামা করে — এটি স্বাভাবিক। এক বেলায় কম খেলে
         পরের বেলায় বা পরদিন সে পুষিয়ে নেয়। তাই এক দিনের হিসাব ধরে দুশ্চিন্তা করার দরকার নেই।</p>
      <p style="margin:0"><strong>এক পরিবেশন কতটুকু?</strong> শিশুর নিজের মুঠো সমান — আপনার নয়।
         দিনে তিন বেলা প্রধান খাবার ও দুইবার হালকা নাস্তাই যথেষ্ট।</p>
    </div>

    <div class="panel">
      <h2>🤝 কে কী ঠিক করবে</h2>
      <p>খাওয়ানো নিয়ে দ্বন্দ্ব কমানোর সবচেয়ে কার্যকর নিয়ম — দায়িত্ব ভাগ করে নেওয়া:</p>
      <div class="two-col">
        <div>
          <h3>আপনি ঠিক করবেন</h3>
          <ul>${FEEDING_ROLES.parent.map(s => `<li>${esc(s)}</li>`).join('')}</ul>
        </div>
        <div>
          <h3>সে ঠিক করবে</h3>
          <ul>${FEEDING_ROLES.child.map(s => `<li>${esc(s)}</li>`).join('')}</ul>
        </div>
      </div>
    </div>

    <div class="panel panel-warn">
      <h2>🚫 যা করবেন না</h2>
      ${NOT_TO_DO.map(n => `<p style="margin:0 0 12px"><strong>${esc(n.title)}</strong><br>${esc(n.text)}</p>`).join('')}
    </div>

    <div class="panel panel-warn">
      <h2>⚠️ যেসব লক্ষণে ডাক্তার দেখাবেন</h2>
      ${WARNING_SIGNS.map(w => `
        <div style="margin-bottom:16px">
          <strong>${esc(w.title)}</strong>
          <p style="margin:4px 0 2px">${esc(w.signs)}</p>
          <p class="muted" style="margin:0">→ ${esc(w.action)}</p>
        </div>`).join('')}
    </div>

    <div class="panel">
      <h2>📚 সূত্র</h2>
      <p class="muted">এই পাতার তথ্য নিচের নির্দেশনাগুলো থেকে নেওয়া। কোথাও সংস্থাগুলো একমত না হলে
         তা আলাদা করেই দেখানো হয়েছে।</p>
      <div class="src-list">
        ${SOURCES.map(s => `<a href="${s.url}" target="_blank" rel="noopener">${esc(s.label)}</a>`).join('')}
      </div>
    </div>`;
}
