// Fianna rules: pure functions, no DOM. Everything here is tested in tests/logic.test.mjs.
import { EX, LEVELS, TRIALS, WEEK, WALKS, BADGES } from './data.js';

export const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const parseDay = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
export const addDays = (k, n) => { const d = parseDay(k); d.setDate(d.getDate() + n); return dayKey(d); };
export const daysBetween = (a, b) => Math.round((parseDay(b) - parseDay(a)) / 86400000);

export function newState() {
  return {
    v: 1,
    profile: { name: '', level: 1, weightLb: null, proteinTarget: 120, waterTarget: 80, doseDay: null, dbStep: 5, stepsGoal: 7000, setup: false },
    settings: { times: { wake: '05:30', midday: '12:00', evening: '19:30', bedtime: '21:30' }, weekend: { wake: '07:30', midday: '12:30', evening: '19:30', bedtime: '22:00' }, notify: true, skipDate: null, apiKey: '', workspaceId: '', model: 'claude-sonnet-5-5', speak: true, drum: false, lastBackup: null, dev: false },
    sessions: [], days: {}, weights: [], meals: [], rewards: [], badges: {}, chat: [], doses: [], health: {},
  };
}

export const day = (state, k) => (state.days[k] ||= { water: 0, food: [], mind: 0 });
export const proteinOf = (d) => (d?.food || []).reduce((a, f) => a + (Number(f.protein) || 0), 0);
export const caloriesOf = (d) => (d?.food || []).reduce((a, f) => a + (Number(f.cal) || 0), 0);

// Protein range from bodyweight: 1.6 to 2.0 g per kg, a commonly cited range for keeping muscle.
export function proteinRange(lb) {
  if (!lb) return null;
  const kg = lb / 2.2046;
  return [Math.round((kg * 1.6) / 5) * 5, Math.round((kg * 2.0) / 5) * 5];
}

// ---------- Plan for a day ----------
export function planFor(k) { return WEEK[parseDay(k).getDay()]; }

// Energy 1 to 5 picks how much to do. Low energy never means zero.
export function modeFor(energy) {
  if (energy == null) return 'full';
  if (energy <= 2) return 'min';
  if (energy === 3) return 'light';
  return 'full';
}

export function repsFor(exId, level) {
  const e = EX[exId];
  if (e.hold) return e.reps ? [e.reps[0] + (level - 1) * 5, e.reps[1] + (level - 1) * 10] : [20, 30];
  if (e.reps) return e.reps;
  return level <= 2 ? [10, 12] : level === 3 ? [8, 12] : [8, 10];
}

export function buildSession(trialId, level, mode = 'full', opts = {}) {
  const steps = [];
  if (trialId === 'walk') {
    const w = WALKS[level - 1];
    if (mode === 'min') steps.push({ type: 'timed', ex: 'walk', secs: 300, title: 'Easy walk', note: 'Five minutes at any pace. Showing up is the win.' });
    else if (w.blocks) for (const [secs, note] of w.blocks) steps.push({ type: 'timed', ex: 'walk', secs: mode === 'light' ? Math.round(secs * 0.7) : secs, title: 'Treadmill', note });
    else {
      const i = w.intervals, rounds = mode === 'light' ? Math.ceil(i.rounds / 2) : i.rounds;
      steps.push({ type: 'timed', ex: 'walk', secs: i.warm, title: 'Warm-up', note: 'Easy pace, flat' });
      for (let r = 1; r <= rounds; r++) {
        steps.push({ type: 'timed', ex: 'walk', secs: i.fast, title: `Fast ${r} of ${rounds}`, note: i.fastNote });
        steps.push({ type: 'timed', ex: 'walk', secs: i.easy, title: `Easy ${r} of ${rounds}`, note: i.easyNote });
      }
      steps.push({ type: 'timed', ex: 'walk', secs: i.cool, title: 'Cool-down', note: 'Easy pace, flat' });
    }
    return { trialId, level, mode, steps, name: 'Treadmill walk' };
  }
  const t = TRIALS[trialId];
  const moves = t.pool.slice(0, t.count[level - 1]);
  const rounds = mode === 'min' ? 1 : mode === 'light' ? 2 : level >= 4 ? 4 : 3;
  const rest = level < 3 ? 30 : level === 3 ? 25 : 20;
  steps.push({ type: 'timed', ex: 'walk', secs: mode === 'min' ? 60 : 120, title: 'Warm-up walk', note: 'Easy pace on the treadmill, or march in place.' });
  const set = (ex, r) => steps.push({ type: 'set', ex, round: r, of: rounds, reps: repsFor(ex, level), rest });
  if (level < 3) {
    for (let r = 1; r <= rounds; r++) for (const ex of moves) set(ex, r);
  } else {
    // supersets: pairs of moves done back to back
    for (let i = 0; i < moves.length; i += 2) {
      const pair = moves.slice(i, i + 2);
      for (let r = 1; r <= rounds; r++) for (const ex of pair) set(ex, r);
    }
  }
  const fin = t.finishers.find((f) => f.id === opts.finisher) || t.finishers[0];
  const stretch = mode === 'light' ? 0.6 : opts.boss ? 1.4 : 1;
  if (mode !== 'min') for (const f of fin.steps) steps.push({ type: 'timed', finisher: true, ex: f.ex, secs: Math.round(f.secs * stretch), title: 'Ríastrad', note: f.note });
  steps.push({ type: 'timed', ex: null, secs: 30, title: 'Breathe', note: 'Slow breath in through your nose, long breath out.' });
  return { trialId, level, mode, steps, name: opts.boss || t.name, boss: opts.boss || null, finisherId: mode === 'min' ? null : fin.id };
}

export function sessionMinutes(session) {
  let secs = 0;
  for (const s of session.steps) secs += s.type === 'timed' ? s.secs : 45 + s.rest;
  return Math.max(5, Math.round(secs / 60));
}

// ---------- Progression ----------
const isStrength = (s) => s.trialId !== 'walk';

// Sessions that count toward leaving the current level: strength, at this level, not the 5-minute version.
export function levelProgress(state) {
  const lvl = state.profile.level;
  const since = state.profile.levelSince || '0000-00-00';
  const list = state.sessions.filter((s) => isStrength(s) && s.level === lvl && s.mode !== 'min' && s.date >= since);
  const doable = list.filter((s) => s.felt === 'easy' || s.felt === 'doable').length;
  return { count: Math.min(list.length, 4), doable, need: 4, ready: list.length >= 4 && doable >= 3 && lvl < LEVELS.length };
}

export function maybeLevelUp(state, today = dayKey()) {
  if (!levelProgress(state).ready) return false;
  state.profile.level += 1;
  state.profile.levelSince = today;
  return true;
}

// Last logged sets for a move, newest first.
export function historyFor(state, exId) {
  return state.sessions.filter((s) => s.sets && s.sets[exId]?.length).map((s) => ({ date: s.date, sets: s.sets[exId] })).reverse();
}

export function suggestWeight(state, exId, level = state.profile.level) {
  if (EX[exId].bw) return { w: 0, note: 'Bodyweight' };
  const hist = historyFor(state, exId);
  if (!hist.length) return { w: null, note: 'Pick a weight you could lift about 15 times.' };
  const [lo, hi] = repsFor(exId, level);
  const last = hist[0].sets, w = Math.max(...last.map((s) => s.w));
  const top = last.filter((s) => s.w === w);
  if (top.every((s) => s.r >= hi)) return { w: w + state.profile.dbStep, note: `You hit ${hi} on every set. Go up ${state.profile.dbStep} lb.`, up: true };
  // Plateau: same top weight for three sessions with no more reps than three sessions ago.
  if (hist.length >= 3) {
    const score = (sets) => { const m = Math.max(...sets.map((x) => x.w)); return [m, sets.filter((x) => x.w === m).reduce((a, x) => a + x.r, 0)]; };
    const [a, b, c] = hist.slice(0, 3).map((h) => score(h.sets));
    if (a[0] === b[0] && b[0] === c[0] && a[1] <= c[1]) {
      const step = state.profile.dbStep, lighter = Math.max(step, Math.floor((w * 0.9) / step) * step);
      return { w: lighter === w ? Math.max(step, w - step) : lighter, note: 'Stalled for three sessions. Go lighter this week with slow, clean reps, then build back up.', deload: true };
    }
  }
  const missed = (sets) => sets.some((s) => s.r < lo);
  if (hist.length >= 2 && missed(last) && missed(hist[1].sets)) return { w, note: 'Hold this weight until the reps come back.' };
  return { w, note: `Same weight. Aim for ${hi} reps on every set.` };
}

export function bestFor(state, exId) {
  let best = null;
  for (const h of historyFor(state, exId)) for (const s of h.sets) if (!best || s.w > best.w || (s.w === best.w && s.r > best.r)) best = { ...s, date: h.date };
  return best;
}

// Number of lifts where the top weight has gone up since the first time it was logged.
export function prCount(state) {
  let n = 0;
  for (const id of Object.keys(EX)) {
    const h = historyFor(state, id);
    if (h.length < 2) continue;
    const first = Math.max(...h[h.length - 1].sets.map((s) => s.w));
    const max = Math.max(...h.flatMap((x) => x.sets.map((s) => s.w)));
    if (max > first) n++;
  }
  return n;
}

// ---------- Streak ----------
// Active days chain together as long as there is never a gap of 3 or more quiet days,
// so a rest weekend is safe but a lost week is not.
export function activeDays(state) {
  const set = new Set(state.sessions.map((s) => s.date));
  for (const [k, d] of Object.entries(state.days)) if (d.mind > 0) set.add(k);
  return [...set].sort();
}

// A shield is banked for every 7th active day in a run (2 at most). A shield covers one longer
// gap of up to 10 days, so a rough week does not erase months of work.
export function streak(state, today = dayKey()) {
  const days = activeDays(state).filter((d) => d <= today);
  if (!days.length) return { current: 0, best: 0, lastActive: null, shields: 0, shielded: false };
  let best = 1, run = 1, bank = 0;
  for (let i = 1; i < days.length; i++) {
    const gap = daysBetween(days[i - 1], days[i]);
    if (gap <= 3) run += 1;
    else if (bank > 0 && gap <= 10) { bank -= 1; run += 1; }
    else run = 1;
    if (run % 7 === 0) bank = Math.min(2, bank + 1);
    best = Math.max(best, run);
  }
  const lastActive = days[days.length - 1], gap = daysBetween(lastActive, today);
  const shielded = gap > 3 && gap <= 10 && bank > 0;
  const current = gap <= 3 || shielded ? run : 0;
  return { current, best: Math.max(best, current), lastActive, shields: bank, shielded };
}

export function needsComeback(state, today = dayKey()) {
  const s = streak(state, today);
  return !!s.lastActive && daysBetween(s.lastActive, today) >= 7;
}

// ---------- Fuel ----------
export function lowIntake(state, today = dayKey()) {
  const target = state.profile.proteinTarget;
  const low = (k) => { const d = state.days[k]; return d && d.food?.length > 0 && proteinOf(d) < target * 0.4; };
  return low(addDays(today, -1)) && low(addDays(today, -2));
}

export function proteinDaysHit(state) {
  return Object.values(state.days).filter((d) => proteinOf(d) >= state.profile.proteinTarget).length;
}

// ---------- Badges ----------
export function stats(state, today = dayKey()) {
  return {
    sessions: state.sessions.length,
    bestStreak: streak(state, today).best,
    level: state.profile.level,
    proteinDays: proteinDaysHit(state),
    mind: Object.values(state.days).reduce((a, d) => a + (d.mind || 0), 0),
    prs: prCount(state),
  };
}

export function awardBadges(state, today = dayKey()) {
  const s = stats(state, today), fresh = [];
  for (const b of BADGES) if (!state.badges[b.id] && b.test(s)) { state.badges[b.id] = today; fresh.push(b); }
  return fresh;
}

// ---------- Weekly report ----------
export function weekReport(state, today = dayKey()) {
  const keys = Array.from({ length: 7 }, (_, i) => addDays(today, -6 + i));
  const sess = state.sessions.filter((s) => s.date >= keys[0] && s.date <= today);
  const ds = keys.map((k) => state.days[k]).filter(Boolean);
  const avg = (xs) => (xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : null);
  const ws = state.weights.filter((w) => w.date >= keys[0] && w.date <= today);
  const before = state.weights.filter((w) => w.date < keys[0]).slice(-1)[0];
  return {
    from: keys[0], to: today,
    strength: sess.filter(isStrength).length, walks: sess.filter((s) => !isStrength(s)).length,
    minutes: sess.reduce((a, s) => a + (s.minutes || 0), 0),
    proteinHit: ds.filter((d) => proteinOf(d) >= state.profile.proteinTarget).length,
    proteinAvg: avg(ds.filter((d) => d.food?.length).map(proteinOf)),
    waterAvg: avg(ds.filter((d) => d.water > 0).map((d) => d.water)),
    energyAvg: avg(ds.filter((d) => d.energy).map((d) => d.energy)),
    sleepAvg: avg(ds.filter((d) => d.sleep).map((d) => d.sleep)),
    pumpAvg: avg(sess.filter((s) => s.pump).map((s) => s.pump)),
    mind: ds.reduce((a, d) => a + (d.mind || 0), 0),
    bandSleepAvg: avg(keys.map((k) => state.health?.[k]?.sleep).filter(Boolean)), bandStepsAvg: avg(keys.map((k) => state.health?.[k]?.steps).filter(Boolean)), recoveryAvg: avg(keys.map((k) => readiness(state, k)?.score).filter((v) => v != null)),
    weightChange: ws.length && before ? Math.round((ws[ws.length - 1].lb - before.lb) * 10) / 10 : null,
  };
}

// ---------- Pump learning ----------
// Try each finisher twice, then favour the one with the best average pump rating.
export function chooseFinisher(state, trialId) {
  const t = TRIALS[trialId]; if (!t) return null;
  const rated = (id) => state.sessions.filter((s) => s.trialId === trialId && s.finisherId === id && s.pump);
  const info = t.finishers.map((f) => { const r = rated(f.id); return { id: f.id, n: r.length, avg: r.length ? r.reduce((a, s) => a + s.pump, 0) / r.length : 0 }; });
  const untried = info.filter((f) => f.n < 2).sort((a, b) => a.n - b.n)[0];
  if (untried) return untried.id;
  return info.sort((a, b) => b.avg - a.avg)[0].id;
}

// The last trial before a new rank is a named boss trial with a longer finisher.
export function bossFor(state, trialId, mode) {
  if (trialId === 'walk' || mode !== 'full' || state.profile.level >= LEVELS.length) return null;
  const p = levelProgress(state);
  return p.count === p.need - 1 ? LEVELS[state.profile.level - 1].boss : null;
}

// ---------- Dose days ----------
// Days since the most recent logged dose (0 = dose day), or null when no dose is within a week.
export function doseOffset(state, k) {
  const prior = (state.doses || []).filter((d) => d <= k).sort().pop();
  if (!prior) return null;
  const n = daysBetween(prior, k);
  return n <= 6 ? n : null;
}

// Average logged energy for each day after a dose. Low days need at least two readings.
export function dosePattern(state) {
  const sum = Array(7).fill(0), n = Array(7).fill(0);
  for (const [k, d] of Object.entries(state.days)) {
    const off = doseOffset(state, k);
    if (off != null && d.energy) { sum[off] += d.energy; n[off] += 1; }
  }
  const avg = sum.map((v, i) => (n[i] ? Math.round((v / n[i]) * 10) / 10 : null));
  return { avg, n, low: avg.map((v, i) => (v != null && n[i] >= 2 && v <= 2.5 ? i : null)).filter((v) => v != null) };
}

export function isLowDoseDay(state, k) {
  const off = doseOffset(state, k);
  return off != null && dosePattern(state).low.includes(off);
}

// ---------- Health data (wearable) ----------
// state.health[day] = { sleep (hours), steps, rhr (resting bpm), hrv (ms), source }.
// Simulated entries from developer mode and real Health Connect readings share this shape.
const baseline = (state, k, field) => {
  const xs = [];
  for (let i = 1; i <= 14; i++) { const v = state.health?.[addDays(k, -i)]?.[field]; if (v) xs.push(v); }
  return xs.length >= 3 ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
};
const clamp01 = (x) => Math.max(0, Math.min(1, x));

// Recovery score 0 to 100 from last night's sleep, plus resting heart rate and HRV against
// the person's own two-week baseline. Missing pieces are left out and the rest reweighted.
export function readiness(state, k = dayKey()) {
  const h = state.health?.[k];
  if (!h) return null;
  const parts = [];
  if (h.sleep) parts.push({ name: 'sleep', w: 50, v: clamp01((h.sleep - 4) / 3.5), note: `${h.sleep} h sleep` });
  const rb = baseline(state, k, 'rhr'), hb = baseline(state, k, 'hrv');
  if (h.rhr && rb) parts.push({ name: 'rhr', w: 25, v: clamp01(1 - (h.rhr - rb) / 8), note: `resting heart rate ${h.rhr} (usual ${Math.round(rb)})` });
  if (h.hrv && hb) parts.push({ name: 'hrv', w: 25, v: clamp01((h.hrv / hb - 0.7) / 0.3), note: `HRV ${h.hrv} (usual ${Math.round(hb)})` });
  if (!parts.length) return null;
  const score = Math.round((parts.reduce((a, p) => a + p.w * p.v, 0) / parts.reduce((a, p) => a + p.w, 0)) * 100);
  return { score, label: score >= 70 ? 'ready' : score >= 45 ? 'steady' : 'low', parts, source: h.source || 'sim', hasBaseline: !!(rb || hb) };
}

// How much to do today. What the person says about their energy wins; with no check-in,
// a low recovery score from the wearable starts the day lighter.
export function modeToday(state, k = dayKey()) {
  const energy = state.days[k]?.energy;
  if (energy != null) return modeFor(energy);
  const r = readiness(state, k);
  return r && r.label === 'low' ? 'light' : 'full';
}

export function setHealth(state, k, data, source = 'sim') {
  const clean = {};
  for (const f of ['sleep', 'steps', 'rhr', 'hrv']) { const v = Number(data[f]); if (data[f] !== '' && data[f] != null && Number.isFinite(v) && v > 0) clean[f] = v; }
  state.health ||= {};
  if (Object.keys(clean).length) state.health[k] = { ...clean, source }; else delete state.health[k];
  return state.health[k] || null;
}

// Developer helper: two weeks of ordinary nights so today's numbers have a baseline to compare with.
export function seedHealthBaseline(state, today = dayKey()) {
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let i = 14; i >= 1; i--) {
    const k = addDays(today, -i);
    if (state.health?.[k] && state.health[k].source !== 'sim') continue;
    setHealth(state, k, { sleep: Math.round((6.6 + rnd() * 1.2) * 10) / 10, steps: Math.round(5500 + rnd() * 4000), rhr: Math.round(60 + rnd() * 5), hrv: Math.round(44 + rnd() * 10) });
  }
}
export function clearSimHealth(state) { for (const [k, h] of Object.entries(state.health || {})) if ((h.source || 'sim') === 'sim') delete state.health[k]; }

// ---------- Band analysis support ----------
// A plain safety check that never depends on the AI: resting heart rate at least 10 bpm
// above the person's own baseline for three days running.
export function healthFlag(state, k = dayKey()) {
  for (let i = 0; i < 3; i++) {
    const d = addDays(k, -i), h = state.health?.[d], b = baseline(state, addDays(k, -2), 'rhr');
    if (!h?.rhr || !b || h.rhr < b + 10) return null;
  }
  return 'Your resting heart rate has been well above your normal for three days. That can come from illness, dehydration, poor sleep, or medication. Take it easy and check with your doctor.';
}

// One row per day joining band data with what was logged, for pattern finding.
export function dayTable(state, today = dayKey(), span = 28) {
  const rows = [];
  for (let i = span - 1; i >= 0; i--) {
    const k = addDays(today, -i), h = state.health?.[k], d = state.days[k], ss = state.sessions.filter((x) => x.date === k);
    if (!h && !d && !ss.length) continue;
    const row = { date: k };
    if (h) Object.assign(row, { sleepH: h.sleep, restingHr: h.rhr, hrv: h.hrv, steps: h.steps, recovery: readiness(state, k)?.score });
    if (d) Object.assign(row, { energy: d.energy, mood: d.mood, proteinG: d.food?.length ? proteinOf(d) : undefined, waterOz: d.water || undefined });
    if (ss.length) Object.assign(row, { trained: ss.map((x) => x.trialId).join('+'), felt: ss[0].felt, pump: ss.find((x) => x.pump)?.pump });
    const off = doseOffset(state, k); if (off != null) row.daysSinceDose = off;
    rows.push(JSON.parse(JSON.stringify(row)));
  }
  return rows;
}
