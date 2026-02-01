const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname);
const coffees = JSON.parse(fs.readFileSync(path.join(dir, 'coffees.json'), 'utf8'));

// descriptor → 한글 표현
const ko = {
  Orange: '오렌지', Strawberry: '딸기', Floral: '꽃향', Chocolate: '초콜릿', 'Overall sweet': '단맛',
  Coconut: '코코넛', 'Black Tea': '홍차', Jasmine: '자스민', Vanillin: '바닐라',
  Almond: '아몬드', Honey: '꿀', Roasted: '로스팅', 'Brown, Roast': '브라운 로스트',
  Raspberry: '라즈베리', 'Dark chocolate': '다크 초콜릿', Cereal: '곡물',
  Peanuts: '땅콩', Grape: '포도', 'Brown sugar': '흑설탕', Chamomile: '캐모마일',
  Grapefruit: '자몽', Sweet: '단맛', Smoky: '스모키', Cocoa: '코코아', 'Nutty/Cocoa': '견과·코코아',
  Pomegranate: '석류', Berry: '베리', Prune: '자두', 'Pipe tobacco': '파이프 담배',
  Pepper: '후추', Nutty: '견과', Ashy: '애쉬', Caramelized: '캐러멜',
  Apple: '사과', 'Nutty/Cocoa': '견과·코코아', Pineapple: '파인애플', 'Malic acid': '산미',
  Burnt: '번트', 'Mapple syrup': '메이플 시럽', Raisin: '건포도', Grain: '곡물', Malt: '몰트',
  Hazelnut: '헤이즐넛', Caramelized: '캐러멜', Fruity: '과일', 'Pipe tobacco': '파이프 담배',
  Pear: '배', Walnut: '호두', 'Dark Roast': '다크 로스트', Tobacco: '담배', 'Cacao Nibs': '카카오닙스',
  'Red Apple': '사과', 'Orange Blossom': '오렌지 블라썸', Caramel: '캐러멜',
  Hibiscus: '히비스커스', 'Brown Sugar': '흑설탕', Gardenia: '가드니아',
  Winey: '와이니', 'Red Wine': '레드 와인', Rum: '럼', Fermented: '발효', Overripe: '과숙',
  'Light Toast': '라이트 토스트', 'Roasted Nuts': '로스티드 너트', Lime: '라임', Bergamot: '베르가못',
  Peach: '복숭아', 'Mandarin Orange': '만다린', 'Milk Chocolate': '밀크 초콜릿',
  Blackcurrant: '블랙커런트', Toast: '토스트', Lavender: '라벤더', Blueberry: '블루베리',
  'Passion Fruit': '패션프루트', Molasses: '당밀', Vanilla: '바닐라', 'Sweet Aromatics': '스위트 아로마',
  Rose: '로즈', Cinnamon: '시나몬', Clove: '클로브', Nutmeg: '너트멕', Anise: '아니스',
  'Brown spice': '브라운 스파이스', Pungent: '훈연', Woody: '우디', 'Papery/Musty': '페이퍼리',
  Blackberry: '블랙베리', Cherry: '체리', Lemon: '레몬', 'Citric acid': '시트릭 산',
};

function uniqueDescriptors(cupNote) {
  const seen = new Set();
  return (cupNote.descriptors || []).filter((d) => {
    const k = d.descriptor;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function toKoName(descriptor) {
  return ko[descriptor] || descriptor;
}

function buildDescription(coffee) {
  const descs = uniqueDescriptors(coffee.cup_note);
  const names = coffee.name.split(' ');
  const origin = names[0];
  const list = descs.slice(0, 4).map((d) => toKoName(d.descriptor));
  if (list.length === 0) return `${origin} 원두. 깔끔한 바디와 은은한 여운이 특징입니다.`;
  if (list.length === 1) return `${list[0]} 향이 느껴지는 ${origin} 원두. 깔끔하고 달콤한 여운이 남습니다.`;
  if (list.length === 2) return `${list[0]}와 ${list[1]}가 어우러진 ${origin} 원두. 균형 잡힌 풍미가 매력입니다.`;
  const last = list.pop();
  const front = list.join(', ');
  const josa = (word) => (/[가-힣]$/.test(word) && (word.charCodeAt(word.length - 1) - 0xac00) % 28 !== 0 ? '이' : '가');
  return `${front}과 ${last}${josa(last)} 조화를 이루는 ${origin} 원두. 깔끔한 산미와 달콤한 여운이 특징입니다.`;
}

for (const c of coffees) {
  c.product.description = buildDescription(c);
}

fs.writeFileSync(path.join(dir, 'coffees.json'), JSON.stringify(coffees, null, 2), 'utf8');
console.log('product.description 한글 반영 완료:', coffees.length, '건');
