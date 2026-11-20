// Phone features. In the installed Android app these use Capacitor; in a plain browser they quietly do nothing.
import { NOTIFY } from './data.js';

const plugin = (name) => window.Capacitor?.Plugins?.[name];
export const isNative = () => !!window.Capacitor?.isNativePlatform?.();

const SLOTS = ['wake', 'midday', 'evening', 'bedtime'];
const WAKE_CHANNEL = 'fianna_wake_v1';

// One repeating weekly notification per slot per weekday (Capacitor weekday: 1 = Sunday).
export function buildSchedule(settings) {
  const out = [];
  SLOTS.forEach((slot, si) => {
    for (let wd = 1; wd <= 7; wd++) {
      const weekend = wd === 1 || wd === 7;
      const time = (weekend ? settings.weekend : settings.times)[slot];
      if (!time) continue;
      const [hour, minute] = time.split(':').map(Number);
      const [title, body] = NOTIFY[slot];
      const n = { id: (si + 1) * 10 + wd, title, body, schedule: { on: { weekday: wd, hour, minute }, allowWhileIdle: true }, smallIcon: 'ic_stat_fianna', iconColor: '#F07A2E' };
      if (slot === 'wake') { n.channelId = WAKE_CHANNEL; n.sound = 'carnyx.wav'; }
      out.push(n);
    }
  });
  return out;
}

export async function syncNotifications(settings) {
  const LN = plugin('LocalNotifications');
  if (!isNative() || !LN) return { ok: false, reason: 'Notifications work in the installed Android app.' };
  try {
    const all = buildSchedule(settings);
    await LN.cancel({ notifications: all.map((n) => ({ id: n.id })) });
    if (!settings.notify) return { ok: true, count: 0 };
    let perm = await LN.checkPermissions();
    if (perm.display !== 'granted') perm = await LN.requestPermissions();
    if (perm.display !== 'granted') return { ok: false, reason: 'Notifications are turned off for Fianna in your phone settings.' };
    // The wake-up reminder gets its own channel so it can play the carnyx horn.
    try { await LN.createChannel({ id: WAKE_CHANNEL, name: 'Wake-up call', description: 'The morning carnyx', importance: 4, sound: 'carnyx.wav', vibration: true }); } catch { /* older Android */ }
    // "Skip today": leave out today's weekday; it comes back the next time the app opens on a later day.
    const today = new Date(), key = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const list = settings.skipDate === key ? all.filter((n) => n.schedule.on.weekday !== today.getDay() + 1) : all;
    await LN.schedule({ notifications: list });
    return { ok: true, count: list.length };
  } catch (e) {
    return { ok: false, reason: String(e?.message || e) };
  }
}

export function buzz(ms = 200) { try { navigator.vibrate?.(ms); } catch { /* not supported */ } }

let ctx;
export function beep(freq = 880, ms = 140) {
  try {
    ctx ||= new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.value = freq; o.connect(g); g.connect(ctx.destination);
    g.gain.setValueAtTime(0.15, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + ms / 1000);
    o.start(); o.stop(ctx.currentTime + ms / 1000);
  } catch { /* no audio */ }
}

let wake;
export async function keepAwake(on) {
  try {
    if (on && navigator.wakeLock) wake = await navigator.wakeLock.request('screen');
    else if (!on && wake) { await wake.release(); wake = null; }
  } catch { /* not supported */ }
}

// Speech: the native text-to-speech plugin in the installed app, the browser voice elsewhere.
export function canSpeak() { return !!(isNative() && plugin('TextToSpeech')) || !!window.speechSynthesis; }
export function say(text) {
  try {
    const T = isNative() && plugin('TextToSpeech');
    if (T) { T.stop().catch(() => {}).finally(() => T.speak({ text, lang: 'en-US', rate: 0.95 }).catch(() => {})); return true; }
    if (!window.speechSynthesis) return false;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text); u.rate = 0.9;
    speechSynthesis.speak(u);
    return true;
  } catch { return false; }
}
export function hush() {
  try { const T = isNative() && plugin('TextToSpeech'); if (T) T.stop().catch(() => {}); else window.speechSynthesis?.cancel(); } catch { /* nothing */ }
}

export function playHorn() { try { new Audio('carnyx.wav').play(); } catch { /* no audio */ } }

// Writes the backup to a file and opens the share sheet (Drive, email, Files). Returns false in a browser.
export async function shareBackup(name, text) {
  const FS = plugin('Filesystem'), SH = plugin('Share');
  if (!isNative() || !FS || !SH) return false;
  const { uri } = await FS.writeFile({ path: name, data: text, directory: 'CACHE', encoding: 'utf8' });
  await SH.share({ title: 'Fianna backup', text: 'Fianna backup file', url: uri, dialogTitle: 'Save your Fianna backup' });
  return true;
}
