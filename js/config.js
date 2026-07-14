export const CONFIG = {
  tileSize: 4,
  wallHeight: 4,
  downscale: 3, // Render-Auflösung = Fenster / downscale → Retro-Pixellook

  player: {
    speed: 9.5,
    radius: 0.55,
    maxHealth: 100,
    eyeHeight: 1.7,
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
  // hp/dmg/speed scale the customer, fire his fire interval, proj his projectile speed.
  skill: 2, // index into difficulties, set from the skill screen
  difficulties: [
    { name: 'Ich bin noch in der Probezeit.', hp: 0.6, dmg: 0.5, speed: 0.85, fire: 1.4, proj: 0.9 },
    { name: 'Hey, nicht vor dem ersten Kaffee.', hp: 0.8, dmg: 0.75, speed: 0.92, fire: 1.2, proj: 0.95 },
    { name: 'Feilsch mich ordentlich runter.', hp: 1, dmg: 1, speed: 1, fire: 1, proj: 1 },
    { name: 'Ultra-Eskalation.', hp: 1.4, dmg: 1.5, speed: 1.2, fire: 0.75, proj: 1.2 },
    { name: 'ALBTRAUM: FESTPREIS!', hp: 2.2, dmg: 3, speed: 1.5, fire: 0.45, proj: 1.5 },
  ],

  boss: {
    radius: 0.9,     // Kollisionsradius Bewegung
    hitRadius: 1.4,  // Trefferradius für Hitscan
    attackRange: 20,
    minDist: 4.5,    // näher kommt der Kunde nicht
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
