const d = require('./figma_data.json');
const page = d.document.children.find(c => c.name === '✅ 설문조사');

function extractFrames(node, arr = [], depth = 0) {
  if (depth > 6) return arr;

  if ((node.type === 'FRAME' || node.type === 'RECTANGLE' || node.type === 'INSTANCE') &&
      node.fills && node.fills[0] && node.fills[0].color &&
      node.absoluteBoundingBox && node.absoluteBoundingBox.width > 20) {
    const c = node.fills[0].color;
    arr.push({
      name: node.name,
      type: node.type,
      w: Math.round(node.absoluteBoundingBox.width),
      h: Math.round(node.absoluteBoundingBox.height),
      radius: node.cornerRadius,
      bg: 'rgb('+Math.round(c.r*255)+','+Math.round(c.g*255)+','+Math.round(c.b*255)+')'
    });
  }

  if (node.children) {
    node.children.forEach(c => extractFrames(c, arr, depth + 1));
  }
  return arr;
}

const surveyResult = page.children.find(c => c.name === 'Survey_Result' && c.type === 'COMPONENT');
if (surveyResult) {
  console.log('=== Survey_Result 프레임/버튼 ===');
  const frames = extractFrames(surveyResult);
  const seen = {};
  frames.forEach(f => {
    const key = f.name + f.w + f.h;
    if (!seen[key]) {
      seen[key] = true;
      console.log(f.name + ' | ' + f.w + 'x' + f.h + ' | radius:' + (f.radius||0) + ' | ' + f.bg);
    }
  });
}
