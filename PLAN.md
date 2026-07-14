# Sprint Doom @ denkwerk — Implementierungsplan

Old-School-FPS im Doom-Stil (three.js + Sprite-Billboards). Ein Level = ein Sprint.
Der Spieler verhandelt 5 Tickets, indem er den Kunden pro Ticket im Boss-Fight besiegt.
Kampf-Performance bestimmt die vergebenen Story-Points. Ziel: Punktesumme im
Sprint-Korridor (25–35).

---

## Technische Eckdaten

- **Stack:** three.js via CDN (ESM + importmap), kein Build-Tool, Vanilla JS (ES-Module)
- **Assets:** 100 % code-generiert — Pixeltexturen & Sprites per Canvas, SFX per WebAudio
- **Start:** statischer Server (`npx serve` o. ä.) über `.claude/launch.json`, Browser-Preview

## Dateistruktur

```
sprint-doom/
├── PLAN.md                  # dieser Plan
├── index.html               # Einstieg, importmap, HUD-DOM, Screens
├── css/style.css            # HUD, Screens, Retro-Font-Styling
└── js/
    ├── main.js              # Bootstrap, Game-Loop, State-Machine (Intro→Spiel→Ende)
    ├── config.js            # Balancing: Tickets, Punkte-Spannen, Korridor, Speeds, Damage
    ├── level.js             # Grid-Map, Wand-/Boden-Meshes, Türen, Raum-Trigger
    ├── textures.js          # Canvas-generierte Pixeltexturen (Wände, Boden, Decke, Board)
    ├── sprites.js           # Canvas-Pixelart: Kunde (Zustände), Waffe, HUD-Face, Projektile
    ├── player.js            # Steuerung (PointerLock, WASD), Kollision, Health
    ├── weapon.js            # Waffen-Overlay, Hitscan, Muzzle-Flash, Accuracy-Tracking
    ├── enemy.js             # Kunden-KI: Zustände, Bewegung, Ausreden-Projektile, HP
    ├── tickets.js           # Ticket-/Sprint-Logik, Punkteformel, Velocity
    ├── hud.js               # HUD-Rendering: Health, Face, Ticket-Karte, Velocity-Gauge
    └── audio.js             # WebAudio-Synth-SFX
```

## Kern-Datenstrukturen

**Grid-Map** (Strings, 1 Zeichen = 1 Tile): `#` Wand, `.` frei, `D` Tür, `S` Spieler-Start,
`1–5` Kunde-Spawn für Ticket n, `B` Ticket-Board (Intro-Raum-Deko).

**Ticket-Config** (`config.js`):
```js
{ id: 1, title: "Bugfix: Checkout-Button tot", minPts: 2, maxPts: 5,
  bossHp: 60, bossSpeed: 2.2, projectileRate: 1.2,
  excuses: ["Das ist doch nur ein Klick-Fix!", ...] }
```
5 Tickets mit steigender Schwierigkeit: Bugfix (2–5) → Kleines Feature (3–8) →
Mittleres Feature (5–13) → Großes Feature (8–13) → Finale: Shop-Relaunch-Kickoff (8–21).
Max-Summe 60, Min-Summe 26 → Korridor 25–35 erzwingt gute, aber nicht perfekte Runs
mit taktischem "Wie hart verhandle ich?".

**Punkteformel** (nach Boss-Kill, Ticket verloren = 0 Punkte):
```
score = 0.4 * timeFactor + 0.35 * accuracyFactor + 0.25 * healthFactor   // je 0..1
points = round(minPts + score * (maxPts - minPts))
```
- `timeFactor`: 1.0 bei Kill ≤ Par-Zeit, linear fallend auf 0 bei 3× Par-Zeit
- `accuracyFactor`: Treffer / abgegebene Schüsse
- `healthFactor`: Health-Anteil, der im Kampf übrig blieb (Schaden in diesem Kampf zählt)

---

## Stages

### Stage 0 — Projektgerüst & Dev-Loop
**Inhalt:** Ordnerstruktur, `index.html` mit importmap (three@0.16x von CDN), leere Szene
mit Testwürfel + Ambient Light, Game-Loop (fixed timestep für Logik, rAF fürs Rendern),
`.claude/launch.json` für statischen Server.
**Zwischenziel / Definition of Done:** Browser-Preview zeigt rotierenden Testwürfel,
keine Konsolen-Fehler, Fenster-Resize funktioniert.

### Stage 1 — Level-Geometrie & Bewegung
**Inhalt:** Grid-Map-Parser; Wände als gemergte Box-Geometrie, Boden + Decke als Planes;
erste Canvas-Pixeltexturen (Beton-Wand, Teppich-Boden, Decke) mit `NearestFilter`;
PointerLockControls + WASD; AABB-Kollision gegen das Grid (Wall-Sliding); Spieler-Spawn.
Level-Layout: Intro-Raum → 5 Ticket-Räume, verbunden durch Korridore mit Türen.
**DoD:** Man läuft flüssig per WASD/Maus durchs komplette Level, kann nicht durch
Wände, ESC gibt den Pointer frei.

### Stage 2 — Retro-Look & HUD-Gerüst
**Inhalt:** Pixelation-Effekt (Rendern in niedriger Auflösung ~320×200-Äquivalent,
hochskaliert ohne Smoothing); Fog + spärliche Punktlichter für Doom-Stimmung;
denkwerk-Farbakzente. HUD als DOM-Overlay: Statusleiste unten (Health "NERVEN",
Face-Icon, Ticket-Anzeige, Velocity-Gauge als Balken mit Korridor-Markierung),
Crosshair. Retro-Font (System-Monospace, pixelig gestylt).
**DoD:** Spiel sieht erkennbar nach 90er-Shooter aus; HUD zeigt Dummy-Werte an und
skaliert bei Resize korrekt.

### Stage 3 — Waffe & Schießen
**Inhalt:** Waffen-Sprite "Argumentator 9000" als Screen-Overlay (Idle-Bobbing beim
Laufen, Recoil + Muzzle-Flash beim Schuss); Hitscan per Raycast aus Kameramitte;
Feuerrate-Limit; Treffer-Marker; Accuracy-Tracking (Schüsse/Treffer) für die
Punkteformel. Erste WebAudio-SFX: Schuss.
**DoD:** Schießen fühlt sich responsiv an (Flash, Recoil, Sound), Raycast trifft
Testziel, Accuracy wird in der Konsole korrekt mitgezählt.

### Stage 4 — Der Kunde (Gegner-KI & Kampf)
**Inhalt:** Kunde als Billboard-Sprite mit Canvas-Pixelart-Zuständen (idle, walk,
attack, hit-flinch, death — als Sprite-Frames); KI-Zustandsmaschine: annähern bis
Mindestabstand, seitliches Ausweichen (Strafing), periodisch "Ausreden"-Projektile
feuern (langsame, ausweichbare Sprechblasen-Projektile mit Text wie "Das ist doch
nur ein Klick-Fix!"); Kunden-HP + Lebensbalken über dem Sprite; Spieler nimmt
Projektil-Schaden, Hit-Flash am Screenrand; Health 0 → Game-Over-Zustand (Ticket
verloren, weiter zum nächsten Raum). SFX: Treffer, Ausrede, Kunden-K.O.
**DoD:** Kompletter Boss-Fight in einem Testraum spielbar: Kunde jagt/beschießt den
Spieler, ist besiegbar, Spieler kann sterben; alle Kampfwerte (Zeit, Accuracy,
Schaden) werden erfasst.

### Stage 5 — Ticket- & Sprint-Logik (Meta-Game)
**Inhalt:** Raum-Trigger: Betreten eines Ticket-Raums → Ticket-Karte einblenden
(Titel, Punkte-Spanne), Tür hinter dem Spieler schließt, Kunde spawnt mit
Ticket-spezifischen Werten. Nach Sieg: Punkteformel anwenden, Punkte-Einblendung
("+8 SP — starke Verhandlung!" vs. "+3 SP — der Kunde hat dich runtergehandelt"),
Velocity-Gauge aktualisieren, Tür zum nächsten Raum öffnen. Intro-Raum mit
Sprint-Planning-Board (Textur mit den 5 Tickets). Nach Ticket 5: Auswertung —
Summe im Korridor 25–35 = Sieg, darunter = "Kunde kam zu billig davon",
darüber = "Team überlastet, Sprint gescheitert". Sieg-/Niederlage-Screen mit
Statistik (Punkte je Ticket, Zeit, Accuracy) und Restart.
**DoD:** Kompletter Durchlauf Intro → 5 Tickets → Auswertung funktioniert inkl.
aller drei Endings; Restart setzt sauber zurück.

### Stage 6 — Sound & Polish
**Inhalt:** Restliche SFX (Punkte hoch/runter, Tür, Ticket-Karte, Sieg/Niederlage-Sting,
Schritt-Sounds); HUD-Face reagiert auf Zustand (grinst bei vielen Punkten, blutet bei
wenig Health — Doom-Guy-Hommage als "denkwerk-Guy"); Screenshake bei Treffern;
Balancing-Pass über `config.js` (Par-Zeiten, HP, Schaden, Projektil-Speed so, dass
der Korridor erreichbar aber nicht trivial ist); Start-Screen mit Titel, Story-Text
und "Klick zum Starten" (nötig für PointerLock + AudioContext).
**DoD:** Durchlauf fühlt sich rund an: durchgängiges Audio-Feedback, lesbares HUD,
gewinnbarer aber fordernder Sprint.

### Stage 7 — Verifikation & Playtest
**Inhalt:** End-to-End-Test über Browser-Preview: kompletter Run, alle drei Endings
erzwingen, Konsole auf Fehler prüfen, Performance-Check (Framerate bei Projektil-Spam),
Kanten-Fälle (Tod im letzten Ticket, ESC mitten im Kampf, Resize). Screenshots als
Nachweis. Bugfixes.
**DoD:** Fehlerfreier kompletter Durchlauf, Screenshots von Gameplay + Endscreen.

---

## Reihenfolge & Abhängigkeiten

Stages sind strikt sequenziell (jede baut auf der vorherigen auf). Nach jeder Stage:
kurzer Funktionstest im Browser-Preview gegen die DoD, bevor die nächste beginnt.
