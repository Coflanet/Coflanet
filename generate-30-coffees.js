const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname);
const flavorFull = JSON.parse(fs.readFileSync(path.join(dir, 'coffee_flavor_full.json'), 'utf8'));

// category별 descriptor 풀 (매칭용 Fruity, Floral, Nutty/Cocoa, Roasted + Sweet, Sour/Fermented, Spices 등)
const byCategory = {};
for (const row of flavorFull) {
  const c = row.category;
  if (!byCategory[c]) byCategory[c] = [];
  byCategory[c].push({ category: row.category, subCategory: row.subCategory, descriptor: row.descriptor });
}

// 30개 커피 시드: name, origin, variety, processing, roast_point(3-7), taste_note
const seeds = [
  { name: 'Colombia Pink Bourbon', origin: 'Colombia', variety: 'Pink Bourbon', processing: 'Washed', roast: 3, taste: [4.2, 2.7, 3.5, 1] },
  { name: 'Ethiopia Yirgacheffe', origin: 'Ethiopia', variety: 'Heirloom', processing: 'Washed', roast: 3, taste: [4.8, 1.9, 2.8, 1.3] },
  { name: 'Brazil Natural', origin: 'Brazil', variety: 'Bourbon', processing: 'Natural', roast: 5, taste: [2, 3.8, 3.2, 2.5] },
  { name: 'Kenya AA', origin: 'Kenya', variety: 'SL28 / SL34', processing: 'Washed', roast: 4, taste: [4.6, 3, 2.9, 1.6] },
  { name: 'Guatemala Antigua', origin: 'Guatemala', variety: 'Caturra / Bourbon', processing: 'Washed', roast: 5, taste: [3.5, 3.3, 3.8, 1.8] },
  { name: 'Ethiopia Gesha Natural', origin: 'Ethiopia', variety: 'Gesha', processing: 'Natural', roast: 3, taste: [4.7, 2.5, 3.9, 0.8] },
  { name: 'Sumatra Mandheling', origin: 'Indonesia', variety: 'Typica', processing: 'Wet-Hulled', roast: 7, taste: [1.5, 4.5, 3.8, 3] },
  { name: 'Costa Rica Honey', origin: 'Costa Rica', variety: 'Caturra', processing: 'Honey', roast: 4, taste: [3.3, 3.2, 4.2, 1.1] },
  { name: 'Rwanda Bourbon Honey', origin: 'Rwanda', variety: 'Bourbon', processing: 'Honey', roast: 3, taste: [4, 3, 3.6, 1.4] },
  { name: 'Ethiopia Anaerobic Natural', origin: 'Ethiopia', variety: 'Heirloom', processing: 'Anaerobic Natural', roast: 3, taste: [4.5, 2.9, 3.8, 1.2] },
  { name: 'Panama Geisha', origin: 'Panama', variety: 'Gesha', processing: 'Washed', roast: 3, taste: [4.9, 2.2, 4, 0.9] },
  { name: 'Honduras Marcala', origin: 'Honduras', variety: 'Catuai', processing: 'Washed', roast: 5, taste: [3.2, 3.4, 3.5, 1.9] },
  { name: 'Papua New Guinea', origin: 'Papua New Guinea', variety: 'Arusha', processing: 'Washed', roast: 5, taste: [3.4, 3.1, 3.3, 2] },
  { name: 'Tanzania Kilimanjaro', origin: 'Tanzania', variety: 'Kent', processing: 'Washed', roast: 4, taste: [4.1, 2.8, 3.2, 1.5] },
  { name: 'Uganda Bugisu', origin: 'Uganda', variety: 'SL14', processing: 'Washed', roast: 5, taste: [3.6, 3.5, 3.4, 2.1] },
  { name: 'Peru Chanchamayo', origin: 'Peru', variety: 'Typica', processing: 'Washed', roast: 5, taste: [3.1, 3.2, 3.6, 1.7] },
  { name: 'Nicaragua Jinotega', origin: 'Nicaragua', variety: 'Caturra', processing: 'Honey', roast: 4, taste: [3.8, 3.1, 3.7, 1.4] },
  { name: 'El Salvador Santa Ana', origin: 'El Salvador', variety: 'Bourbon', processing: 'Washed', roast: 5, taste: [3.3, 3.6, 3.5, 1.6] },
  { name: 'India Chikmagalur', origin: 'India', variety: 'Selection 9', processing: 'Monsooned', roast: 6, taste: [2.2, 4, 3.2, 2.6] },
  { name: 'Yemen Mocha', origin: 'Yemen', variety: 'Mocha', processing: 'Natural', roast: 5, taste: [3.5, 3.8, 3.4, 2.3] },
  { name: 'Mexico Chiapas', origin: 'Mexico', variety: 'Bourbon', processing: 'Washed', roast: 4, taste: [3.7, 2.9, 3.5, 1.5] },
  { name: 'Bolivia Caranavi', origin: 'Bolivia', variety: 'Caturra', processing: 'Washed', roast: 4, taste: [4, 2.8, 3.6, 1.2] },
  { name: 'Burundi Kayanza', origin: 'Burundi', variety: 'Red Bourbon', processing: 'Washed', roast: 4, taste: [4.2, 3, 3.4, 1.3] },
  { name: 'Cameroon Boyo', origin: 'Cameroon', variety: 'Java', processing: 'Washed', roast: 5, taste: [3.4, 3.3, 3.2, 2] },
  { name: 'Ecuador Loja', origin: 'Ecuador', variety: 'Typica', processing: 'Washed', roast: 4, taste: [3.9, 2.7, 3.5, 1.4] },
  { name: 'Hawaii Kona', origin: 'USA', variety: 'Typica', processing: 'Washed', roast: 4, taste: [3.6, 3.2, 3.8, 1.5] },
  { name: 'Jamaica Blue Mountain', origin: 'Jamaica', variety: 'Blue Mountain', processing: 'Washed', roast: 4, taste: [3.2, 3.5, 3.6, 1.7] },
  { name: 'Myanmar Shan', origin: 'Myanmar', variety: 'Caturra', processing: 'Washed', roast: 5, taste: [3.5, 3.4, 3.3, 1.8] },
  { name: 'Timor Leste Ermera', origin: 'Timor-Leste', variety: 'Hybrid', processing: 'Semi-washed', roast: 5, taste: [2.8, 3.6, 3.2, 2.2] },
  { name: 'Zambia Northern', origin: 'Zambia', variety: 'Catimor', processing: 'Washed', roast: 5, taste: [3.4, 3.3, 3.4, 1.9] },
];

function pickDescriptors(countByCategory) {
  const descriptors = [];
  const categories = [];
  for (const [cat, n] of Object.entries(countByCategory)) {
    const pool = byCategory[cat];
    if (!pool || pool.length === 0) continue;
    for (let i = 0; i < n; i++) {
      const d = pool[Math.floor(Math.random() * pool.length)];
      descriptors.push({ category: d.category, subCategory: d.subCategory, descriptor: d.descriptor });
      if (!categories.includes(d.category)) categories.push(d.category);
    }
  }
  return { categories, descriptors };
}

// 다양한 note 조합 (Fruity, Floral, Sweet, Nutty/Cocoa, Roasted, Sour/Fermented, Spices 등)
const noteRecipes = [
  { Fruity: 2, Floral: 1, Sweet: 1, 'Nutty/Cocoa': 1 },
  { Fruity: 1, Floral: 2, Sweet: 1 },
  { 'Nutty/Cocoa': 2, Roasted: 2, Sweet: 1 },
  { Fruity: 2, 'Nutty/Cocoa': 1, Roasted: 1 },
  { Sweet: 2, 'Nutty/Cocoa': 1, Roasted: 1 },
  { Fruity: 1, Floral: 1, Sweet: 2, 'Nutty/Cocoa': 1 },
  { Roasted: 2, 'Nutty/Cocoa': 2 },
  { Fruity: 2, Sweet: 1, Floral: 1 },
  { Floral: 1, Fruity: 2, Sweet: 1 },
  { Fruity: 1, 'Sour/Fermented': 1, Roasted: 1, Sweet: 1 },
  { Fruity: 2, Floral: 1, Roasted: 1 },
  { Spices: 1, 'Nutty/Cocoa': 1, Roasted: 1, Sweet: 1 },
  { Fruity: 1, Sweet: 2, 'Nutty/Cocoa': 1 },
  { Roasted: 1, 'Nutty/Cocoa': 2, Sweet: 1 },
  { Floral: 2, Fruity: 1, Sweet: 1 },
  { Fruity: 1, Roasted: 2, 'Nutty/Cocoa': 1 },
  { Sweet: 2, 'Nutty/Cocoa': 1, Roasted: 1 },
  { Fruity: 2, Floral: 1, Roasted: 1 },
  { 'Nutty/Cocoa': 2, Sweet: 1, Roasted: 1 },
  { Fruity: 1, Floral: 1, 'Nutty/Cocoa': 1, Roasted: 1 },
  { Fruity: 2, Sweet: 2 },
  { Roasted: 2, Spices: 1, 'Nutty/Cocoa': 1 },
  { Floral: 1, Fruity: 2, Sweet: 1 },
  { 'Nutty/Cocoa': 1, Roasted: 2, Sweet: 1 },
  { Fruity: 1, Floral: 2, 'Nutty/Cocoa': 1 },
  { Sweet: 1, Fruity: 2, Roasted: 1 },
  { Fruity: 1, 'Sour/Fermented': 1, Sweet: 1, Roasted: 1 },
  { 'Nutty/Cocoa': 2, Roasted: 1, Sweet: 1 },
  { Fruity: 2, Floral: 1, Sweet: 1 },
  { Roasted: 1, 'Nutty/Cocoa': 1, Sweet: 2, Fruity: 1 },
];

const coffees = [];
for (let i = 0; i < 30; i++) {
  const seed = seeds[i];
  const recipe = noteRecipes[i];
  const { categories, descriptors } = pickDescriptors(recipe);
  coffees.push({
    id: `coffee_${String(i + 1).padStart(3, '0')}`,
    name: seed.name,
    origin: seed.origin,
    variety: seed.variety,
    processing: seed.processing,
    roast_point: seed.roast,
    taste_note: {
      acidity: seed.taste[0],
      body: seed.taste[1],
      sweetness: seed.taste[2],
      bitterness: seed.taste[3],
    },
    cup_note: { categories: [...new Set(categories)], descriptors },
    product: {
      description: `${seed.origin} ${seed.variety} ${seed.processing}. 다양한 향미가 조화를 이룹니다.`,
      image_url: `https://dummy.coflanet.com/images/coffee_${String(i + 1).padStart(3, '0')}.jpg`,
      weight_options: [
        { weight: '100g', price: 9000 + Math.floor(Math.random() * 7000) },
        { weight: '500g', price: 40000 + Math.floor(Math.random() * 30000) },
      ],
    },
  });
}

fs.writeFileSync(path.join(dir, 'coffees.json'), JSON.stringify(coffees, null, 2), 'utf8');
console.log('coffees.json 30건 생성 완료');
