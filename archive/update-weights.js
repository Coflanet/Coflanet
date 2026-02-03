const fs = require('fs');
const path = require('path');

/**
 * 수정된 가중치 (2025.02 기준)
 * 기준: "긍정적 품질 기여도"
 *
 * 1.30 - 프리미엄 / 희귀 고급 특성
 * 1.25 - 대중적 인기 + 품질 지표
 * 1.20 - 인기 + 고품질
 * 1.15 - 인기 있는 긍정적 특성
 * 1.05 - 중립 / 상황적 긍정
 * 1.00 - 기본값
 * 0.85 - 호불호 갈림 / 부정적 경향
 * 0.70 - 결함 / 부정적
 * 0.50 - 심각한 결함
 */

// descriptor 기준 가중치 (우선 적용)
const descriptorWeight = {
  // 1.30 - 프리미엄
  'Jasmine': 1.30,
  'Rose': 1.30,
  'Winey': 1.30,

  // 1.25 - 대중적 인기 + 품질
  'Cherry': 1.25,

  // 1.20 - 인기 + 고품질
  'Peach': 1.20,
  'Grape': 1.20,
  'Pomegranate': 1.20,

  // 1.15 - 상향 조정
  'Pineapple': 1.15,
  'Apple': 1.15,
  'Pear': 1.15,
  'Black Tea': 1.15,

  // 1.05 - 상향 조정 (0.85에서)
  'Pipe tobacco': 1.05,
  'Pepper': 1.05,
  'Pungent': 1.05,
  'Fermented': 1.05,
  'Overripe': 1.05,

  // 0.85 - 호불호 (1.0에서 하향)
  'Burnt': 0.85,
  'Acrid': 0.85,
  'Ashy': 0.85,
  'Under-ripe': 0.85,
  'Peapod': 0.85,
  'Hay-like': 0.85,

  // 0.70 - 결함 (0.9에서 하향)
  'Stale': 0.70,
  'Cardboard': 0.70,
  'Papery': 0.70,
  'Woody': 0.70,
  'Musty/Dusty': 0.70,
  'Musty/Earthy': 0.70,
  'Animalic': 0.70,
  'Meaty/Brothy': 0.70,
  'Phenolic': 0.70,
  'Chemical': 0.70,
  'Bitter': 0.70,
  'Salty': 0.70,
  'Medicinal': 0.70,
  'Moldy/Damp': 0.70,

  // 0.50 - 심각한 결함
  'Petroleum': 0.50,
  'Skunky': 0.50,
  'Rubber': 0.50,
};

// subCategory 기준 가중치 (descriptor에 없으면 적용)
const subCategoryWeight = {
  // 1.25 - 유지
  'Berry': 1.25,
  'Citrus fruit': 1.25,
  'Cocoa': 1.25,
  'Nutty': 1.25,
  'Brown sugar': 1.25,

  // 1.15 - 유지/조정
  'Floral': 1.15,
  'Tobacco': 1.15,
  'Brown spice': 1.15,
  'Vanilla': 1.15,
  'Sweet Aromatics': 1.15,
  'Nutty/Cocoa': 1.15,
  'Roasted': 1.15,
  'Dried fruit': 1.15,
  'Black Tea': 1.15,

  // 1.05 - 유지
  'Fruity': 1.05,
  'Other fruit': 1.05,
  'Spices': 1.05,
  'Sweet': 1.05,
  'Pepper': 1.05,
  'Pungent': 1.05,
  'Pipe tobacco': 1.05,

  // 1.0 - 기본값
  'Cereal': 1.0,
  'Vanillin': 1.0,
  'Overall sweet': 1.0,
  'Sour/Fermented': 1.0,
  'Alcohol/Fermented': 1.0,
  'Green/Vegetative': 1.0,

  // 0.85 - 호불호
  'Burnt': 0.85,
  'Sour': 0.85,
  'Raw': 0.85,
  'Beany': 0.85,
  'Olive oil': 0.85,

  // 0.70 - 결함
  'Other': 0.70,
  'Papery/Musty': 0.70,
  'Chemical': 0.70,
};

// 가중치 적용 함수
function getWeight(item) {
  // 1순위: descriptor 기준
  if (descriptorWeight[item.descriptor] !== undefined) {
    return descriptorWeight[item.descriptor];
  }
  // 2순위: subCategory 기준
  if (subCategoryWeight[item.subCategory] !== undefined) {
    return subCategoryWeight[item.subCategory];
  }
  // 기본값
  return 1.0;
}

// 실행
const filePath = path.join(__dirname, 'coffee_flavor_full.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const updated = data.map(item => ({
  ...item,
  subCategoryWeight: getWeight(item),
}));

fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), 'utf8');

// 결과 출력
const weightCount = {};
updated.forEach(item => {
  const w = item.subCategoryWeight;
  weightCount[w] = (weightCount[w] || 0) + 1;
});

console.log('\n===== 가중치 수정 완료 =====\n');
console.log('가중치 분포:');
Object.keys(weightCount).sort((a, b) => b - a).forEach(w => {
  const bar = '█'.repeat(Math.round(weightCount[w] / 2));
  console.log(`  ${w}: ${bar} (${weightCount[w]}개)`);
});
console.log('\n총 항목:', updated.length);
