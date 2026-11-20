// Fianna rune stone artwork: faceted vector stones with carved, glowing glyphs.
// Everything is generated as SVG markup so it stays sharp at any size and needs no image files.

let uid = 0;
const nid = (p) => `${p}${++uid}`;
const hsl = (h, s, l, a = 1) => { const L = Math.max(4, Math.min(96, l)); return a === 1 ? `hsl(${h.toFixed(0)} ${s.toFixed(0)}% ${L.toFixed(0)}%)` : `hsl(${h.toFixed(0)} ${s.toFixed(0)}% ${L.toFixed(0)}% / ${a})`; };
const LIGHT = [-0.55, -0.83];
const pts = (p) => p.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
function rng(seed) { let a = (seed * 2654435761) >>> 0; return (lo = 0, hi = 1) => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return lo + (((t ^ (t >>> 14)) >>> 0) / 4294967296) * (hi - lo); }; }

export const GLOW = { ember: [22, 95, 58], gold: [42, 90, 60], cyan: [190, 95, 62], violet: [285, 90, 70], moss: [100, 60, 58], bone: [42, 45, 86] };
export const ROCK = { slate: [250, 16, 34], lit: [250, 18, 38], brown: [24, 26, 34], violet: [268, 30, 38], blue: [212, 42, 40], deep: [240, 22, 24], green: [150, 24, 32], red: [8, 62, 44], ember: [18, 48, 36], bronze: [36, 40, 34], hero: [252, 18, 36] };
const INK = '#07050e';

function facetBody(outer, inner, [h, s, l], outline = 2.2) {
  const n = outer.length, cx = outer.reduce((a, p) => a + p[0], 0) / n, cy = outer.reduce((a, p) => a + p[1], 0) / n;
  const dotOf = (a, b) => { const mx = (a[0] + b[0]) / 2 - cx, my = (a[1] + b[1]) / 2 - cy, m = Math.hypot(mx, my) || 1; return (mx / m) * LIGHT[0] + (my / m) * LIGHT[1]; };
  let o = '';
  for (let i = 0; i < n; i++) {
    const a = outer[i], b = outer[(i + 1) % n], c = inner[(i + 1) % n], d = inner[i], f = hsl(h, s, l + dotOf(a, b) * 17 - 3);
    o += `<polygon points="${pts([a, b, c, d])}" fill="${f}" stroke="${f}" stroke-width="0.6"/>`;
  }
  const g = nid('g');
  o += `<linearGradient id="${g}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${hsl(h, s, l + 9)}"/><stop offset="1" stop-color="${hsl(h, s, l - 4)}"/></linearGradient><polygon points="${pts(inner)}" fill="url(#${g})"/>`;
  for (let i = 0; i < n; i++) {
    const a = inner[i], b = inner[(i + 1) % n], dot = dotOf(a, b), ln = (c, w, op) => `<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" stroke="${c}" stroke-width="${w}" stroke-linecap="round" opacity="${op.toFixed(2)}"/>`;
    if (dot > 0.25) o += ln(hsl(h, s * 0.6, l + 34), 1.3, 0.35 + dot * 0.5);
    if (dot < -0.25) o += ln(hsl(h, s, l - 22), 1.2, 0.6);
  }
  return o + `<polygon points="${pts(outer)}" fill="none" stroke="${hsl(h, s * 0.8, Math.max(5, l - 30))}" stroke-width="${outline}" stroke-linejoin="round"/>`;
}

function specks(inner, [h, s, l], rnd, k = 5) {
  const cx = inner.reduce((a, p) => a + p[0], 0) / inner.length, cy = inner.reduce((a, p) => a + p[1], 0) / inner.length;
  const r = Math.min(Math.max(...inner.map((p) => p[0])) - cx, Math.max(...inner.map((p) => p[1])) - cy);
  let o = '';
  for (let i = 0; i < k; i++) {
    const a = rnd(0, 6.28), d = rnd(0.25, 0.8) * r, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * 0.8, q = rnd(1.2, 2.6) * Math.max(0.5, r / 30);
    o += `<polygon points="${pts([[x, y], [x + q * 1.6, y - q * 0.5], [x + q * 1.1, y + q]])}" fill="${hsl(h, s, l + (i % 2 ? 12 : -12))}" opacity="0.55"/>`;
  }
  return o;
}

function stoneShape(cx, cy, rx, ry, seed, n = 8, inset = 0.74) {
  const rnd = rng(seed), outer = [];
  for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + ((i + 0.5) * 2 * Math.PI) / n + rnd(-0.13, 0.13), k = rnd(0.9, 1.04); outer.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]); }
  const ox = -rx * 0.03, oy = -ry * 0.07;
  return { outer, inner: outer.map(([x, y]) => [cx + ox + (x - cx) * inset, cy + oy + (y - cy) * inset]), rnd };
}

const softShadow = (cx, cy, rx, ry = rx * 0.22) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#000" opacity="0.4"/><ellipse cx="${cx}" cy="${cy}" rx="${rx * 0.7}" ry="${ry * 0.6}" fill="#000" opacity="0.35"/>`;
export function halo(cx, cy, r, [h, s, l], op = 0.5, pulse = false) {
  const g = nid('h');
  return `<radialGradient id="${g}"><stop offset="0" stop-color="${hsl(h, s, l)}" stop-opacity="${op}"/><stop offset="1" stop-color="${hsl(h, s, l)}" stop-opacity="0"/></radialGradient><circle ${pulse ? 'class="pulse"' : ''} cx="${cx}" cy="${cy}" r="${r}" fill="url(#${g})"/>`;
}

// A glyph cut into the stone. `inner` is stroke-only markup; lit glyphs glow in the given colour.
export function carve(inner, glow, w = 3.2, lit = true) {
  const g = (attrs) => `<g fill="none" stroke-linecap="round" stroke-linejoin="round" ${attrs}>${inner}</g>`;
  if (!lit || !glow) return g(`stroke="hsl(250 20% 58%)" stroke-width="${w}" transform="translate(0.7 1.1)" opacity="0.5"`) + g(`stroke="#0b0916" stroke-width="${w}"`);
  const f = nid('f'), [h, s, l] = glow;
  return `<filter id="${f}" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="${(w * 1.25).toFixed(1)}"/></filter>` +
    g(`stroke="${INK}" stroke-width="${w + 2.4}" transform="translate(0.8 1.4)" opacity="0.85"`) + g(`stroke="${hsl(h, s, l)}" stroke-width="${w + 4}" filter="url(#${f})" opacity="0.95"`) +
    g(`stroke="${hsl(h, s, l)}" stroke-width="${w}"`) + g(`stroke="${hsl(h, 35, 93)}" stroke-width="${Math.max(0.8, w * 0.32).toFixed(1)}" opacity="0.9"`);
}
// The same, for a filled shape such as the Fearn F from the logo.
export function carveFill(inner, glow, blur = 5, lit = true) {
  const g = (attrs) => `<g ${attrs}>${inner}</g>`;
  if (!lit || !glow) return g('fill="hsl(250 20% 58%)" transform="translate(0.8 1.2)" opacity="0.5"') + g('fill="#0b0916"');
  const f = nid('f'), [h, s, l] = glow;
  return `<filter id="${f}" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="${blur}"/></filter>` +
    g(`fill="${INK}" stroke="${INK}" stroke-width="3" stroke-linejoin="round" transform="translate(1 1.8)" opacity="0.85"`) + g(`fill="${hsl(h, s, l)}" stroke="${hsl(h, s, l)}" stroke-width="4" filter="url(#${f})"`) +
    g(`fill="${hsl(h, s, l)}"`) + g(`fill="none" stroke="${hsl(h, 60, 88)}" stroke-width="1.2" opacity="0.8"`);
}
export function carveText(txt, x, y, size, glow, { font = "'Cinzel', Georgia, serif", anchor = 'middle', weight = 700 } = {}) {
  const f = nid('f'), [h, s, l] = glow, t = (extra) => `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="${font}" font-size="${size}" font-weight="${weight}" ${extra}>${txt}</text>`;
  return `<filter id="${f}" x="-40%" y="-60%" width="180%" height="220%"><feGaussianBlur stdDeviation="${(size * 0.13).toFixed(1)}"/></filter>` + t(`fill="${INK}" transform="translate(1 1.8)" opacity="0.8"`) + t(`fill="${hsl(h, s, l)}" filter="url(#${f})"`) + t(`fill="${hsl(h, s * 0.9, l + 16)}"`);
}

export function runeStone(cx, cy, rx, ry, seed, rock, glyph, glow, { w = 3.2, lit = true, n = 8, withHalo = true, pulse = false } = {}) {
  const { outer, inner, rnd } = stoneShape(cx, cy, rx, ry, seed, n);
  return softShadow(cx, cy + ry * 0.98, rx * 0.85) + (lit && glow && withHalo ? halo(cx, cy, rx * 1.55, glow, 0.32, pulse) : '') + facetBody(outer, inner, rock) + specks(inner, rock, rnd) + glyph(lit ? glow : null);
}

// ---------- Glyphs ----------
const PATHS = {
  today: 'M4 11l8-7 8 7v9H4z', train: 'M3 9v6M7 6v12M17 6v12M21 9v6M7 12h10', fuel: 'M12 3c3 4 5 6.5 5 10a5 5 0 01-10 0c0-3.5 2-6 5-10z',
  mind: 'M12 12c0-4 4-5 5.5-2.5S16 15 13 14.2M12 12c3.500 2 2.500 6-.4 6.500S6.500 16 8.700 13.600M12 12c-3.500 2-6.500-1-5.500-3.800S11 5 11.800 8', progress: 'M4 20V10M10 20V4M16 20v-7',
  flame: 'M12 3c1 5 6 7 6 12a6 6 0 01-12 0c0-3 2-4 3-7 1 2 2 2 3-5z', drop: 'M12 3c3 4 5 6.5 5 10a5 5 0 01-10 0c0-3.5 2-6 5-10z', spiral: 'M12 12c0-2 3-2 3 .5s-4 4-6 1.500-1-7 3-7.500 7 3 6.500 7',
  star: 'M12 3l2.600 6 6.400.600-4.900 4.200 1.500 6.200L12 16.800 6.400 20l1.500-6.200L3 9.600 9.400 9z', shield: 'M12 3l8 3v6c0 5-3.500 8-8 9-4.500-1-8-4-8-9V6z', leaf: 'M5 19C5 9 11 5 20 4c0 9-4 15-13 15zM5 19l8-8', bolt: 'M13 2L5 14h6l-1 8 8-12h-6z',
};
export const iconGlyph = (name, cx, cy, size, w = 3) => (glow) => carve(`<g transform="translate(${(cx - size / 2).toFixed(1)} ${(cy - size / 2).toFixed(1)}) scale(${(size / 24).toFixed(3)})"><path d="${PATHS[name]}"/></g>`, glow, w * (24 / size), !!glow);
// Ogham letters of the first group: a stem with 1 to 5 strokes to the right (Beith, Luis, Fearn, Sail, Nion).
export const oghamGlyph = (k, cx, cy, h, w = 3.4) => (glow) => {
  let d = `M${cx - h * 0.07} ${cy + h / 2} V${cy - h / 2}`;
  for (let j = 0; j < k; j++) d += ` M${cx - h * 0.07} ${(cy - h * 0.36 + (j + 0.5) * ((h * 0.72) / k)).toFixed(1)} h${(h * 0.34).toFixed(1)}`;
  return carve(`<path d="${d}"/>`, glow, w, !!glow);
};
// The Fearn F exactly as drawn on the logo canvas, scaled to fit.
export const fearnGlyph = (cx, cy, h) => (glow) => {
  const k = h / 162;
  return carveFill(`<g transform="translate(${(cx - 46 * k).toFixed(1)} ${(cy - h / 2).toFixed(1)}) scale(${k.toFixed(3)}) translate(-96 -38)"><path d="M96 46 L120 38 V200 H96 Z"/><path d="M120 46 H196 L186 70 H120 Z"/><path d="M120 94 H176 L167 116 H120 Z"/><path d="M120 140 H156 L148 160 H120 Z"/></g>`, glow, Math.max(2, h * 0.07), !!glow);
};
export const textGlyph = (txt, cx, cy, size) => (glow) => (glow ? carveText(txt, cx, cy + size * 0.34, size, glow) : `<text x="${cx}" y="${cy + size * 0.34}" text-anchor="middle" font-family="'Cinzel', Georgia, serif" font-size="${size}" font-weight="700" fill="#0b0916">${txt}</text>`);
const noGlyph = () => '';

// ---------- Ready-made pieces ----------
const wrap = (w, h, body, label, cls = '') => `<svg class="stone ${cls}" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" ${label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"'}>${body}</svg>`;

export const RANKS = [{ rock: ROCK.brown, glow: GLOW.ember }, { rock: ROCK.slate, glow: GLOW.gold }, { rock: ROCK.blue, glow: GLOW.cyan }, { rock: ROCK.violet, glow: GLOW.violet }, { rock: ROCK.green, glow: GLOW.moss }];
export function rankStone(level, size = 80, lit = true, pulse = false) {
  const r = RANKS[level - 1], c = size / 2;
  return wrap(size, size * 1.08, runeStone(c, c, size * 0.4, size * 0.42, 80 + level, lit ? r.rock : ROCK.deep, oghamGlyph(level, c, c, size * 0.5, size * 0.045), r.glow, { lit, n: 7 + (level % 2), pulse }), `Rank ${level} stone`);
}
export function heroStone(size = 120, pulse = true) {
  const c = size / 2;
  return wrap(size, size * 1.1, runeStone(c, c + 2, size * 0.42, size * 0.45, 7, ROCK.hero, fearnGlyph(c, c, size * 0.5), GLOW.ember, { pulse }), 'Fianna');
}
export function numberStone(value, rock, glow, seed, size = 96) {
  const c = size / 2, txt = String(value), fs = size * (txt.length > 2 ? 0.27 : 0.36);
  return wrap(size, size * 1.05, runeStone(c, c - 1, size * 0.45, size * 0.43, seed, rock, textGlyph(txt, c, c - 1, fs), glow, { n: 7 + (seed % 2) }));
}
export function iconStone(name, rock, glow, seed, size = 64, lit = true) {
  const c = size / 2;
  return wrap(size, size * 1.08, runeStone(c, c, size * 0.42, size * 0.42, seed, lit ? rock : ROCK.deep, iconGlyph(name, c, c - 1, size * 0.46), glow, { lit, n: 7 + (seed % 2) }));
}
export function tabStone(name, on, seed) {
  return wrap(52, 48, runeStone(26, 23, 22, 20, seed, on ? ROCK.lit : ROCK.slate, iconGlyph(name, 26, 22, 19, 2.4), GLOW.ember, { lit: on }));
}
export function notchStone(lit, seed, size = 34) {
  const c = size / 2;
  return wrap(size, size, runeStone(c, c - 1, size * 0.44, size * 0.42, seed, ROCK.slate, (glow) => carve(`<path d="M${c - size * 0.18} ${c - 1} H${c + size * 0.18}"/>`, glow, 2.6, !!glow), GLOW.ember, { lit, n: 6, withHalo: false }));
}

// A stone slab as a stretchable button background (data URI).
export function slabURI(rock, w = 320, h = 52, seed = 3) {
  const rnd = rng(seed), j = () => rnd(-1.4, 1.4), ch = 9, x = 3, y = 3, W = w - 6, H = h - 9, cx = x + W / 2, cy = y + H / 2;
  const outer = [[x + ch + j(), y + j()], [x + W - ch + j(), y + j()], [x + W + j(), y + ch + j()], [x + W + j(), y + H - ch + j()], [x + W - ch + j(), y + H + j()], [x + ch + j(), y + H + j()], [x + j(), y + H - ch + j()], [x + j(), y + ch + j()]];
  const inner = outer.map(([px, py]) => [px + (px < cx ? 7 : -7) * (Math.abs(px - cx) > W / 2 - ch - 3 ? 1 : 0.55), py + (py < cy ? 5.5 : -8.5) * (Math.abs(py - cy) > H / 2 - ch - 3 ? 1 : 0.55)]);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><ellipse cx="${w / 2}" cy="${h - 3}" rx="${w * 0.46}" ry="3" fill="#000" opacity="0.45"/>${facetBody(outer, inner, rock)}${specks(inner, rock, rnd, 7)}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

// A carved slate plate as a nine-slice border image: chamfered corners with knots, a twisted rope edge.
export function plateURI(knots = true) {
  const S = 120, c = 12, P = (d) => [[c + d, d], [S - c - d, d], [S - d, c + d], [S - d, S - c - d], [S - c - d, S - d], [c + d, S - d], [d, S - c - d], [d, c + d]];
  let s = `<linearGradient id="p" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stop-color="hsl(246 24% 25%)"/><stop offset="1" stop-color="hsl(250 28% 15%)"/></linearGradient>`;
  s += `<polygon points="${pts(P(1.5))}" fill="url(#p)" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/><polygon points="${pts(P(4))}" fill="none" stroke="hsl(250 22% 46%)" stroke-width="1" opacity="0.7"/>`;
  s += `<polygon points="${pts(P(10))}" fill="none" stroke="#0b0916" stroke-width="5"/><polygon points="${pts(P(10))}" fill="none" stroke="hsl(38 45% 46%)" stroke-width="3" stroke-dasharray="5 3"/><polygon points="${pts(P(10))}" fill="none" stroke="hsl(42 70% 72%)" stroke-width="1" stroke-dasharray="2 6" stroke-dashoffset="-1"/>`;
  s += `<polygon points="${pts(P(15))}" fill="hsl(250 30% 13%)" stroke="${INK}" stroke-width="1.5"/>`;
  if (knots) for (const [kx, ky] of [[16, 16], [S - 16, 16], [16, S - 16], [S - 16, S - 16]]) {
    s += `<circle cx="${kx}" cy="${ky}" r="9.500" fill="hsl(250 26% 20%)" stroke="${INK}" stroke-width="1.600"/><circle cx="${kx}" cy="${ky}" r="7.500" fill="none" stroke="hsl(38 45% 46%)" stroke-width="1"/>`;
    for (const a of [90, 210, 330]) { const ex = kx + Math.cos((a * Math.PI) / 180) * 2.2, ey = ky - Math.sin((a * Math.PI) / 180) * 2.2; s += `<ellipse cx="${ex.toFixed(1)}" cy="${ey.toFixed(1)}" rx="2.300" ry="4.300" transform="rotate(${90 - a} ${ex.toFixed(1)} ${ey.toFixed(1)})" fill="none" stroke="hsl(42 70% 70%)" stroke-width="0.900"/>`; }
  }
  return `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">${s}</svg>`)}")`;
}

// Full app icon artwork (also used to render the Android launcher icons).
export function appIconSVG(size = 512, rounded = true) {
  const body = `<radialGradient id="bgi" cx="0.5" cy="0.3" r="0.9"><stop offset="0" stop-color="hsl(252 44% 22%)"/><stop offset="1" stop-color="hsl(246 50% 8%)"/></radialGradient><rect width="220" height="220" ${rounded ? 'rx="50"' : ''} fill="url(#bgi)"/>` +
    runeStone(110, 112, 78, 84, 7, ROCK.hero, fearnGlyph(110, 110, 96), GLOW.ember);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 220 220">${body}</svg>`;
}
