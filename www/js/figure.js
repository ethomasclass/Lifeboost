// Fianna exercise figure: one reusable jointed figure, drawn as SVG.
// Poses are keyframes (A = start of the rep, B = other end); the engine
// interpolates between them. Limb lengths are fixed so nothing can stretch.

const L = { T: 58, N: 20, UA: 32, FA: 30, TH: 42, SH: 40, FT: 12 };
const C = { near: '#F2EADB', far: '#9A92B8', prop: '#57536A', propDark: '#3E3B4D', db: '#C9973F', dbDark: '#8F6524', floor: '#3A3275' };
const FLOOR = 228;

const rad = (d) => (d * Math.PI) / 180;
const dir = (a) => [Math.cos(rad(a)), Math.sin(rad(a))];
const add = (p, v, s = 1) => [p[0] + v[0] * s, p[1] + v[1] * s];
const lerp = (a, b, k) => a + (b - a) * k;
const lerpP = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];

function ik(p0, target, l1, l2, pick) {
  let dx = target[0] - p0[0], dy = target[1] - p0[1];
  let d = Math.hypot(dx, dy) || 0.001;
  const dc = Math.max(Math.abs(l1 - l2) + 0.5, Math.min(d, l1 + l2 - 0.5));
  const ux = dx / d, uy = dy / d;
  const a = (l1 * l1 - l2 * l2 + dc * dc) / (2 * dc);
  const h = Math.sqrt(Math.max(l1 * l1 - a * a, 0));
  const m = [p0[0] + ux * a, p0[1] + uy * a];
  const s1 = [m[0] - uy * h, m[1] + ux * h], s2 = [m[0] + uy * h, m[1] - ux * h];
  const better = { f: s1[0] > s2[0], b: s1[0] < s2[0], u: s1[1] < s2[1], d: s1[1] > s2[1] }[pick || 'f'];
  const mid = better ? s1 : s2;
  const end = [p0[0] + ux * dc, p0[1] + uy * dc];
  return [mid, end];
}

function limb(origin, spec, l1, l2) {
  if (spec.hand || spec.foot) return ik(origin, spec.hand || spec.foot, l1, l2, spec.eb || spec.kb);
  const a1 = spec.ua ?? spec.th, a2 = spec.fa ?? spec.sh;
  const mid = add(origin, dir(a1), l1);
  return [mid, add(mid, dir(a2), l2)];
}

function lerpSpec(a, b, k) {
  const out = {};
  for (const key of Object.keys(a)) {
    const x = a[key], y = b[key] ?? x;
    out[key] = Array.isArray(x) ? lerpP(x, y, k) : typeof x === 'number' ? lerp(x, y, k) : x;
  }
  return out;
}

function solve(anim, k) {
  const { A, B } = anim;
  const hip = lerpP(A.hip, B.hip ?? A.hip, k);
  const t = lerp(A.t, B.t ?? A.t, k);
  const sh = add(hip, dir(t), L.T);
  const head = add(sh, dir(t), L.N);
  const armOf = (P) => limb(add(P.hip, dir(P.t), L.T), P.arm, L.UA, L.FA);
  const farArmOf = (P) => limb(add(P.hip, dir(P.t), L.T), P.farArm || P.arm, L.UA, L.FA);
  const full = (P) => ({ ...A, ...P, hip: P.hip ?? A.hip, t: P.t ?? A.t, arm: P.arm ?? A.arm, leg: P.leg ?? A.leg, farArm: P.farArm ?? A.farArm, farLeg: P.farLeg ?? A.farLeg });
  const a = full(A), b = full(B);
  let arm, farArm;
  if (anim.armLerp === 'point') {
    const rel = (P, fn) => { const s = add(P.hip, dir(P.t), L.T); return fn(P).map((p) => [p[0] - s[0], p[1] - s[1]]); };
    const mix = (fn) => { const ra = rel(a, fn), rb = rel(b, fn); return [0, 1].map((i) => add(sh, lerpP(ra[i], rb[i], k))); };
    arm = mix(armOf); farArm = mix(farArmOf);
  } else {
    arm = limb(sh, lerpSpec(a.arm, b.arm, k), L.UA, L.FA);
    farArm = limb(sh, lerpSpec(a.farArm || a.arm, b.farArm || b.arm, k), L.UA, L.FA);
  }
  const legSpec = lerpSpec(a.leg, b.leg, k);
  const farLegSpec = lerpSpec(a.farLeg || a.leg, b.farLeg || b.leg, k);
  const leg = limb(hip, legSpec, L.TH, L.SH), farLeg = limb(hip, farLegSpec, L.TH, L.SH);
  const toe = (ankle, spec) => add(ankle, dir(spec.ft ?? 0), L.FT);
  return { hip, sh, head, arm, farArm, leg, farLeg, toe: toe(leg[1], legSpec), farToe: toe(farLeg[1], farLegSpec), splitFar: !!(a.farArm || a.farLeg) };
}

const f = (n) => Math.round(n * 10) / 10;
const line = (p, q, w, c, extra = '') => `<line x1="${f(p[0])}" y1="${f(p[1])}" x2="${f(q[0])}" y2="${f(q[1])}" stroke="${c}" stroke-width="${w}" stroke-linecap="round" ${extra}/>`;
const bell = (p, big) => `<g transform="translate(${f(p[0])} ${f(p[1])})"><rect x="-${big ? 15 : 13}" y="-3" width="${big ? 30 : 26}" height="6" rx="2" fill="${C.dbDark}"/><circle r="${big ? 10 : 8}" fill="${C.db}"/><circle r="3" fill="${C.dbDark}"/></g>`;

function props(list = []) {
  return list.map((p) => {
    if (p[0] === 'pad') return line([p[1], p[2]], [p[3], p[4]], 9, C.prop);
    if (p[0] === 'post') return line([p[1], p[2]], [p[1], FLOOR], 5, C.propDark);
    if (p[0] === 'bar') return line([p[1], p[2]], [p[3], p[4]], 4, C.propDark);
    if (p[0] === 'mat') return line([p[1], FLOOR - 3], [p[2], FLOOR - 3], 5, '#4A4380');
    return '';
  }).join('');
}

function sideFigure(anim, k) {
  const j = solve(anim, k);
  const off = [4, -3];
  const o = (p) => add(p, off);
  let s = props(anim.props);
  // far side first, lighter
  s += line(o(j.hip), o(j.farLeg[0]), 9, C.far) + line(o(j.farLeg[0]), o(j.farLeg[1]), 8, C.far) + line(o(j.farLeg[1]), o(j.farToe), 6, C.far);
  s += line(o(j.sh), o(j.farArm[0]), 8, C.far) + line(o(j.farArm[0]), o(j.farArm[1]), 7, C.far);
  if (anim.db === 'both') s += `<g opacity="0.7">${bell(o(j.farArm[1]))}</g>`;
  // torso, near leg, head
  s += line(j.hip, j.sh, 16, C.near);
  s += line(j.hip, j.leg[0], 10, C.near) + line(j.leg[0], j.leg[1], 9, C.near) + line(j.leg[1], j.toe, 7, C.near);
  s += `<circle cx="${f(j.head[0])}" cy="${f(j.head[1])}" r="12" fill="${C.near}"/>`;
  // near arm with a dark outline so it reads over the torso
  s += line(j.sh, j.arm[0], 12, '#221C44') + line(j.arm[0], j.arm[1], 11, '#221C44');
  s += line(j.sh, j.arm[0], 9, C.near) + line(j.arm[0], j.arm[1], 8, C.near);
  if (anim.db && anim.db !== 'none') s += bell(j.arm[1], anim.db === 'goblet');
  // working muscle glows ember, brightest at the hardest point of the rep
  const glow = (0.22 + 0.68 * (anim.hotAt === 'B' ? k : 1 - k)).toFixed(2), mix = (p, q, t) => lerpP(p, q, t);
  const hl = (p, q, w) => line(p, q, w, '#F07A2E', `opacity="${glow}"`), dot = (p, r) => `<circle cx="${f(p[0])}" cy="${f(p[1])}" r="${r}" fill="#F07A2E" opacity="${glow}"/>`;
  const hot = { chest: () => hl(mix(j.sh, j.hip, 0.08), mix(j.sh, j.hip, 0.42), 9), back: () => hl(mix(j.sh, j.hip, 0.1), mix(j.sh, j.hip, 0.55), 9), core: () => hl(mix(j.hip, j.sh, 0.1), mix(j.hip, j.sh, 0.5), 9),
    legs: () => hl(mix(j.hip, j.leg[0], 0.15), mix(j.hip, j.leg[0], 0.9), 6), calves: () => hl(mix(j.leg[0], j.leg[1], 0.1), mix(j.leg[0], j.leg[1], 0.7), 5), glutes: () => dot(j.hip, 8),
    arms: () => hl(mix(j.sh, j.arm[0], 0.2), mix(j.sh, j.arm[0], 0.9), 5), shoulders: () => dot(j.sh, 7) }[anim.hot];
  if (hot) s += hot();
  const cx = (j.sh[0] + j.hip[0] + j.leg[0][0]) / 3;
  return `<ellipse cx="${f(cx)}" cy="${FLOOR + 5}" rx="52" ry="4" fill="#000" opacity="0.28"/>` + s;
}

function frontFigure(anim, k) {
  const a = lerp(anim.A.a, anim.B.a, k), bend = anim.bend ?? 10;
  const fore = anim.A.f != null ? lerp(anim.A.f, anim.B.f, k) : null;
  const cy = anim.lying ? 120 : 88;
  let s = '';
  if (anim.lying) {
    s += `<rect x="100" y="${cy + 6}" width="100" height="16" rx="5" fill="${C.prop}"/>` + line([150, cy + 22], [150, FLOOR], 6, C.propDark) + line([120, FLOOR], [180, FLOOR], 6, C.propDark);
    s += line([128, cy], [172, cy], 18, C.near);
    s += `<circle cx="150" cy="${cy - 4}" r="13" fill="${C.near}" stroke="#221C44" stroke-width="2"/>`;
  } else {
    s += line([139, 150], [137, 190], 10, C.near) + line([137, 190], [136, FLOOR - 2], 9, C.near);
    s += line([161, 150], [163, 190], 10, C.near) + line([163, 190], [164, FLOOR - 2], 9, C.near);
    s += `<path d="M126 ${cy} L174 ${cy} L163 152 L137 152 Z" fill="${C.near}" stroke="${C.near}" stroke-width="6" stroke-linejoin="round"/>`;
    s += `<circle cx="150" cy="${cy - 26}" r="12" fill="${C.near}"/>`;
  }
  for (const side of [-1, 1]) {
    const shd = [150 + side * 24, cy];
    const v = (ang) => [side * Math.sin(rad(ang)), Math.cos(rad(ang))];
    const el = add(shd, v(a), L.UA), hd = add(el, v(fore ?? a + (anim.lying ? bend : -bend)), L.FA);
    s += line(shd, el, 12, '#221C44') + line(el, hd, 11, '#221C44') + line(shd, el, 9, C.near) + line(el, hd, 8, C.near) + bell(hd);
  }
  const glow = (0.22 + 0.68 * (anim.hotAt === 'B' ? k : 1 - k)).toFixed(2);
  if (anim.hot === 'chest') s += `<line x1="134" y1="${cy + (anim.lying ? 0 : 12)}" x2="166" y2="${cy + (anim.lying ? 0 : 12)}" stroke="#F07A2E" stroke-width="10" stroke-linecap="round" opacity="${glow}"/>`;
  if (anim.hot === 'shoulders') s += `<circle cx="126" cy="${cy}" r="7" fill="#F07A2E" opacity="${glow}"/><circle cx="174" cy="${cy}" r="7" fill="#F07A2E" opacity="${glow}"/>`;
  if (anim.lying) s += `<text x="150" y="20" text-anchor="middle" font-size="11" fill="${C.far}" font-family="system-ui,sans-serif">Seen from the foot of the bench</text>`;
  return s;
}

const stand = (x = 150) => ({ foot: [x, FLOOR], kb: 'f' });
const flatBench = [['post', 100, 203], ['post', 178, 203], ['pad', 80, 199, 192, 199]];

export const ANIMS = {
  incline_press: { hot: 'chest', hotAt: 'A', armLerp: 'point', db: 'both', props: [['post', 104, 176], ['post', 190, 203], ['pad', 156, 199, 68, 148], ['pad', 152, 199, 206, 199]],
    A: { hip: [150, 186], t: 210, arm: { ua: -90, fa: -90 }, leg: { th: 0, sh: 85 } }, B: { arm: { ua: 100, fa: -85 } },
    tempo: [3, 0.5, 1, 0.5], labels: ['Lower', 'Pause', 'Press', 'Squeeze'] },
  flat_press: { hot: 'chest', hotAt: 'A', armLerp: 'point', db: 'both', props: flatBench,
    A: { hip: [170, 186], t: 180, arm: { ua: -90, fa: -90 }, leg: { th: 0, sh: 86 } }, B: { arm: { ua: 100, fa: -85 } },
    tempo: [3, 0.5, 1, 0.5], labels: ['Lower', 'Pause', 'Press', 'Squeeze'] },
  squeeze_press: { hot: 'chest', hotAt: 'A', armLerp: 'point', db: 'near', props: flatBench,
    A: { hip: [170, 186], t: 180, arm: { ua: -90, fa: -90 }, leg: { th: 0, sh: 86 } }, B: { arm: { ua: 95, fa: -80 } },
    tempo: [2, 0, 2, 1], labels: ['Lower slow', '', 'Press', 'Crush together'] },
  pullover: { hot: 'chest', hotAt: 'A', db: 'near', props: flatBench,
    A: { hip: [170, 186], t: 180, arm: { ua: -90, fa: -90 }, leg: { th: 0, sh: 86 } }, B: { arm: { ua: -165, fa: -175 } },
    tempo: [3, 0.5, 2, 0.5], labels: ['Reach back', 'Stretch', 'Pull over', 'Squeeze'] },
  row: { hot: 'back', hotAt: 'B', db: 'near', props: [['post', 168, 212], ['post', 236, 212], ['pad', 150, 208, 252, 208]],
    A: { hip: [125, 148], t: -8, arm: { ua: 90, fa: 90 }, farArm: { ua: 90, fa: 90 }, leg: stand(118) }, B: { arm: { ua: 205, fa: 95 } },
    tempo: [1, 1, 2, 0.5], labels: ['Pull', 'Squeeze', 'Lower', 'Reach'] },
  goblet_squat: { hot: 'legs', hotAt: 'B', db: 'goblet',
    A: { hip: [160, 147], t: -88, arm: { ua: 78, fa: -55 }, leg: stand(160) }, B: { hip: [128, 186], t: -68, arm: { ua: 85, fa: -48 } },
    tempo: [3, 0.5, 1, 0.5], labels: ['Sit down', 'Pause', 'Drive up', 'Stand tall'] },
  squat_pulse: { hot: 'legs', hotAt: 'B', db: 'goblet',
    A: { hip: [140, 170], t: -74, arm: { ua: 82, fa: -52 }, leg: stand(160) }, B: { hip: [128, 186], t: -68, arm: { ua: 85, fa: -48 } },
    tempo: [0.6, 0, 0.6, 0], labels: ['Pulse', '', 'Pulse', ''] },
  rdl: { hot: 'legs', hotAt: 'B', db: 'both',
    A: { hip: [140, 147], t: -88, arm: { ua: 88, fa: 90 }, leg: stand(140) }, B: { hip: [108, 155], t: -18, arm: { ua: 100, fa: 100 } },
    tempo: [3, 0.5, 1.5, 0.5], labels: ['Hinge back', 'Stretch', 'Stand', 'Squeeze'] },
  split_squat: { hot: 'legs', hotAt: 'B', db: 'both',
    A: { hip: [148, 152], t: -88, arm: { ua: 90, fa: 90 }, leg: { foot: [172, FLOOR], kb: 'f' }, farLeg: { foot: [116, 224], kb: 'f', ft: 60 } }, B: { hip: [148, 178] },
    tempo: [2.5, 0.5, 1, 0.5], labels: ['Lower', 'Pause', 'Drive', 'Top'] },
  calf_raise: { hot: 'calves', hotAt: 'B', db: 'both',
    A: { hip: [150, 147], t: -89, arm: { ua: 90, fa: 90 }, leg: { foot: [150, FLOOR], kb: 'f', ft: 0 } }, B: { hip: [150, 139], leg: { foot: [150, 220], kb: 'f', ft: 40 } },
    tempo: [1, 1, 2, 0.3], labels: ['Rise', 'Squeeze', 'Lower', 'Reset'] },
  dead_bug: { hot: 'core', hotAt: 'B', db: 'none', props: [['mat', 80, 230]],
    A: { hip: [170, 212], t: 180, arm: { ua: -90, fa: -90 }, farArm: { ua: -90, fa: -90 }, leg: { th: -90, sh: 0 }, farLeg: { th: -90, sh: 0 } },
    B: { farArm: { ua: -170, fa: -175 }, leg: { th: -12, sh: -8 } },
    tempo: [2, 1, 2, 0.5], labels: ['Reach long', 'Hold', 'Return', 'Reset'] },
  leg_raise: { hot: 'core', hotAt: 'B', db: 'none', props: [['mat', 70, 240]],
    A: { hip: [150, 214], t: 180, arm: { ua: 3, fa: 0 }, leg: { th: -6, sh: -6 } }, B: { leg: { th: -85, sh: -80 } },
    tempo: [2, 0.5, 3, 0.3], labels: ['Raise', 'Top', 'Lower slow', 'Hover'] },
  glute_bridge: { hot: 'glutes', hotAt: 'B', db: 'none', props: [['mat', 70, 230]],
    A: { hip: [153, 214], t: 180, arm: { ua: 5, fa: 0 }, leg: { foot: [190, 222], kb: 'u', ft: 0 } }, B: { hip: [150, 192], t: 158.2 },
    tempo: [1.5, 2, 1.5, 0.5], labels: ['Lift', 'Squeeze', 'Lower', 'Reset'] },
  plank: { hot: 'core', hotAt: 'A', db: 'none', props: [['mat', 50, 250]],
    A: { hip: [147.6, 198], t: -8, arm: { ua: 90, fa: 0 }, leg: { th: 172, sh: 172, ft: 90 } }, B: { hip: [147.6, 199.5] },
    tempo: [2, 0, 2, 0], labels: ['Brace', '', 'Breathe', ''] },
  incline_pushup: { hot: 'chest', hotAt: 'B', db: 'none', props: [['post', 205, 200], ['post', 262, 200], ['pad', 195, 197, 272, 197]],
    A: { hip: [165.2, 166.2], t: -42.5, arm: { hand: [215, 190], eb: 'b' }, leg: { th: 137.5, sh: 137.5, ft: 90 } },
    B: { hip: [175.7, 180.6], t: -30, leg: { th: 150, sh: 150, ft: 90 } },
    tempo: [2, 0.5, 1, 0.5], labels: ['Lower', 'Pause', 'Push', 'Lock out'] },
  shoulder_press: { hot: 'shoulders', hotAt: 'B', armLerp: 'point', db: 'both', props: [['post', 150, 203], ['pad', 124, 199, 186, 199], ['pad', 124, 196, 124, 122]],
    A: { hip: [140, 186], t: -90, arm: { ua: 75, fa: -90 }, leg: { th: 0, sh: 90 } }, B: { arm: { ua: -90, fa: -90 } },
    tempo: [1, 0.5, 3, 0.5], labels: ['Press', 'Top', 'Lower', 'Ready'] },
  curl: { hot: 'arms', hotAt: 'B', db: 'both',
    A: { hip: [150, 147], t: -89, arm: { ua: 90, fa: 85 }, leg: stand() }, B: { arm: { ua: 92, fa: -75 } },
    tempo: [1, 0.5, 3, 0.3], labels: ['Curl', 'Squeeze', 'Lower', 'Reset'] },
  triceps_ext: { hot: 'arms', hotAt: 'A', db: 'near',
    A: { hip: [150, 147], t: -89, arm: { ua: -85, fa: -90 }, leg: stand() }, B: { arm: { ua: -85, fa: -230 } },
    tempo: [3, 0.5, 1, 0.5], labels: ['Lower behind', 'Stretch', 'Extend', 'Squeeze'] },
  walk: { db: 'none', props: [['bar', 206, 232, 224, 150], ['bar', 224, 150, 204, 150], ['pad', 96, 234, 216, 234]],
    A: { hip: [150, 148], t: -86, arm: { ua: 115, fa: 70 }, farArm: { ua: 65, fa: 20 }, leg: { th: 68, sh: 96 }, farLeg: { th: 112, sh: 122 } },
    B: { arm: { ua: 65, fa: 20 }, farArm: { ua: 115, fa: 70 }, leg: { th: 112, sh: 122 }, farLeg: { th: 68, sh: 96 } },
    tempo: [0.5, 0, 0.5, 0], labels: ['Stride', '', 'Stride', ''] },
  press_front: { hot: 'chest', hotAt: 'A', view: 'front', lying: true, A: { a: 183, f: 183 }, B: { a: 78, f: 180 }, tempo: [3, 0.5, 1, 0.5], labels: ['Lower', 'Pause', 'Press', 'Squeeze'] },
  ohp_front: { hot: 'shoulders', hotAt: 'B', view: 'front', A: { a: 104, f: 180 }, B: { a: 176, f: 180 }, tempo: [1, 0.5, 3, 0.5], labels: ['Press', 'Top', 'Lower', 'Ready'] },
  lateral_raise: { hot: 'shoulders', hotAt: 'B', view: 'front', A: { a: 8 }, B: { a: 86 }, tempo: [1, 0.5, 2, 0.3], labels: ['Raise', 'Hold', 'Lower', 'Reset'] },
  fly: { hot: 'chest', hotAt: 'A', view: 'front', lying: true, bend: 12, A: { a: 194 }, B: { a: 102 }, tempo: [3, 0.5, 1.5, 0.5], labels: ['Open wide', 'Stretch', 'Hug in', 'Squeeze'] },
};

export function figureSVG(id, k) {
  const anim = ANIMS[id];
  if (!anim) return '';
  const body = anim.view === 'front' ? frontFigure(anim, k) : sideFigure(anim, k);
  return `<line x1="10" y1="${FLOOR + 5}" x2="290" y2="${FLOOR + 5}" stroke="${C.floor}" stroke-width="2"/>` + body;
}

const ease = (x) => (x < 0.5 ? 2 * x * x : 1 - ((-2 * x + 2) ** 2) / 2);

// Where the rep is at time t (seconds): k from 0 (A) to 1 (B), plus the tempo label.
export function phaseAt(id, t) {
  const { tempo, labels } = ANIMS[id];
  const total = tempo.reduce((a, b) => a + b, 0);
  let x = t % total;
  const [toB, holdB, toA] = tempo;
  if (x < toB) return { k: ease(x / toB), label: labels[0], left: Math.ceil(toB - x) };
  x -= toB;
  if (x < holdB) return { k: 1, label: labels[1] || labels[0], left: 0 };
  x -= holdB;
  if (x < toA) return { k: 1 - ease(x / toA), label: labels[2], left: Math.ceil(toA - x) };
  return { k: 0, label: labels[3] || labels[2], left: 0 };
}

// Mounts a looping animation into an <svg>. Returns a stop function.
export function mountFigure(svg, id, labelEl, onPhase) {
  let raf = 0, t = 0, last = performance.now(), alive = true, lastLabel = null;
  const reduce = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const draw = () => {
    const p = phaseAt(id, t);
    svg.innerHTML = figureSVG(id, p.k);
    if (labelEl) labelEl.textContent = p.label + (p.left > 1 ? ' · ' + p.left : '');
    if (onPhase && p.label !== lastLabel) { if (lastLabel !== null) onPhase(p.label); lastLabel = p.label; }
  };
  const tick = (now) => {
    if (!alive) return;
    t += Math.min((now - last) / 1000, 0.1); last = now;
    draw();
    raf = requestAnimationFrame(tick);
  };
  draw();
  if (!reduce) raf = requestAnimationFrame(tick);
  return () => { alive = false; cancelAnimationFrame(raf); };
}
