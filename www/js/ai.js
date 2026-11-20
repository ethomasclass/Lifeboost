// Talks to Claude with the key the user saved on this device. The key never leaves the phone
// except in requests to api.anthropic.com, and is never written into the repository.
import { weekReport, streak, levelProgress, proteinOf, dayKey, planFor, doseOffset, isLowDoseDay, readiness, dayTable, healthFlag } from './logic.js';
import { LEVELS, TRIALS } from './data.js';

const URL = 'https://api.anthropic.com/v1/messages';

export async function ask(state, { system, messages, max = 700 }) {
  const key = state.settings.apiKey?.trim();
  if (!key) throw new Error('Add your Claude API key in Settings to use the coach.');
  let res;
  const headers = { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' };
  const ws = state.settings.workspaceId?.trim();
  if (ws) headers['anthropic-workspace-id'] = ws;
  try {
    res = await fetch(URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({ model: state.settings.model || 'claude-sonnet-5-5', max_tokens: max, system, messages }),
    });
  } catch { throw new Error("Couldn't reach Claude. Check your connection and try again."); }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401) throw new Error("That API key wasn't accepted. Check it in Settings.");
    if (res.status === 429) throw new Error('Claude is busy or your credits ran out. Try again in a minute.');
    if (/workspace/i.test(data?.error?.message || '')) throw new Error('This key is not tied to a workspace. Make a new key and choose a workspace for it, or add your workspace ID in Settings.');
    throw new Error(data?.error?.message || `Claude returned an error (${res.status}).`);
  }
  return (data.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('\n').trim();
}

export function context(state) {
  const today = dayKey(), d = state.days[today] || {}, lv = LEVELS[state.profile.level - 1], plan = planFor(today);
  return {
    name: state.profile.name, today, level: lv.n, sessionMinutesAtLevel: lv.minutes,
    todaysPlan: plan === 'rest' ? 'rest day' : plan === 'walk' ? 'treadmill walk' : TRIALS[plan].short,
    equipment: 'adjustable dumbbells, adjustable bench, treadmill',
    goals: 'build muscle from a beginner start, chest and abs definition, sessions of 30 minutes or less at home, a good pump each session',
    energyToday: d.energy ?? null, sleepHours: d.sleep ?? null, moodToday: d.mood ?? null,
    proteinToday: proteinOf(d), proteinTarget: state.profile.proteinTarget, waterOzToday: d.water || 0, waterTarget: state.profile.waterTarget,
    streak: streak(state).current, levelProgress: levelProgress(state), lastWeek: weekReport(state),
    goToMeals: state.meals.map((m) => `${m.name} (${m.protein} g protein)`), glp1DaysSinceDose: doseOffset(state, today), usuallyLowEnergyToday: isLowDoseDay(state, today),
    wearable: state.health?.[today] ? { ...state.health[today], recovery: readiness(state, today) } : null,
    recentSessions: state.sessions.slice(-5).map((s) => ({ date: s.date, trial: s.trialId, mode: s.mode, felt: s.felt, pump: s.pump })),
  };
}

const COACH = `You are the coach inside Fianna, a personal fitness app themed on the warrior band of Irish legend. The user is a beginner training at home who takes a GLP-1 medication and often has low energy.
Voice: warm, direct, encouraging, never guilt. Short answers a person can read on a phone between sets: a few sentences or a short list. A light Celtic flavor is welcome, never forced. Do not use em dashes.
Rules: protect muscle (protein and strength training come first). Never push eating less. On low-energy days offer a smaller version instead of skipping. Only suggest moves possible with dumbbells, a bench, a treadmill, or bodyweight. You are not a doctor: for medication, dosing, pain, dizziness, or protein targets beyond general ranges, say to check with their prescriber. If they describe chest pain, fainting, or severe symptoms, tell them to stop and seek medical care.`;

export function coach(state, history) {
  return ask(state, { system: `${COACH}\n\nThe user's current data (JSON):\n${JSON.stringify(context(state))}`, messages: history, max: 600 });
}

export async function estimateMeal(state, base64, mediaType = 'image/jpeg') {
  const text = await ask(state, {
    system: 'You estimate food from a photo for a protein-first food log. Reply with only a JSON object: {"name": short meal name, "protein": grams as a number, "cal": calories as a number, "note": one short sentence on how sure you are}. Be honest about uncertainty. If the photo is not food, use {"name":"","protein":0,"cal":0,"note":"I could not see food in this photo."}.',
    messages: [{ role: 'user', content: [{ type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } }, { type: 'text', text: 'Estimate this meal.' }] }],
    max: 300,
  });
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) throw new Error("Couldn't read the estimate. Enter it by hand.");
  const o = JSON.parse(m[0]);
  return { name: String(o.name || ''), protein: Math.round(Number(o.protein) || 0), cal: Math.round(Number(o.cal) || 0), note: String(o.note || '') };
}

export function bardTale(state) {
  return ask(state, {
    system: 'You are a bard of the Fianna telling the tale of one warrior\'s week of training. Write 90 to 130 words in second person, vivid but plain, based only on the numbers given. Be honest: if the week was thin, say so kindly and point to one thing to do next week. End with one line naming next week\'s single focus. No em dashes.',
    messages: [{ role: 'user', content: JSON.stringify({ name: state.profile.name, week: weekReport(state), level: state.profile.level, proteinTarget: state.profile.proteinTarget }) }],
    max: 400,
  });
}

export function briefing(state) {
  return ask(state, {
    system: `${COACH}\n\nWrite this morning's briefing: one paragraph of 60 to 90 words that will be read aloud. Cover, in order: how they are set up today (sleep and energy if logged, and whether this is usually a low day after their dose), what today's trial is and how long, and one specific protein move for the morning. End with a short send-off. Plain sentences only, no lists, no symbols.`,
    messages: [{ role: 'user', content: JSON.stringify(context(state)) }], max: 250,
  });
}

const BAND_RULES = `You analyse fitness-band data inside Fianna for one user: a beginner building muscle at home with dumbbells, a bench and a treadmill, who takes a GLP-1 medication, often has low appetite and low energy, and trains at 5:30 am. You are not a doctor and this is general wellness information, not medical advice.
Hard rules:
- Never diagnose, never interpret numbers as a medical condition, never comment on medication or dosing.
- If the data looks worrying (resting heart rate far above their usual for days, very little sleep for many nights), set "flag" to one sentence telling them to check with their doctor, and keep the other advice gentle.
- Food advice: protein first, never suggest eating less or cutting calories, favour small protein-dense foods that suit a low appetite, and name real foods.
- Supplements: only widely studied basics relevant to their goal (for example creatine monohydrate, protein powder, electrolytes, vitamin D, magnesium, fibre). At most three, and only ones the data or goal actually supports. For each give the reason and a question to ask their prescriber or pharmacist. Mention an amount only as "the amount commonly listed on the label". Never suggest stimulants, fat burners, appetite suppressants, testosterone boosters, sleep drugs, or anything to treat a symptom.
- Be specific to the numbers given. If the data is marked simulated, or there are fewer than 10 days, say plainly that the pattern is weak.
- Plain words, short sentences, no em dashes.
Reply with only a JSON object, no other text.`;

async function askJson(state, system, payload, max = 900) {
  const text = await ask(state, { system, messages: [{ role: 'user', content: JSON.stringify(payload) }], max });
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) throw new Error("Couldn't read the analysis. Try again.");
  try { return JSON.parse(m[0]); } catch { throw new Error("Couldn't read the analysis. Try again."); }
}
const list = (x, n) => (Array.isArray(x) ? x.slice(0, n) : []);
const str = (x) => (typeof x === 'string' ? x : '');

// Today's reading of the band: what the numbers mean for training, food and recovery.
export async function bandRead(state) {
  const today = dayKey();
  const o = await askJson(state, `${BAND_RULES}\nShape: {"summary": one or two sentences on how they are set up today, "today": [exactly three objects {"title": 3 to 5 words, "action": one sentence saying exactly what to do today}], "food": [two or three objects {"food": a specific food or small meal, "why": short reason tied to the data}], "supplements": [zero to three objects {"name", "why", "ask": the question for their prescriber or pharmacist}], "flag": null or one sentence}`,
    { context: context(state), last14Days: dayTable(state, today, 14), simulated: (state.health?.[today]?.source || 'sim') === 'sim' });
  return { summary: str(o.summary), today: list(o.today, 3).map((t) => ({ title: str(t.title), action: str(t.action) })), food: list(o.food, 3).map((f) => ({ food: str(f.food), why: str(f.why) })),
    supplements: list(o.supplements, 3).map((x) => ({ name: str(x.name), why: str(x.why), ask: str(x.ask) })), flag: str(o.flag) || healthFlag(state, today) || '' };
}

// Patterns across the last four weeks of band data and logs.
export async function bandPatterns(state) {
  const rows = dayTable(state, dayKey(), 28);
  const o = await askJson(state, `${BAND_RULES}\nFind real relationships in this table between band data (sleep, resting heart rate, HRV, steps, recovery) and what they logged (energy, mood, protein, water, pump, how the trial felt, days since dose). Only report a pattern the rows actually show, with the numbers that show it. Shape: {"findings": [zero to three objects {"pattern": one sentence with the numbers, "try": one specific thing to try next week}], "enough": true or false (false when there is too little data to trust), "note": one sentence on how much to trust this}`,
    { days: rows, simulated: rows.some((r) => r.sleepH) && Object.values(state.health || {}).every((h) => (h.source || 'sim') === 'sim') }, 700);
  return { findings: list(o.findings, 3).map((f) => ({ pattern: str(f.pattern), try: str(f.try) })), enough: o.enough !== false, note: str(o.note) };
}
