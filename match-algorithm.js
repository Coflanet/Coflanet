/**
 * 커피 × 사용자 매칭 알고리즘
 *
 * - taste_match_ratio: 사용자 맛 선호(low/mid/high)와 커피 taste(숫자) 일치도 (0~1)
 * - flavor_match_ratio: 사용자 향 선호(true인 카테고리)와 커피 flavor.categories 일치도 (0~1)
 * - total_score: 0.6 * taste_match_ratio + 0.4 * flavor_match_ratio (0~1)
 */

const path = require('path');
const fs = require('fs');

// --- 설정 (조정 가능) ---

/** 커피 taste 수치(1~5 스케일)를 low / mid / high 구간으로 나누는 기준 (상한 포함) */
const TASTE_BANDS = {
  low:  { min: 0,   max: 2   },   // 0 <= x <= 2
  mid:  { min: 2,   max: 3.5 },   // 2 < x <= 3.5
  high: { min: 3.5, max: 6   },   // 3.5 < x <= 6
};

/** 사용자 flavor_preference 키 → 커피 categories 문자열 매핑 */
const FLAVOR_KEY_TO_CATEGORY = {
  fruity:      'Fruity',
  floral:      'Floral',
  nutty_cocoa: 'Nutty/Cocoa',
  roasted:     'Roasted',
};

/** total_score 가중치: [taste 비중, flavor 비중] (합 1) */
const TOTAL_SCORE_WEIGHTS = { taste: 0.6, flavor: 0.4 };

const TASTE_DIMENSIONS = ['acidity', 'body', 'sweetness', 'bitterness'];

// --- 내부 함수 ---

/**
 * 커피 수치가 사용자 선호 구간(low/mid/high)에 들어가는지 여부
 * @param {number} value - 커피 taste 값 (예: 4.2)
 * @param {string} userLevel - 사용자 선호: 'low' | 'mid' | 'high'
 * @returns {boolean}
 */
function isInTasteBand(value, userLevel) {
  const band = TASTE_BANDS[userLevel];
  if (!band) return false;
  // low: 0~2, mid: 2 초과~3.5 이하, high: 3.5 초과~6 (3.5는 mid로)
  if (userLevel === 'low') return value >= band.min && value <= 2;
  if (userLevel === 'mid') return value > 2 && value <= 3.5;
  if (userLevel === 'high') return value > 3.5 && value <= band.max;
  return false;
}

/**
 * taste_match_ratio 계산 (0~1)
 * 사용자 taste_preference(acidity, body, sweetness, bitterness 각각 low|mid|high)와
 * 커피 taste(숫자)를 비교해, 4개 차원 중 맞는 개수 / 4
 */
function computeTasteMatchRatio(userTastePreference, coffeeTasteProfile) {
  let matchCount = 0;
  for (const dim of TASTE_DIMENSIONS) {
    const userLevel = userTastePreference[dim];
    const coffeeValue = coffeeTasteProfile[dim];
    if (userLevel != null && typeof coffeeValue === 'number' && isInTasteBand(coffeeValue, userLevel)) {
      matchCount += 1;
    }
  }
  return matchCount / TASTE_DIMENSIONS.length;
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
 * total_score = weight_taste * taste_match_ratio + weight_flavor * flavor_match_ratio
 */
function computeTotalScore(tasteMatchRatio, flavorMatchRatio) {
  const w = TOTAL_SCORE_WEIGHTS;
  return w.taste * tasteMatchRatio + w.flavor * flavorMatchRatio;
}

/**
 * 한 사용자 × 한 커피에 대한 매칭 점수 객체
 */
function computeMatch(user, coffee) {
  const tasteMatchRatio = computeTasteMatchRatio(user.taste_preference, coffee.taste);
  const flavorMatchRatio = computeFlavorMatchRatio(user.flavor_preference, coffee.flavor?.categories ?? []);
  const totalScore = computeTotalScore(tasteMatchRatio, flavorMatchRatio);
  return {
    coffee_id: coffee.id,
    coffee_name: coffee.name,
    taste_match_ratio: Math.round(tasteMatchRatio * 10000) / 10000,
    flavor_match_ratio: Math.round(flavorMatchRatio * 10000) / 10000,
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
  TASTE_BANDS,
  FLAVOR_KEY_TO_CATEGORY,
  TOTAL_SCORE_WEIGHTS,
  computeTasteMatchRatio,
  computeFlavorMatchRatio,
  computeTotalScore,
  computeMatch,
  matchUserToCoffees,
  matchAll,
};

// --- CLI: node match-algorithm.js 로 실행 시 users.json, coffees.json 읽어서 결과 출력 ---
function main() {
  const dir = path.join(__dirname);
  const usersPath = path.join(dir, 'users.json');
  const coffeesPath = path.join(dir, 'coffees.json');

  if (!fs.existsSync(usersPath) || !fs.existsSync(coffeesPath)) {
    console.error('users.json 또는 coffees.json 이 없습니다.');
    process.exit(1);
  }

  const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
  const coffees = JSON.parse(fs.readFileSync(coffeesPath, 'utf8'));
  const results = matchAll(users, coffees);
  const out = { match_results: results };

  const jsonStr = JSON.stringify(out, null, 2);
  console.log(jsonStr);

  // 결과를 match_results.json 으로도 저장 (테스트용)
  const outPath = path.join(dir, 'match_results.json');
  fs.writeFileSync(outPath, jsonStr, 'utf8');
  console.error('→ 결과 저장:', outPath);
}

if (require.main === module) {
  main();
}

