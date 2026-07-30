# Dahlia

A private period, food and training tracker with a strict coach.

Everything is stored on your own device. There are no accounts, no server, no
analytics, and nothing is ever uploaded — which is also why there is no
password reset and no sync.

**Not medical advice.** Cycle predictions are estimates from your own averages.
They are not a contraceptive method and not a pregnancy test.

## What it does

- **Cycle** — flow, symptoms with severity, notes; cycle day, phase and a next
  period estimate
- **Workouts** — a session generated from your goal, equipment, experience and
  how much time you actually have today
- **Diet** — meals, with guidance shaped by goal, cycle phase and any
  conditions on file
- **Home** — a daily check-in (sleep, energy, soreness, minutes free) that the
  whole plan is built from
- **Dahlia** — a coach that speaks from your logs, in one of three tones
- **Progress** — streak, weekly and 28-day stats, training trends, cycle
  patterns
- **Settings** — export, import, delete everything, reminders, app lock

## How it decides things

The logic is a rule engine, not a model. Readiness is scored from sleep,
energy, soreness, symptoms and cycle phase; that score then drives the workout,
the food guidance and the single next action. Low readiness forces recovery
regardless of goal or coach tone.

Safety notes are never softened by tone. Severe symptoms escalate to "see a
doctor" in every setting, and the reply to overeating never prescribes exercise
as compensation.

No calorie or gram targets are invented, because the app never asks your
weight.

## Privacy

- Stored in your browser's local storage, on one device
- **Export** writes a readable JSON file you own; **import** restores it
- **Delete** wipes everything
- **App lock** encrypts the whole store with a passcode (PBKDF2-SHA256 at
  310,000 rounds, AES-GCM). The passcode is never stored, so there is no
  recovery if you forget it — export a copy first

## Running it

```bash
npm install
npm run dev
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build into `dist/` |
| `npm test` | Full test suite |
| `npm run lint` | ESLint |

The build uses relative asset paths and hash routing, so `dist/` can be dropped
on any static host, including a subdirectory, with no server configuration. A
service worker caches the app shell so it opens without a connection.

## Tests

```bash
npm test
```

Logic tests run in Node; page tests opt into jsdom per file. They cover the
cycle maths, the rule engine, the coach's safety boundaries, encryption, and
the pages themselves through the real state provider.

## Stack

React, TypeScript, Vite, React Router, Vitest, React Testing Library. No UI
framework and no state library — plain CSS custom properties and React context.
