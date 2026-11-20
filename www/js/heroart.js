// The warrior, drawn in the rune stone style: dark outlines, flat fills, a light strip on the lit side.
// He is a layered paper doll, so each piece of gear can be swapped by tier without redrawing the rest.
import { carve, halo, GLOW } from './stones.js';

const INK = '#07050e';
const P = (pts) => pts.map(([x, y]) => `${x},${y}`).join(' ');
const mir = (pts) => pts.map(([x, y]) => [200 - x, y]).reverse();
const poly = (pts, fill, sw = 2) => `<polygon points="${P(pts)}" fill="${fill}" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round"/>`;
const flat = (pts, fill, op = 1) => `<polygon points="${P(pts)}" fill="${fill}" opacity="${op}"/>`;
const stroke = (d, col, w = 1.4, op = 1) => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" opacity="${op}"/>`;
const dot = (x, y, r, fill, sw = 1.4) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${INK}" stroke-width="${sw}"/>`;
const both = (fn) => fn((p) => p) + fn(mir);

// Materials by tier: [base, light, dark, trim]
const MAT = [
  null,
  ['hsl(24 40% 34%)', 'hsl(28 45% 47%)', 'hsl(20 40% 23%)', 'hsl(36 42% 58%)'],
  ['hsl(36 56% 46%)', 'hsl(44 78% 67%)', 'hsl(30 52% 29%)', 'hsl(48 90% 80%)'],
  ['hsl(220 14% 52%)', 'hsl(214 22% 75%)', 'hsl(226 18% 32%)', 'hsl(40 18% 86%)'],
  ['hsl(226 20% 38%)', 'hsl(220 24% 58%)', 'hsl(230 24% 22%)', 'hsl(46 95% 62%)'],
];
const CLOAK = [null, ['hsl(26 28% 30%)', 'hsl(28 30% 40%)', 'hsl(24 28% 20%)', 'hsl(36 30% 50%)'], ['hsl(150 32% 28%)', 'hsl(148 34% 38%)', 'hsl(152 34% 18%)', 'hsl(44 60% 58%)'], ['hsl(215 48% 33%)', 'hsl(212 50% 45%)', 'hsl(218 50% 21%)', 'hsl(44 70% 64%)'], ['hsl(276 46% 34%)', 'hsl(278 48% 47%)', 'hsl(274 48% 21%)', 'hsl(46 95% 62%)']];
const SKIN = 'hsl(24 46% 68%)', SKIN_D = 'hsl(20 40% 54%)', HAIR = 'hsl(16 62% 34%)', HAIR_L = 'hsl(22 70% 46%)', LINEN = 'hsl(40 28% 66%)', LINEN_D = 'hsl(36 24% 50%)', TROUSER = 'hsl(248 20% 34%)', TROUSER_L = 'hsl(248 20% 44%)', WOOD = 'hsl(28 42% 36%)', WOOD_L = 'hsl(32 46% 50%)';

function cloak(t) {
  if (!t) return '';
  const [b, l, d, trim] = CLOAK[t];
  if (t === 1) return poly([[55, 80], [145, 80], [152, 116], [142, 128], [58, 128], [48, 116]], b) + flat([[55, 80], [76, 80], [70, 128], [58, 128], [48, 116]], l, 0.55);
  let s = poly([[58, 78], [142, 78], [154, 150], [151, 238], [126, 229], [100, 240], [74, 229], [49, 238], [46, 150]], b);
  s += flat([[58, 78], [72, 78], [66, 232], [49, 238], [46, 150]], l, 0.6) + flat([[128, 78], [142, 78], [154, 150], [151, 238], [134, 232]], d, 0.75);
  s += stroke('M86 190 L84 232 M100 186 V238 M114 190 L116 232', d, 2, 0.8);
  if (t >= 3) s += stroke('M49 238 L74 229 L100 240 L126 229 L151 238', trim, t === 4 ? 3 : 2);
  return s;
}
function collar(t) {
  if (t < 2) return '';
  const [b, l, , trim] = CLOAK[t];
  let s = poly([[68, 76], [132, 76], [127, 87], [100, 92], [73, 87]], b) + flat([[68, 76], [100, 76], [100, 92], [73, 87]], l, 0.5);
  if (t === 4) s += stroke('M70 78 l5 5 l5 -5 l5 5 l5 -5 l5 5 l5 -5 l5 5 l5 -5 l5 5 l5 -5 l5 5 l5 -5', 'hsl(40 30% 86%)', 2.4);
  if (t >= 3) s += dot(121, 84, 5, trim) + dot(121, 84, 1.8, t === 4 ? 'hsl(22 95% 58%)' : INK, 0);
  return s;
}

function legs(t) {
  const leg = (m) => poly(m([[79, 172], [99, 172], [97, 245], [82, 245]]), TROUSER) + flat(m([[80, 173], [86, 173], [87, 244], [83, 244]]), TROUSER_L, 0.7);
  const wrap = (m) => stroke(`M${P(m([[82, 214], [97, 220]]))} M${P(m([[82, 224], [97, 230]]))} M${P(m([[82, 234], [97, 240]]))}`.replace(/ (\d)/g, ' L$1').replace(/M([\d.,]+) L/g, 'M$1 L'), LINEN_D, 1.6);
  const boot = (m) => poly(m([[80, 240], [98, 240], [99, 257], [73, 257], [76, 248]]), 'hsl(22 34% 26%)') + flat(m([[80, 241], [86, 241], [80, 250], [76, 250]]), 'hsl(26 36% 38%)', 0.8);
  let s = both(leg);
  if (!t) s += both(wrap);
  s += both(boot);
  if (t) {
    const [b, l, d, trim] = MAT[t];
    const shin = (m) => poly(m([[79, 206], [99, 206], [98, 243], [81, 243]]), b) + flat(m([[80, 207], [87, 207], [88, 242], [82, 242]]), l, 0.85) + (m === mir ? '' : '') + stroke(`M${P(m([[89, 208]]))} L${P(m([[89.5, 241]]))}`, d, 1.4, 0.8) + (t >= 2 ? stroke(`M${P(m([[80, 208]]))} L${P(m([[98, 208]]))}`, trim, 1.6) : '');
    const knee = (m) => poly(m([[80, 196], [98, 196], [100, 207], [89, 213], [78, 207]]), b) + flat(m([[81, 197], [89, 197], [89, 211], [79, 206]]), l, 0.85) + (t === 4 ? dot(...m([[89, 204]])[0], 2.6, trim, 1) : '');
    s += both(shin);
    if (t >= 3) s += both(knee);
  }
  return s;
}

function torso() {
  let s = poly([[72, 78], [128, 78], [139, 89], [131, 104], [125, 148], [75, 148], [69, 104], [61, 89]], LINEN);
  s += flat([[100, 79], [128, 79], [138, 89], [130, 104], [124, 147], [100, 147]], LINEN_D, 0.45);
  // tunic skirt with a cut hem
  s += poly([[75, 146], [125, 146], [132, 184], [121, 180], [111, 187], [100, 181], [89, 187], [79, 180], [68, 184]], LINEN) + flat([[100, 147], [125, 147], [131, 183], [121, 179], [111, 186], [100, 180]], LINEN_D, 0.45);
  s += stroke('M92 79 L100 90 L108 79', LINEN_D, 2);
  return s;
}

function belt(t) {
  if (!t) return poly([[74, 143], [126, 143], [127, 150], [73, 150]], 'hsl(34 34% 40%)', 1.6) + stroke('M96 150 l-3 14 M101 150 l2 12', 'hsl(34 34% 40%)', 2.4);
  const [b, l, d, trim] = MAT[t];
  let s = poly([[73, 141], [127, 141], [128, 157], [72, 157]], b) + flat([[74, 142], [126, 142], [126, 146], [74, 146]], l, 0.8) + flat([[74, 153], [127, 153], [127, 156], [73, 156]], d, 0.8);
  if (t >= 2) for (const x of [82, 91, 109, 118]) s += stroke(`M${x} 143 V155`, d, 1.2, 0.8);
  s += poly([[92, 139], [108, 139], [111, 149], [108, 159], [92, 159], [89, 149]], t >= 2 ? trim : l, 1.6);
  if (t === 4) s += halo(100, 149, 12, GLOW.ember, 0.7) + dot(100, 149, 3.6, 'hsl(22 95% 60%)', 1) + `<circle cx="99" cy="148" r="1.2" fill="#fff" opacity="0.8"/>`;
  else s += dot(100, 149, 3, t >= 2 ? b : d, 1);
  return s;
}

function breastplate(t) {
  if (!t) return '';
  const [b, l, d, trim] = MAT[t];
  const shape = [[76, 80], [92, 80], [100, 88], [108, 80], [124, 80], [130, 104], [124, 143], [76, 143], [70, 104]];
  let s = poly(shape, b);
  if (t === 1) { // leather jerkin with a cross strap and lacing
    s += flat([[76, 81], [92, 81], [100, 89], [100, 142], [77, 142], [71, 104]], l, 0.6);
    s += stroke('M78 84 L122 138', d, 5) + stroke('M78 84 L122 138', trim, 1.4, 0.9) + stroke('M97 98 h6 M97 108 h6 M97 118 h6 M97 128 h6', trim, 1.4);
    return s;
  }
  // metal cuirass: lit left pec, shaded right, a centre ridge, banded stomach
  s += flat([[77, 81], [92, 81], [100, 89], [100, 114], [73, 108]], l, 0.9) + flat([[100, 89], [108, 81], [123, 81], [129, 104], [128, 110], [100, 114]], d, 0.55);
  s += flat([[100, 114], [128, 110], [124, 142], [100, 142]], d, 0.75) + flat([[73, 108], [100, 114], [100, 142], [77, 142]], b, 1);
  s += stroke('M73 108 Q86 118 100 114 Q114 118 127 108', INK, 1.6, 0.8) + stroke('M100 89 V142', INK, 1.4, 0.7);
  s += stroke('M76 122 Q100 128 124 122 M78 133 Q100 138 122 133', d, 1.6, 0.9);
  s += stroke('M77 82 L92 82 L100 90 L108 82 L123 82', trim, 1.8);
  if (t >= 3) s += dot(86, 98, 2.2, trim, 1) + dot(114, 98, 2.2, trim, 1);
  if (t === 4) s += halo(100, 104, 16, GLOW.gold, 0.6) + carve('<path d="M97 114 V96 M97 98 h9 M97 104 h7 M97 110 h5"/>', GLOW.gold, 2);
  return s;
}

function arms(tb) {
  const arm = (m) => {
    let s = poly(m([[62, 86], [75, 90], [69, 131], [52, 129]]), SKIN) + flat(m([[63, 88], [67, 89], [59, 129], [54, 129]]), 'hsl(26 55% 78%)', 0.7);
    s += poly(m([[51, 127], [69, 129], [64, 165], [49, 165]]), SKIN) + flat(m([[52, 129], [57, 129], [54, 164], [50, 164]]), 'hsl(26 55% 78%)', 0.7);
    s += poly(m([[60, 84], [76, 88], [73, 108], [56, 105]]), LINEN) + flat(m([[61, 86], [66, 87], [62, 105], [58, 104]]), 'hsl(42 34% 78%)', 0.7);
    if (tb) {
      const [b, l, d, trim] = MAT[tb];
      s += poly(m([[50, 133], [69, 135], [65, 161], [49, 161]]), b) + flat(m([[51, 134], [57, 135], [55, 160], [50, 160]]), l, 0.85);
      if (tb >= 2) s += stroke(`M${P(m([[50, 136]]))} L${P(m([[68, 138]]))} M${P(m([[49, 158]]))} L${P(m([[65, 158]]))}`, trim, 1.6);
      if (tb >= 3) s += poly(m([[49, 124], [71, 126], [70, 137], [59, 141], [48, 135]]), b) + flat(m([[50, 125], [59, 126], [59, 139], [49, 134]]), l, 0.85);
      if (tb === 4) s += dot(...m([[58, 148]])[0], 2.4, trim, 1);
    }
    return s;
  };
  return both(arm);
}
const hand = (m) => poly(m([[46, 162], [61, 162], [62, 175], [47, 176]]), SKIN) + stroke(`M${P(m([[48, 167]]))} L${P(m([[61, 166]]))} M${P(m([[48, 171]]))} L${P(m([[61, 170.5]]))}`, SKIN_D, 1.1);

function pauldrons(t) {
  if (!t) return '';
  const [b, l, d, trim] = MAT[t];
  const one = (m) => {
    if (t === 1) return poly(m([[55, 83], [75, 76], [80, 92], [61, 99]]), b) + flat(m([[56, 84], [70, 79], [66, 96], [61, 98]]), l, 0.7) + stroke(`M${P(m([[60, 97]]))} L${P(m([[79, 91]]))}`, trim, 1.4);
    let s = '';
    if (t >= 3) s += poly(m([[48, 97], [77, 100], [73, 113], [50, 110]]), b) + flat(m([[49, 98], [60, 99], [58, 111], [51, 110]]), l, 0.8) + stroke(`M${P(m([[50, 109]]))} L${P(m([[73, 112]]))}`, trim, 1.4);
    s += poly(m([[47, 86], [58, 73], [79, 72], [84, 90], [75, 102], [51, 101]]), b) + flat(m([[48, 87], [58, 74], [68, 74], [60, 100], [52, 100]]), l, 0.9) + flat(m([[74, 74], [79, 73], [83, 90], [75, 101], [70, 101]]), d, 0.7);
    s += stroke(`M${P(m([[51, 100]]))} L${P(m([[75, 101]]))}`, trim, 1.8);
    if (t === 4) s += dot(...m([[65, 86]])[0], 3, trim, 1);
    return s;
  };
  return both(one);
}

function head(torc) {
  const TC = [null, ['hsl(36 56% 46%)', 'hsl(44 78% 67%)'], ['hsl(215 12% 66%)', 'hsl(210 20% 88%)'], ['hsl(46 90% 56%)', 'hsl(50 100% 80%)']][torc];
  let s = poly([[77, 41], [86, 26], [102, 21], [119, 27], [125, 43], [124, 72], [115, 78], [85, 78], [76, 72]], HAIR) + flat([[78, 42], [86, 27], [96, 23], [88, 76], [77, 71]], HAIR_L, 0.6);
  s += poly([[91, 62], [109, 62], [111, 80], [89, 80]], SKIN) + flat([[100, 63], [109, 63], [110, 79], [100, 79]], SKIN_D, 0.5);
  if (TC) s += stroke('M87 77 Q100 91 113 77', INK, 7.5) + stroke('M87 77 Q100 91 113 77', TC[0], 4.6) + stroke('M88 78 Q100 90 112 78', TC[1], 1.4, 0.9) + dot(87, 76, 3.4, TC[0], 1.4) + dot(113, 76, 3.4, TC[0], 1.4);
  s += poly([[84, 40], [116, 40], [118, 57], [112, 69], [100, 74], [88, 69], [82, 57]], SKIN) + flat([[100, 41], [115, 41], [117, 57], [111, 68], [100, 73]], SKIN_D, 0.35);
  s += poly([[85, 58], [93, 61], [100, 60], [107, 61], [115, 58], [112, 70], [100, 78], [88, 70]], HAIR) + flat([[86, 59], [93, 62], [99, 61], [99, 77], [89, 70]], HAIR_L, 0.6) + stroke('M95 66 Q100 68 105 66', INK, 1.3, 0.8);
  s += `<rect x="90" y="51" width="5" height="3.4" rx="1" fill="${INK}"/><rect x="105" y="51" width="5" height="3.4" rx="1" fill="${INK}"/>` + stroke('M88 47.500 L96 48.500 M104 48.500 L112 47.500', HAIR, 2.2);
  s += poly([[82, 44], [87, 30], [102, 25], [117, 30], [119, 45], [111, 40], [105, 46], [97, 40], [90, 46]], HAIR) + flat([[83, 43], [88, 31], [100, 27], [96, 39], [90, 45]], HAIR_L, 0.7);
  return s;
}

function spear(t) {
  let s = stroke('M50 30 V262', INK, 8) + stroke('M50 30 V262', WOOD, 5) + stroke('M48.500 32 V260', WOOD_L, 1.4, 0.8);
  if (t === 1) return s + poly([[50, 10], [55, 34], [45, 34]], WOOD_L) + flat([[50, 12], [50, 33], [46, 33]], 'hsl(36 50% 64%)', 0.8);
  const M = [null, null, ['hsl(36 56% 46%)', 'hsl(44 78% 67%)', 'hsl(30 52% 29%)'], ['hsl(220 14% 56%)', 'hsl(214 22% 80%)', 'hsl(226 18% 34%)'], ['hsl(220 14% 56%)', 'hsl(214 22% 80%)', 'hsl(226 18% 34%)'], ['hsl(46 92% 56%)', 'hsl(50 100% 82%)', 'hsl(38 80% 36%)']][t];
  const big = t >= 3 ? 1 : 0;
  if (t === 5) s += halo(50, 20, 26, GLOW.ember, 0.75, true);
  if (t >= 4) s += poly([[54, 44], [72, 50], [66, 58], [76, 66], [54, 62]], 'hsl(8 62% 44%)') + flat([[55, 45], [70, 50], [60, 54], [55, 52]], 'hsl(12 70% 58%)', 0.8);
  s += poly([[50, 2 - big * 0], [58 + big, 22], [54, 38], [46, 38], [42 - big, 22]], M[0]) + flat([[50, 4], [50, 37], [47, 37], [43.500 - big, 22]], M[1], 0.9) + flat([[50, 4], [57 + big, 22], [53, 37], [50, 37]], M[2], 0.6);
  s += poly([[45, 38], [55, 38], [55, 44], [45, 44]], t === 5 ? M[0] : 'hsl(30 40% 30%)', 1.6);
  return s;
}

function shield(t, bosses) {
  if (!t) return '';
  const cx = 151, cy = 152, R = 31;
  const RIM = [null, ['hsl(24 40% 30%)', 'hsl(28 45% 44%)'], ['hsl(36 56% 46%)', 'hsl(44 78% 67%)'], ['hsl(220 14% 52%)', 'hsl(214 22% 76%)'], ['hsl(46 92% 56%)', 'hsl(50 100% 82%)']][t];
  let s = `<circle cx="${cx}" cy="${cy}" r="${R + 1.5}" fill="${INK}"/><circle cx="${cx}" cy="${cy}" r="${R}" fill="${RIM[0]}"/><path d="M${cx - R * 0.72} ${cy - R * 0.69} A${R} ${R} 0 0 1 ${cx + R * 0.5} ${cy - R * 0.87}" fill="none" stroke="${RIM[1]}" stroke-width="2.4" stroke-linecap="round"/>`;
  s += `<circle cx="${cx}" cy="${cy}" r="${R - 5}" fill="${WOOD}" stroke="${INK}" stroke-width="1.4"/><path d="M${cx - 21} ${cy - 15} A26 26 0 0 1 ${cx - 2} ${cy - 26} L${cx - 2} ${cy + 26} A26 26 0 0 1 ${cx - 21} ${cy + 15} Z" fill="${WOOD_L}" opacity="0.55"/>`;
  s += stroke(`M${cx - 12} ${cy - 23} V${cy + 23} M${cx} ${cy - 26} V${cy + 26} M${cx + 12} ${cy - 23} V${cy + 23}`, 'hsl(24 40% 24%)', 1.2, 0.8);
  if (t === 4) s += halo(cx, cy, 20, GLOW.gold, 0.3) + carve(`<path d="M${cx} ${cy} c0 -9 9 -11 12 -4 M${cx} ${cy} c8 4 5 13 -3 12 M${cx} ${cy} c-8 5 -14 -2 -9 -8"/>`, GLOW.gold, 1.8);
  for (let i = 0; i < Math.min(bosses, 8); i++) { const a = -Math.PI / 2 + (i * Math.PI * 2) / Math.max(bosses, 4); s += dot(cx + Math.cos(a) * 19, cy + Math.sin(a) * 19, 2.3, RIM[1], 1); }
  s += dot(cx, cy, 8, RIM[0], 1.6) + `<circle cx="${cx - 2.5}" cy="${cy - 2.5}" r="3" fill="${RIM[1]}" opacity="0.9"/>`;
  return s;
}

// look: { armor: { breastplate, belt, pauldrons, bracers, greaves, cloak }, spear 1-5, shield 0-4, bosses, torc 0-3, dawn }
export function heroSVG(look, size = 200, label = 'Your warrior') {
  const a = look.armor;
  let s = `<ellipse cx="100" cy="259" rx="62" ry="7" fill="#000" opacity="0.45"/>`;
  if (look.dawn) s += halo(100, 126, 100, GLOW.gold, 0.5, true);
  s += `<g class="herocloak">${cloak(a.cloak)}</g>`;
  s += legs(a.greaves) + torso() + belt(a.belt) + breastplate(a.breastplate) + collar(a.cloak);
  s += spear(look.spear) + arms(a.bracers) + hand((p) => p) + (look.shield ? '' : hand(mir)) + pauldrons(a.pauldrons) + head(look.torc) + shield(look.shield, look.bosses);
  return `<svg class="hero" width="${size}" height="${Math.round(size * 1.4)}" viewBox="0 -12 200 280" role="img" aria-label="${label}">${s}</svg>`;
}
