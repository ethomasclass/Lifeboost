# Fianna

A personal training, fuel, and mind app for Android. Progressive home workouts with dumbbells, a bench, and a treadmill, starting at 10 minutes and growing to 30.

## Install on your phone

1. Open this repository's **Releases** page on your Android phone.
2. Tap **Fianna.apk**, then allow your browser to install apps when Android asks.
3. Open Fianna and allow notifications.

Every push to `main` builds a fresh APK (Actions tab) and replaces the one on the Releases page.

## What is inside

- `www/` the app itself (plain HTML, CSS, and JavaScript, no build step)
  - `js/data.js` exercises, trials, levels, torcs, proverbs
  - `js/logic.js` the rules: session builder, leveling, weight suggestions, streaks
  - `js/figure.js` the animated exercise figure
  - `js/ai.js` coach, photo food estimates, weekly tale (uses your own Claude API key)
  - `js/native.js` notifications and other phone features
- `android/` the Android wrapper (Capacitor)
- `tests/` checks for the training rules: `npm test`

## Run it in a browser

    npm run serve

Then open http://localhost:8080. Notifications only work in the installed app.

## Your data

Everything you log is stored on your phone only. Your Claude API key is saved on the phone and is never part of this repository. Use Settings, Backup to copy your data out.

Fianna is a training aid, not medical advice.
