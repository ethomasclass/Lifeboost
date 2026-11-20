// The hero: gear and rune powers earned only by real training, food, water and rest. Pure rules, no drawing.
import { EX, TRIALS, LEVELS } from './data.js';
import { dayKey, addDays, daysBetween, streak, wellRun, weekStart, proteinHitsInWeek, salmonReady, mindTotal, rerollCharges } from './logic.js';

export const TIER_AT = [0, 80, 400, 1200, 3000];
export const PIECES = [
  { id: 'breastplate', name: 'Breastplate', part: 'chest', tiers: ['Linen tunic', 'Leather jerkin', 'Bronze cuirass', 'Iron cuirass', 'Gold-inlaid cuirass'] },
  { id: 'belt', name: 'Belt', part: 'core', tiers: ['Rope belt', 'Leather belt', 'Bronze belt', 'Iron war belt', 'Gold-inlaid war belt'] },
  { id: 'pauldrons', name: 'Pauldrons', part: 'shoulders', tiers: ['Bare shoulders', 'Leather pads', 'Bronze pauldrons', 'Iron pauldrons', 'Gold-inlaid pauldrons'] },
  { id: 'bracers', name: 'Bracers', part: 'arms', tiers: ['Bare arms', 'Leather bracers', 'Bronze bracers', 'Iron bracers', 'Gold-inlaid bracers'] },
  { id: 'greaves', name: 'Greaves', part: 'legs', tiers: ['Cloth wraps', 'Leather greaves', 'Bronze greaves', 'Iron greaves', 'Gold-inlaid greaves'] },
  { id: 'cloak', name: 'Cloak', part: 'back', tiers: ['No cloak', 'Wool mantle', 'Green cloak', 'Blue cloak', 'Royal purple cloak'] },
];

// Which gear each move builds. 1 is the main muscle; smaller numbers are helpers.
export const CREDIT = {
  incline_press: { breastplate: 1, pauldrons: 0.3, bracers: 0.3 }, flat_press: { breastplate: 1, bracers: 0.3 }, squeeze_press: { breastplate: 1 },
  fly: { breastplate: 1 }, fly_incline: { breastplate: 1 }, incline_pushup: { breastplate: 1, bracers: 0.3 },
  pullover: { cloak: 1, breastplate: 0.3 }, row: { cloak: 1, bracers: 0.4 },
  shoulder_press: { pauldrons: 1, bracers: 0.3 }, lateral_raise: { pauldrons: 1 }, curl: { bracers: 1 }, triceps_ext: { bracers: 1 },
  dead_bug: { belt: 1 }, leg_raise: { belt: 1 }, plank: { belt: 1 },
  goblet_squat: { greaves: 1, belt: 0.2 }, squat_pulse: { greaves: 1 }, rdl: { greaves: 1, cloak: 0.3 }, split_squat: { greaves: 1 }, calf_raise: { greaves: 1 }, glute_bridge: { greaves: 1 },
};
const main = (ex) => Object.entries(CREDIT[ex] || {}).sort((a, b) => b[1] - a[1])[0]?.[0];

// Experience per piece: logged reps (holds count a third), 15 per finisher move, 40 each time a lift's top weight goes up, 10 per walk.
export function armorXP(state) {
  const xp = Object.fromEntries(PIECES.map((p) => [p.id, 0])), best = {};
  const give = (ex, units) => { for (const [piece, w] of Object.entries(CREDIT[ex] || {})) xp[piece] += units * w; };
  for (const s of [...state.sessions].sort((a, b) => a.date.localeCompare(b.date))) {
    for (const [ex, sets] of Object.entries(s.sets || {})) {
      if (!CREDIT[ex] || !sets.length) continue;
      give(ex, sets.reduce((a, x) => a + (EX[ex].hold ? x.r / 3 : x.r), 0));
      const top = Math.max(...sets.map((x) => x.w));
      if (top > 0) { if (best[ex] != null && top > best[ex]) xp[main(ex)] += 40; best[ex] = Math.max(best[ex] ?? 0, top); }
    }
    const fin = TRIALS[s.trialId]?.finishers.find((f) => f.id === s.finisherId);
    if (fin) for (const step of fin.steps) give(step.ex, 15);
    if (s.trialId === 'walk') xp.greaves += s.mode === 'min' ? 5 : 10;
  }
  for (const k of Object.keys(xp)) xp[k] = Math.round(xp[k]);
  return xp;
}
export const tierOf = (xp) => TIER_AT.reduce((t, at, i) => (xp >= at ? i : t), 0);

export function armor(state) {
  const xp = armorXP(state);
  return PIECES.map((p) => {
    const tier = tierOf(xp[p.id]), next = TIER_AT[tier + 1] ?? null, from = TIER_AT[tier];
    return { ...p, xp: xp[p.id], tier, tierName: p.tiers[tier], next, nextName: next ? p.tiers[tier + 1] : null, pct: next ? Math.round(((xp[p.id] - from) / (next - from)) * 100) : 100 };
  });
}
// The piece closest to its next tier, for the "next upgrade" line.
export function nextUpgrade(state) {
  return armor(state).filter((a) => a.next).sort((a, b) => (a.next - a.xp) - (b.next - b.xp))[0] || null;
}

const isDawn = (s) => s.hour != null && s.hour < 7;
export function dawnDays(state, today = dayKey()) {
  return new Set(state.sessions.filter((s) => isDawn(s) && daysBetween(s.date, today) >= 0 && daysBetween(s.date, today) < 7).map((s) => s.date)).size;
}

// The five rune powers. Each is lit by a habit and does something real in the app.
export function runes(state, today = dayKey()) {
  const st = streak(state, today), well = wellRun(state, today), mon = weekStart(today), hits = proteinHitsInWeek(state, mon), mind = mindTotal(state), charges = rerollCharges(state), dawn = dawnDays(state, today);
  const armed = salmonReady(state, today);
  return [
    { id: 'embers', name: 'Rune of Embers', icon: 'flame', rock: 'ember', glow: 'ember', lit: st.shields > 0, charges: st.shields, habit: 'Train on 7 active days in a row to bank a charge (2 at most).', effect: 'A charge saves your streak through a gap of up to 10 days.', progress: `${st.current % 7} of 7 active days toward the next charge` },
    { id: 'salmon', name: 'Rune of the Salmon', icon: 'fish', rock: 'green', glow: 'gold', lit: armed, habit: 'Hit your protein target on 5 days of a week.', effect: 'The first full strength trial of the next week counts double toward your rank.', progress: armed ? 'Armed. Your next full strength trial counts double.' : `${hits} of 5 protein days this week` },
    { id: 'well', name: 'Rune of the Well', icon: 'drop', rock: 'blue', glow: 'cyan', lit: well >= 3, habit: 'Fill the cauldron 3 days running.', effect: 'Unlocks a third pump finisher, the Gift of the Well, in every trial.', progress: `${Math.min(well, 3)} of 3 days in a row` },
    { id: 'stillness', name: 'Rune of Stillness', icon: 'spiral', rock: 'violet', glow: 'violet', lit: charges > 0, charges, habit: 'Every 10 breathing or meditation sessions earns a charge.', effect: "Spend a charge to re-roll a trial you don't feel like doing.", progress: `${mind % 10} of 10 mind sessions toward the next charge` },
    { id: 'dawn', name: 'Rune of the Dawn', icon: 'sun', rock: 'bronze', glow: 'gold', lit: dawn >= 3, habit: 'Train before 7 AM on 3 of the last 7 days.', effect: 'Your warrior stands in the light of the rising sun.', progress: `${Math.min(dawn, 3)} of 3 dawn trials this week` },
  ];
}

export function relics(state, today = dayKey()) {
  const firsts = {}, tops = {};
  for (const s of [...state.sessions].sort((a, b) => a.date.localeCompare(b.date))) for (const [ex, sets] of Object.entries(s.sets || {})) {
    const top = Math.max(0, ...sets.map((x) => x.w)); if (top <= 0) continue;
    firsts[ex] ??= top; tops[ex] = Math.max(tops[ex] ?? 0, top);
  }
  const bosses = state.sessions.filter((s) => s.boss).length, dawns = state.sessions.filter(isDawn).length;
  return [
    { id: 'boss', name: 'Mark of the Salmon Leap', how: 'Finish your first boss trial', icon: 'shield', rock: 'slate', glow: 'cyan', have: bosses >= 1 },
    { id: 'double', name: 'Stone of the Doubled Lift', how: 'Lift double your starting weight on any move', icon: 'bolt', rock: 'red', glow: 'gold', have: Object.keys(firsts).some((ex) => tops[ex] >= firsts[ex] * 2) },
    { id: 'thirty', name: 'Thirty Fires', how: 'Reach a 30-day streak', icon: 'flame', rock: 'ember', glow: 'ember', have: streak(state, today).best >= 30 },
    { id: 'dawn', name: 'Dawn-treader', how: 'Finish 10 trials before 7 AM', icon: 'sun', rock: 'bronze', glow: 'gold', have: dawns >= 10 },
  ];
}

export const SPEARS = ['Ash practice spear', 'Bronze-tipped spear', 'Iron war spear', 'Bannered war spear', 'Gold spear of the Fianna'];
export const SHIELDS = ['No shield', 'Hide shield', 'Bronze-bound shield', 'Iron-bound shield', 'Shield of the Fianna'];
export const TORCS = ['No torc', 'Bronze torc', 'Silver torc', 'Gold torc'];

// Everything the artwork needs to draw the hero as he stands today.
export function heroLook(state, today = dayKey()) {
  const n = state.sessions.length, bosses = state.sessions.filter((s) => s.boss).length;
  return {
    armor: Object.fromEntries(armor(state).map((a) => [a.id, a.tier])),
    spear: Math.max(1, Math.min(LEVELS.length, state.profile.level)), shield: Math.min(4, bosses), bosses,
    torc: n >= 100 ? 3 : n >= 25 ? 2 : n >= 5 ? 1 : 0,
    dawn: dawnDays(state, today) >= 3, embers: streak(state, today).shields,
  };
}
// A look with every piece at one tier, for previews.
export const previewLook = (t) => ({ armor: Object.fromEntries(PIECES.map((p) => [p.id, t])), spear: Math.min(5, t + 1), shield: t, bosses: t, torc: Math.min(3, t), dawn: t >= 3, embers: t >= 2 ? 1 : 0 });

// What changed between two looks, for the reward screen after a trial.
export function forged(before, after) {
  const out = [];
  for (const p of PIECES) if (after.armor[p.id] > before.armor[p.id]) out.push({ kind: 'armor', name: p.tiers[after.armor[p.id]], part: p.part });
  if (after.spear > before.spear) out.push({ kind: 'spear', name: SPEARS[after.spear - 1] });
  if (after.shield > before.shield) out.push({ kind: 'shield', name: SHIELDS[after.shield] });
  if (after.torc > before.torc) out.push({ kind: 'torc', name: TORCS[after.torc] });
  return out;
}
