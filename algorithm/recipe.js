/**
 * 레시피 병합 유틸리티
 *
 * 우선순위: 사용자 커스텀 > 커피별 권장값 > 기본 레시피
 */

const fs = require('fs');
const path = require('path');

// --- 데이터 로드 ---

let _recipesCache = null;

function loadRecipes() {
  if (_recipesCache) return _recipesCache;

  const recipesPath = path.join(__dirname, '..', 'data', 'recipes.json');
  if (fs.existsSync(recipesPath)) {
    _recipesCache = JSON.parse(fs.readFileSync(recipesPath, 'utf8'));
  } else {
    _recipesCache = {};
  }
  return _recipesCache;
}

// --- 병합 함수 ---

/**
 * 레시피 병합 (기본 + 커피별 + 사용자 커스텀)
 * @param {string} method - 'handdrop' | 'espresso'
 * @param {object} coffee - 커피 객체 (recipe_override 포함)
 * @param {object} user - 사용자 객체 (custom_recipes 포함)
 * @returns {object} 병합된 레시피
 */
function getRecipe(method, coffee = null, user = null) {
  const recipes = loadRecipes();
  const baseRecipe = recipes[method];

  if (!baseRecipe) {
    return null;
  }

  // 1. 기본 레시피 복사
  const merged = JSON.parse(JSON.stringify(baseRecipe));

  // 2. 커피별 오버라이드 적용
  if (coffee?.recipe_override?.[method]) {
    const coffeeOverride = coffee.recipe_override[method];
    merged.default = { ...merged.default, ...coffeeOverride };
  }

  // 3. 사용자 커스텀 적용
  if (user?.custom_recipes?.[coffee?.id]?.[method]) {
    const userCustom = user.custom_recipes[coffee.id][method];
    merged.default = { ...merged.default, ...userCustom };
    merged.isCustomized = true;
  }

  return merged;
}

/**
 * 사용자 커스텀 레시피 저장
 * @param {object} user - 사용자 객체
 * @param {string} coffeeId - 커피 ID
 * @param {string} method - 'handdrop' | 'espresso'
 * @param {object} customValues - 커스텀 값 { coffee_g, water_temp, ... }
 * @returns {object} 업데이트된 사용자 객체
 */
function saveCustomRecipe(user, coffeeId, method, customValues) {
  if (!user.custom_recipes) {
    user.custom_recipes = {};
  }

  if (!user.custom_recipes[coffeeId]) {
    user.custom_recipes[coffeeId] = {};
  }

  user.custom_recipes[coffeeId][method] = customValues;

  return user;
}

/**
 * 사용자 커스텀 레시피 초기화 (삭제)
 * @param {object} user - 사용자 객체
 * @param {string} coffeeId - 커피 ID
 * @param {string} method - 'handdrop' | 'espresso'
 * @returns {object} 업데이트된 사용자 객체
 */
function resetCustomRecipe(user, coffeeId, method) {
  if (user.custom_recipes?.[coffeeId]?.[method]) {
    delete user.custom_recipes[coffeeId][method];

    // 빈 객체 정리
    if (Object.keys(user.custom_recipes[coffeeId]).length === 0) {
      delete user.custom_recipes[coffeeId];
    }
  }

  return user;
}

/**
 * 사용자의 모든 커스텀 레시피 목록 조회
 * @param {object} user - 사용자 객체
 * @returns {Array} [{ coffeeId, method, values }, ...]
 */
function getCustomRecipeList(user) {
  const list = [];

  if (!user.custom_recipes) return list;

  for (const [coffeeId, methods] of Object.entries(user.custom_recipes)) {
    for (const [method, values] of Object.entries(methods)) {
      list.push({ coffeeId, method, values });
    }
  }

  return list;
}

// --- 모듈 내보내기 ---
module.exports = {
  loadRecipes,
  getRecipe,
  saveCustomRecipe,
  resetCustomRecipe,
  getCustomRecipeList
};

// --- CLI 테스트 ---
if (require.main === module) {
  const dataDir = path.join(__dirname, '..', 'data');
  const coffees = JSON.parse(fs.readFileSync(path.join(dataDir, 'coffees.json'), 'utf8'));
  const users = JSON.parse(fs.readFileSync(path.join(dataDir, 'users.json'), 'utf8'));

  const coffee = coffees[0]; // coffee_001
  const user = users[0];     // user_001

  console.log('\n========================================');
  console.log('    레시피 병합 테스트');
  console.log('========================================\n');

  console.log('[ 기본 핸드드립 레시피 ]');
  const baseRecipe = getRecipe('handdrop');
  console.log('  원두:', baseRecipe.default.coffee_g + 'g');
  console.log('  물:', baseRecipe.default.water_ml + 'ml');
  console.log('  온도:', baseRecipe.default.water_temp + '°C');

  console.log('\n[ user_001 + coffee_001 커스텀 적용 ]');
  const customRecipe = getRecipe('handdrop', coffee, user);
  console.log('  원두:', customRecipe.default.coffee_g + 'g');
  console.log('  물:', customRecipe.default.water_ml + 'ml');
  console.log('  온도:', customRecipe.default.water_temp + '°C');
  console.log('  메모:', customRecipe.default.memo || '없음');
  console.log('  커스텀 여부:', customRecipe.isCustomized ? '✅' : '❌');

  console.log('\n[ user_001 커스텀 레시피 목록 ]');
  const customList = getCustomRecipeList(user);
  customList.forEach(item => {
    console.log(`  - ${item.coffeeId} (${item.method}): ${item.values.memo || '메모 없음'}`);
  });

  console.log('\n========================================\n');
}
