export const CONFIG = {
  tileSize: 4,
  wallHeight: 4,
  downscale: 3, // Render-Auflösung = Fenster / downscale → Retro-Pixellook

  player: {
    speed: 9.5,
    radius: 0.55,
    maxHealth: 100,
    eyeHeight: 1.7,
    jumpSpeed: 6.7,  // Absprung ~1,5 m — genug, um flache Patterns zu überspringen
    gravity: 15,
    coffeeHeal: 30,    // Heilung nach gewonnenem Ticket
    respawnHealth: 60, // Nerven nach Nervenzusammenbruch
  },

  weapon: {
    damage: 12,        // ±20 % Streuung
    fireInterval: 0.26,
    range: 80,
  },

  sprint: {
    min: 25,
    max: 35,
    maxPossible: 60,
  },

  // Skill levels after the classic Doom selection screen, denkwerk edition.
  // hp/dmg/speed scale the customer, fire his fire interval, proj his projectile
  // speed, wind his windup (telegraph), volley = projectiles per shot (fan),
  // heal scales the coffee break between tickets.
  // adds = consultants the customer brings along (entourage); +1 on tickets 4-5.
  // patterns = weighted attack pool (see PATTERNS in enemy.js):
  // single/double aimed fans · lead = predictive aim · mg = tracking burst ·
  // ring = 360° · wall = rolling wall with one gap · split/homing projectiles ·
  // spiral = rotating spray · pincer = curves in from both sides · bounce =
  // wall ricochet · rain = barrage from above · cluster = lob detonating into a ring.
  skill: 2, // index into difficulties, set from the skill screen
  difficulties: [
    { name: 'Ich bin noch in der Probezeit.', hp: 0.5, dmg: 0.5, speed: 0.85, fire: 1.5, proj: 0.9, wind: 1.3, volley: 1, heal: 1.5, adds: 0,
      patterns: { single: 1 } },
    { name: 'Hey, nicht vor dem ersten Kaffee.', hp: 0.8, dmg: 0.8, speed: 0.95, fire: 1.15, proj: 1, wind: 1.1, volley: 1, heal: 1.2, adds: 0,
      patterns: { single: 0.7, double: 0.3 } },
    { name: 'Feilsch mich ordentlich runter.', hp: 1.15, dmg: 1.3, speed: 1.15, fire: 0.85, proj: 1.25, wind: 0.85, volley: 1, heal: 0.9, adds: 1,
      patterns: { single: 0.4, double: 0.3, lead: 0.15, split: 0.1, bounce: 0.05 } },
    { name: 'Ultra-Eskalation.', hp: 1.9, dmg: 2.2, speed: 1.45, fire: 0.55, proj: 1.6, wind: 0.6, volley: 2, heal: 0.6, adds: 2,
      patterns: { double: 0.2, mg: 0.14, lead: 0.14, ring: 0.1, wall: 0.08, split: 0.09, homing: 0.08, spiral: 0.07, pincer: 0.06, bounce: 0.04 } },
    // Albtraum is meant to be borderline unwinnable: the customer outruns you,
    // two boss hits end a ticket, and up to four consultants keep a crossfire
    // going — the boss's own spam is eased a notch to leave a sliver of hope.
    { name: 'ALBTRAUM: FESTPREIS!', hp: 3.2, dmg: 5, speed: 2, fire: 0.35, proj: 2.3, wind: 0.4, volley: 3, heal: 0.35, adds: 3,
      patterns: { mg: 0.16, wall: 0.15, spiral: 0.12, lead: 0.12, rain: 0.1, double: 0.08, ring: 0.08, pincer: 0.08, cluster: 0.06, homing: 0.05 } },
  ],

  boss: {
    radius: 0.9,     // Kollisionsradius Bewegung
    hitRadius: 1.4,  // Trefferradius für Hitscan
    attackRange: 20,
    minDist: 4.5,    // näher kommt der Kunde nicht
    volleySpread: 0.26, // angle (rad) between fan projectiles
  },

  // score = 0.4*Zeit + 0.35*Accuracy + 0.25*übrige Nerven → points = min + score*(max-min)
  tickets: [
    {
      id: 1, code: 'DW-101', title: 'Bugfix: Checkout-Button reagiert nicht',
      min: 2, max: 5, hp: 70, speed: 3.4, fireInterval: 1.5, windup: 0.4,
      projSpeed: 10, projDamage: 8, parTime: 14,
      excuses: [
        'Das ist doch nur ein Klick-Fix!',
        'Mein Neffe macht das in 5 Minuten!',
        'Dafür wollt ihr Geld?!',
        'Das war vorher auch schon kaputt!',
      ],
    },
    {
      id: 2, code: 'DW-102', title: 'Feature: Newsletter-Popup',
      min: 3, max: 8, hp: 100, speed: 3.8, fireInterval: 1.25, windup: 0.38,
      projSpeed: 11, projDamage: 10, parTime: 20,
      excuses: [
        'Ein Popup! Copy-Paste, oder?',
        'Andere Agenturen sind billiger!',
        'Muss das getestet werden?',
        'Das braucht doch keine Konzeption!',
      ],
    },
    {
      id: 3, code: 'DW-103', title: 'Feature: Produktfilter im Shop',
      min: 5, max: 13, hp: 140, speed: 4.2, fireInterval: 1.05, windup: 0.35,
      projSpeed: 12, projDamage: 11, parTime: 27,
      excuses: [
        'Amazon hat das doch auch einfach!',
        'Können wir das nicht mit KI machen?',
        'Ist das nicht im Budget drin?',
        'Filter sind Standard, oder?!',
      ],
    },
    {
      id: 4, code: 'DW-104', title: 'Feature: Login & Kundenkonto',
      min: 8, max: 13, hp: 180, speed: 4.6, fireInterval: 0.9, windup: 0.32,
      projSpeed: 13, projDamage: 13, parTime: 34,
      excuses: [
        "Login gibt's doch fertig im Internet!",
        'DSGVO? Machen wir später!',
        'Das hatten wir doch schon besprochen?!',
        'Passwort-Reset braucht kein Mensch!',
      ],
    },
    {
      id: 5, code: 'DW-105', title: 'FINALE: Shop-Relaunch Kickoff',
      min: 8, max: 21, hp: 260, speed: 5.0, fireInterval: 0.72, windup: 0.3,
      projSpeed: 14, projDamage: 15, parTime: 44,
      excuses: [
        'Der ganze Relaunch für 8 Punkte!',
        'Mein Bauchgefühl sagt: 3 Punkte!',
        'Beim Golf hat der CEO was anderes gesagt!',
        'Das Logo nur ein bisschen größer!',
      ],
    },
  ],
};
