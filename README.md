# SPRINT DOOM

*Ein denkwerk Abenteuer.* A retro raycaster-style shooter set on the real 3.BA floor
(399 m², Konfizone) of the denkwerk office in Cologne. It's Sprint 42: five tickets,
one customer who haggles over every single one. Your combat performance decides the
story points per ticket — hit a total velocity of 25–35 SP or the sprint fails.

![Genre](https://img.shields.io/badge/genre-office%20doom-black)
![Engine](https://img.shields.io/badge/engine-three.js-ffe449)
![Assets](https://img.shields.io/badge/assets-100%25%20code--generated-ff42a1)

## Play

The game is static HTML/JS with an import map (three.js via CDN) — it needs a local
web server, nothing else:

```bash
npx serve .          # or: python3 -m http.server 8642
```

Open the printed URL in a browser, pick a difficulty on the title screen, click to start.

| Input | Action |
|---|---|
| WASD / arrows | move |
| Mouse | aim |
| Left click | fire the Argumentator 9000 |
| ESC | pause (Daily Standup) |

## How it plays

You spawn at the T30RS fire door in the **Konfizone**, a narrow vaulted corridor.
The sprint board next to you shows the backlog. Five meeting rooms line the glass
front to the south — each one holds a ticket negotiation:

1. Konferenzraum 1 — DW-101 · Bugfix: Checkout-Button
2. Besprechungsraum 1 — DW-102 · Newsletter-Popup
3. Besprechungsraum 2 — DW-103 · Produktfilter
4. Workshopraum — DW-104 · Login & Kundenkonto
5. Konferenzraum 2 — DW-105 · FINALE: Shop-Relaunch

Step into a room and the glass door slams shut behind you. The Kunde fires his
excuses at you ("Das ist doch nur ein Klick-Fix!") — dodge them, argue back.
Story points per ticket are scored from speed, accuracy, and remaining nerves:
`score = 0.4·time + 0.35·accuracy + 0.25·health`. Lose a fight and the ticket
scores zero. Between meetings: coffee (+30 nerves).

Difficulty scales the customer (HP, damage, speed, fire rate) across five levels,
from *"Ich bin noch in der Probezeit."* to *"ALBTRAUM: FESTPREIS!"*.

## The floor is real

The map is the actual 3.BA floor plan, tile by tile (see `references/`):

- **Konfizone** — single-tile corridor with a barrel vault, arch ribs, and warm
  wall sconces, modeled after the office corridor photo.
- **South wing** — the five meeting rooms behind a fully transparent glass front
  with sliding glass doors, plus the Flügelraum (with grand piano).
- **North wing** — Technikraum (mainframes), Kickerraum (foosball table),
  Archiv FiBu (binder shelves), Officelager (dw moving boxes), Küche 2, and the
  open lounge with the L-shaped kitchen and its long tables.
- **Windows** — the south façade glazing per plan, with a night view of Cologne,
  Dom silhouette included.
- **Details** — polished screed floor, white Altbau plaster, exposed concrete
  ceilings with duct runs, fire extinguishers where the plan puts them, and
  denkwerk deck-style decorations (section-slide sculptures, statement art,
  brand palette signage).

Everything is code-generated: geometry from an ASCII floor plan in `js/level.js`,
all textures drawn on canvases at runtime, sound synthesized in `js/audio.js`.
No external assets beyond the three.js CDN module.

## Project layout

```
index.html        title screen, HUD skeleton, import map
css/style.css     HUD + overlay styling
js/config.js      tuning: player, weapon, tickets, difficulties
js/level.js       ASCII floor plan → geometry, doors, collision, signage
js/props.js       furniture, plants, sculptures, brand art
js/textures.js    canvas-generated pixel textures
js/main.js        bootstrap + game loop
js/player.js      FPS controls (pointer lock + WASD)
js/enemy.js       the Kunde: chase → windup → excuse projectile
js/weapon.js      Argumentator 9000
js/tickets.js     sprint meta-game: triggers, scoring, velocity
js/hud.js         nerves, ticket cards, ticker, end screen
js/sprites.js     customer + excuse-bubble sprites
js/audio.js       WebAudio SFX + music
references/       floor plan + office mood photos the look is based on
```

## Debug

`window.SD` exposes player, boss, sprint, level, camera, and CONFIG for poking
around in the console — e.g. `SD.player.pos.set(26, 1.7, 50)` teleports you
straight into the first meeting.
