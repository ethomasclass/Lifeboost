// Fianna content: exercises, trials, levels, badges, words.

export const EX = {
  incline_press: { name: 'Incline dumbbell press', front: 'press_front', cues: ['Bench at 30 degrees, feet flat, shoulder blades pinched back and down.', 'Lower for 3 seconds to the top of your chest, elbows about 45 degrees from your body.', 'Press straight up over your shoulders and squeeze your chest at the top.'] },
  flat_press: { name: 'Flat dumbbell press', front: 'press_front', cues: ['Lie flat, feet planted, shoulder blades pinched together.', 'Lower slowly until the bells are level with your chest.', 'Press up and slightly together. Do not bang the bells.'] },
  squeeze_press: { name: 'Squeeze press', cues: ['Press the two dumbbells hard against each other the whole time.', 'Lower slowly to your chest while still squeezing.', 'Press up and crush the bells together at the top.'] },
  pullover: { name: 'Dumbbell pullover', cues: ['Hold one dumbbell with both hands above your chest, elbows soft.', 'Reach back over your head until you feel a stretch in your chest and lats.', 'Pull the bell back over your chest in a wide arc.'] },
  fly: { name: 'Dumbbell fly', cues: ['Start with the bells together above your chest, elbows slightly bent.', 'Open your arms wide and slow, like hugging a barrel.', 'Squeeze your chest to bring the bells back together.'] },
  fly_incline: { name: 'Incline dumbbell fly', anim: 'fly', cues: ['Bench at 30 degrees, bells together above your upper chest.', 'Open wide and slow until you feel the stretch.', 'Hug the bells back together and squeeze the upper chest.'] },
  row: { name: 'One-arm dumbbell row', perSide: true, cues: ['One hand on the bench, back flat like a table.', 'Pull the bell to your hip, elbow close to your side.', 'Squeeze your shoulder blade back, then lower for 2 seconds.'] },
  goblet_squat: { name: 'Goblet squat', cues: ['Hold one dumbbell at your chest, feet a little wider than your hips.', 'Sit down between your heels for 3 seconds, chest tall.', 'Drive up through your whole foot.'] },
  squat_pulse: { name: 'Goblet squat pulses', cues: ['Stay in the bottom half of the squat.', 'Small, quick bounces. Keep tension on your legs.', 'Chest tall, heels down.'] },
  rdl: { name: 'Dumbbell Romanian deadlift', cues: ['Soft knees, bells close to your legs.', 'Push your hips straight back until your hamstrings stretch. Back stays flat.', 'Squeeze your glutes to stand tall.'] },
  split_squat: { name: 'Split squat', perSide: true, cues: ['Long stance, most of your weight on the front foot.', 'Drop your back knee straight down toward the floor.', 'Drive up through the front heel.'] },
  calf_raise: { name: 'Calf raise', reps: [12, 15], cues: ['Stand tall, bells at your sides.', 'Rise onto the balls of your feet and pause for a second.', 'Lower for 2 seconds.'] },
  dead_bug: { name: 'Dead bug', bw: true, perSide: true, reps: [6, 8], cues: ['Lie on your back, arms up, knees over hips.', 'Press your lower back into the floor.', 'Reach one arm back and the opposite leg long, then switch.'] },
  leg_raise: { name: 'Lying leg raise', bw: true, reps: [8, 12], cues: ['Hands under your hips, lower back pressed down.', 'Raise your legs until your feet point at the ceiling.', 'Lower for 3 seconds. Stop just above the floor.'] },
  glute_bridge: { name: 'Glute bridge hold', bw: true, hold: true, cues: ['Feet flat, close to your hips.', 'Lift your hips until your body is a straight line.', 'Squeeze your glutes hard and keep breathing.'] },
  plank: { name: 'Plank', bw: true, hold: true, reps: [20, 30], cues: ['Elbows under shoulders.', 'Straight line from head to heels. Do not let your hips sag.', 'Squeeze your glutes and breathe slowly.'] },
  incline_pushup: { name: 'Incline push-up', bw: true, reps: [8, 15], cues: ['Hands on the bench, body in one straight line.', 'Lower your chest to the bench for 2 seconds.', 'Push the bench away and lock out.'] },
  shoulder_press: { name: 'Seated shoulder press', front: 'ohp_front', cues: ['Sit tall against the upright bench, bells at shoulder height.', 'Press straight up without arching your back.', 'Lower for 3 seconds to shoulder height.'] },
  lateral_raise: { name: 'Lateral raise', cues: ['Use a light weight. Slight bend in your elbows.', 'Raise out to the sides until your arms are level with your shoulders.', 'Lower for 2 seconds. No swinging.'] },
  curl: { name: 'Dumbbell curl', cues: ['Elbows pinned to your sides.', 'Curl up without leaning back.', 'Lower for 3 seconds.'] },
  triceps_ext: { name: 'Overhead triceps extension', cues: ['Hold one dumbbell overhead with both hands.', 'Lower it behind your head, elbows pointing up.', 'Extend back to the top and squeeze.'] },
  walk: { name: 'Treadmill walk', bw: true, cues: ['Stand tall and let your arms swing.', 'Do not hold the rails on the incline.', 'Brisk means you can talk, but not sing.'] },
};

export const LEVELS = [
  { n: 1, minutes: 10, rank: 'Beith', tree: 'Birch', meaning: 'the tree of new beginnings', boss: 'The Salmon Leap' },
  { n: 2, minutes: 15, rank: 'Luis', tree: 'Rowan', meaning: 'the tree of protection', boss: 'The Running of the Wood' },
  { n: 3, minutes: 20, rank: 'Fearn', tree: 'Alder', meaning: 'the shield tree of warriors', boss: 'The Shield and the Nine Spears' },
  { n: 4, minutes: 25, rank: 'Sail', tree: 'Willow', meaning: 'the tree that bends and does not break', boss: 'The Thorn Unbroken' },
  { n: 5, minutes: 30, rank: 'Nion', tree: 'Ash', meaning: 'the tree spear shafts were cut from' },
];

// How many moves from each pool a level uses, and the Riastrad finisher.
export const TRIALS = {
  chest_back: { name: 'Trial of Chest and Back', short: 'Chest and back', pool: ['incline_press', 'row', 'flat_press', 'fly', 'pullover', 'curl'], count: [2, 3, 4, 5, 6],
    finishers: [{ id: 'a', steps: [{ ex: 'incline_pushup', secs: 45, note: 'As many good reps as you can.' }, { ex: 'squeeze_press', secs: 30, note: 'Light bells. Slow and constant squeeze.' }] },
      { id: 'b', steps: [{ ex: 'flat_press', secs: 40, note: 'Drop set: lighter bells, steady reps, stop just short of failure.' }, { ex: 'fly', secs: 35, note: 'Drop the weight again and keep going.' }] },
      { id: 'c', well: true, steps: [{ ex: 'pullover', secs: 40, note: 'Gift of the Well. One light bell, long slow stretch.' }, { ex: 'incline_pushup', secs: 40, note: 'Smooth reps to finish.' }] }] },
  legs_core: { name: 'Trial of Legs and Core', short: 'Legs and core', pool: ['goblet_squat', 'dead_bug', 'rdl', 'split_squat', 'leg_raise', 'calf_raise'], count: [2, 3, 4, 5, 6],
    finishers: [{ id: 'a', steps: [{ ex: 'squat_pulse', secs: 45, note: 'Short bounces in the bottom half.' }, { ex: 'glute_bridge', secs: 30, note: 'Hold at the top and squeeze.' }] },
      { id: 'b', steps: [{ ex: 'split_squat', secs: 40, note: 'Bodyweight only. Switch legs halfway, no rest.' }, { ex: 'leg_raise', secs: 35, note: 'Slow on the way down.' }] },
      { id: 'c', well: true, steps: [{ ex: 'calf_raise', secs: 40, note: 'Gift of the Well. Pause at the top of every rep.' }, { ex: 'dead_bug', secs: 40, note: 'Slow and controlled.' }] }] },
  chest_shoulders: { name: 'Trial of Chest and Shoulders', short: 'Chest and shoulders', pool: ['flat_press', 'plank', 'shoulder_press', 'fly_incline', 'lateral_raise', 'triceps_ext'], count: [2, 3, 4, 5, 6],
    finishers: [{ id: 'a', steps: [{ ex: 'lateral_raise', secs: 30, note: 'Very light. Do not stop moving.' }, { ex: 'squeeze_press', secs: 45, note: 'Squeeze until your chest burns.' }] },
      { id: 'b', steps: [{ ex: 'incline_pushup', secs: 40, note: 'As many good reps as you can.' }, { ex: 'lateral_raise', secs: 35, note: 'Very light. Half reps at the end are fine.' }] },
      { id: 'c', well: true, steps: [{ ex: 'fly_incline', secs: 40, note: 'Gift of the Well. Light bells, wide and slow.' }, { ex: 'plank', secs: 40, note: 'Hold steady and breathe.' }] }] },
};

// Monday = 1 ... Sunday = 0 (JS getDay)
export const WEEK = { 1: 'chest_back', 2: 'walk', 3: 'legs_core', 4: 'walk', 5: 'chest_shoulders', 6: 'rest', 0: 'rest' };

export const WALKS = [
  { minutes: 10, blocks: [[60, 'Easy pace, flat'], [480, 'Brisk pace, 3% incline'], [60, 'Easy pace, flat']] },
  { minutes: 15, blocks: [[60, 'Easy pace, flat'], [780, 'Brisk pace, 4% incline'], [60, 'Easy pace, flat']] },
  { minutes: 20, blocks: [[120, 'Easy pace, flat'], [960, 'Brisk pace, 5% incline'], [120, 'Easy pace, flat']] },
  { minutes: 22, intervals: { warm: 120, fast: 60, easy: 60, rounds: 9, cool: 120, fastNote: 'Fast walk or light jog, 4% incline', easyNote: 'Easy walk, 4% incline' } },
  { minutes: 26, intervals: { warm: 120, fast: 60, easy: 60, rounds: 11, cool: 120, fastNote: 'Fast walk or jog, 6% incline', easyNote: 'Easy walk, 6% incline' } },
];

export const BADGES = [
  { id: 'first', name: 'Bronze torc', desc: 'Finish your first trial', metal: 'bronze', test: (s) => s.sessions >= 1 },
  { id: 'five', name: 'Twisted torc', desc: 'Finish 5 sessions', metal: 'bronze', test: (s) => s.sessions >= 5 },
  { id: 'streak7', name: 'Seven fires', desc: 'Reach a 7-day streak', metal: 'bronze', test: (s) => s.bestStreak >= 7 },
  { id: 'level2', name: 'Rowan rank', desc: 'Reach Trial 2', metal: 'silver', test: (s) => s.level >= 2 },
  { id: 'protein5', name: 'Salmon of knowledge', desc: 'Hit your protein target 5 days', metal: 'silver', test: (s) => s.proteinDays >= 5 },
  { id: 'mind10', name: 'Still water', desc: 'Complete 10 mind sessions', metal: 'silver', test: (s) => s.mind >= 10 },
  { id: 'level3', name: 'Alder shield', desc: 'Reach Trial 3', metal: 'silver', test: (s) => s.level >= 3 },
  { id: 'twentyfive', name: 'Silver torc', desc: 'Finish 25 sessions', metal: 'silver', test: (s) => s.sessions >= 25 },
  { id: 'streak30', name: 'Thirty fires', desc: 'Reach a 30-day streak', metal: 'gold', test: (s) => s.bestStreak >= 30 },
  { id: 'level5', name: 'Gold torc', desc: 'Reach Trial 5', metal: 'gold', test: (s) => s.level >= 5 },
  { id: 'dair', name: 'Dair, the oak', desc: 'Add weight to 10 different lifts', metal: 'gold', test: (s) => s.prs >= 10 },
  { id: 'hundred', name: 'One of the Fianna', desc: 'Finish 100 sessions', metal: 'gold', test: (s) => s.sessions >= 100 },
];

export const PROVERBS = [
  ['Tús maith leath na hoibre.', 'A good start is half the work.'],
  ['Bíonn gach tosú lag.', 'Every beginning is weak.'],
  ['De réir a chéile a thógtar na caisleáin.', 'Castles are built bit by bit.'],
  ['Is fearr rith maith ná drochsheasamh.', 'A good run is better than a bad stand.'],
  ['Ní hé lá na gaoithe lá na scolb.', 'The windy day is not the day for thatching. Prepare ahead.'],
  ['Glaine ár gcroí, neart ár ngéag, agus beart de réir ár mbriathar.', 'Purity of our hearts, strength of our limbs, and action to match our words. The motto of the Fianna.'],
];

export const MEDITATIONS = [
  { id: 'morning', name: 'Morning focus', minutes: 2, lines: ['Sit tall. Let your shoulders drop.', 'Breathe in slowly through your nose.', 'Breathe out longer than you breathed in.', 'Notice your feet on the floor.', 'Name one thing you will do today for your body.', 'Picture yourself finishing it.', 'Breathe in. You are already up. That was the hard part.', 'Breathe out, and begin.'] },
  { id: 'scan', name: 'Body scan', minutes: 3, lines: ['Lie down or sit back. Close your eyes if you like.', 'Bring your attention to your feet. Let them go heavy.', 'Move up to your calves and knees. Soften them.', 'Your thighs and hips. Let the floor hold them.', 'Your stomach. Let it rise and fall on its own.', 'Your chest and shoulders. Unclench.', 'Your arms, down to your fingertips.', 'Your jaw, your eyes, your forehead. Smooth them out.', 'Feel your whole body breathing at once.', 'Stay here for three more slow breaths.'] },
  { id: 'wind', name: 'Evening wind-down', minutes: 4, lines: ['The day is done. Nothing more is needed from you.', 'Breathe in for four.', 'Hold gently for four.', 'Breathe out for six.', 'Think of one thing that went right today, however small.', 'Let anything unfinished wait until morning.', 'Breathe in for four.', 'Breathe out for six.', 'Feel the weight of your body sinking.', 'Your muscles rebuild while you sleep.', 'Let your breath slow by itself.', 'Rest well.'] },
];

export const NOTIFY = {
  wake: ['The carnyx sounds', 'Your trial awaits. Ten minutes is enough.'],
  midday: ['Midday muster', 'Water and protein check. Snap your lunch.'],
  evening: ['Evening by the fire', 'Catch up on protein, then write a line in your journal.'],
  bedtime: ['Bank the fire', 'Wind down now. Tomorrow starts tonight.'],
};
