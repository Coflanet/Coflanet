/**
 * 커피 × 사용자 매칭 알고리즘 (벡터 유사도 기반)
 *
 * - taste_similarity: 사용자 taste 벡터와 커피 taste 벡터의 코사인 유사도 (0~1)
 * - flavor_match_ratio: 사용자 향 선호(true인 카테고리)와 커피 flavor.categories 일치도 (0~1)
 * - quality_score: 커피 디스크립터 가중치 기반 품질 점수 (0.5~1.3)
 * - total_score: (0.6 * taste_similarity + 0.4 * flavor_match) * quality_multiplier
 */

const path = require('path');
const fs = require('fs');

// --- 디스크립터 가중치 로드 ---
let _flavorWeightsCache = null;

function loadFlavorWeights() {
  if (_flavorWeightsCache) return _flavorWeightsCache;

  const weightsPath = path.join(__dirname, '..', 'data', 'flavor_weights.json');
  if (fs.existsSync(weightsPath)) {
    _flavorWeightsCache = JSON.parse(fs.readFileSync(weightsPath, 'utf8'));
  } else {
    _flavorWeightsCache = [];
  }
  return _flavorWeightsCache;
}

/**
 * 디스크립터명으로 가중치 조회
 * @param {string} descriptorName - 예: "Jasmine", "Cherry"
 * @returns {number} 가중치 (기본값 1.0)
 */
function getDescriptorWeight(descriptorName) {
  const weights = loadFlavorWeights();
  const entry = weights.find(w => w.descriptor === descriptorName);
  return entry?.subCategoryWeight || 1.0;
}

/**
 * 커피의 디스크립터 기반 품질 점수 계산
 * 모든 디스크립터 가중치의 평균값 반환
 * @param {Array} descriptors - coffee.flavor.descriptors
 * @returns {number} 품질 점수 (0.5 ~ 1.3 범위)
 */
function computeFlavorQualityScore(descriptors) {
  if (!descriptors || descriptors.length === 0) return 1.0;

  const totalWeight = descriptors.reduce((sum, d) => {
    return sum + getDescriptorWeight(d.descriptor);
  }, 0);

  return totalWeight / descriptors.length;
}

// --- 설정 (조정 가능) ---

/** 사용자 flavor_preference 키 → 커피 categories 문자열 매핑 */
const FLAVOR_KEY_TO_CATEGORY = {
  fruity:      'Fruity',
  floral:      'Floral',
  nutty_cocoa: 'Nutty/Cocoa',
  roasted:     'Roasted',
};

/** total_score 가중치: [taste 비중, flavor 비중] (합 1) */
const TOTAL_SCORE_WEIGHTS = { taste: 0.6, flavor: 0.4 };

/** Taste 차원 (1~5 스케일) */
const TASTE_DIMENSIONS = ['acidity', 'body', 'sweetness', 'bitterness'];

/** Taste 값 범위 (정규화용) */
const TASTE_MIN = 1;
const TASTE_MAX = 5;

// --- 벡터 유사도 함수 ---

/**
 * 코사인 유사도 계산
 * @param {number[]} vecA
 * @param {number[]} vecB
 * @returns {number} 0~1 범위의 유사도
 */
function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * 유클리드 거리 기반 유사도 계산
 * @param {number[]} vecA
 * @param {number[]} vecB
 * @returns {number} 0~1 범위의 유사도 (거리가 가까울수록 1에 가까움)
 */
function euclideanSimilarity(vecA, vecB) {
  let sumSquares = 0;
  for (let i = 0; i < vecA.length; i++) {
    const diff = vecA[i] - vecB[i];
    sumSquares += diff * diff;
  }
  const distance = Math.sqrt(sumSquares);
  // 최대 거리: 각 차원에서 (TASTE_MAX - TASTE_MIN) 차이일 때
  const maxDistance = Math.sqrt(vecA.length * Math.pow(TASTE_MAX - TASTE_MIN, 2));
  return 1 - (distance / maxDistance);
}

/**
 * taste_similarity 계산 (0~1) - 벡터 유사도 기반
 * @param {object} userTaste - { acidity: 4.5, body: 3.0, ... }
 * @param {object} coffeeTaste - { acidity: 4.2, body: 2.8, ... }
 * @returns {number} 0~1 유사도
 */
function computeTasteSimilarity(userTaste, coffeeTaste) {
  const userVec = TASTE_DIMENSIONS.map(dim => userTaste[dim] || 3);
  const coffeeVec = TASTE_DIMENSIONS.map(dim => coffeeTaste[dim] || 3);

  // 유클리드 유사도 사용 (거리 기반이 직관적)
  return euclideanSimilarity(userVec, coffeeVec);
}

/**
 * 사용자가 선호하는 향 카테고리 목록 (flavor_preference에서 true인 것만, 카테고리명으로)
 */
function getPreferredFlavorCategories(flavorPreference) {
  return Object.entries(flavorPreference)
    .filter(([, v]) => v === true)
    .map(([k]) => FLAVOR_KEY_TO_CATEGORY[k])
    .filter(Boolean);
}

/**
 * flavor_match_ratio 계산 (0~1)
 * 사용자 flavor_preference에서 true인 카테고리가 커피 flavor.categories에
 * 몇 개 포함되는지 / (사용자 선호 개수). 선호 0개면 0 반환.
 */
function computeFlavorMatchRatio(userFlavorPreference, coffeeCategories) {
  const preferred = getPreferredFlavorCategories(userFlavorPreference);
  if (preferred.length === 0) return 0;
  const matchCount = preferred.filter((cat) => coffeeCategories && coffeeCategories.includes(cat)).length;
  return matchCount / preferred.length;
}

/**
 * total_score 계산 (0~1)
 * total_score = (weight_taste * taste_match_ratio + weight_flavor * flavor_match_ratio) * quality_multiplier
 * quality_multiplier: 품질 점수를 0.9~1.1 범위로 정규화
 */
function computeTotalScore(tasteMatchRatio, flavorMatchRatio, qualityScore = 1.0) {
  const w = TOTAL_SCORE_WEIGHTS;
  const baseScore = w.taste * tasteMatchRatio + w.flavor * flavorMatchRatio;

  // 품질 점수를 곱셈 계수로 변환 (0.5~1.3 → 0.9~1.1)
  // 기본값 1.0일 때 multiplier = 1.0
  const qualityMultiplier = 0.9 + (qualityScore - 0.5) * (0.2 / 0.8);

  return Math.min(1.0, baseScore * qualityMultiplier);
}

/**
 * 한 사용자 × 한 커피에 대한 매칭 점수 객체
 */
function computeMatch(user, coffee) {
  const tasteSimilarity = computeTasteSimilarity(user.taste_preference, coffee.taste);
  const flavorMatchRatio = computeFlavorMatchRatio(user.flavor_preference, coffee.flavor?.categories ?? []);
  const qualityScore = computeFlavorQualityScore(coffee.flavor?.descriptors ?? []);
  const totalScore = computeTotalScore(tasteSimilarity, flavorMatchRatio, qualityScore);
  return {
    coffee_id: coffee.id,
    coffee_name: coffee.name,
    taste_similarity: Math.round(tasteSimilarity * 10000) / 10000,
    flavor_match_ratio: Math.round(flavorMatchRatio * 10000) / 10000,
    quality_score: Math.round(qualityScore * 10000) / 10000,
    total_score: Math.round(totalScore * 10000) / 10000,
  };
}

/**
 * 한 사용자에 대해 모든 커피와의 매칭 결과를 계산하고, total_score 내림차순 정렬
 */
function matchUserToCoffees(user, coffees) {
  const results = coffees.map((coffee) => computeMatch(user, coffee));
  results.sort((a, b) => b.total_score - a.total_score);
  return results;
}

/**
 * 모든 사용자 × 모든 커피 매칭 결과 생성
 * @returns {{ [user_id: string]: Array<{ coffee_id, coffee_name, taste_match_ratio, flavor_match_ratio, total_score }> }}
 */
function matchAll(users, coffees) {
  const matchResults = {};
  for (const user of users) {
    const id = user.user_id;
    matchResults[id] = matchUserToCoffees(user, coffees);
  }
  return matchResults;
}

// --- 모듈 내보내기 (다른 파일에서 require 시 사용) ---
module.exports = {
  FLAVOR_KEY_TO_CATEGORY,
  TOTAL_SCORE_WEIGHTS,
  TASTE_DIMENSIONS,
  loadFlavorWeights,
  getDescriptorWeight,
  computeFlavorQualityScore,
  cosineSimilarity,
  euclideanSimilarity,
  computeTasteSimilarity,
  computeFlavorMatchRatio,
  computeTotalScore,
  computeMatch,
  matchUserToCoffees,
  matchAll,
};

// --- CLI: node match.js 로 실행 시 테스트 ---
function main() {
  const dataDir = path.join(__dirname, '..', 'data');
  const usersPath = path.join(dataDir, 'users.json');
  const coffeesPath = path.join(dataDir, 'coffees.json');

  if (!fs.existsSync(usersPath) || !fs.existsSync(coffeesPath)) {
    console.error('data/users.json 또는 data/coffees.json 이 없습니다.');
    process.exit(1);
  }

  const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
  const coffees = JSON.parse(fs.readFileSync(coffeesPath, 'utf8'));
  const results = matchAll(users, coffees);

  const jsonStr = JSON.stringify({ match_results: results }, null, 2);
  console.log(jsonStr);
}

if (require.main === module) {
  main();
}

