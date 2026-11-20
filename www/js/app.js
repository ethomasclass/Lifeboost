import { EX, LEVELS, TRIALS, BADGES, PROVERBS, MEDITATIONS } from './data.js';
import * as L from './logic.js';
import { mountFigure } from './figure.js';
import { syncNotifications, isNative, buzz, beep, keepAwake, say, hush, canSpeak, playHorn, shareBackup } from './native.js';
import { coach, estimateMeal, bardTale, briefing, bandRead, bandPatterns } from './ai.js';
import { allPhotos, addPhoto, removePhoto } from './photos.js';
import * as H from './hero.js';
import { heroSVG } from './heroart.js';
import { GLOW, ROCK, rankStone, heroStone, numberStone, iconStone, tabStone, notchStone, slabURI, plateURI, runeStone, oghamGlyph, iconGlyph } from './stones.js';

const KEY = 'fianna.v1';
function load() {
  try { const raw = localStorage.getItem(KEY); if (raw) { const s = JSON.parse(raw), d = L.newState(); return { ...d, ...s, profile: { ...d.profile, ...s.profile }, settings: { ...d.settings, ...s.settings, times: { ...d.settings.times, ...s.settings?.times }, weekend: { ...d.settings.weekend, ...s.settings?.weekend } } }; } } catch { /* fresh start */ }
  return L.newState();
}
let S = load();
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { toast("Couldn't save. Storage may be full."); } };
const ui = { tab: 'today', sheet: null, player: null, breath: null, med: null, move: null, busy: false, mealNote: '', mealDraft: null, tale: '', backup: '', front: false, photos: [], brief: '', heroPreview: null };
const $ = (sel) => document.querySelector(sel);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const today = () => L.dayKey();
const lv = () => LEVELS[S.profile.level - 1];
const clock = (s) => { const c = Math.max(0, Math.ceil(s)); return c >= 60 ? `${Math.floor(c / 60)}:${String(c % 60).padStart(2, '0')}` : String(c); };
const niceDate = (k) => L.parseDay(k).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

let toastTimer;
function toast(msg) {
  document.querySelector('.toast')?.remove();
  const t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg; document.body.append(t);
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.remove(), 2600);
}

// ---------- Small drawings ----------
const fearn = (size = 40) => heroStone(size, size > 60);
// The rank stone for the current level; `big` is used on the level-up screen.
function stoneSVG(lit, of = 4, level = S.profile.level, big = false) { return rankStone(level, big ? 150 : 84, true, big); }
const BADGE_ART = { first: ['spiral', 'bronze', 'gold'], five: ['bolt', 'bronze', 'gold'], streak7: ['flame', 'ember', 'ember'], level2: ['o2', 'slate', 'gold'], protein5: ['leaf', 'green', 'moss'], mind10: ['mind', 'violet', 'violet'],
  level3: ['o3', 'blue', 'cyan'], twentyfive: ['shield', 'slate', 'cyan'], streak30: ['flame', 'red', 'gold'], level5: ['o5', 'green', 'moss'], dair: ['leaf', 'brown', 'gold'], hundred: ['star', 'violet', 'gold'] };
function badgeStone(b, size = 64, lit = true) {
  const [g, rock, glow] = BADGE_ART[b.id] || ['star', 'slate', 'gold'], c = size / 2;
  const glyph = g[0] === 'o' && g.length === 2 ? oghamGlyph(Number(g[1]), c, c, size * 0.48, size * 0.05) : iconGlyph(g, c, c - 1, size * 0.46);
  return `<svg class="stone" width="${size}" height="${Math.round(size * 1.08)}" viewBox="0 0 ${size} ${size * 1.08}" aria-hidden="true">${runeStone(c, c, size * 0.42, size * 0.42, 90 + b.id.length * 7 + b.id.charCodeAt(0), lit ? ROCK[rock] : ROCK.deep, glyph, GLOW[glow], { lit, n: 7 + (b.id.length % 2) })}</svg>`;
}
// The cauldron fills toward the day's water goal.
function cauldron(oz, goal, mini = false) {
  const pct = Math.max(0, Math.min(1, oz / Math.max(1, goal))), prev = ui.waterPrev ?? pct;
  return `<svg viewBox="0 0 200 170" role="img" aria-label="Water: ${oz} of ${goal} ounces" data-water="${pct}" style="--lvl:${prev}">
  <defs><clipPath id="pot${mini ? 'm' : ''}"><path d="M34 52 C22 96 44 142 100 142 C156 142 178 96 166 52 Z"/></clipPath></defs>
  <path d="M58 136 L46 164 M142 136 L154 164 M100 142 V166" stroke="#07050e" stroke-width="13" stroke-linecap="round"/><path d="M58 136 L46 164 M142 136 L154 164 M100 142 V166" stroke="#6E4A14" stroke-width="9" stroke-linecap="round"/><path d="M30 44 C8 30 8 76 28 70 M170 44 C192 30 192 76 172 70" fill="none" stroke="#07050e" stroke-width="10" stroke-linecap="round"/><path d="M34 52 C22 96 44 142 100 142 C156 142 178 96 166 52 Z" fill="#07050e" stroke="#07050e" stroke-width="13" stroke-linejoin="round"/>
  <path d="M34 52 C22 96 44 142 100 142 C156 142 178 96 166 52 Z" fill="#15112B"/>
  <g clip-path="url(#pot${mini ? 'm' : ''})"><g class="water"><g class="wave"><path d="M-40 62 Q-30 54 -20 62 T0 62 T20 62 T40 62 T60 62 T80 62 T100 62 T120 62 T140 62 T160 62 T180 62 T200 62 T220 62 T240 62 V160 H-40 Z" fill="#6FA8DC"/></g><path d="M0 72 H200 V160 H0 Z" fill="#4E86BD"/></g></g>
  <path d="M34 52 C22 96 44 142 100 142 C156 142 178 96 166 52" fill="none" stroke="#8F6524" stroke-width="8" stroke-linecap="round"/>
  <g stroke="#C9973F" stroke-width="3" stroke-linecap="round"><path d="M40 121 h10 M150 121 h10 M33 101 h10 M157 101 h10 M30 82 h10 M160 82 h10"/></g>
  <path d="M24 50 H176" stroke="#07050e" stroke-width="16" stroke-linecap="round"/><path class="rim" d="M24 50 H176" stroke="#C9973F" stroke-width="12" stroke-linecap="round"/><path d="M28 47 H172" stroke="#F3D08A" stroke-width="2.500" stroke-linecap="round" opacity=".8"/>
  <g fill="#E8C27A"><circle cx="40" cy="50" r="2.400"/><circle cx="70" cy="50" r="2.400"/><circle cx="100" cy="50" r="2.400"/><circle cx="130" cy="50" r="2.400"/><circle cx="160" cy="50" r="2.400"/></g>
  <path d="M30 44 C8 30 8 76 28 70 M170 44 C192 30 192 76 172 70" fill="none" stroke="#8F6524" stroke-width="6" stroke-linecap="round"/></svg>`;
}
function waterCard(mini = false) {
  const d = S.days[today()] || {}, oz = d.water || 0, goal = S.profile.waterTarget, left = Math.max(0, goal - oz);
  return `<div class="cloth"><div class="cauldron ${mini ? 'mini' : ''} ${oz >= goal ? 'full' : ''}">${cauldron(oz, goal, mini)}<div><p class="small">Water</p><p class="big">${oz} <span class="small">/ ${goal} oz</span></p><p class="small">${oz >= goal ? 'The cauldron is full. Goal met.' : `${left} oz to go, about ${Math.ceil(left / 8)} ${Math.ceil(left / 8) === 1 ? 'glass' : 'glasses'}.`}</p>
  <div class="row wrap" style="margin-top:8px"><button class="btn sm" data-act="water" data-v="8">+8 oz</button><button class="btn sm" data-act="water" data-v="16">+16</button>${mini ? '' : '<button class="btn sm" data-act="water" data-v="24">+24</button><button class="btn sm quiet" data-act="water" data-v="-8" aria-label="Remove 8 ounces">−8</button>'}</div></div></div>${mini ? '' : '<p class="small" style="margin:8px 0 0">Change your daily goal in Settings.</p>'}</div>`;
}
const wordmark = (w = 220) => `<svg class="wordmark" width="${w}" height="${Math.round(w * 0.27)}" viewBox="-6 -6 536 142" role="img" aria-label="Fianna"><defs><g id="wm"><path d="M0 0 H70 L62 22 H22 V48 H58 L51 68 H22 V120 H0 Z"/><path d="M86 6 L108 0 V114 L86 120 Z"/><path d="M162 0 H178 L216 120 H192 L170 46 L148 120 H124 Z"/><path d="M232 0 H254 L292 74 V0 H314 V120 H292 L254 46 V120 H232 Z"/><path d="M330 0 H352 L390 74 V0 H412 V120 H390 L352 46 V120 H330 Z"/><path d="M466 0 H482 L520 120 H496 L474 46 L452 120 H428 Z"/></g></defs><use href="#wm" fill="#120E26" transform="translate(4 5)"/><use href="#wm" fill="#F2EADB"/><path d="M170 80 l9 9 l-9 9 l-9 -9 Z M474 80 l9 9 l-9 9 l-9 -9 Z" fill="#F07A2E"/></svg>`;
const flame = '<svg class="flame" viewBox="0 0 18 22" aria-hidden="true"><path d="M9 1C10 6 15 8 15 14a6 6 0 01-12 0c0-3 2-4 3-7 1 2 2 2 3-6z" fill="#F07A2E"/><path d="M9 10c1 2 3 3 3 5.500a3 3 0 01-6 0C6 13.500 8 13 9 10z" fill="#FFD08A"/></svg>';
const woad = '<svg class="woad" viewBox="-150 -150 300 300" aria-hidden="true"><g fill="none" stroke="#3A3275" stroke-width="9" stroke-linecap="round"><path id="wa" d="M0 0 C0 -44 58 -62 76 -26 C92 6 56 30 34 12 C20 0 30 -18 46 -12"/><use href="#wa" transform="rotate(120)"/><use href="#wa" transform="rotate(240)"/><circle r="118" stroke-width="3" stroke-dasharray="2 14"/></g></svg>';
const embers = () => `<div class="embers" aria-hidden="true">${Array.from({ length: 18 }, (_, i) => `<i style="left:${(i * 37 + 11) % 100}%;--t:${2.4 + ((i * 7) % 10) / 4}s;--d:${((i * 13) % 20) / 8}s;--x:${((i * 29) % 80) - 40}px"></i>`).join('')}</div>`;
const stage = (ex, withLabel = true) => `<div class="stage">${withLabel ? `<div class="row between" style="padding:4px 8px 0"><span class="small">${esc(EX[ex].name)}</span><span class="phase" data-figlabel></span></div>` : ''}<svg data-fig="${ui.front && EX[ex].front ? EX[ex].front : EX[ex].anim || ex}" viewBox="0 0 300 240" role="img" aria-label="Animation of ${esc(EX[ex].name)}"></svg>${EX[ex].front ? `<button class="btn quiet sm" data-act="front" style="width:100%">${ui.front ? 'Show side view' : 'Show front view'}</button>` : ''}</div>`;
const meter = (v, max, cls = '') => `<div class="meter ${cls}"><i style="width:${Math.min(100, Math.round((v / Math.max(1, max)) * 100))}%"></i></div>`;
const proverb = () => { const p = PROVERBS[L.parseDay(today()).getDate() % PROVERBS.length]; return `<div class="proverb"><q lang="ga">${p[0]}</q><span class="small">${p[1]}</span></div>`; };

// ---------- Today ----------
function todayPlan() {
  const k = today(), d = S.days[k] || {}, plan = L.planForDay(S, k);
  const comeback = L.needsComeback(S, k);
  const lowDay = L.isLowDoseDay(S, k) && d.energy == null;
  const base = L.modeToday(S, k), ready = L.readiness(S, k);
  const mode = (comeback || lowDay) && base === 'full' ? 'light' : base;
  const done = S.sessions.some((s) => s.date === k && (plan === 'rest' || s.trialId === plan));
  return { k, d, plan, mode, comeback, done, lowDay, ready, rerolled: !!d.planOverride, boss: plan !== 'rest' ? L.bossFor(S, plan, mode) : null };
}
const modeWords = { full: 'Full trial', light: 'Lighter trial', min: 'Five-minute trial' };

function backupDue() {
  if (!S.sessions.length) return false;
  const last = S.settings.lastBackup || S.sessions[0].date;
  return L.daysBetween(last, today()) > 7;
}

function viewToday() {
  const { d, plan, mode, comeback, done, lowDay, boss, ready, rerolled } = todayPlan();
  const hour = new Date().getHours(), greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const st = L.streak(S), prog = L.levelProgress(S), protein = L.proteinOf(d);
  let info, acts;
  if (plan === 'rest') {
    info = `<p class="tag">Today</p><h3>Rest day</h3><p class="dim">Even the Fianna rested between hunts. Muscle grows on days like this.</p>`;
    acts = `<button class="btn" style="width:100%" data-act="start" data-trial="walk" data-mode="min">Take an easy 5-minute walk</button>`;
  } else {
    const sess = L.buildSession(plan, S.profile.level, mode, { boss });
    const name = plan === 'walk' ? 'Treadmill walk' : TRIALS[plan].short;
    info = `<p class="tag">${boss ? 'Boss trial · earn your next rank' : rerolled ? 'Re-rolled by the Rune of Stillness' : "Today's trial"}</p><h3 class="herotitle">${boss ? `${boss}` : name}</h3>${boss ? `<p class="dim" style="margin:0">${name}</p>` : ''}<p class="dim">${L.sessionMinutes(sess)} min · ${modeWords[mode].toLowerCase()}${d.energy ? ` · energy ${d.energy} of 5` : ''}</p>`;
    acts = (done ? `<p class="moss" style="font-weight:700;margin:6px 0 0;text-align:center">Trial complete. Well fought.</p>` : `<button class="btn go" data-act="start" data-trial="${plan}" data-mode="${mode}">Begin trial</button>`) +
      `<div class="row between" style="margin-top:6px"><button class="btn quiet sm" data-act="tab" data-tab="train">Choose another</button>${!done && TRIALS[plan] && L.rerollCharges(S) > 0 ? `<button class="btn quiet sm" data-act="reroll">Re-roll</button>` : ''}${!done && mode !== 'min' ? `<button class="btn quiet sm" data-act="start" data-trial="${plan}" data-mode="min">Just 5 minutes</button>` : ''}</div>`;
  }
  const water = d.water || 0;
  const stat = (svg, big, label, attrs = '') => `<button class="statstone" ${attrs}>${svg}<span class="statlabel"><b>${big}</b>${label}</span></button>`;
  const stats = `<div class="statrow">
    ${stat(numberStone(st.current, ROCK.ember, GLOW.ember, 20), st.current === 1 ? 'day streak' : 'day streak', st.shields ? `${st.shields} ember ${st.shields === 1 ? 'charge' : 'charges'}` : 'ember charge every 7', 'data-act="tab" data-tab="progress"')}
    ${stat(numberStone(protein, ROCK.green, GLOW.gold, 21), `of ${S.profile.proteinTarget} g`, 'protein', 'data-act="tab" data-tab="fuel"')}
    ${stat(numberStone(water, ROCK.blue, GLOW.cyan, 22), `of ${S.profile.waterTarget} oz`, 'tap to add 8 oz', 'data-act="water" data-v="8" aria-label="Add 8 ounces of water"')}</div>`;
  const top = S.profile.level >= LEVELS.length;
  const stoneCard = `<div class="slab plain"><div class="row between"><h3>Standing stone</h3><span class="small">${prog.count} of ${prog.need} notches</span></div>
    <div class="row" style="margin-top:8px"><div class="row" style="gap:4px">${Array.from({ length: prog.need }, (_, i) => notchStone(i < prog.count, 60 + i)).join('')}</div><p class="small grow" style="margin:0">${top ? 'You hold the highest rank. Keep adding weight.' : prog.count >= prog.need && !prog.ready ? 'Finish one more that feels doable to rise.' : `${prog.need - prog.count} more full ${prog.need - prog.count === 1 ? 'trial' : 'trials'} to reach Trial ${S.profile.level + 1} (${LEVELS[S.profile.level].minutes} min).`}</p></div></div>`;
  return `
  <div class="top"><div class="grow"><h1>${greet}${S.profile.name ? ', ' + esc(S.profile.name) : ''}</h1><p class="sub">Trial ${lv().n} · ${lv().rank}, the ${lv().tree.toLowerCase()}</p></div>
    <button class="iconbtn" data-act="sheet" data-sheet="settings" aria-label="Settings"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/></svg></button></div>
  ${comeback ? `<div class="note">Welcome back. Today is a lighter comeback session, then you pick up where you left off. Nothing was lost.</div>` : ''}
  ${healthCard(ready, d)}
  ${lowDay ? `<div class="note">This is usually a low-energy day after your dose, so today starts as a lighter trial. Log your energy if you feel better than that.</div>` : ''}
  ${st.shielded ? `<div class="note">The Rune of Embers is holding your ${st.current}-day streak. Any session today keeps it.</div>` : ''}
  ${backupDue() ? `<div class="note">It has been over a week since your last backup. <button class="btn sm" data-act="savebackup" style="margin-top:6px">Save a backup now</button></div>` : ''}
  ${L.lowIntake(S) ? `<div class="note">You logged very little protein two days running. On a GLP-1 that costs muscle. Try a shake or a small protein snack early today.</div>` : ''}
  ${d.energy ? '' : `<div class="cloth"><h3>How is your energy this morning?</h3><p class="small">Your trial adjusts to it. Low energy gets a shorter session, never a skipped one.</p><div class="pick">${[1, 2, 3, 4, 5].map((n) => `<button class="btn" data-act="energy" data-v="${n}" aria-label="Energy ${n} of 5">${n}</button>`).join('')}</div><div class="row between small" style="margin-top:4px"><span>Drained</span><span>Strong</span></div></div>`}
  <div class="slab"><div class="herorow">${heroStone(108, true)}<div class="grow">${info}</div></div>${acts}</div>
  ${stats}
  ${stoneCard}
  ${heroCard()}
  ${ui.brief ? `<div class="cloth"><h3>Morning briefing</h3><p style="margin:0">${esc(ui.brief)}</p></div>` : ''}
  <div class="grid2"><button class="btn" data-act="brief" ${ui.busy === 'brief' ? 'disabled' : ''}>${ui.busy === 'brief' ? 'Preparing…' : 'Morning briefing'}</button><button class="btn" data-act="sheet" data-sheet="coach">Ask your coach</button></div>
  ${S.settings.dev ? '<button class="btn sm" style="width:100%;margin-bottom:12px" data-act="sheet" data-sheet="dev">Developer: simulate health data</button>' : ''}
  ${proverb()}`;
}

const MED_NOTE = 'General wellness information, not medical advice. Check any supplement with your prescriber or pharmacist first, especially on a GLP-1.';
function bandReadCard(r) {
  if (!r) return '';
  return `<div class="slab band"><p class="tag">Your coach's reading</p>${r.flag ? `<div class="note">${esc(r.flag)}</div>` : ''}<p>${esc(r.summary)}</p>
  ${r.today.length ? `<h3 style="margin-top:10px">Today</h3><ul class="list">${r.today.map((t) => `<li><span class="grow"><b>${esc(t.title)}</b><br><span class="dim">${esc(t.action)}</span></span></li>`).join('')}</ul>` : ''}
  ${r.food.length ? `<h3 style="margin-top:12px">Food that fits today</h3><ul class="list">${r.food.map((f) => `<li><span class="grow"><b>${esc(f.food)}</b><br><span class="dim">${esc(f.why)}</span></span></li>`).join('')}</ul>` : ''}
  ${r.supplements.length ? `<h3 style="margin-top:12px">Supplements to ask about</h3><ul class="list">${r.supplements.map((x) => `<li><span class="grow"><b>${esc(x.name)}</b><br><span class="dim">${esc(x.why)}</span><br><span class="small">Ask: ${esc(x.ask)}</span></span></li>`).join('')}</ul>` : ''}
  <p class="small" style="margin:10px 0 0">${MED_NOTE}</p></div>`;
}
function patternCard() {
  if (!Object.keys(S.health || {}).length) return '';
  const r = ui.patterns;
  return `<h2>Patterns in your band data</h2><div class="cloth">${r ? (r.findings.length ? `<ul class="list">${r.findings.map((f) => `<li><span class="grow">${esc(f.pattern)}<br><span class="bronze">Try: ${esc(f.try)}</span></span></li>`).join('')}</ul>` : '<p class="dim">No clear pattern yet.</p>') + (r.note ? `<p class="small" style="margin-top:8px">${esc(r.note)}</p>` : '') + `<p class="small">${MED_NOTE}</p>` : '<p class="small">Your coach compares four weeks of sleep, heart rate and steps with your energy, protein and pump ratings, and reports what actually moves together.</p>'}
  <button class="btn" data-act="patterns" ${ui.busy === 'patterns' ? 'disabled' : ''}>${ui.busy === 'patterns' ? 'Looking for patterns…' : r ? 'Look again' : 'Find my patterns'}</button></div>`;
}
const look = () => (ui.heroPreview != null ? H.previewLook(ui.heroPreview) : H.heroLook(S));
const runeStoneSvg = (r, size = 40) => iconStone(r.icon, ROCK[r.rock], GLOW[r.glow], 30 + r.id.length, size, r.lit);
function heroCard() {
  const nx = H.nextUpgrade(S), rs = H.runes(S);
  return `<div class="slab plain"><div class="herorow" style="align-items:flex-start;margin:0">${heroSVG(look(), 116)}<div class="grow">
    <div class="row between"><h3>Your warrior</h3>${ui.heroPreview != null ? '<span class="small">preview</span>' : ''}</div>
    ${nx ? `<p class="small" style="margin:4px 0 0">Next: ${nx.nextName.toLowerCase()}</p>${meter(nx.xp - H.TIER_AT[nx.tier], nx.next - H.TIER_AT[nx.tier])}<p class="small">Built by ${nx.part} work</p>` : '<p class="small">Every piece is gold-inlaid. A warrior of legend.</p>'}
    <div class="runerow">${rs.map((r) => runeStoneSvg(r, 34)).join('')}</div>
    <button class="btn sm" style="width:100%;margin-top:6px" data-act="sheet" data-sheet="hero">Open the armory</button></div></div></div>`;
}
function sheetHero() {
  const ar = H.armor(S), rs = H.runes(S), lk = look(), real = H.heroLook(S), rel = H.relics(S);
  const piece = (a) => `<li><span class="grow"><b>${a.tierName}</b><br><span class="small">${a.name} · built by ${a.part} work${a.next ? ` · ${a.xp} of ${a.next} to ${a.nextName.toLowerCase()}` : ' · finest tier'}</span>${a.next ? meter(a.xp - H.TIER_AT[a.tier], a.next - H.TIER_AT[a.tier]) : ''}</span></li>`;
  const rune = (r) => `<li>${runeStoneSvg(r, 52)}<span class="grow"><b>${r.name}</b>${r.charges ? ` <span class="bronze">· ${r.charges} ${r.charges === 1 ? 'charge' : 'charges'}</span>` : r.lit ? ' <span class="bronze">· lit</span>' : ''}<br><span class="dim" style="font-size:15px">${r.effect}</span><br><span class="small">${r.habit} ${r.progress}.</span></span></li>`;
  return `<div><div class="row between"><h1>The armory</h1>${closeBtn()}</div>
  <div style="display:grid;justify-items:center;margin:6px 0 2px">${heroSVG(lk, 230)}</div>
  ${ui.heroPreview != null ? `<p class="small" style="text-align:center">Previewing every piece at tier ${ui.heroPreview}. <button class="btn quiet sm" data-act="heropreview" data-v="">Show my real gear</button></p>` : `<p class="sub" style="text-align:center;margin-bottom:8px">Trial ${lv().n} · ${lv().rank}, the ${lv().tree.toLowerCase()}</p>`}
  <h2>Armor</h2><div class="cloth"><p class="small">Each piece is forged by training the muscles under it. Reps build it, and adding weight builds it faster.</p><ul class="list">${ar.map(piece).join('')}</ul></div>
  <h2>Weapons</h2><div class="cloth"><ul class="list">
    <li><span class="grow"><b>${H.SPEARS[real.spear - 1]}</b><br><span class="small">${real.spear < 5 ? `Reforged each time you rise a rank. Next: ${H.SPEARS[real.spear].toLowerCase()} at Trial ${real.spear + 1}.` : 'The finest spear in the warband.'}</span></span></li>
    <li><span class="grow"><b>${H.SHIELDS[real.shield]}</b><br><span class="small">${real.bosses ? `${real.bosses} boss ${real.bosses === 1 ? 'mark' : 'marks'}. ` : ''}${real.shield < 4 ? 'Each boss trial you beat improves it and adds a stud.' : 'Fully bound and marked.'}</span></span></li>
    <li><span class="grow"><b>${H.TORCS[real.torc]}</b><br><span class="small">${S.sessions.length} sessions finished. ${real.torc < 3 ? `Next torc at ${[5, 25, 100][real.torc]}.` : 'The gold torc of a veteran.'}</span></span></li></ul></div>
  <h2>Rune powers</h2><div class="cloth"><ul class="list runelist">${rs.map(rune).join('')}</ul></div>
  <h2>Relics</h2><div class="cloth"><div class="torcs">${rel.map((r, i) => `<div class="torc ${r.have ? '' : 'locked'}">${iconStone(r.icon, ROCK[r.rock], GLOW[r.glow], 70 + i, 64, r.have)}<b>${r.name}</b>${r.how}</div>`).join('')}</div></div></div>`;
}
function healthCard(ready, d) {
  const h = S.health?.[today()]; if (!h) return '';
  const tone = ready ? { ready: 'moss', steady: 'bronze', low: 'ember' }[ready.label] : '';
  const words = ready ? { ready: 'Well recovered. A full trial is on.', steady: 'Middling recovery. A full trial is fine if you feel up to it.', low: d.energy == null ? 'Poor recovery, so today starts as a lighter trial.' : 'Poor recovery. Your energy check-in decides today.' }[ready.label] : '';
  return `<div class="cloth"><div class="row between"><h3>From your band</h3>${(h.source || 'sim') === 'sim' ? '<span class="small">simulated</span>' : ''}</div>
  <div class="grid2" style="margin:8px 0 0">${ready ? `<div><p class="small">Recovery</p><p class="big ${tone}">${ready.score}<span class="small"> / 100</span></p></div>` : ''}${h.sleep ? `<div><p class="small">Sleep</p><p class="big">${h.sleep}<span class="small"> h</span></p></div>` : ''}${h.rhr ? `<div><p class="small">Resting heart rate</p><p class="big">${h.rhr}<span class="small"> bpm</span></p></div>` : ''}${h.hrv ? `<div><p class="small">HRV</p><p class="big">${h.hrv}<span class="small"> ms</span></p></div>` : ''}</div>
  ${h.steps ? `<p class="small" style="margin:10px 0 0">Steps: ${h.steps.toLocaleString()} of ${S.profile.stepsGoal.toLocaleString()}</p>${meter(h.steps, S.profile.stepsGoal)}` : ''}
  ${words ? `<p class="small" style="margin:8px 0 0">${words}</p>` : ''}
  ${L.healthFlag(S) ? `<div class="note" style="margin:10px 0 0">${L.healthFlag(S)}</div>` : ''}
  <button class="btn" style="width:100%;margin-top:10px" data-act="bandread" ${ui.busy === 'band' ? 'disabled' : ''}>${ui.busy === 'band' ? 'Reading your band…' : d.bandRead ? 'Read my band again' : 'Read my band'}</button></div>${bandReadCard(d.bandRead)}`;
}

// ---------- Train ----------
function viewTrain() {
  const n = S.profile.level;
  const card = (id, name, sub) => `<div class="slab"><div class="row between"><div><h3>${name}</h3><p class="small">${sub}</p></div><button class="btn sm" data-act="start" data-trial="${id}" data-mode="full">Begin</button></div></div>`;
  const trials = Object.entries(TRIALS).map(([id, t]) => card(id, t.name, `${L.sessionMinutes(L.buildSession(id, n))} min · ${t.pool.slice(0, t.count[n - 1]).map((e) => EX[e].name.replace(/^(Dumbbell|One-arm dumbbell|Seated|Lying) /i, '')).join(', ')}`)).join('');
  const used = new Set(Object.values(TRIALS).flatMap((t) => [...t.pool.slice(0, t.count[n - 1]), ...t.finishers.flatMap((f) => f.steps.map((x) => x.ex))]));
  const moves = Object.keys(EX).filter((id) => id !== 'walk').sort((a, b) => used.has(b) - used.has(a)).map((id) => { const b = L.bestFor(S, id); return `<li><button class="btn quiet sm grow" style="justify-content:flex-start;padding-left:0" data-act="move" data-id="${id}">${EX[id].name}${used.has(id) ? '' : ' <span class="small">(later trials)</span>'}</button><span class="num small">${b && b.w ? `${b.w} lb × ${b.r}` : ''}</span></li>`; }).join('');
  const hist = S.sessions.slice(-6).reverse().map((s) => `<li><span class="grow">${s.trialId === 'walk' ? 'Treadmill walk' : TRIALS[s.trialId].short}<br><span class="small">${niceDate(s.date)} · ${modeWords[s.mode]}${s.pump ? ` · pump ${s.pump}/5` : ''}</span></span><span class="num small">${s.minutes} min</span></li>`).join('');
  return `<div class="top"><div class="grow"><h1>Train</h1><p class="sub">Trial ${n} · ${lv().minutes}-minute sessions</p></div></div>
  ${trials}${card('walk', 'Treadmill walk', `${L.sessionMinutes(L.buildSession('walk', n))} min · incline cardio`)}
  <h2>Moves</h2><div class="cloth"><p class="small">Tap a move to watch the form.</p><ul class="list">${moves}</ul></div>
  <h2>Recent sessions</h2><div class="cloth">${hist ? `<ul class="list">${hist}</ul>` : '<p class="dim" style="margin:0">Your first trial will show up here.</p>'}</div>`;
}

// ---------- Fuel ----------
function viewFuel() {
  const d = L.day(S, today()), p = L.proteinOf(d), cal = L.caloriesOf(d), draft = ui.mealDraft || {};
  const food = d.food.map((f, i) => `<li><span class="grow">${esc(f.name || 'Food')}</span><span class="num">${f.protein} g${f.cal ? ` · ${f.cal} cal` : ''}</span><button class="iconbtn" data-act="delfood" data-i="${i}" aria-label="Remove ${esc(f.name)}">✕</button></li>`).join('');
  const meals = S.meals.map((m, i) => `<button class="btn sm" data-act="quickmeal" data-i="${i}">${esc(m.name)} · ${m.protein} g</button>`).join('');
  return `<div class="top"><div class="grow"><h1>Fuel</h1><p class="sub">Protein first. It protects your muscle.</p></div></div>
  <div class="slab"><div class="row between"><div><p class="small">Protein today</p><p class="big">${p} <span class="small">/ ${S.profile.proteinTarget} g</span></p></div>${cal ? `<p class="small num">${cal} cal logged</p>` : ''}</div>${meter(p, S.profile.proteinTarget)}
    <p class="small">${p >= S.profile.proteinTarget ? 'Target hit. Your muscles are fed.' : `${S.profile.proteinTarget - p} g to go. Small, protein-dense bites count.`}</p></div>
  ${waterCard()}
  <h2>Log food</h2>
  <div class="cloth">
    <label class="btn" style="width:100%;margin:0 0 4px;color:var(--bone)">${ui.busy === 'meal' ? 'Looking at your photo…' : 'Snap a photo to estimate'}<input type="file" accept="image/*" capture="environment" data-photo hidden></label>
    ${ui.mealNote ? `<p class="small">${esc(ui.mealNote)}</p>` : '<p class="small">The estimate fills in the boxes below. Check it, then add.</p>'}
    <form data-form="food"><label for="fname">What you ate</label><input id="fname" name="name" placeholder="Greek yogurt and berries" value="${esc(draft.name || '')}" required>
      <div class="fields"><div><label for="fprot">Protein (g)</label><input id="fprot" name="protein" type="number" inputmode="numeric" min="0" max="300" value="${draft.protein ?? ''}" required></div><div><label for="fcal">Calories (optional)</label><input id="fcal" name="cal" type="number" inputmode="numeric" min="0" max="5000" value="${draft.cal ?? ''}"></div></div>
      <label class="row" style="margin:12px 0"><input type="checkbox" name="keep" style="width:22px;min-height:22px;height:22px"> Save as a go-to meal</label>
      <button class="btn go">Add to today</button></form></div>
  ${meals ? `<h2>Go-to meals</h2><div class="row wrap" style="margin-bottom:12px">${meals}</div>` : ''}
  <h2>Today</h2><div class="cloth">${food ? `<ul class="list">${food}</ul>` : '<p class="dim" style="margin:0">Nothing logged yet today.</p>'}</div>
  <p class="small">Appetite low? A shake, eggs, cottage cheese, jerky, or Greek yogurt are easy protein in small portions. Your target is a general guide; confirm it with your prescriber.</p>`;
}

// ---------- Mind ----------
function viewMind() {
  const d = L.day(S, today()), j = d.journal || {};
  const pick = (act, cur, labels) => `<div class="pick">${[1, 2, 3, 4, 5].map((n) => `<button class="btn ${cur === n ? 'on' : ''}" data-act="${act}" data-v="${n}" aria-label="${labels} ${n} of 5" aria-pressed="${cur === n}">${n}</button>`).join('')}</div>`;
  return `<div class="top"><div class="grow"><h1>Mind</h1><p class="sub">${d.mind ? `${d.mind} ${d.mind === 1 ? 'session' : 'sessions'} today` : 'A calm mind trains better.'}</p></div></div>
  <div class="cloth"><h3>Daily check-in</h3><label>Mood</label>${pick('mood', d.mood, 'Mood')}<label>Energy</label>${pick('energy', d.energy, 'Energy')}
    <label>Weekly GLP-1 dose</label><button class="btn sm ${S.doses.includes(today()) ? 'on' : ''}" data-act="dose" aria-pressed="${S.doses.includes(today())}">${S.doses.includes(today()) ? 'Dose logged today' : 'I took my dose today'}</button>
    <label>Sleep last night</label><div class="pick">${[5, 6, 7, 8, 9].map((n) => `<button class="btn ${d.sleep === n ? 'on' : ''}" data-act="sleep" data-v="${n}" aria-pressed="${d.sleep === n}">${n === 5 ? '≤5' : n === 9 ? '9+' : n} h</button>`).join('')}</div></div>
  <h2>Breathing</h2><div class="slab"><p class="dim">In for 4, hold for 4, out for 6. Slows your heart and settles your head.</p><div class="pick pick3">${[1, 2, 3].map((n) => `<button class="btn" data-act="breath" data-v="${n}">${n} min</button>`).join('')}</div></div>
  <h2>Guided meditation</h2>${MEDITATIONS.map((m) => `<div class="slab"><div class="row between"><div><h3>${m.name}</h3><p class="small">${m.minutes} min</p></div><button class="btn sm" data-act="med" data-id="${m.id}">Begin</button></div></div>`).join('')}
  <h2>Evening journal</h2><div class="cloth"><form data-form="journal"><label for="jg">One thing you're grateful for</label><textarea id="jg" name="grat" placeholder="A good class, a quiet morning">${esc(j.grat || '')}</textarea><label for="jr">How did today go?</label><textarea id="jr" name="refl" placeholder="What went well, what was hard">${esc(j.refl || '')}</textarea><button class="btn" style="margin-top:12px;width:100%">Save journal</button></form></div>
  ${proverb()}`;
}

// ---------- Progress ----------
function chart(points) {
  if (points.length < 2) return '<p class="dim" style="margin:8px 0 0">Add two weigh-ins to see your line.</p>';
  const ys = points.map((p) => p.lb), lo = Math.min(...ys) - 1, hi = Math.max(...ys) + 1;
  const pts = points.map((p, i) => `${(i / (points.length - 1)) * 300},${140 - ((p.lb - lo) / (hi - lo)) * 130}`).join(' ');
  return `<div class="row between small" style="margin-top:8px"><span>${niceDate(points[0].date)}: ${points[0].lb} lb</span><span>${niceDate(points[points.length - 1].date)}: ${points[points.length - 1].lb} lb</span></div><div class="chart"><svg viewBox="0 0 300 150" preserveAspectRatio="none" role="img" aria-label="Weight over time"><polyline points="${pts}" fill="none" stroke="#F07A2E" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg></div>`;
}
function doseCard() {
  if (!S.doses.length) return '';
  const p = L.dosePattern(S), names = ['Dose day', 'Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6'];
  const rows = names.map((n, i) => `<li><span style="width:5.5em" class="small">${n}</span><span class="grow">${p.avg[i] == null ? '' : `<div class="meter" style="margin:0"><i style="width:${p.avg[i] * 20}%;background:${p.low.includes(i) ? 'var(--bronze)' : 'var(--moss)'}"></i></div>`}</span><span class="num small" style="width:3.5em;text-align:right">${p.avg[i] == null ? 'no data' : p.avg[i]}</span></li>`).join('');
  return `<h2>Energy after your dose</h2><div class="cloth"><ul class="list">${rows}</ul><p class="small" style="margin-top:8px">${p.low.length ? `You usually run low on ${p.low.map((i) => names[i].toLowerCase()).join(' and ')}. Fianna starts those days with a lighter trial.` : 'Keep logging energy each morning. After two weeks Fianna can spot your low days and plan around them.'}</p></div>`;
}
function photoCard() {
  const ph = ui.photos;
  if (!ph.length) return '<p class="dim" style="margin:0">Take one photo a month in the same spot and light. Changes show up here before you notice them in the mirror.</p>';
  const first = ph[0], last = ph[ph.length - 1];
  const cmp = ph.length > 1 ? `<div class="cmp"><img src="${last.dataUrl}" alt="Latest photo, ${niceDate(last.date)}"><div class="cmpTop" id="cmpTop" style="width:50%"><img src="${first.dataUrl}" alt="First photo, ${niceDate(first.date)}"></div></div><input type="range" min="0" max="100" value="50" data-cmp aria-label="Slide to compare first and latest photo"><div class="row between small"><span>${niceDate(first.date)}</span><span>${niceDate(last.date)}</span></div>` : '';
  return cmp + `<div class="thumbs">${ph.map((x) => `<div><img src="${x.dataUrl}" alt="Photo from ${niceDate(x.date)}"><button class="btn quiet sm" data-act="delphoto" data-id="${x.id}">Remove</button></div>`).join('')}</div>`;
}
function viewProgress() {
  const r = L.weekReport(S), show = (v, unit = '') => (v == null ? '–' : v + unit);
  const tiles = [['Strength trials', r.strength], ['Walks', r.walks], ['Minutes trained', r.minutes], ['Protein days hit', `${r.proteinHit} of 7`], ['Avg energy', show(r.energyAvg, ' / 5')], ['Avg pump', show(r.pumpAvg, ' / 5')], ['Avg sleep', show(r.sleepAvg, ' h')], ['Mind sessions', r.mind]];
  const recs = Object.keys(EX).map((id) => [id, L.bestFor(S, id)]).filter(([, b]) => b && b.w).map(([id, b]) => `<li><span class="grow">${EX[id].name}</span><span class="num">${b.w} lb × ${b.r}</span></li>`).join('');
  const badges = BADGES.map((b) => `<div class="torc ${S.badges[b.id] ? '' : 'locked'}">${badgeStone(b, 68, !!S.badges[b.id])}<b>${b.name}</b>${b.desc}</div>`).join('');
  const rewards = S.rewards.map((w, i) => `<li><span class="grow">${esc(w.text)}<br><span class="small">${S.profile.level >= w.level ? 'Earned. Go claim it.' : `Unlocks at Trial ${w.level}`}</span></span><button class="iconbtn" data-act="delreward" data-i="${i}" aria-label="Remove reward">✕</button></li>`).join('');
  return `<div class="top"><div class="grow"><h1>Progress</h1><p class="sub">Dispatch for ${niceDate(r.from)} to ${niceDate(r.to)}</p></div></div>
  <div class="grid2">${tiles.map(([k, v]) => `<div class="slab"><p class="small">${k}</p><p class="big">${v}</p></div>`).join('')}</div>
  <div class="cloth"><h3>The bard's tale of your week</h3>${ui.tale ? `<p style="white-space:pre-wrap">${esc(ui.tale)}</p>` : '<p class="small">Your coach turns the week\'s numbers into a short story and one focus for next week.</p>'}<button class="btn" data-act="tale" ${ui.busy === 'tale' ? 'disabled' : ''}>${ui.busy === 'tale' ? 'The bard is composing…' : ui.tale ? 'Tell it again' : 'Hear the tale'}</button></div>
  <h2>Weigh-in</h2><div class="cloth"><form data-form="weight" class="row"><div class="grow"><label for="wlb" style="margin-top:0">Weight (lb)</label><input id="wlb" name="lb" type="number" inputmode="decimal" step="0.1" min="60" max="600" required></div><button class="btn" style="align-self:flex-end">Log</button></form>${chart(S.weights.slice(-20))}
    <p class="small" style="margin-top:8px">Weekly is enough. The scale can't tell fat from muscle, so watch your strength records too.</p></div>
  ${patternCard()}
  ${doseCard()}
  <h2>Progress photos</h2><div class="cloth">${photoCard()}<label class="btn sm" style="margin-top:10px;color:var(--bone)">Add a photo<input type="file" accept="image/*" data-progphoto hidden></label><p class="small" style="margin-top:8px">Photos stay on this phone only. They are not included in backups.</p></div>
  <h2>Strength records</h2><div class="cloth">${recs ? `<ul class="list">${recs}</ul>` : '<p class="dim" style="margin:0">Log weights in a trial and your best lifts appear here.</p>'}</div>
  <h2>Rune stones earned</h2><div class="cloth"><div class="torcs">${badges}</div></div>
  <h2>Your rewards</h2><div class="cloth">${rewards ? `<ul class="list">${rewards}</ul>` : '<p class="small">Promise yourself something real for reaching a new trial.</p>'}
    <form data-form="reward" class="row" style="margin-top:8px"><div class="grow"><label for="rw" style="margin-top:0">Reward</label><input id="rw" name="text" placeholder="New lifting gloves" required></div><div style="width:110px"><label for="rl" style="margin-top:0">At trial</label><select id="rl" name="level">${[2, 3, 4, 5].map((n) => `<option>${n}</option>`).join('')}</select></div><button class="btn" style="align-self:flex-end">Add</button></form></div>`;
}

// ---------- Sheets ----------
const closeBtn = (label = 'Close') => `<button class="btn quiet sm" data-act="close">${label}</button>`;

function sheetSetup() {
  return `<div><div style="text-align:center;margin:18px 0 10px">${fearn(84)}<div style="margin-top:16px">${wordmark(210)}</div><h1 style="margin-top:14px;font-size:20px">Welcome to the warband</h1><p class="dim" style="margin-top:6px">Three answers and your first trial is ready.</p></div>
  <form data-form="setup"><label for="sn">What should your coach call you?</label><input id="sn" name="name" autocomplete="given-name" required>
  <label for="sw">Body weight in pounds (optional, sets a protein range)</label><input id="sw" name="lb" type="number" inputmode="decimal" min="60" max="600">
  <label for="st">Weekday wake-up reminder</label><input id="st" name="wake" type="time" value="${S.settings.times.wake}" required>
  <div class="spacer" style="min-height:18px"></div><button class="btn go">Enter the warband</button></form>
  <p class="small" style="margin-top:14px">Everything you log stays on this phone. Fianna is a training aid, not medical advice.</p></div>`;
}

function sheetSettings() {
  const p = S.profile, s = S.settings, range = L.proteinRange(p.weightLb);
  const t = (group, slot, label) => `<div><label for="${group}${slot}">${label}</label><input id="${group}${slot}" name="${group}.${slot}" type="time" value="${s[group][slot]}"></div>`;
  return `<div><div class="row between"><h1>Settings</h1>${closeBtn()}</div>
  <form data-form="settings">
  <h2>You</h2><div class="fields"><div><label for="pn">Name</label><input id="pn" name="name" value="${esc(p.name)}"></div><div><label for="pw">Body weight (lb)</label><input id="pw" name="lb" type="number" inputmode="decimal" value="${p.weightLb ?? ''}"></div>
    <div><label for="pp">Protein target (g)</label><input id="pp" name="protein" type="number" inputmode="numeric" min="30" max="350" value="${p.proteinTarget}"></div><div><label for="pwt">Water target (oz)</label><input id="pwt" name="water" type="number" inputmode="numeric" min="20" max="250" value="${p.waterTarget}"></div>
    <div><label for="ps">Dumbbell step (lb)</label><select id="ps" name="step">${[2.5, 5, 10].map((n) => `<option ${p.dbStep === n ? 'selected' : ''}>${n}</option>`).join('')}</select></div><div><label for="pl">Current trial</label><select id="pl" name="level">${LEVELS.map((l) => `<option value="${l.n}" ${p.level === l.n ? 'selected' : ''}>${l.n} (${l.minutes} min)</option>`).join('')}</select></div></div>
  ${range ? `<p class="small" style="margin-top:8px">A commonly cited range for keeping muscle is 1.6 to 2.0 g per kg, which is ${range[0]} to ${range[1]} g for you. Confirm your target with your prescriber.</p>` : ''}
  <h2>Reminders</h2><label class="row"><input type="checkbox" name="notify" ${s.notify ? 'checked' : ''} style="width:22px;min-height:22px;height:22px"> Send reminders</label>
  <p class="small">Weekdays</p><div class="fields">${t('times', 'wake', 'Wake-up')}${t('times', 'midday', 'Midday')}${t('times', 'evening', 'Evening')}${t('times', 'bedtime', 'Wind-down')}</div>
  <p class="small" style="margin-top:12px">Weekends</p><div class="fields">${t('weekend', 'wake', 'Wake-up')}${t('weekend', 'midday', 'Midday')}${t('weekend', 'evening', 'Evening')}${t('weekend', 'bedtime', 'Wind-down')}</div>
  <button type="button" class="btn sm" style="margin-top:12px" data-act="skipday">${s.skipDate === today() ? 'Reminders are off for today' : 'Skip reminders today'}</button>
  <button type="button" class="btn sm" style="margin-top:12px" data-act="horn">Hear the carnyx</button>
  ${isNative() ? '' : '<p class="small" style="margin-top:8px">Reminders work in the installed Android app.</p>'}
  <h2>During a trial</h2><label class="row"><input type="checkbox" name="speak" ${s.speak ? 'checked' : ''} style="width:22px;min-height:22px;height:22px"> Read form cues aloud</label>
  <label class="row"><input type="checkbox" name="drum" ${s.drum ? 'checked' : ''} style="width:22px;min-height:22px;height:22px"> Drum beat on each tempo change</label>
  <label for="sg">Daily steps goal</label><input id="sg" name="stepsGoal" type="number" inputmode="numeric" min="1000" max="40000" step="500" value="${p.stepsGoal}">
  <h2>Coach</h2><label for="ak">Claude API key</label><input id="ak" name="apiKey" type="password" autocomplete="off" placeholder="sk-ant-…" value="${esc(s.apiKey)}">
  <label for="wsid">Workspace ID (only if your key asks for one)</label><input id="wsid" name="workspaceId" autocomplete="off" placeholder="wrkspc_…" value="${esc(s.workspaceId || '')}">
  <p class="small" style="margin-top:6px">Powers the coach, photo food estimates, and the bard's tale. Stored only on this phone.</p>
  <button class="btn go" style="margin-top:18px">Save settings</button></form>
  <div class="cloth" style="margin-top:16px"><label class="row" style="margin:0"><input type="checkbox" data-devtoggle ${s.dev ? 'checked' : ''} style="width:22px;min-height:22px;height:22px"> Developer mode</label><p class="small" style="margin:8px 0 0">Adds a button on Today for entering simulated band data (sleep, steps, heart rate).</p></div>
  <h2>Backup</h2><div class="cloth"><p class="small">${S.settings.lastBackup ? `Last backup: ${niceDate(S.settings.lastBackup)}.` : 'No backup yet.'} Save the file to Google Drive or email it to yourself.</p><div class="row wrap"><button class="btn sm" data-act="savebackup">Save backup file</button><label class="btn sm" style="margin:0;color:var(--bone)">Restore from file<input type="file" accept=".json,application/json,text/plain" data-restore hidden></label></div>
  ${ui.backup ? `<label for="backup">Backup text (copy all of it)</label><textarea id="backup">${esc(ui.backup)}</textarea><button class="btn sm" data-act="import" style="margin-top:8px">Restore from this text</button>` : ''}</div></div>`;
}

function sheetMove() {
  const id = ui.move, e = EX[id], b = L.bestFor(S, id), sug = L.suggestWeight(S, id);
  return `<div><div class="row between"><h1>${e.name}</h1>${closeBtn()}</div>${stage(id)}${e.cues.map((c) => `<div class="cue">${c}</div>`).join('')}
  <div class="cloth" style="margin-top:8px"><p class="small">${b && b.w ? `Your best: ${b.w} lb × ${b.r} on ${niceDate(b.date)}` : e.bw ? 'Bodyweight move' : 'Not logged yet'}</p><p style="margin:0">${sug.note}</p></div></div>`;
}

function sheetCoach() {
  const msgs = S.chat.map((m) => `<div class="bubble ${m.role === 'user' ? 'me' : 'coach'}">${esc(m.content)}</div>`).join('');
  const ideas = ['I only have 10 minutes today. What should I do?', 'My energy is low. Adjust today for me.', 'Give me a high-protein snack idea.', 'Build a grocery list from my go-to meals.'];
  return `<div><div class="row between"><h1>Coach</h1>${closeBtn()}</div>
  <div id="chatlog" style="margin:12px 0">${msgs || `<p class="dim">Ask about today's trial, food, or how to adjust when life gets in the way.</p><div style="display:grid;gap:8px">${ideas.map((q) => `<button class="btn sm" style="justify-content:flex-start;text-align:left" data-act="ask" data-q="${esc(q)}">${q}</button>`).join('')}</div>`}${ui.busy === 'coach' ? '<div class="bubble coach">Thinking…</div>' : ''}</div>
  <div class="spacer"></div><form data-form="chat" class="row"><input name="q" aria-label="Message your coach" placeholder="Ask your coach" autocomplete="off" required><button class="btn" ${ui.busy === 'coach' ? 'disabled' : ''}>Send</button></form>
  ${S.chat.length ? '<button class="btn quiet sm" data-act="clearchat" style="margin-top:6px">Clear conversation</button>' : ''}</div>`;
}

function sheetBreath() {
  return `<div><div class="row between"><h1>Breathe</h1>${closeBtn('End')}</div><div class="spacer"></div><div class="breath" id="breath"><span id="breathLabel">Ready</span></div><p class="count" id="count" style="font-size:40px">${clock(ui.breath.remain)}</p><div class="spacer"></div></div>`;
}
function sheetMed() {
  const m = MEDITATIONS.find((x) => x.id === ui.med.id);
  return `<div><div class="row between"><h1>${m.name}</h1>${closeBtn('End')}</div><div class="spacer"></div><p class="medline" id="medline" aria-live="polite">${m.lines[0]}</p><p class="count" id="count" style="font-size:40px">${clock(ui.med.remain)}</p><div class="spacer"></div><button class="btn sm ${ui.med.voice ? 'on' : ''}" data-act="voice" aria-pressed="${!!ui.med.voice}">Read aloud</button></div>`;
}

function sheetPlayer() {
  const P = ui.player, steps = P.session.steps;
  const dots = `<div class="dots" aria-hidden="true">${steps.map((_, i) => `<i class="${i < P.i ? 'done' : i === P.i ? 'now' : ''}"></i>`).join('')}</div>`;
  const head = `<div class="row between"><p class="tag" style="margin:0">${P.session.boss ? 'Boss trial · ' : ''}${P.session.name}</p><div class="row"><button class="btn quiet sm" data-act="voicecue" aria-pressed="${!!S.settings.speak}">${S.settings.speak ? 'Voice on' : 'Voice off'}</button><button class="btn quiet sm" data-act="quit">End</button></div></div>${dots}`;
  if (P.phase === 'finish') {
    const strength = P.session.trialId !== 'walk';
    const b = (group, v, label) => `<button type="button" class="btn ${P[group] === v ? 'on' : ''}" data-act="rate" data-group="${group}" data-v="${v}" aria-pressed="${P[group] === v}">${label}</button>`;
    return `<div>${head}<h1 style="margin-top:18px">Trial complete</h1><p class="dim">Two quick answers so your next trial fits you.</p>
    <h2>How did it feel?</h2><div class="pick pick3">${b('felt', 'easy', 'Easy')}${b('felt', 'doable', 'Doable')}${b('felt', 'hard', 'Wrecked me')}</div>
    ${strength ? `<h2>How was the pump?</h2><div class="pick">${[1, 2, 3, 4, 5].map((n) => b('pump', n, n)).join('')}</div><div class="row between small" style="margin-top:4px"><span>Nothing</span><span>Skin-tight</span></div>` : ''}
    <div class="spacer"></div><button class="btn go" data-act="finish">Carve it in stone</button></div>`;
  }
  if (P.phase === 'done') {
    const r = P.result, prog = L.levelProgress(S);
    return `<div style="position:relative">${r.leveled || r.badges.length || r.forged.length ? embers() : ''}<div class="spacer"></div><div style="text-align:center;position:relative">${r.leveled ? `<div class="bigstone award">${stoneSVG(0, 4, S.profile.level, true)}</div><h1 style="margin-top:12px">You rise to Trial ${S.profile.level}</h1><p class="sub">${lv().rank}, the ${lv().tree.toLowerCase()}: ${lv().meaning}.</p><p class="dim" style="margin-top:8px">The ${S.profile.level} ${S.profile.level === 1 ? 'stroke' : 'strokes'} on your stone spell ${lv().rank} in Ogham. Your sessions are now ${lv().minutes} minutes.</p>` : `<div class="row" style="justify-content:center;gap:4px">${Array.from({ length: prog.need }, (_, i) => notchStone(r.counted && i < prog.count, 60 + i, 46)).join('')}</div><h1 style="margin-top:8px">${r.counted ? 'A notch is carved' : 'You showed up'}</h1><p class="dim">${r.counted ? `${prog.count} of ${prog.need} toward Trial ${Math.min(S.profile.level + 1, LEVELS.length)}.` : 'The five-minute trial keeps your streak alive. That is how warriors are made.'}</p>`}
    ${r.badges.map((x, i) => `<div class="cloth award" style="margin-top:12px;--d:${0.5 + i * 0.25}s"><div class="row" style="justify-content:center">${badgeStone(x, 60)}<div style="text-align:left"><p class="small">New rune stone</p><h3>${x.name}</h3></div></div></div>`).join('')}
    ${r.double ? '<div class="note" style="margin-top:12px;text-align:left">Rune of the Salmon: this trial counted double toward your rank.</div>' : ''}
    ${r.forged.length ? `<div class="cloth award" style="margin-top:12px;--d:.4s"><div class="row">${heroSVG(H.heroLook(S), 84)}<div style="text-align:left"><p class="small">Forged in the armory</p>${r.forged.map((f) => `<h3>${f.name}</h3>`).join('')}</div></div></div>` : ''}
    ${r.lit.map((x, i) => `<div class="cloth award" style="margin-top:12px;--d:${0.6 + i * 0.2}s"><div class="row" style="justify-content:center">${runeStoneSvg(x, 52)}<div style="text-align:left"><p class="small">Rune power</p><h3>${x.name}${x.charges ? ` · ${x.charges}` : ''}</h3></div></div></div>`).join('')}
    ${r.rewards.map((x) => `<div class="note" style="margin-top:12px;text-align:left">Reward earned: ${esc(x.text)}</div>`).join('')}</div>
    <div class="spacer"></div><button class="btn go" data-act="close">Done</button></div>`;
  }
  const step = steps[P.i], next = steps[P.i + 1];
  if (P.phase === 'rest') {
    return `<div>${head}<p class="tag" style="margin-top:18px">Rest</p><div class="ring"><svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="44" fill="none" stroke="#3A3275" stroke-width="5"/><circle cx="50" cy="50" r="44" fill="none" stroke="#C9973F" stroke-width="5" stroke-dasharray="1.5 5.4" opacity=".7"/><circle id="ringArc" cx="50" cy="50" r="44" fill="none" stroke="#F07A2E" stroke-width="5" stroke-linecap="round" stroke-dasharray="276.5" stroke-dashoffset="0"/></svg><p class="count" id="count">${clock(P.remain)}</p></div><p class="dim" style="text-align:center">Next: ${next ? (next.ex ? EX[next.ex].name : next.title) : 'finish'}</p>${next?.ex ? stage(next.ex, false) : ''}<div class="spacer"></div><button class="btn" data-act="skip">Skip rest</button></div>`;
  }
  if (step.type === 'timed') {
    return `<div>${head}<p class="tag" style="margin-top:12px">${step.finisher ? 'Ríastrad · pump finisher' : esc(step.title)}</p><h1>${step.ex ? EX[step.ex].name : step.title}</h1>${step.ex ? stage(step.ex, false) : '<div class="breath" id="breath" style="transform:scale(.8)"><span>Breathe</span></div>'}
    <p class="count" id="count">${clock(P.remain)}</p><p class="dim" style="text-align:center">${esc(step.note || '')}</p><div class="spacer"></div>
    <div class="row"><button class="btn grow" data-act="pause">${P.paused ? 'Resume' : 'Pause'}</button><button class="btn grow" data-act="skip">${next ? 'Next' : 'Finish'}</button></div></div>`;
  }
  const e = EX[step.ex], sug = L.suggestWeight(S, step.ex, P.session.level), prev = P.sets[step.ex]?.slice(-1)[0];
  const w = prev?.w ?? sug.w ?? '', unit = e.hold ? 'seconds' : e.perSide ? 'reps each side' : 'reps';
  return `<div>${head}<p class="tag" style="margin-top:12px">Round ${step.round} of ${step.of}</p><h1>${e.name}</h1>${stage(step.ex)}
  <div class="cue">${e.cues[(step.round - 1) % e.cues.length]}</div>
  <p style="margin:8px 0 0"><b>${step.reps[0]} to ${step.reps[1]} ${unit}</b>${e.bw ? '' : ` · <span class="dim">${sug.note}</span>`}</p>
  <form data-form="set"><div class="fields">${e.bw ? '<input type="hidden" name="w" value="0">' : `<div><label for="sw">Weight each (lb)</label><input id="sw" name="w" type="number" inputmode="decimal" step="0.5" min="0" max="300" value="${w}" required></div>`}<div><label for="sr">${e.hold ? 'Seconds held' : 'Reps done'}</label><input id="sr" name="r" type="number" inputmode="numeric" min="0" max="300" value="${prev?.r ?? step.reps[1]}" required></div></div>
  <div class="spacer" style="min-height:12px"></div><button class="btn go" style="margin-top:12px">Set done</button></form></div>`;
}

function sheetDev() {
  const k = ui.devDay || today(), h = S.health?.[k] || {}, r = L.readiness(S, k), n = Object.values(S.health || {}).filter((x) => (x.source || 'sim') === 'sim').length;
  const f = (name, label, attrs) => `<div><label for="dv${name}">${label}</label><input id="dv${name}" name="${name}" type="number" inputmode="decimal" value="${h[name] ?? ''}" ${attrs}></div>`;
  return `<div><div class="row between"><h1>Developer mode</h1>${closeBtn()}</div>
  <p class="dim" style="margin-top:6px">Type in the numbers a fitness band would send through Health Connect, then watch how Fianna reacts. Nothing here touches real health data.</p>
  <div class="slab" style="margin-top:12px"><p class="small">Result for ${niceDate(k)}</p>${r ? `<h3>Recovery ${r.score} of 100 · ${r.label}</h3><p class="small">${r.parts.map((p) => `${p.note}: ${Math.round(p.v * 100)}%`).join(' · ')}</p><p class="small">${r.hasBaseline ? '' : 'No baseline yet, so only sleep counts. Add two weeks of history below. '}${k === today() ? `Today's trial would be: ${modeWords[todayPlan().mode].toLowerCase()}.` : ''}</p>` : '<p class="dim" style="margin:0">No data for this day yet.</p>'}</div>
  <form data-form="dev"><label for="dvday">Day</label><input id="dvday" name="day" type="date" value="${k}" max="${today()}" data-devday>
  <div class="fields">${f('sleep', 'Sleep (hours)', 'step="0.1" min="0" max="16"')}${f('steps', 'Steps', 'step="1" min="0" max="80000"')}${f('rhr', 'Resting heart rate (bpm)', 'step="1" min="30" max="140"')}${f('hrv', 'HRV (ms)', 'step="1" min="5" max="250"')}</div>
  <button class="btn go" style="margin-top:14px">Save this day</button></form>
  <h2>Quick scenarios for today</h2><div class="row wrap"><button class="btn sm" data-act="devpreset" data-p="great">Great night</button><button class="btn sm" data-act="devpreset" data-p="ok">Average night</button><button class="btn sm" data-act="devpreset" data-p="rough">Rough night</button></div>
  <h2>History</h2><p class="small">${n} simulated ${n === 1 ? 'day' : 'days'} stored. Heart rate and HRV are judged against your own last two weeks, so they need history to mean anything.</p><div class="row wrap"><button class="btn sm" data-act="devseed">Add two ordinary weeks</button><button class="btn sm" data-act="devclear">Clear simulated data</button></div>
  <h2>Preview hero gear</h2><p class="small">See your warrior with every piece at one tier. This changes nothing you have earned.</p><div class="pick">${[0, 1, 2, 3, 4].map((t) => `<button class="btn sm ${ui.heroPreview === t ? 'on' : ''}" data-act="heropreview" data-v="${t}">${['Cloth', 'Leather', 'Bronze', 'Iron', 'Gold'][t]}</button>`).join('')}</div><div class="row wrap" style="margin-top:8px"><button class="btn sm" data-act="sheet" data-sheet="hero">Open the armory</button><button class="btn sm quiet" data-act="heropreview" data-v="">Stop preview</button></div>
  <p class="small" style="margin-top:14px">Your energy check-in always overrides the band. Clear today's energy on the Mind tab to see the band decide.</p><button class="btn sm" data-act="devenergy">Clear today's energy check-in</button></div>`;
}

const SHEETS = { hero: sheetHero, dev: sheetDev, setup: sheetSetup, settings: sheetSettings, move: sheetMove, coach: sheetCoach, breath: sheetBreath, med: sheetMed, player: sheetPlayer };
const VIEWS = { today: viewToday, train: viewTrain, fuel: viewFuel, mind: viewMind, progress: viewProgress };
const TABS = [['today', 'Today', '<path d="M4 11l8-7 8 7v9H4z"/>'], ['train', 'Train', '<path d="M3 9v6M7 6v12M17 6v12M21 9v6M7 12h10"/>'], ['fuel', 'Fuel', '<path d="M12 3c3 4 5 6.5 5 10a5 5 0 01-10 0c0-3.500 2-6 5-10z"/>'], ['mind', 'Mind', '<circle cx="12" cy="12" r="8"/><path d="M12 12c0-3 3-4 4-2s-1 4-3 3"/>'], ['progress', 'Progress', '<path d="M4 20V10M10 20V4M16 20v-7M21 20H3"/>']];

let stops = [];
function render() {
  stops.forEach((f) => f()); stops = [];
  if (!S.profile.setup) ui.sheet = 'setup';
  const sheetKey = ui.sheet === 'player' ? `player:${ui.player?.phase === 'done'}` : ui.sheet;
  const freshTab = ui.tab !== render.tab, freshSheet = ui.sheet && sheetKey !== render.sheet;
  render.tab = ui.tab; render.sheet = sheetKey;
  const app = $('#app'); app.className = freshTab ? 'enter' : '';
  const brand = `<div class="brandbar">${wordmark(108)}</div>`;
  app.innerHTML = woad + brand + VIEWS[ui.tab]();
  $('#tabs').innerHTML = `<div>${TABS.map(([id, label, path]) => `<button class="tab ${ui.tab === id ? 'on' : ''}" data-act="tab" data-tab="${id}" ${ui.tab === id ? 'aria-current="page"' : ''}>${tabStone(id, ui.tab === id, 40 + TABS.findIndex((t) => t[0] === id))}${label}</button>`).join('')}</div>`;
  $('#overlay').innerHTML = ui.sheet ? `<div class="sheet${freshSheet ? ' enter' : ''}" role="dialog" aria-modal="true">${ui.sheet === 'setup' ? '' : brand}${SHEETS[ui.sheet]()}</div>` : '';
  document.querySelectorAll('svg[data-water]').forEach((el) => requestAnimationFrame(() => requestAnimationFrame(() => el.style.setProperty('--lvl', el.dataset.water))));
  ui.waterPrev = Math.max(0, Math.min(1, ((S.days[today()] || {}).water || 0) / Math.max(1, S.profile.waterTarget)));
  document.querySelectorAll('svg[data-fig]').forEach((svg) => stops.push(mountFigure(svg, svg.dataset.fig, svg.closest('.stage')?.querySelector('[data-figlabel]'), () => { const P = ui.player; if (S.settings.drum && ui.sheet === 'player' && P && P.phase === 'work' && P.remain == null) beep(180, 60); })));
  if (ui.sheet === 'coach') { const log = $('.sheet'); if (log) log.scrollTop = log.scrollHeight; }
}

// ---------- Player engine ----------
function enterStep() {
  const P = ui.player;
  if (P.i >= P.session.steps.length) { P.phase = 'finish'; P.remain = null; keepAwake(false); return; }
  const step = P.session.steps[P.i];
  P.phase = 'work'; P.remain = step.type === 'timed' ? step.secs : null; P.paused = false; P.lastBeep = null;
  if (S.settings.speak && step.ex && step.ex !== 'walk') {
    const e = EX[step.ex];
    say(step.type === 'set' ? `${e.name}. Round ${step.round}. ${e.cues[(step.round - 1) % e.cues.length]}` : `${e.name}. ${step.note || ''}`);
  }
}
function advance() {
  const P = ui.player; if (!P) return;
  P.i += 1; enterStep(); beep(660, 180); buzz(150); render();
}
function start(trialId, mode) {
  const session = L.buildSession(trialId, S.profile.level, mode, { finisher: L.chooseFinisher(S, trialId), boss: L.bossFor(S, trialId, mode) });
  ui.player = { session, i: 0, sets: {}, started: Date.now(), felt: 'doable', pump: 3 };
  enterStep(); ui.sheet = 'player'; keepAwake(true); render();
}
function finishSession() {
  const P = ui.player, k = today(), strength = P.session.trialId !== 'walk';
  const before = S.profile.level, lookBefore = H.heroLook(S, k), runesBefore = H.runes(S, k);
  const double = strength && P.session.mode !== 'min' && L.salmonReady(S, k);
  S.sessions.push({ id: Date.now(), date: k, hour: new Date(P.started).getHours(), double, trialId: P.session.trialId, level: P.session.level, mode: P.session.mode, finisherId: P.session.finisherId || null, boss: P.session.boss || null, sets: P.sets, felt: P.felt, pump: strength ? P.pump : null, minutes: Math.max(1, Math.round((Date.now() - P.started) / 60000)) });
  const leveled = L.maybeLevelUp(S, k), badges = L.awardBadges(S, k);
  const rewards = leveled ? S.rewards.filter((w) => w.level > before && w.level <= S.profile.level) : [];
  const runesNow = H.runes(S, k);
  P.result = { leveled, badges, rewards, counted: strength && P.session.mode !== 'min', double, forged: H.forged(lookBefore, H.heroLook(S, k)), lit: runesNow.filter((r, i) => (r.lit && !runesBefore[i].lit) || (r.charges || 0) > (runesBefore[i].charges || 0)) };
  P.phase = 'done'; save(); buzz(400); render();
}

let lastTick = performance.now();
setInterval(() => {
  const now = performance.now(), dt = (now - lastTick) / 1000; lastTick = now;
  const P = ui.player;
  if (ui.sheet === 'player' && P && P.remain != null && !P.paused) {
    P.remain -= dt;
    const c = Math.ceil(P.remain), el = $('#count');
    if (el) { el.textContent = clock(P.remain); el.classList.toggle('last', c <= 3); }
    const arc = $('#ringArc'); if (arc && P.total) arc.setAttribute('stroke-dashoffset', (276.5 * (1 - Math.max(0, P.remain) / P.total)).toFixed(1));
    if (c <= 3 && c >= 1 && P.lastBeep !== c) { P.lastBeep = c; beep(520, 90); }
    if (P.remain <= 0) advance();
  }
  const B = ui.breath;
  if (ui.sheet === 'breath' && B) {
    B.remain -= dt; B.t += dt;
    const x = B.t % 14, ph = x < 4 ? 0 : x < 8 ? 1 : 2;
    if (ph !== B.ph) { B.ph = ph; const ring = $('#breath'), lab = $('#breathLabel'); if (ring) { ring.style.transitionDuration = ph === 2 ? '6s' : '4s'; ring.style.transform = `scale(${ph === 2 ? 0.62 : 1})`; } if (lab) lab.textContent = ['Breathe in', 'Hold', 'Breathe out'][ph]; }
    const el = $('#count'); if (el) el.textContent = clock(B.remain);
    if (B.remain <= 0) mindDone('Breathing complete.');
  }
  const M = ui.med;
  if (ui.sheet === 'med' && M) {
    M.remain -= dt;
    const m = MEDITATIONS.find((x) => x.id === M.id), idx = Math.min(m.lines.length - 1, Math.floor(((m.minutes * 60 - M.remain) / (m.minutes * 60)) * m.lines.length));
    if (idx !== M.idx) { M.idx = idx; const el = $('#medline'); if (el) el.textContent = m.lines[idx]; if (M.voice) say(m.lines[idx]); }
    const el = $('#count'); if (el) el.textContent = clock(M.remain);
    if (M.remain <= 0) mindDone('Meditation complete.');
  }
}, 250);

function mindDone(msg) {
  L.day(S, today()).mind += 1; L.awardBadges(S); save(); hush();
  ui.breath = null; ui.med = null; ui.sheet = null; beep(520, 400); render(); toast(msg);
}

// ---------- Actions ----------
const ACT = {
  tab: (d) => { ui.tab = d.tab; render(); window.scrollTo(0, 0); },
  sheet: (d) => { ui.sheet = d.sheet; render(); },
  close: () => { hush(); keepAwake(false); ui.sheet = null; ui.player = null; ui.breath = null; ui.med = null; render(); },
  quit: () => { const P = ui.player; if (P.confirmQuit) return ACT.close(); P.confirmQuit = true; toast('Tap End again to leave this trial.'); setTimeout(() => { if (ui.player) ui.player.confirmQuit = false; }, 3000); },
  start: (d) => start(d.trial, d.mode),
  skip: () => advance(),
  pause: () => { ui.player.paused = !ui.player.paused; render(); },
  rate: (d) => { ui.player[d.group] = d.group === 'pump' ? Number(d.v) : d.v; render(); },
  finish: () => finishSession(),
  energy: (d) => { L.day(S, today()).energy = Number(d.v); save(); render(); },
  mood: (d) => { L.day(S, today()).mood = Number(d.v); save(); render(); },
  sleep: (d) => { L.day(S, today()).sleep = Number(d.v); save(); render(); },
  water: (d) => { const day = L.day(S, today()); day.water = Math.max(0, day.water + Number(d.v)); save(); render(); if (Number(d.v) > 0 && day.water >= S.profile.waterTarget && day.water - Number(d.v) < S.profile.waterTarget) toast('Water target hit.'); },
  delfood: (d) => { L.day(S, today()).food.splice(Number(d.i), 1); save(); render(); },
  quickmeal: (d) => { const m = S.meals[Number(d.i)]; L.day(S, today()).food.push({ ...m }); L.awardBadges(S); save(); render(); toast(`Added ${m.name}.`); },
  move: (d) => { ui.move = d.id; ui.sheet = 'move'; render(); },
  breath: (d) => { ui.breath = { remain: Number(d.v) * 60, t: 0, ph: -1 }; ui.sheet = 'breath'; render(); },
  med: (d) => { const m = MEDITATIONS.find((x) => x.id === d.id); ui.med = { id: d.id, remain: m.minutes * 60, idx: 0, voice: false }; ui.sheet = 'med'; render(); },
  voice: () => { const M = ui.med; M.voice = !M.voice; if (M.voice) { const ok = say(MEDITATIONS.find((x) => x.id === M.id).lines[M.idx]); if (!ok) { M.voice = false; toast("This phone can't read aloud here."); } } else hush(); render(); },
  delreward: (d) => { S.rewards.splice(Number(d.i), 1); save(); render(); },
  skipday: async () => { S.settings.skipDate = S.settings.skipDate === today() ? null : today(); save(); await syncNotifications(S.settings); render(); },
  front: () => { ui.front = !ui.front; render(); },
  voicecue: () => { S.settings.speak = !S.settings.speak; if (!S.settings.speak) hush(); else if (!canSpeak()) { S.settings.speak = false; toast("This phone can't read aloud here."); } save(); render(); },
  horn: () => playHorn(),
  dose: () => { const k = today(); S.doses = S.doses.includes(k) ? S.doses.filter((d) => d !== k) : [...S.doses, k].sort(); save(); render(); },
  delphoto: async (d) => { await removePhoto(Number(d.id)); ui.photos = await allPhotos(); render(); },
  brief: async () => { ui.busy = 'brief'; render(); try { ui.brief = await briefing(S); if (S.settings.speak) say(ui.brief); } catch (e) { toast(e.message); } ui.busy = false; render(); },
  savebackup: async () => {
    const text = JSON.stringify({ ...S, settings: { ...S.settings, apiKey: '' } });
    try {
      if (await shareBackup(`fianna-backup-${today()}.json`, text)) { S.settings.lastBackup = today(); save(); render(); toast('Backup file ready.'); return; }
    } catch { /* fall through to text */ }
    ui.backup = text; ui.sheet = 'settings'; S.settings.lastBackup = today(); save(); render(); toast('Copy the backup text at the bottom of Settings.');
  },
  bandread: async () => { ui.busy = 'band'; render(); try { L.day(S, today()).bandRead = await bandRead(S); save(); } catch (e) { toast(e.message); } ui.busy = false; render(); },
  patterns: async () => { ui.busy = 'patterns'; render(); try { ui.patterns = await bandPatterns(S); } catch (e) { toast(e.message); } ui.busy = false; render(); },
  reroll: () => { const next = L.reroll(S); if (next) { save(); render(); toast(`Re-rolled to ${TRIALS[next].short.toLowerCase()}.`); } },
  heropreview: (d) => { ui.heroPreview = d.v === '' ? null : Number(d.v); render(); },
  devpreset: (d) => { const v = { great: { sleep: 8.2, steps: 9400, rhr: 58, hrv: 58 }, ok: { sleep: 6.8, steps: 6200, rhr: 63, hrv: 48 }, rough: { sleep: 4.6, steps: 2100, rhr: 72, hrv: 31 } }[d.p]; ui.devDay = today(); L.setHealth(S, today(), v); if (S.days[today()]) delete S.days[today()].bandRead; save(); render(); toast('Simulated night saved for today.'); },
  devseed: () => { L.seedHealthBaseline(S); save(); render(); toast('Two ordinary weeks added.'); },
  devclear: () => { L.clearSimHealth(S); save(); render(); toast('Simulated data cleared.'); },
  devenergy: () => { const d = S.days[today()]; if (d) delete d.energy; save(); render(); toast("Today's energy check-in cleared."); },
  export: () => { ui.backup = JSON.stringify({ ...S, settings: { ...S.settings, apiKey: '' } }); render(); toast('Your API key is left out of backups.'); },
  import: () => restore($('#backup').value),
  ask: (d) => sendChat(d.q),
  clearchat: () => { S.chat = []; save(); render(); },
  tale: async () => { ui.busy = 'tale'; render(); try { ui.tale = await bardTale(S); } catch (e) { toast(e.message); } ui.busy = false; render(); },
};

function restore(text) {
  try {
    const o = JSON.parse(text); if (!o.profile || !Array.isArray(o.sessions)) throw new Error('bad');
    const key = S.settings.apiKey; localStorage.setItem(KEY, JSON.stringify(o)); S = load(); S.settings.apiKey ||= key; save(); ui.backup = ''; ui.sheet = null; render(); toast('Backup restored.');
  } catch { toast("That doesn't look like a Fianna backup."); }
}

async function sendChat(q) {
  S.chat.push({ role: 'user', content: q }); ui.busy = 'coach'; render();
  try { const a = await coach(S, S.chat.slice(-12)); S.chat.push({ role: 'assistant', content: a }); }
  catch (e) { S.chat.pop(); toast(e.message); }
  S.chat = S.chat.slice(-30); ui.busy = false; save(); render();
}

const FORMS = {
  setup: (f) => {
    S.profile.name = f.name.trim(); S.profile.weightLb = Number(f.lb) || null;
    const r = L.proteinRange(S.profile.weightLb); if (r) S.profile.proteinTarget = r[0];
    S.settings.times.wake = f.wake; S.profile.setup = true; S.profile.levelSince = today();
    save(); ui.sheet = null; render(); syncNotifications(S.settings);
  },
  settings: async (f) => {
    const p = S.profile, s = S.settings, lvl = Number(f.level);
    p.name = f.name.trim(); p.weightLb = Number(f.lb) || null; p.proteinTarget = Number(f.protein) || p.proteinTarget; p.waterTarget = Number(f.water) || p.waterTarget; p.dbStep = Number(f.step);
    if (lvl !== p.level) { p.level = lvl; p.levelSince = today(); }
    p.stepsGoal = Number(f.stepsGoal) || p.stepsGoal; s.notify = !!f.notify; s.speak = !!f.speak; s.drum = !!f.drum; s.apiKey = f.apiKey.trim(); s.workspaceId = (f.workspaceId || '').trim();
    for (const g of ['times', 'weekend']) for (const slot of Object.keys(s[g])) if (f[`${g}.${slot}`]) s[g][slot] = f[`${g}.${slot}`];
    save(); const r = await syncNotifications(s); ui.sheet = null; render();
    toast(r.ok ? (s.notify ? 'Saved. Reminders are set.' : 'Saved. Reminders are off.') : 'Saved.');
  },
  food: (f) => {
    const item = { name: f.name.trim(), protein: Math.round(Number(f.protein) || 0), cal: Math.round(Number(f.cal) || 0) };
    L.day(S, today()).food.push(item);
    if (f.keep && !S.meals.some((m) => m.name.toLowerCase() === item.name.toLowerCase())) S.meals.push({ ...item });
    ui.mealDraft = null; ui.mealNote = ''; const fresh = L.awardBadges(S); save(); render();
    toast(fresh.length ? `New rune stone: ${fresh[0].name}` : `Added ${item.protein} g protein.`);
  },
  dev: (f) => { ui.devDay = f.day || today(); L.setHealth(S, ui.devDay, f); if (S.days[ui.devDay]) delete S.days[ui.devDay].bandRead; save(); render(); toast('Saved.'); },
  journal: (f) => { L.day(S, today()).journal = { grat: f.grat.trim(), refl: f.refl.trim() }; save(); toast('Journal saved.'); },
  weight: (f) => { const lb = Number(f.lb); if (!lb) return; S.weights = S.weights.filter((w) => w.date !== today()); S.weights.push({ date: today(), lb }); S.profile.weightLb = lb; save(); render(); toast('Weigh-in logged.'); },
  reward: (f) => { S.rewards.push({ text: f.text.trim(), level: Number(f.level) }); save(); render(); },
  chat: (f) => sendChat(f.q.trim()),
  set: (f) => {
    const P = ui.player, step = P.session.steps[P.i], next = P.session.steps[P.i + 1];
    (P.sets[step.ex] ||= []).push({ w: Number(f.w) || 0, r: Number(f.r) || 0 });
    if (next && next.type === 'set') { P.phase = 'rest'; P.remain = step.rest; P.total = step.rest; P.lastBeep = null; beep(660, 150); render(); } else advance();
  },
};

document.addEventListener('click', (ev) => {
  const el = ev.target.closest('[data-act]'); if (!el || el.disabled) return;
  if (el.tagName !== 'INPUT') ev.preventDefault();
  ACT[el.dataset.act]?.(el.dataset, el);
});
document.addEventListener('submit', (ev) => {
  const form = ev.target.closest('form[data-form]'); if (!form) return;
  ev.preventDefault(); FORMS[form.dataset.form]?.(Object.fromEntries(new FormData(form)), form);
});
document.addEventListener('input', (ev) => { if (ev.target.matches('input[data-cmp]')) { const top = $('#cmpTop'); if (top) top.style.width = ev.target.value + '%'; } });
document.addEventListener('change', (ev) => {
  if (ev.target.matches('input[data-devtoggle]')) { S.settings.dev = ev.target.checked; save(); toast(S.settings.dev ? 'Developer mode is on. Look for the button on Today.' : 'Developer mode is off.'); }
  if (ev.target.matches('input[data-devday]') && ev.target.value) { ui.devDay = ev.target.value; render(); }
});
document.addEventListener('change', async (ev) => {
  const rest = ev.target.closest('input[data-restore]');
  if (rest?.files?.[0]) { restore(await rest.files[0].text()); return; }
  const prog = ev.target.closest('input[data-progphoto]');
  if (prog?.files?.[0]) { try { await addPhoto(today(), 'data:image/jpeg;base64,' + (await shrink(prog.files[0], 900))); ui.photos = await allPhotos(); render(); toast('Photo saved on this phone.'); } catch (e) { toast(e.message || "Couldn't save that photo."); } return; }
  const input = ev.target.closest('input[data-photo]'); if (!input || !input.files?.[0]) return;
  ui.busy = 'meal'; ui.mealNote = ''; render();
  try {
    const b64 = await shrink(input.files[0]);
    const est = await estimateMeal(S, b64);
    ui.mealDraft = est; ui.mealNote = est.name ? `Estimate: ${est.note}` : est.note;
  } catch (e) { ui.mealNote = e.message; }
  ui.busy = false; render();
});

// Downscale a photo to keep the upload small.
function shrink(file, max = 1024) {
  return new Promise((res, rej) => {
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement('canvas');
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
      res(c.toDataURL('image/jpeg', 0.8).split(',')[1]);
    };
    img.onerror = () => rej(new Error("Couldn't open that photo."));
    img.src = url;
  });
}

{
  const st = document.documentElement.style;
  st.setProperty('--slab-red', slabURI(ROCK.red, 320, 54, 3)); st.setProperty('--slab-slate', slabURI(ROCK.slate, 200, 48, 19)); st.setProperty('--slab-bronze', slabURI([38, 55, 40], 200, 48, 23));
  st.setProperty('--plate', plateURI(true)); st.setProperty('--plate-plain', plateURI(false));
}
window.__fianna = { get state() { return S; }, ui, render, start };
render();
// Opening: let the rune finish carving and glow, then lift the stone away. A tap skips it.
{
  const sp = $('#splash'), quick = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lift = () => { if (!sp || sp.classList.contains('out')) return; sp.classList.add('out'); setTimeout(() => sp.remove(), 800); };
  sp?.addEventListener('click', lift); setTimeout(lift, quick ? 1200 : 5600);
}
allPhotos().then((p) => { ui.photos = p; if (p.length && ui.tab === 'progress') render(); });
if (S.profile.setup) syncNotifications(S.settings);
