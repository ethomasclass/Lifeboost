import assert from 'node:assert/strict';
import * as L from '../www/js/logic.js';
import { TRIALS, EX } from '../www/js/data.js';
import { ANIMS } from '../www/js/figure.js';

const sess = (date, over = {}) => ({ date, trialId: 'chest_back', level: 1, mode: 'full', felt: 'doable', sets: {}, minutes: 10, ...over });

// every exercise used by a trial exists and has an animation
for (const t of Object.values(TRIALS)) for (const id of [...t.pool, ...t.finisher.map((f) => f.ex)]) {
  assert.ok(EX[id], `missing exercise ${id}`);
  assert.ok(ANIMS[EX[id].anim || id], `missing animation for ${id}`);
}

// session length grows with level and lands near the promised minutes
for (const id of Object.keys(TRIALS)) {
  const mins = [1, 2, 3, 4, 5].map((n) => L.sessionMinutes(L.buildSession(id, n)));
  for (let i = 1; i < 5; i++) assert.ok(mins[i] >= mins[i - 1], `${id} minutes should not shrink: ${mins}`);
  [10, 15, 20, 25, 30].forEach((want, i) => assert.ok(Math.abs(mins[i] - want) <= 4, `${id} level ${i + 1}: ${mins[i]} min vs ${want}`));
  assert.ok(L.sessionMinutes(L.buildSession(id, 1, 'min')) <= 6, 'bare minimum stays near 5 minutes');
}
[10, 15, 20, 22, 26].forEach((want, i) => assert.equal(L.sessionMinutes(L.buildSession('walk', i + 1)), want));

// energy picks the mode
assert.equal(L.modeFor(1), 'min'); assert.equal(L.modeFor(3), 'light'); assert.equal(L.modeFor(5), 'full');

// level up: 4 sessions with at least 3 doable
let s = L.newState();
s.sessions = [sess('2026-11-02'), sess('2026-11-04'), sess('2026-11-06', { felt: 'hard' })];
assert.equal(L.levelProgress(s).ready, false);
s.sessions.push(sess('2026-11-09', { mode: 'min' }));
assert.equal(L.levelProgress(s).ready, false, '5-minute sessions do not count toward a level');
s.sessions.push(sess('2026-11-11'));
assert.equal(L.levelProgress(s).ready, true);
assert.equal(L.maybeLevelUp(s, '2026-11-11'), true);
assert.equal(s.profile.level, 2);
assert.equal(L.levelProgress(s).count, 0, 'progress resets at the new level');
s = L.newState();
s.sessions = [1, 2, 3, 4].map((d) => sess(`2026-11-0${d}`, { felt: d < 3 ? 'doable' : 'hard' }));
assert.equal(L.levelProgress(s).ready, false, 'two hard sessions hold the level');

// weight suggestions
s = L.newState();
assert.equal(L.suggestWeight(s, 'incline_press').w, null);
s.sessions = [sess('2026-11-02', { sets: { incline_press: [{ w: 20, r: 12 }, { w: 20, r: 12 }, { w: 20, r: 12 }] } })];
assert.equal(L.suggestWeight(s, 'incline_press').w, 25);
s.sessions = [sess('2026-11-02', { sets: { incline_press: [{ w: 20, r: 12 }, { w: 20, r: 10 }] } })];
assert.equal(L.suggestWeight(s, 'incline_press').w, 20);
s.sessions = [sess('2026-11-02', { sets: { incline_press: [{ w: 25, r: 8 }] } }), sess('2026-11-04', { sets: { incline_press: [{ w: 25, r: 7 }] } })];
assert.match(L.suggestWeight(s, 'incline_press').note, /Hold/);
assert.equal(L.suggestWeight(s, 'plank').note, 'Bodyweight');

// streak: weekend rest is safe, a lost week is not
s = L.newState();
s.sessions = ['2026-11-09', '2026-11-10', '2026-11-11', '2026-11-13', '2026-11-16'].map((d) => sess(d));
assert.equal(L.streak(s, '2026-11-16').current, 5, 'Fri to Mon keeps the streak');
assert.equal(L.streak(s, '2026-11-19').current, 5, 'three days later it still stands');
assert.equal(L.streak(s, '2026-11-20').current, 0, 'four days later it is gone');
assert.equal(L.streak(s, '2026-11-20').best, 5);
assert.equal(L.needsComeback(s, '2026-11-23'), true);
assert.equal(L.needsComeback(s, '2026-11-18'), false);

// fuel
s = L.newState(); s.profile.proteinTarget = 150;
s.days['2026-11-18'] = { food: [{ protein: 30 }], water: 0, mind: 0 };
s.days['2026-11-19'] = { food: [{ protein: 40 }], water: 0, mind: 0 };
assert.equal(L.lowIntake(s, '2026-11-20'), true);
s.days['2026-11-19'].food.push({ protein: 60 });
assert.equal(L.lowIntake(s, '2026-11-20'), false);
assert.deepEqual(L.proteinRange(220), [160, 200]);

// badges and plan
s = L.newState(); s.sessions = [sess('2026-11-20')];
assert.deepEqual(L.awardBadges(s, '2026-11-20').map((b) => b.id), ['first']);
assert.equal(L.awardBadges(s, '2026-11-20').length, 0, 'a badge is only awarded once');
assert.equal(L.planFor('2026-11-20'), 'chest_shoulders');
assert.equal(L.planFor('2026-11-21'), 'rest');

// weekly report
const r = L.weekReport(s, '2026-11-20');
assert.equal(r.strength, 1); assert.equal(r.minutes, 10);

console.log('all logic tests passed');
