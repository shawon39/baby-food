const fs = require('fs');
const path = require('path');
const ROOT = __dirname;
const src = fs.readFileSync(path.join(ROOT, 'js/data.js'), 'utf8');
const D = eval(src + ';({RECIPES,CATEGORIES,CUISINES,FOODS,MEAL_PLANS,GUIDELINES,getRecipe,recipesInCategory})');

let bad = 0;
const fail = (...a) => { console.log('  ✗', ...a); bad++; };

const req = ['id','title','category','cuisine','time','portion','intro','ingredients','steps','benefits','warnings'];
D.RECIPES.forEach(r => req.forEach(f => {
  if (!r[f] || (Array.isArray(r[f]) && !r[f].length)) fail('missing field', r.id, f);
}));

const ids = D.RECIPES.map(r => r.id);
if (new Set(ids).size !== ids.length) fail('duplicate recipe ids');

const catIds = D.CATEGORIES.map(c => c.id);
D.RECIPES.forEach(r => {
  if (!catIds.includes(r.category)) fail('bad category', r.id, r.category);
  if (!D.CUISINES.map(c => c.id).includes(r.cuisine)) fail('bad cuisine', r.id, r.cuisine);
});

D.MEAL_PLANS.forEach(p => p.days.forEach(d =>
  ['breakfast','lunch','snack','dinner','evening'].forEach(slot => {
    if (!D.getRecipe(d[slot])) fail('meal-plan ref not found', p.id, d.day, slot, d[slot]);
  })));

// every recipe should be reachable from at least one meal plan or at least exist in a category
const planned = new Set();
D.MEAL_PLANS.forEach(p => p.days.forEach(d =>
  ['breakfast','lunch','snack','dinner','evening'].forEach(s => planned.add(d[s]))));
const orphans = ids.filter(i => !planned.has(i));

// images
const imgDir = path.join(ROOT, 'images');
if (fs.existsSync(imgDir)) {
  ids.forEach(i => {
    if (!fs.existsSync(path.join(imgDir, i + '.svg'))) fail('missing image', i + '.svg');
  });
  D.CATEGORIES.forEach(c => {
    if (!fs.existsSync(path.join(imgDir, 'cat-' + c.id + '.svg'))) fail('missing category icon', c.id);
  });
} else {
  console.log('  (images/ not created yet — skipping image check)');
}

console.log('\nCategories:');
D.CATEGORIES.forEach(c => console.log('  ' + c.id.padEnd(10), D.recipesInCategory(c.id).length, 'recipes'));
console.log('\nTotals: ' + D.RECIPES.length + ' recipes, ' + D.FOODS.length + ' foods, ' +
            D.GUIDELINES.length + ' guidelines, ' + D.MEAL_PLANS.length + ' meal plans');
if (orphans.length) console.log('Not used in any meal plan: ' + orphans.join(', '));
console.log(bad ? '\nFAILED — ' + bad + ' problem(s)' : '\nALL CHECKS PASSED');
process.exit(bad ? 1 : 0);
