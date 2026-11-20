import assert from 'node:assert/strict';
import * as L from '../www/js/logic.js';
import { TRIALS, EX } from '../www/js/data.js';
import { ANIMS } from '../www/js/figure.js';
import * as H from '../www/js/hero.js';

const sess = (date, over = {}) => ({ date, trialId: 'chest_back', level: 1, mode: 'full', felt: 'doable', sets: {}, minutes: 10, ...over });

// every exercise used by a trial exists and has an animation
for (const t of Object.values(TRIALS)) for (const id of [...t.pool, ...t.finishers.flatMap((f) => f.steps.map((x) => x.ex))]) {
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

// front views exist
for (const e of Object.values(EX)) if (e.front) assert.ok(ANIMS[e.front], `missing front view ${e.front}`);

// plateau: three sessions stuck at the same weight and reps
s = L.newState();
s.sessions = ['2026-11-02', '2026-11-04', '2026-11-06'].map((d) => sess(d, { sets: { curl: [{ w: 20, r: 10 }, { w: 20, r: 10 }] } }));
assert.equal(L.suggestWeight(s, 'curl').deload, true);
assert.equal(L.suggestWeight(s, 'curl').w, 15);
s.sessions[2].sets.curl = [{ w: 20, r: 11 }, { w: 20, r: 10 }];
assert.equal(L.suggestWeight(s, 'curl').deload, undefined, 'more reps means no plateau');

// streak shields: 7 active days bank a shield that covers a week away
s = L.newState();
s.sessions = Array.from({ length: 7 }, (_, i) => sess(L.addDays('2026-10-01', i)));
assert.equal(L.streak(s, '2026-10-07').shields, 1);
assert.equal(L.streak(s, '2026-10-14').current, 7, 'shield holds the streak after 7 quiet days');
assert.equal(L.streak(s, '2026-10-14').shielded, true);
assert.equal(L.streak(s, '2026-10-20').current, 0, 'a shield does not cover 13 days');
s.sessions.push(sess('2026-10-14'));
assert.equal(L.streak(s, '2026-10-14').current, 8);
assert.equal(L.streak(s, '2026-10-14').shields, 0, 'the shield was spent');

// pump learning
s = L.newState();
assert.equal(L.chooseFinisher(s, 'chest_back'), 'a');
s.sessions = [sess('2026-11-02', { finisherId: 'a', pump: 2 }), sess('2026-11-04', { finisherId: 'a', pump: 3 })];
assert.equal(L.chooseFinisher(s, 'chest_back'), 'b', 'tries the other finisher next');
s.sessions.push(sess('2026-11-06', { finisherId: 'b', pump: 5 }), sess('2026-11-09', { finisherId: 'b', pump: 4 }));
assert.equal(L.chooseFinisher(s, 'chest_back'), 'b', 'keeps the better pump');
assert.equal(L.buildSession('chest_back', 1, 'full', { finisher: 'b' }).finisherId, 'b');

// boss trial is the last one before a new rank
s = L.newState(); s.sessions = [1, 2, 3].map((d) => sess(`2026-11-0${d}`));
assert.equal(L.bossFor(s, 'chest_back', 'full'), 'The Salmon Leap');
assert.equal(L.bossFor(s, 'chest_back', 'light'), null);
assert.equal(L.bossFor(s, 'walk', 'full'), null);
const boss = L.buildSession('chest_back', 1, 'full', { boss: 'The Salmon Leap' });
assert.ok(L.sessionMinutes(boss) >= L.sessionMinutes(L.buildSession('chest_back', 1)));

// dose days
s = L.newState(); s.doses = ['2026-11-01', '2026-11-08'];
assert.equal(L.doseOffset(s, '2026-11-03'), 2); assert.equal(L.doseOffset(s, '2026-11-08'), 0); assert.equal(L.doseOffset(s, '2026-10-30'), null);
s.days['2026-11-02'] = { energy: 2, food: [], water: 0, mind: 0 }; s.days['2026-11-09'] = { energy: 2, food: [], water: 0, mind: 0 };
s.days['2026-11-05'] = { energy: 4, food: [], water: 0, mind: 0 }; s.days['2026-11-12'] = { energy: 5, food: [], water: 0, mind: 0 };
assert.deepEqual(L.dosePattern(s).low, [1]);
s.doses.push('2026-11-15');
assert.equal(L.isLowDoseDay(s, '2026-11-16'), true); assert.equal(L.isLowDoseDay(s, '2026-11-19'), false);

// wearable data: recovery score and how it sets the day
s = L.newState();
assert.equal(L.readiness(s, '2026-11-20'), null);
assert.equal(L.modeToday(s, '2026-11-20'), 'full');
L.seedHealthBaseline(s, '2026-11-20');
assert.equal(Object.keys(s.health).length, 14);
L.setHealth(s, '2026-11-20', { sleep: 8, steps: 3000, rhr: 61, hrv: 52 });
let rd = L.readiness(s, '2026-11-20');
assert.equal(rd.label, 'ready'); assert.equal(rd.parts.length, 3);
L.setHealth(s, '2026-11-20', { sleep: 4.5, rhr: 72, hrv: 30 });
rd = L.readiness(s, '2026-11-20');
assert.equal(rd.label, 'low'); assert.ok(rd.score < 30);
assert.equal(L.modeToday(s, '2026-11-20'), 'light', 'a rough night starts the day lighter');
s.days['2026-11-20'] = { energy: 5, food: [], water: 0, mind: 0 };
assert.equal(L.modeToday(s, '2026-11-20'), 'full', 'the energy check-in overrides the wearable');
s.days['2026-11-20'].energy = 1;
assert.equal(L.modeToday(s, '2026-11-20'), 'min');
const solo = L.newState(); L.setHealth(solo, '2026-11-20', { sleep: 7.5 });
assert.equal(L.readiness(solo, '2026-11-20').score, 100, 'sleep alone still gives a score');
L.setHealth(solo, '2026-11-20', { sleep: '', steps: '' });
assert.equal(solo.health['2026-11-20'], undefined, 'empty input removes the day');
L.clearSimHealth(s); assert.equal(Object.keys(s.health).length, 0);

// heart-rate safety flag and the pattern table
s = L.newState(); L.seedHealthBaseline(s, '2026-11-20');
for (const d of ['2026-11-18', '2026-11-19', '2026-11-20']) L.setHealth(s, d, { sleep: 6, rhr: 78, hrv: 40 });
assert.match(L.healthFlag(s, '2026-11-20'), /doctor/);
L.setHealth(s, '2026-11-19', { sleep: 6, rhr: 64, hrv: 40 });
assert.equal(L.healthFlag(s, '2026-11-20'), null, 'one normal day clears the flag');
s.days['2026-11-20'] = { energy: 2, food: [{ protein: 40 }], water: 32, mind: 0 }; s.sessions = [sess('2026-11-20', { pump: 2 })];
const tbl = L.dayTable(s, '2026-11-20');
const lastRow = tbl[tbl.length - 1];
assert.equal(lastRow.restingHr, 78); assert.equal(lastRow.proteinG, 40); assert.equal(lastRow.pump, 2); assert.equal(lastRow.energy, 2);
assert.ok(L.weekReport(s, '2026-11-20').bandSleepAvg > 0);

// ---------- hero ----------
// every move that can be logged or used in a finisher feeds some gear
for (const id of Object.keys(EX)) if (id !== 'walk') assert.ok(H.CREDIT[id], `no gear credit for ${id}`);
s = L.newState();
assert.ok(H.armor(s).every((a) => a.tier === 0), 'a new warrior starts in cloth');
assert.equal(H.heroLook(s, '2026-11-20').spear, 1); assert.equal(H.heroLook(s, '2026-11-20').shield, 0);
// one chest and back session: 36 press reps + finisher a (push-up 15, squeeze press 15)
s.sessions = [sess('2026-11-02', { finisherId: 'a', sets: { incline_press: [{ w: 20, r: 12 }, { w: 20, r: 12 }, { w: 20, r: 12 }], row: [{ w: 25, r: 12 }, { w: 25, r: 12 }, { w: 25, r: 12 }] } })];
let xp = H.armorXP(s);
assert.equal(xp.breastplate, 36 + 30); assert.equal(xp.cloak, 36); assert.equal(xp.pauldrons, 11); assert.equal(xp.bracers, Math.round(36 * 0.3 + 36 * 0.4 + 15 * 0.3)); assert.equal(xp.greaves, 0);
// a second session with more weight earns the 40-point bonus and tips the chest into leather
const lookBefore = H.heroLook(s, '2026-11-04');
s.sessions.push(sess('2026-11-04', { finisherId: null, sets: { incline_press: [{ w: 25, r: 10 }] } }));
xp = H.armorXP(s);
assert.equal(xp.breastplate, 66 + 10 + 40);
assert.equal(H.tierOf(xp.breastplate), 1);
assert.deepEqual(H.forged(lookBefore, H.heroLook(s, '2026-11-04')).map((f) => f.name), ['Leather jerkin']);
assert.equal(H.nextUpgrade(s).id, 'cloak', 'closest piece to its next tier');
// holds count a third, walks build greaves
s = L.newState(); s.sessions = [sess('2026-11-02', { finisherId: null, sets: { plank: [{ w: 0, r: 30 }, { w: 0, r: 30 }] } }), sess('2026-11-03', { trialId: 'walk', finisherId: null, sets: {} })];
assert.equal(H.armorXP(s).belt, 20); assert.equal(H.armorXP(s).greaves, 10);
assert.deepEqual([0, 79, 80, 400, 1200, 3000, 9999].map(H.tierOf), [0, 0, 1, 2, 3, 4, 4]);

// Rune of the Salmon: 5 protein days last week arm one double-count trial this week
s = L.newState(); s.profile.proteinTarget = 100;
for (const d of ['2026-11-09', '2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13']) s.days[d] = { food: [{ protein: 110 }], water: 0, mind: 0 };
assert.equal(L.weekStart('2026-11-20'), '2026-11-16'); assert.equal(L.weekStart('2026-11-16'), '2026-11-16'); assert.equal(L.weekStart('2026-11-22'), '2026-11-16');
assert.equal(L.salmonReady(s, '2026-11-18'), true);
assert.equal(L.salmonReady(s, '2026-11-25'), false, 'only the week right after');
s.sessions = [sess('2026-11-16', { double: true }), sess('2026-11-17')];
assert.equal(L.salmonReady(s, '2026-11-18'), false, 'spent for this week');
assert.equal(L.levelProgress(s).count, 3, 'a double trial counts twice');
s.sessions.push(sess('2026-11-18'));
assert.equal(L.levelProgress(s).ready, true);

// Rune of the Well: three full days unlock the third finisher
s = L.newState(); s.profile.waterTarget = 80;
for (const d of ['2026-11-17', '2026-11-18', '2026-11-19']) s.days[d] = { food: [], water: 80, mind: 0 };
assert.equal(L.wellRun(s, '2026-11-20'), 3, 'today not yet met, so the run counts back from yesterday');
s.days['2026-11-20'] = { food: [], water: 96, mind: 0 };
assert.equal(L.wellRun(s, '2026-11-20'), 4);
s.sessions = ['a', 'a', 'b', 'b'].map((f, i) => sess(`2026-11-1${i}`, { finisherId: f, pump: 3 }));
assert.equal(L.chooseFinisher(s, 'chest_back', '2026-11-20'), 'c', 'the Well opens the third finisher');
assert.notEqual(L.chooseFinisher(s, 'chest_back', '2026-12-20'), 'c', 'and it closes again when the run ends');
assert.equal(L.buildSession('chest_back', 1, 'full', { finisher: 'c' }).finisherId, 'c');

// Rune of Stillness: 10 mind sessions earn one re-roll
s = L.newState(); s.days['2026-11-19'] = { food: [], water: 0, mind: 10 };
assert.equal(L.rerollCharges(s), 1);
assert.equal(L.planForDay(s, '2026-11-20'), 'chest_shoulders');
s.sessions = [sess('2026-11-16', { trialId: 'chest_back' })];
assert.equal(L.reroll(s, '2026-11-20'), 'legs_core', 'swaps to the trial done least recently');
assert.equal(L.planForDay(s, '2026-11-20'), 'legs_core'); assert.equal(L.rerollCharges(s), 0);
assert.equal(L.reroll(s, '2026-11-20'), null, 'no charge left');
assert.equal(L.reroll(L.newState(), '2026-11-21'), null, 'nothing to re-roll on a rest day');

// Rune of the Dawn, embers, gear and relics
s = L.newState(); s.sessions = ['2026-11-16', '2026-11-18', '2026-11-20'].map((d) => sess(d, { hour: 5 }));
assert.equal(H.dawnDays(s, '2026-11-20'), 3); assert.equal(H.heroLook(s, '2026-11-20').dawn, true);
assert.equal(H.dawnDays(s, '2026-11-25'), 1);
const rn = Object.fromEntries(H.runes(s, '2026-11-20').map((r) => [r.id, r]));
assert.equal(rn.dawn.lit, true); assert.equal(rn.embers.lit, false); assert.equal(rn.well.lit, false); assert.equal(rn.salmon.lit, false); assert.equal(rn.stillness.lit, false);
s.sessions.push(sess('2026-11-21', { boss: 'The Salmon Leap', sets: { curl: [{ w: 10, r: 10 }] } }), sess('2026-11-23', { sets: { curl: [{ w: 20, r: 8 }] } }));
assert.equal(H.heroLook(s, '2026-11-23').shield, 1); assert.equal(H.heroLook(s, '2026-11-23').torc, 1);
const rl = Object.fromEntries(H.relics(s, '2026-11-23').map((r) => [r.id, r.have]));
assert.deepEqual(rl, { boss: true, double: true, thirty: false, dawn: false });
s.profile.level = 3;
assert.deepEqual(H.forged(H.previewLook(0), H.heroLook(s, '2026-11-23')).map((f) => f.kind).sort(), ['shield', 'spear', 'torc']);

console.log('all logic tests passed');
