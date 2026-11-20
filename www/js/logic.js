// Fianna rules: pure functions, no DOM. Everything here is tested in tests/logic.test.mjs.
import { EX, LEVELS, TRIALS, WEEK, WALKS, BADGES } from './data.js';

export const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const parseDay = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
export const addDays = (k, n) => { const d = parseDay(k); d.setDate(d.getDate() + n); return dayKey(d); };
export const daysBetween = (a, b) => Math.round((parseDay(b) - parseDay(a)) / 86400000);

export function newState() {
  return {
    v: 1,
    profile: { name: '', level: 1, weightLb: null, proteinTarget: 120, waterTarget: 80, doseDay: null, dbStep: 5, setup: false },
    settings: { times: { wake: '05:30', midday: '12:00', evening: '19:30', bedtime: '21:30' }, weekend: { wake: '07:30', midday: '12:30', evening: '19:30', bedtime: '22:00' }, notify: true, skipDate: null, apiKey: '', model: 'claude-sonnet-5-5' },
    sessions: [], days: {}, weights: [], meals: [], rewards: [], badges: {}, chat: [],
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

export function buildSession(trialId, level, mode = 'full') {
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
  if (mode !== 'min') for (const f of t.finisher) steps.push({ type: 'timed', finisher: true, ex: f.ex, secs: mode === 'light' ? Math.round(f.secs * 0.6) : f.secs, title: 'Ríastrad', note: f.note });
  steps.push({ type: 'timed', ex: null, secs: 30, title: 'Breathe', note: 'Slow breath in through your nose, long breath out.' });
  return { trialId, level, mode, steps, name: t.name };
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

export function streak(state, today = dayKey()) {
  const days = activeDays(state).filter((d) => d <= today);
  if (!days.length) return { current: 0, best: 0, lastActive: null };
  let best = 1, run = 1;
  for (let i = 1; i < days.length; i++) {
    run = daysBetween(days[i - 1], days[i]) <= 3 ? run + 1 : 1;
    best = Math.max(best, run);
  }
  const lastActive = days[days.length - 1];
  const current = daysBetween(lastActive, today) <= 3 ? run : 0;
  return { current, best: Math.max(best, current), lastActive };
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
    weightChange: ws.length && before ? Math.round((ws[ws.length - 1].lb - before.lb) * 10) / 10 : null,
  };
}
