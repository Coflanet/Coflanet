/**
 * 라이프스타일 기반 커피 매칭 알고리즘
 *
 * 간접 질문(라이프스타일, 성격)을 통해 커피 취향을 추론하고
 * 추천 이유를 자동 생성합니다.
 */

const fs = require('fs');
const path = require('path');

// --- 응답별 가중치 매핑 ---
const answerWeights = {
  Q1: { // 아침 스타일
    1: { acidity: 2, body: -1, sweetness: 0, bitterness: -1, fruity: 1, floral: 1, nutty_cocoa: 0, roasted: 0, trait: "아침형 인간", keyword: "상쾌한" },
    2: { acidity: 1, body: 0, sweetness: 0, bitterness: 0, fruity: 1, floral: 0, nutty_cocoa: 0, roasted: 0, trait: "아침형 인간", keyword: "활기찬" },
    3: { acidity: 0, body: 1, sweetness: 1, bitterness: 0, fruity: 0, floral: 0, nutty_cocoa: 1, roasted: 0, trait: "균형잡힌 생활파", keyword: "편안한" },
    4: { acidity: -1, body: 1, sweetness: 0, bitterness: 1, fruity: 0, floral: 0, nutty_cocoa: 1, roasted: 1, trait: "여유로운 아침파", keyword: "깊은" },
    5: { acidity: -1, body: 2, sweetness: 0, bitterness: 1, fruity: -1, floral: 0, nutty_cocoa: 1, roasted: 2, trait: "늦잠 러버", keyword: "진한" }
  },
  Q2: { // 주말 활동
    1: { acidity: 2, body: 0, sweetness: 0, bitterness: 0, fruity: 2, floral: 1, nutty_cocoa: 0, roasted: 0, trait: "모험가", keyword: "독특한" },
    2: { acidity: 1, body: 0, sweetness: 1, bitterness: 0, fruity: 1, floral: 1, nutty_cocoa: 0, roasted: 0, trait: "소셜 버터플라이", keyword: "화사한" },
    3: { acidity: 0, body: 1, sweetness: 0, bitterness: 0, fruity: 0, floral: 0, nutty_cocoa: 1, roasted: 1, trait: "자기계발러", keyword: "균형잡힌" },
    4: { acidity: 0, body: 1, sweetness: 1, bitterness: 0, fruity: 0, floral: 1, nutty_cocoa: 1, roasted: 0, trait: "집순이/집돌이", keyword: "포근한" },
    5: { acidity: -1, body: 2, sweetness: 1, bitterness: 0, fruity: 0, floral: 0, nutty_cocoa: 1, roasted: 1, trait: "휴식 전문가", keyword: "편안한" }
  },
  Q3: { // 스트레스 해소
    1: { acidity: 1, body: 0, sweetness: 0, bitterness: 0, fruity: 1, floral: 0, nutty_cocoa: 0, roasted: 1, trait: "액티브 힐러", keyword: "에너지 넘치는" },
    2: { acidity: 0, body: 0, sweetness: 1, bitterness: 0, fruity: 1, floral: 1, nutty_cocoa: 0, roasted: 0, trait: "소통형 인간", keyword: "부드러운" },
    3: { acidity: 0, body: 0, sweetness: 0, bitterness: 0, fruity: 0, floral: 1, nutty_cocoa: 0, roasted: 0, trait: "감성 충전러", keyword: "은은한" },
    4: { acidity: 0, body: 1, sweetness: 2, bitterness: 0, fruity: 0, floral: 0, nutty_cocoa: 2, roasted: 0, trait: "미식가", keyword: "달콤한" },
    5: { acidity: 0, body: 1, sweetness: 0, bitterness: 1, fruity: 0, floral: 0, nutty_cocoa: 1, roasted: 1, trait: "내면 탐구자", keyword: "깊은" }
  },
  Q4: { // 새로운 경험
    1: { acidity: 2, body: 0, sweetness: 0, bitterness: 0, fruity: 2, floral: 1, nutty_cocoa: 0, roasted: 0, trait: "트렌드세터", keyword: "새로운" },
    2: { acidity: 1, body: 0, sweetness: 0, bitterness: 0, fruity: 1, floral: 1, nutty_cocoa: 0, roasted: 0, trait: "오픈 마인드", keyword: "다채로운" },
    3: { acidity: 0, body: 1, sweetness: 0, bitterness: 0, fruity: 0, floral: 0, nutty_cocoa: 1, roasted: 0, trait: "신중파", keyword: "검증된" },
    4: { acidity: 0, body: 1, sweetness: 1, bitterness: 0, fruity: 0, floral: 0, nutty_cocoa: 1, roasted: 1, trait: "안정 추구형", keyword: "믿을 수 있는" },
    5: { acidity: -1, body: 2, sweetness: 1, bitterness: 0, fruity: 0, floral: 0, nutty_cocoa: 2, roasted: 1, trait: "클래식 러버", keyword: "클래식한" }
  },
  Q5: { // 맛 선호
    1: { acidity: 3, body: 0, sweetness: 0, bitterness: 0, fruity: 2, floral: 1, nutty_cocoa: 0, roasted: 0, trait: "상큼파", keyword: "상큼한" },
    2: { acidity: 0, body: 0, sweetness: 3, bitterness: -1, fruity: 1, floral: 1, nutty_cocoa: 1, roasted: 0, trait: "달콤파", keyword: "달콤한" },
    3: { acidity: 0, body: 1, sweetness: 0, bitterness: 0, fruity: 0, floral: 0, nutty_cocoa: 3, roasted: 1, trait: "고소파", keyword: "고소한" },
    4: { acidity: 0, body: 3, sweetness: 0, bitterness: 1, fruity: 0, floral: 0, nutty_cocoa: 1, roasted: 2, trait: "진한맛파", keyword: "묵직한" },
    5: { acidity: 1, body: 0, sweetness: 0, bitterness: 0, fruity: 1, floral: 0, nutty_cocoa: 0, roasted: 1, trait: "자극파", keyword: "강렬한" }
  },
  Q6: { // 디저트 선호
    1: { acidity: 2, body: -1, sweetness: 1, bitterness: 0, fruity: 3, floral: 1, nutty_cocoa: 0, roasted: 0, trait: "과일 타르트파", keyword: "상큼한" },
    2: { acidity: 0, body: 1, sweetness: 2, bitterness: 0, fruity: 0, floral: 1, nutty_cocoa: 1, roasted: 0, trait: "치즈케이크파", keyword: "부드러운" },
    3: { acidity: 0, body: 2, sweetness: 1, bitterness: 1, fruity: 0, floral: 0, nutty_cocoa: 3, roasted: 1, trait: "초콜릿 러버", keyword: "달콤쌉싸름한" },
    4: { acidity: 0, body: 1, sweetness: 0, bitterness: 0, fruity: 0, floral: 0, nutty_cocoa: 3, roasted: 1, trait: "견과류 마니아", keyword: "고소한" },
    5: { acidity: 0, body: 1, sweetness: 2, bitterness: 0, fruity: 0, floral: 0, nutty_cocoa: 1, roasted: 2, trait: "캐러멜파", keyword: "달콤한" }
  },
  Q7: { // 음료 온도
    1: { acidity: 2, body: -1, sweetness: 0, bitterness: 0, fruity: 1, floral: 0, nutty_cocoa: 0, roasted: 0, trait: "시원함 추구", keyword: "청량한" },
    2: { acidity: 1, body: 0, sweetness: 0, bitterness: 0, fruity: 1, floral: 0, nutty_cocoa: 0, roasted: 0, trait: "쿨한 타입", keyword: "상쾌한" },
    3: { acidity: 0, body: 0, sweetness: 0, bitterness: 0, fruity: 0, floral: 0, nutty_cocoa: 0, roasted: 0, trait: "유연한 타입", keyword: "균형잡힌" },
    4: { acidity: 0, body: 1, sweetness: 0, bitterness: 0, fruity: 0, floral: 0, nutty_cocoa: 1, roasted: 1, trait: "따뜻함 추구", keyword: "포근한" },
    5: { acidity: -1, body: 2, sweetness: 0, bitterness: 1, fruity: 0, floral: 0, nutty_cocoa: 1, roasted: 2, trait: "온기 러버", keyword: "따뜻한" }
  },
  Q8: { // 향기 선호
    1: { acidity: 0, body: 0, sweetness: 0, bitterness: 0, fruity: 0, floral: 3, nutty_cocoa: 0, roasted: 0, trait: "플로럴 감성", keyword: "은은한" },
    2: { acidity: 1, body: 0, sweetness: 0, bitterness: 0, fruity: 3, floral: 1, nutty_cocoa: 0, roasted: 0, trait: "프루티 감성", keyword: "생동감 있는" },
    3: { acidity: 0, body: 0, sweetness: 0, bitterness: 0, fruity: 0, floral: 2, nutty_cocoa: 0, roasted: 0, trait: "자연주의자", keyword: "싱그러운" },
    4: { acidity: 0, body: 0, sweetness: 2, bitterness: 0, fruity: 0, floral: 0, nutty_cocoa: 2, roasted: 1, trait: "스위트 감성", keyword: "달콤한" },
    5: { acidity: 0, body: 2, sweetness: 0, bitterness: 1, fruity: 0, floral: 0, nutty_cocoa: 1, roasted: 3, trait: "딥한 감성", keyword: "깊은" }
  },
  Q9: { // 성격 표현
    1: { acidity: 2, body: 0, sweetness: 0, bitterness: 0, fruity: 2, floral: 0, nutty_cocoa: 0, roasted: 0, trait: "에너자이저", keyword: "활기찬" },
    2: { acidity: 0, body: 0, sweetness: 2, bitterness: 0, fruity: 1, floral: 1, nutty_cocoa: 1, roasted: 0, trait: "따뜻한 사람", keyword: "부드러운" },
    3: { acidity: 0, body: 1, sweetness: 1, bitterness: 0, fruity: 0, floral: 1, nutty_cocoa: 1, roasted: 0, trait: "차분한 영혼", keyword: "안정적인" },
    4: { acidity: 1, body: 0, sweetness: 0, bitterness: 0, fruity: 1, floral: 1, nutty_cocoa: 0, roasted: 1, trait: "개성파", keyword: "독특한" },
    5: { acidity: 0, body: 1, sweetness: 0, bitterness: 0, fruity: 0, floral: 0, nutty_cocoa: 2, roasted: 1, trait: "실용주의자", keyword: "믿음직한" }
  },
  Q10: { // 결정 스타일
    1: { acidity: 1, body: 0, sweetness: 0, bitterness: 0, fruity: 1, floral: 0, nutty_cocoa: 0, roasted: 0, trait: "직감형", keyword: "선명한" },
    2: { acidity: 1, body: 0, sweetness: 0, bitterness: 0, fruity: 0, floral: 0, nutty_cocoa: 0, roasted: 0, trait: "스마트형", keyword: "깔끔한" },
    3: { acidity: 0, body: 1, sweetness: 0, bitterness: 0, fruity: 0, floral: 0, nutty_cocoa: 1, roasted: 0, trait: "숙고형", keyword: "정갈한" },
    4: { acidity: 0, body: 0, sweetness: 1, bitterness: 0, fruity: 0, floral: 1, nutty_cocoa: 0, roasted: 0, trait: "조화형", keyword: "조화로운" },
    5: { acidity: 0, body: 1, sweetness: 0, bitterness: 0, fruity: 0, floral: 0, nutty_cocoa: 1, roasted: 1, trait: "분석형", keyword: "깊이 있는" }
  }
};

// --- 추론된 선호도 계산 ---
function computeInferredPreference(answers) {
  const scores = {
    acidity: 0, body: 0, sweetness: 0, bitterness: 0,
    fruity: 0, floral: 0, nutty_cocoa: 0, roasted: 0
  };
  const traits = [];

  for (const [qId, answer] of Object.entries(answers)) {
    const weight = answerWeights[qId]?.[answer];
    if (weight) {
      scores.acidity += weight.acidity || 0;
      scores.body += weight.body || 0;
      scores.sweetness += weight.sweetness || 0;
      scores.bitterness += weight.bitterness || 0;
      scores.fruity += weight.fruity || 0;
      scores.floral += weight.floral || 0;
      scores.nutty_cocoa += weight.nutty_cocoa || 0;
      scores.roasted += weight.roasted || 0;

      if (weight.trait) {
        traits.push({ qId, answer, trait: weight.trait, keyword: weight.keyword });
      }
    }
  }

  // 정규화 (0~1 범위)
  const normalize = (val, min, max) => Math.max(0, Math.min(1, (val - min) / (max - min)));
  const tasteInferred = {
    acidity: normalize(scores.acidity, -5, 15),
    body: normalize(scores.body, -5, 15),
    sweetness: normalize(scores.sweetness, -5, 15),
    bitterness: normalize(scores.bitterness, -5, 10)
  };
  const flavorInferred = {
    fruity: normalize(scores.fruity, -5, 15),
    floral: normalize(scores.floral, -5, 10),
    nutty_cocoa: normalize(scores.nutty_cocoa, -5, 15),
    roasted: normalize(scores.roasted, -5, 12)
  };

  return { tasteInferred, flavorInferred, traits, rawScores: scores };
}

// --- 기존 알고리즘과 연결 ---
function convertToPreference(inferred) {
  // 0~1 범위를 1~5 스케일로 변환
  const toScale = (val) => {
    return Math.round((1 + val * 4) * 10) / 10; // 1.0 ~ 5.0
  };

  return {
    taste_preference: {
      acidity: toScale(inferred.tasteInferred.acidity),
      body: toScale(inferred.tasteInferred.body),
      sweetness: toScale(inferred.tasteInferred.sweetness),
      bitterness: toScale(inferred.tasteInferred.bitterness)
    },
    flavor_preference: {
      fruity: inferred.flavorInferred.fruity >= 0.4,
      floral: inferred.flavorInferred.floral >= 0.4,
      nutty_cocoa: inferred.flavorInferred.nutty_cocoa >= 0.4,
      roasted: inferred.flavorInferred.roasted >= 0.4
    }
  };
}

// --- 특성 선택 기준: 가중치 기여도 계산 ---
function selectDominantTraits(traits, coffee) {
  // 커피 특성 추출
  const coffeeTraits = {
    highAcidity: coffee.taste.acidity > 3.5,
    highBody: coffee.taste.body > 3.5,
    highSweetness: coffee.taste.sweetness > 3.5,
    fruity: coffee.flavor?.categories?.includes("Fruity"),
    floral: coffee.flavor?.categories?.includes("Floral"),
    nutty_cocoa: coffee.flavor?.categories?.includes("Nutty/Cocoa"),
    roasted: coffee.flavor?.categories?.includes("Roasted")
  };

  // 각 특성별 관련도 점수 계산
  const scoredTraits = traits.map(t => {
    const w = answerWeights[t.qId]?.[t.answer] || {};
    let relevanceScore = 0;

    // 커피 특성과 매칭되는 가중치에 점수 부여
    if (coffeeTraits.highAcidity && w.acidity > 0) relevanceScore += w.acidity;
    if (coffeeTraits.highBody && w.body > 0) relevanceScore += w.body;
    if (coffeeTraits.highSweetness && w.sweetness > 0) relevanceScore += w.sweetness;
    if (coffeeTraits.fruity && w.fruity > 0) relevanceScore += w.fruity;
    if (coffeeTraits.floral && w.floral > 0) relevanceScore += w.floral;
    if (coffeeTraits.nutty_cocoa && w.nutty_cocoa > 0) relevanceScore += w.nutty_cocoa;
    if (coffeeTraits.roasted && w.roasted > 0) relevanceScore += w.roasted;

    // 가중치 절대값 합 (전체 기여도)
    const totalWeight = Math.abs(w.acidity || 0) + Math.abs(w.body || 0) +
                        Math.abs(w.sweetness || 0) + Math.abs(w.bitterness || 0) +
                        Math.abs(w.fruity || 0) + Math.abs(w.floral || 0) +
                        Math.abs(w.nutty_cocoa || 0) + Math.abs(w.roasted || 0);

    return { ...t, relevanceScore, totalWeight };
  });

  // 관련도 점수 기준 정렬
  scoredTraits.sort((a, b) => {
    if (b.relevanceScore !== a.relevanceScore) {
      return b.relevanceScore - a.relevanceScore;
    }
    return b.totalWeight - a.totalWeight;
  });

  // 라이프스타일(Q1-Q4)과 맛/향(Q5-Q10)에서 각각 1개씩 선택
  const lifestyleTrait = scoredTraits.find(t => ['Q1', 'Q2', 'Q3', 'Q4'].includes(t.qId));
  const tasteTrait = scoredTraits.find(t => ['Q5', 'Q6', 'Q7', 'Q8'].includes(t.qId));

  const selected = [];
  if (lifestyleTrait) selected.push(lifestyleTrait);
  if (tasteTrait && tasteTrait.qId !== lifestyleTrait?.qId) selected.push(tasteTrait);

  // 선택된 게 없으면 상위 2개
  if (selected.length === 0) {
    return scoredTraits.slice(0, 2);
  }

  return selected;
}

// --- 추천 이유 생성 ---
function generateRecommendationReason(userName, traits, coffee, matchScore) {
  // 커피와 가장 관련 있는 특성 선택
  const dominantTraits = selectDominantTraits(traits, coffee);

  if (dominantTraits.length === 0) {
    return `${userName}님께 ${coffee.name}을(를) 추천드려요.`;
  }

  const trait1 = dominantTraits[0];

  // 커피 특성 설명 생성
  const coffeeDescParts = [];
  if (coffee.taste.acidity > 3.5) coffeeDescParts.push("밝은 산미");
  if (coffee.taste.body > 3.5) coffeeDescParts.push("묵직한 바디감");
  if (coffee.taste.sweetness > 3.5) coffeeDescParts.push("은은한 단맛");

  const flavorCategories = coffee.flavor?.categories || [];
  if (flavorCategories.includes("Fruity")) coffeeDescParts.push("과일향");
  if (flavorCategories.includes("Floral")) coffeeDescParts.push("꽃향기");
  if (flavorCategories.includes("Nutty/Cocoa")) coffeeDescParts.push("고소한 견과류 노트");
  if (flavorCategories.includes("Roasted")) coffeeDescParts.push("깊은 로스팅 향");

  const coffeeDesc = coffeeDescParts.slice(0, 2).join("와 ");

  // 문장 생성
  const reason = `${trait1.trait}이신 ${userName}님께 ${trait1.keyword} ${coffeeDesc}의 ${coffee.name}을(를) 추천드려요.`;

  return reason;
}

// --- 전체 매칭 프로세스 ---
function matchLifestyleUser(userName, answers, coffees) {
  const inferred = computeInferredPreference(answers);
  const preference = convertToPreference(inferred);

  // 기존 매칭 알고리즘 활용
  const { matchUserToCoffees } = require('./match.js');
  const user = {
    user_id: 'lifestyle_user',
    taste_preference: preference.taste_preference,
    flavor_preference: preference.flavor_preference
  };

  const results = matchUserToCoffees(user, coffees);
  const topCoffee = coffees.find(c => c.id === results[0].coffee_id);

  // 추천 이유 생성
  const reason = generateRecommendationReason(userName, inferred.traits, topCoffee, results[0].total_score);

  return {
    userName,
    answers,
    inferred,
    preference,
    topRecommendations: results.slice(0, 3),
    recommendedCoffee: topCoffee,
    reason
  };
}

// --- 랜덤 테스트 ---
function runRandomTest() {
  const dataDir = path.join(__dirname, '..', 'data');
  const survey = JSON.parse(fs.readFileSync(path.join(dataDir, 'survey', 'lifestyle.json'), 'utf8'));
  const coffees = JSON.parse(fs.readFileSync(path.join(dataDir, 'coffees.json'), 'utf8'));

  // 랜덤 응답 생성
  const randomAnswers = {};
  survey.questions.forEach(q => {
    randomAnswers[q.id] = Math.floor(Math.random() * 5) + 1;
  });

  // 매칭 실행
  const result = matchLifestyleUser("테스트유저", randomAnswers, coffees);

  return result;
}

// --- 모듈 내보내기 ---
module.exports = {
  answerWeights,
  computeInferredPreference,
  convertToPreference,
  selectDominantTraits,
  generateRecommendationReason,
  matchLifestyleUser,
  runRandomTest
};

// --- CLI 실행 ---
if (require.main === module) {
  const result = runRandomTest();
  const dataDir = path.join(__dirname, '..', 'data');
  const survey = JSON.parse(fs.readFileSync(path.join(dataDir, 'survey', 'lifestyle.json'), 'utf8'));

  console.log("\n========================================");
  console.log("    라이프스타일 기반 커피 추천 테스트");
  console.log("========================================\n");

  console.log("[ 설문 응답 ]");
  for (const q of survey.questions) {
    const answer = result.answers[q.id];
    console.log(`${q.id}. ${q.question}`);
    console.log(`   → ${answer}. ${q.options[answer - 1]}`);
  }

  console.log("\n[ 추론된 성향 ]");
  result.inferred.traits.forEach(t => {
    console.log(`   • ${t.trait} (${t.keyword})`);
  });

  console.log("\n[ 추론된 선호도 ]");
  console.log("   Taste:", result.preference.taste_preference);
  console.log("   Flavor:", result.preference.flavor_preference);

  console.log("\n[ TOP 3 추천 커피 ]");
  result.topRecommendations.forEach((r, i) => {
    console.log(`   ${i + 1}. ${r.coffee_name} (${(r.total_score * 100).toFixed(1)}%)`);
  });

  console.log("\n[ 추천 이유 ]");
  console.log(`   "${result.reason}"`);

  console.log("\n========================================\n");
}
